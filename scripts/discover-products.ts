#!/usr/bin/env ts-node
/**
 * discover-products.ts
 * Automatically queries all 4 affiliate network APIs for relevant gift products.
 * Credentials must be set in .env file first.
 *
 * Usage:
 *   npx ts-node scripts/discover-products.ts             (with AI tagging)
 *   npx ts-node scripts/discover-products.ts --dry-run   (preview only)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'products.generated.ts');
const AI_KEY = process.env.ANTHROPIC_API_KEY ?? '';

// ─── Gift search queries ──────────────────────────────────────────────────────
// These drive what the APIs return. Edit freely to match your app's focus.

const QUERIES = [
  { q: 'gold earrings women gift',         cat: 'jewelry',     min: 25,  max: 300 },
  { q: 'gold necklace pendant women',      cat: 'jewelry',     min: 30,  max: 500 },
  { q: 'pearl bracelet women luxury',      cat: 'jewelry',     min: 40,  max: 400 },
  { q: 'luxury skincare gift set women',   cat: 'skincare',    min: 40,  max: 250 },
  { q: 'perfume gift women luxury',        cat: 'skincare',    min: 60,  max: 350 },
  { q: 'face serum vitamin c gift',        cat: 'skincare',    min: 30,  max: 200 },
  { q: 'cashmere sweater women gift',      cat: 'fashion',     min: 80,  max: 400 },
  { q: 'silk blouse women luxury',         cat: 'fashion',     min: 60,  max: 300 },
  { q: 'designer handbag gift women',      cat: 'handbags',    min: 150, max: 800 },
  { q: 'luxury bath gift set women',       cat: 'spa_wellness',min: 30,  max: 150 },
  { q: 'scented candle set luxury gift',   cat: 'spa_wellness',min: 25,  max: 120 },
  { q: 'yoga mat gift women premium',      cat: 'fitness',     min: 60,  max: 200 },
  { q: 'wireless earbuds women gift',      cat: 'tech',        min: 80,  max: 400 },
  { q: 'smart watch women luxury',         cat: 'tech',        min: 150, max: 600 },
  { q: 'bestseller novel women fiction',   cat: 'books',       min: 12,  max: 40  },
  { q: 'personalized jewelry custom name', cat: 'personalized',min: 30,  max: 200 },
  { q: 'throw blanket luxury gift',        cat: 'home_decor',  min: 50,  max: 250 },
  { q: 'wine gift set women',             cat: 'food_drink',  min: 40,  max: 200 },
  { q: 'activewear leggings women gift',   cat: 'fitness',     min: 60,  max: 180 },
  { q: 'luxury wallet women leather gift', cat: 'handbags',    min: 80,  max: 400 },
];

interface Product {
  id: string; name: string; description: string; category: string;
  price: number; priceRange: string; imageUrl: string; affiliateLink: string;
  affiliateNetwork: string; merchantName: string; brand?: string;
  rating?: number; reviewCount?: number; popularityScore: number;
  styleTags: string[]; occasionTags: string[]; interestTags: string[]; recipientTags: string[];
}

function buildId(name: string, merchant: string): string {
  const key = `${name.toLowerCase()}_${merchant.toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) { hash = ((hash << 5) - hash) + key.charCodeAt(i); hash |= 0; }
  return 'p_' + Math.abs(hash).toString(16).padStart(8, '0');
}

function detectPriceRange(price: number): string {
  if (price < 25) return 'budget'; if (price < 75) return 'moderate';
  if (price < 200) return 'premium'; if (price < 500) return 'high_end'; return 'luxury';
}

// ─── Network fetchers ─────────────────────────────────────────────────────────

async function fetchCJ(q: string, cat: string, min: number, max: number): Promise<Product[]> {
  const apiKey = process.env.CJ_API_KEY;
  const websiteId = process.env.CJ_WEBSITE_ID;
  if (!apiKey || !websiteId) return [];
  try {
    const params = new URLSearchParams({
      keywords: q, 'website-id': websiteId,
      'advertiser-ids': 'joined', 'records-per-page': '20',
      'low-price': String(min), 'high-price': String(max),
    });
    const resp = await fetch(`https://product-search.api.cj.com/v2/product-search?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await resp.json() as any;
    const items = data?.products?.product ?? [];
    return (Array.isArray(items) ? items : [items])
      .filter((item: any) => item.name && item.buyurl)
      .map((item: any) => {
        const price = parseFloat(item.price ?? '0');
        return {
          id: buildId(item.name, item['advertiser-name'] ?? 'CJ'),
          name: item.name, description: item.description ?? '',
          category: cat, price, priceRange: detectPriceRange(price),
          imageUrl: item.imageurl ?? '',
          affiliateLink: item.buyurl,
          affiliateNetwork: 'cj', merchantName: item['advertiser-name'] ?? 'CJ',
          brand: item['manufacturer-name'],
          rating: parseFloat(item.rating ?? '0') || undefined,
          popularityScore: 65,
          styleTags: [], occasionTags: [], interestTags: [], recipientTags: [],
        };
      });
  } catch (e) { console.error(`  CJ error: ${(e as Error).message}`); return []; }
}

async function fetchRakuten(q: string, cat: string, min: number, max: number): Promise<Product[]> {
  const token = process.env.RAKUTEN_TOKEN;
  const publisherId = process.env.RAKUTEN_PUBLISHER_ID;
  if (!token || !publisherId) return [];
  try {
    const params = new URLSearchParams({
      keyword: q, publisherId,
      minPrice: String(min), maxPrice: String(max),
      pageSize: '20',
    });
    const resp = await fetch(`https://api.linksynergy.com/productsearch/1.0?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json() as any;
    const items = data?.result?.item ?? [];
    return (Array.isArray(items) ? items : [items])
      .filter((item: any) => item.productname && item.linkurl)
      .map((item: any) => {
        const price = parseFloat(item.saleprice ?? item.price ?? '0');
        return {
          id: buildId(item.productname, item.merchantname ?? 'Rakuten'),
          name: item.productname, description: item.description ?? '',
          category: cat, price, priceRange: detectPriceRange(price),
          imageUrl: item.imageurl ?? '',
          affiliateLink: item.linkurl,
          affiliateNetwork: 'rakuten', merchantName: item.merchantname ?? 'Rakuten',
          brand: item.merchantname,
          popularityScore: 68,
          styleTags: [], occasionTags: [], interestTags: [], recipientTags: [],
        };
      });
  } catch (e) { console.error(`  Rakuten error: ${(e as Error).message}`); return []; }
}

async function fetchImpact(q: string, cat: string, min: number, max: number): Promise<Product[]> {
  const sid = process.env.IMPACT_ACCOUNT_SID;
  const token = process.env.IMPACT_AUTH_TOKEN;
  if (!sid || !token) return [];
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const params = new URLSearchParams({ Keywords: q, PageSize: '20' });
    const resp = await fetch(`https://api.impact.com/Mediapartners/${sid}/Catalogs/Items?${params}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    });
    const data = await resp.json() as any;
    const items = (data?.Items ?? []).filter((item: any) => {
      const p = parseFloat(item.CurrentPrice ?? '0');
      return p >= min && p <= max;
    });
    return items
      .filter((item: any) => item.Name && item.TrackingLink)
      .map((item: any) => {
        const price = parseFloat(item.CurrentPrice ?? '0');
        return {
          id: buildId(item.Name, item.BrandName ?? 'Impact'),
          name: item.Name, description: item.Description ?? '',
          category: cat, price, priceRange: detectPriceRange(price),
          imageUrl: item.ImageUrl ?? '',
          affiliateLink: item.TrackingLink,
          affiliateNetwork: 'impact', merchantName: item.BrandName ?? 'Impact',
          brand: item.BrandName,
          popularityScore: 72,
          styleTags: [], occasionTags: [], interestTags: [], recipientTags: [],
        };
      });
  } catch (e) { console.error(`  Impact error: ${(e as Error).message}`); return []; }
}

// ─── AI Tagging ───────────────────────────────────────────────────────────────

function ruleTags(name: string, desc: string, cat: string) {
  const t = `${name} ${desc} ${cat}`.toLowerCase();
  return {
    styleTags: [/luxury|premium|designer/.test(t) ? 'luxury' : /minimalist|simple/.test(t) ? 'minimalist' : /romantic|floral/.test(t) ? 'romantic' : 'classic'],
    occasionTags: [/birthday/.test(t) ? 'birthday' : 'just_because', /anniversary/.test(t) ? 'anniversary' : null, /christmas/.test(t) ? 'christmas' : null].filter(Boolean) as string[],
    interestTags: [/fitness|yoga|gym/.test(t) ? 'fitness' : /beauty|skin|makeup/.test(t) ? 'beauty' : /tech|gadget/.test(t) ? 'tech' : /book|read/.test(t) ? 'books' : 'fashion'],
    recipientTags: ['girlfriend', 'wife', 'friend', 'sister', /mother|mom/.test(t) ? 'mother' : null].filter(Boolean) as string[],
  };
}

async function tagAll(products: Product[]): Promise<Product[]> {
  if (!AI_KEY) {
    console.log('  No ANTHROPIC_API_KEY — using rule-based tags. Add key to .env for better results.');
    return products.map(p => ({ ...p, ...ruleTags(p.name, p.description, p.category) }));
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: AI_KEY });
  const BATCH = 40;
  const tagged: Product[] = [];
  for (let i = 0; i < products.length; i += BATCH) {
    const chunk = products.slice(i, i + BATCH);
    process.stdout.write(`\r  Tagging ${Math.min(i + BATCH, products.length)}/${products.length}...`);
    const list = chunk.map((p, j) => `${j + 1}. "${p.name}" | ${p.category} | $${p.price} | ${p.description.slice(0, 100)}`).join('\n');
    try {
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 4096,
        messages: [{ role: 'user', content: `Tag these gift products. Use only these tags:\nSTYLE: minimalist,luxury,trendy,classic,sporty,romantic,vintage,casual\nOCCASION: birthday,anniversary,graduation,wedding,holiday,valentines_day,mothers_day,christmas,just_because\nINTEREST: fitness,fashion,beauty,travel,books,cooking,tech,wellness,home_decor,art\nRECIPIENT: girlfriend,wife,mother,sister,friend,daughter,grandmother,colleague\n\n${list}\n\nReturn ONLY JSON array: [{"style":["tag"],"occasion":["tag"],"interest":["tag"],"recipient":["tag","tag"]}]` }],
      });
      const text = resp.content.filter(b => b.type === 'text').map(b => (b as any).text).join('');
      const match = text.match(/\[[\s\S]*\]/);
      const aiTags = match ? JSON.parse(match[0]) : null;
      chunk.forEach((p, j) => {
        const t = aiTags?.[j];
        tagged.push({
          ...p,
          styleTags: (t?.style ?? ruleTags(p.name, p.description, p.category).styleTags).slice(0, 3),
          occasionTags: (t?.occasion ?? ruleTags(p.name, p.description, p.category).occasionTags).slice(0, 4),
          interestTags: (t?.interest ?? ruleTags(p.name, p.description, p.category).interestTags).slice(0, 3),
          recipientTags: (t?.recipient ?? ruleTags(p.name, p.description, p.category).recipientTags).slice(0, 6),
        });
      });
    } catch (e) {
      chunk.forEach(p => tagged.push({ ...p, ...ruleTags(p.name, p.description, p.category) }));
    }
  }
  process.stdout.write('\n');
  return tagged;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔍 Cherish Her — Automated Product Discovery');
  console.log('   Querying all connected affiliate networks...\n');

  const connected: string[] = [];
  if (process.env.CJ_API_KEY && process.env.CJ_WEBSITE_ID) connected.push('CJ');
  if (process.env.RAKUTEN_TOKEN && process.env.RAKUTEN_PUBLISHER_ID) connected.push('Rakuten');
  if (process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN) connected.push('Impact');
  if (connected.length === 0) {
    console.log('⚠️  No affiliate API credentials found in .env');
    console.log('   Add your CJ, Rakuten, and Impact credentials first.');
    console.log('   Use: npx ts-node scripts/import-products.ts for CSV-based imports.\n');
    return;
  }
  console.log(`   Connected: ${connected.join(', ')}\n`);

  const allProducts: Product[] = [];
  const seen = new Set<string>();

  for (const { q, cat, min, max } of QUERIES) {
    process.stdout.write(`\r  Searching: "${q}"...`);
    const results = await Promise.all([
      fetchCJ(q, cat, min, max),
      fetchRakuten(q, cat, min, max),
      fetchImpact(q, cat, min, max),
    ]);
    for (const batch of results) {
      for (const p of batch) {
        const key = p.name.toLowerCase().slice(0, 50) + '|' + p.price;
        if (seen.has(key)) continue;
        seen.add(key);
        allProducts.push(p);
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }
  process.stdout.write('\n');

  console.log(`\n📦 Found ${allProducts.length} unique products across all networks`);

  if (allProducts.length === 0) {
    console.log('\n⚠️  No products returned. Check your API credentials in .env\n');
    return;
  }

  if (DRY_RUN) {
    console.log('\n📋 Sample (first 5):');
    allProducts.slice(0, 5).forEach(p => {
      console.log(`  • ${p.name} ($${p.price}) — ${p.merchantName} [${p.affiliateNetwork}]`);
    });
    console.log(`\n  Run without --dry-run to import and tag all ${allProducts.length} products.\n`);
    return;
  }

  console.log('\n🤖 AI tagging...');
  const tagged = await tagAll(allProducts);

  const lines = tagged.map(p => `  {
    id: ${JSON.stringify(p.id)},
    name: ${JSON.stringify(p.name)},
    description: ${JSON.stringify(p.description)},
    category: ${JSON.stringify(p.category)} as any,
    price: ${p.price},
    priceRange: ${JSON.stringify(p.priceRange)} as any,
    imageUrl: ${JSON.stringify(p.imageUrl)},
    affiliateLink: ${JSON.stringify(p.affiliateLink)},
    affiliateNetwork: ${JSON.stringify(p.affiliateNetwork)} as any,
    merchantName: ${JSON.stringify(p.merchantName)},
    brand: ${JSON.stringify(p.brand ?? null)},
    rating: ${p.rating ?? null},
    reviewCount: null,
    popularityScore: ${p.popularityScore},
    styleTags: ${JSON.stringify(p.styleTags)} as any,
    occasionTags: ${JSON.stringify(p.occasionTags)} as any,
    interestTags: ${JSON.stringify(p.interestTags)},
    recipientTags: ${JSON.stringify(p.recipientTags)},
  }`).join(',\n');

  const output = [
    `// AUTO-GENERATED — DO NOT EDIT MANUALLY`,
    `// Generated: ${new Date().toISOString()}`,
    `// Products: ${tagged.length} from ${connected.join(', ')}`,
    ``,
    `import type { Product } from '../types';`,
    ``,
    `export interface TaggedProduct extends Product {`,
    `  interestTags: string[];`,
    `  recipientTags: string[];`,
    `}`,
    ``,
    `export const GENERATED_PRODUCTS: TaggedProduct[] = [`,
    lines,
    `];`,
    ``,
    `export default GENERATED_PRODUCTS;`,
    ``,
  ].join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

  console.log(`\n✅ ${tagged.length} products written → src/data/products.generated.ts`);
  console.log(`\nPush to all users:`);
  console.log(`   eas update --channel production --message "Fresh products from ${connected.join(', ')}"\n`);
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1); });
