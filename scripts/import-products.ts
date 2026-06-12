#!/usr/bin/env ts-node
/**
 * import-products.ts
 * Reads CSV/JSON/XML files from the imports/ folder, normalizes them,
 * AI-tags each product with Claude, writes src/data/products.generated.ts,
 * and pushes all products to the Cherish Her server.
 *
 * Usage:
 *   npx tsx scripts/import-products.ts              (rule-based tags)
 *   npx tsx scripts/import-products.ts --ai         (Claude AI tags)
 *   npx tsx scripts/import-products.ts --dry-run    (preview only)
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import { XMLParser } from 'fast-xml-parser';
import 'dotenv/config';

const USE_AI      = process.argv.includes('--ai');
const DRY_RUN     = process.argv.includes('--dry-run');
const IMPORTS_DIR = path.join(__dirname, '..', 'imports');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'products.generated.ts');
const AI_KEY      = process.env.ANTHROPIC_API_KEY ?? '';
const SERVER_URL  = process.env.SERVER_URL ?? '';
const API_KEY     = process.env.IMPORT_API_KEY ?? '';

interface RawProduct { [key: string]: string | number | undefined }

const FIELD_MAP: Record<string, string> = {
  'id':'id','product_id':'id','sku':'id','asin':'id','item_id':'id',
  'name':'name','product_name':'name','title':'name','item_name':'name',
  'description':'description','product_description':'description','desc':'description','long_description':'description',
  'price':'price','regular_price':'price','list_price':'price','msrp':'price','retail_price':'price',
  'sale_price':'salePrice','discounted_price':'salePrice',
  'image':'imageUrl','image_url':'imageUrl','imageurl':'imageUrl','image_link':'imageUrl',
  'thumbnail':'imageUrl','main_image':'imageUrl','photo':'imageUrl',
  'affiliate_url':'affiliateLink','buy_url':'affiliateLink','link':'affiliateLink',
  'url':'affiliateLink','buyurl':'affiliateLink','purchase_url':'affiliateLink','tracking_url':'affiliateLink',
  'brand':'brand','manufacturer':'brand','vendor':'brand',
  'merchant':'merchantName','merchant_name':'merchantName','store':'merchantName','advertiser':'merchantName',
  'category':'category','product_category':'category','department':'category','product_type':'category',
  'rating':'rating','average_rating':'rating','review_score':'rating',
  'review_count':'reviewCount','num_reviews':'reviewCount',
};

function extractFields(raw: RawProduct): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(raw)) {
    const target = FIELD_MAP[key.toLowerCase().replace(/[\s\-]+/g, '_')] ?? FIELD_MAP[key];
    if (target) {
      const v = raw[key];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        result[target] = String(v).trim();
      }
    }
  }
  return result;
}

function parsePrice(raw?: string): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

function detectCategory(name: string, cat: string, desc: string): string {
  const t = `${name} ${cat} ${desc}`.toLowerCase();
  if (/ring|necklace|bracelet|earring|jewelry|jewellery|pendant|charm|diamond|pearl/.test(t)) return 'jewelry';
  if (/skincare|serum|moisturizer|cleanser|sunscreen|retinol|face wash|eye cream|toner/.test(t)) return 'skincare';
  if (/spa|massage|bath bomb|candle|essential oil|diffuser|meditation|wellness|self.care/.test(t)) return 'spa_wellness';
  if (/bag|purse|handbag|tote|clutch|backpack|wallet|crossbody/.test(t)) return 'handbags';
  if (/shoe|sneaker|boot|heel|sandal|loafer|mule|pump|footwear/.test(t)) return 'fashion';
  if (/dress|blouse|top|jeans|skirt|jacket|coat|sweater|cardigan|legging|shirt|fashion|clothing|apparel/.test(t)) return 'fashion';
  if (/phone|tablet|laptop|earbuds|headphone|speaker|smartwatch|kindle|camera|gadget|tech/.test(t)) return 'tech';
  if (/book|novel|memoir|cookbook|journal|planner|diary/.test(t)) return 'books';
  if (/fitness|gym|yoga mat|workout|activewear|sports bra|running|bicycle|weights/.test(t)) return 'fitness';
  if (/wine|chocolate|coffee|tea|gin|whiskey|champagne|food|snack|gourmet|cheese/.test(t)) return 'food_drink';
  if (/vase|frame|pillow|blanket|throw|lamp|wall art|planter|home decor/.test(t)) return 'home_decor';
  if (/flower|bouquet|plant|succulent|orchid|rose|tulip/.test(t)) return 'flowers_plants';
  if (/personalized|custom|engraved|monogram|initial|bespoke/.test(t)) return 'personalized';
  if (/experience|class|lesson|workshop|tour|ticket|membership|subscription/.test(t)) return 'experiences';
  if (/perfume|fragrance|cologne/.test(t)) return 'skincare';
  return 'fashion';
}

function detectPriceRange(price: number): string {
  if (price < 25) return 'budget';
  if (price < 75) return 'moderate';
  if (price < 200) return 'premium';
  if (price < 500) return 'high_end';
  return 'luxury';
}

function cleanText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function buildId(name: string, merchant: string): string {
  const key = `${name.toLowerCase()}_${merchant.toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return 'p_' + Math.abs(hash).toString(16).padStart(8, '0');
}

function parseFile(filePath: string): RawProduct[] {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const raw = fs.readFileSync(filePath, 'utf-8');
  if (ext === 'csv' || ext === 'tsv') {
    try {
      return parseCsv(raw, {
        columns: true, skip_empty_lines: true, trim: true,
        bom: true, relax_column_count: true,
        delimiter: ext === 'tsv' ? '\t' : ',',
      }) as RawProduct[];
    } catch (e) {
      console.error(`  CSV error in ${path.basename(filePath)}: ${(e as Error).message}`);
      return [];
    }
  }
  if (ext === 'json') {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
      for (const key of ['products', 'items', 'data', 'results', 'feed', 'offers']) {
        if (Array.isArray((data as Record<string, unknown>)[key])) {
          return (data as Record<string, unknown>)[key] as RawProduct[];
        }
      }
      return [data];
    } catch (e) {
      console.error(`  JSON error: ${(e as Error).message}`);
      return [];
    }
  }
  if (ext === 'xml' || ext === 'rss') {
    const parser = new XMLParser({
      ignoreAttributes: false, attributeNamePrefix: '@_',
      parseTagValue: true, trimValues: true,
      isArray: (_n: string, _j: string, _l: boolean, isAttr: boolean) => !isAttr,
    });
    try {
      const parsed = parser.parse(raw);
      const findArr = (obj: unknown, depth = 0): unknown[] => {
        if (depth > 5) return [];
        if (Array.isArray(obj) && obj.length > 1 && typeof obj[0] === 'object') return obj;
        if (obj && typeof obj === 'object') {
          const best = Object.values(obj as Record<string, unknown>)
            .map(v => findArr(v, depth + 1))
            .sort((a, b) => b.length - a.length)[0];
          if (best && best.length > 0) return best;
        }
        return [];
      };
      return findArr(parsed) as RawProduct[];
    } catch (e) {
      console.error(`  XML error: ${(e as Error).message}`);
      return [];
    }
  }
  return [];
}

function ruleTags(name: string, desc: string, cat: string) {
  const t = `${name} ${desc} ${cat}`.toLowerCase();
  const style: string[] = [];
  if (/luxury|premium|designer|high.end|gold|diamond/.test(t)) style.push('luxury');
  else if (/minimalist|simple|clean|slim|sleek/.test(t)) style.push('minimalist');
  else if (/trendy|modern|contemporary|new/.test(t)) style.push('trendy');
  else if (/romantic|love|heart|floral|rose|pink/.test(t)) style.push('romantic');
  else if (/sport|athletic|active|workout/.test(t)) style.push('sporty');
  else if (/vintage|retro|antique/.test(t)) style.push('vintage');
  else style.push('classic');

  const occasion: string[] = [];
  if (/birthday|bday/.test(t)) occasion.push('birthday');
  if (/anniversary/.test(t)) occasion.push('anniversary');
  if (/christmas|xmas|holiday/.test(t)) occasion.push('christmas');
  if (/wedding|bride/.test(t)) occasion.push('wedding');
  if (/valentine/.test(t)) occasion.push('valentines_day');
  if (/mother|mom/.test(t)) occasion.push('mothers_day');
  if (occasion.length === 0) occasion.push('birthday', 'just_because');

  const interest: string[] = [];
  if (/fitness|gym|yoga|workout/.test(t)) interest.push('fitness');
  else if (/fashion|style|clothing|apparel/.test(t)) interest.push('fashion');
  else if (/beauty|skincare|makeup|fragrance/.test(t)) interest.push('beauty');
  else if (/tech|gadget|digital|phone/.test(t)) interest.push('tech');
  else if (/book|read|novel/.test(t)) interest.push('books');
  else if (/cook|kitchen|bake|food/.test(t)) interest.push('cooking');
  else if (/wellness|spa|relax|meditation/.test(t)) interest.push('wellness');
  else if (/home|decor|interior|candle/.test(t)) interest.push('home_decor');
  else interest.push('fashion');

  return {
    styleTags: style.slice(0, 3),
    occasionTags: occasion.slice(0, 4),
    interestTags: interest.slice(0, 3),
    recipientTags: ['girlfriend', 'wife', 'friend', 'sister'],
  };
}

async function tagWithAI(products: Array<{ id: string; name: string; description: string; category: string; price: number | null }>) {
  if (!AI_KEY) return null;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: AI_KEY });
    const list = products.map((p, i) =>
      `${i + 1}. "${p.name}" | ${p.category} | $${p.price} | ${(p.description || '').slice(0, 120)}`
    ).join('\n');
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Tag these gift products. Only use tags from these exact lists:
STYLE: minimalist, luxury, trendy, classic, sporty, bohemian, romantic, vintage, casual, artsy
OCCASION: birthday, anniversary, graduation, wedding, holiday, valentines_day, mothers_day, christmas, just_because, housewarming
INTEREST: fitness, fashion, beauty, travel, books, cooking, tech, wellness, home_decor, art
RECIPIENT: girlfriend, wife, mother, sister, friend, daughter, grandmother, colleague, teacher

PRODUCTS:
${list}

Return ONLY a JSON array with one object per product:
[{"style":["tag1"],"occasion":["tag1","tag2"],"interest":["tag1"],"recipient":["tag1","tag2","tag3"]}]`
      }],
    });
    const text = resp.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    return JSON.parse(match[0]) as Array<{
      style: string[]; occasion: string[]; interest: string[]; recipient: string[];
    }>;
  } catch (e) {
    console.error('  AI tagging error:', (e as Error).message);
    return null;
  }
}

async function pushToServer(products: any[]) {
  if (!SERVER_URL || !API_KEY) {
    console.log('\n⚠️  SERVER_URL or IMPORT_API_KEY not set — skipping server push');
    return;
  }
  console.log(`\n🚀 Pushing ${products.length} products to server...`);
  const BATCH = 50;
  let totalCreated = 0;
  let totalUpdated = 0;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    try {
      const res = await fetch(`${SERVER_URL}/api/gifts/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ products: batch }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`\n  ❌ Server error (batch ${i / BATCH + 1}): ${err}`);
        continue;
      }

      const data = await res.json() as { created: number; updated: number };
      totalCreated += data.created ?? 0;
      totalUpdated += data.updated ?? 0;
      process.stdout.write(`\r   ${Math.min(i + BATCH, products.length)}/${products.length} pushed...`);
    } catch (e) {
      console.error(`\n  ❌ Network error: ${(e as Error).message}`);
    }
  }

  console.log(`\n✅ Server updated — ${totalCreated} new, ${totalUpdated} refreshed`);
  console.log(`   Live at: ${SERVER_URL}/api/gifts`);
}

async function main() {
  console.log('\n🚀 Cherish Her — Product Import Pipeline');
  console.log(`   AI tagging: ${USE_AI && AI_KEY ? '✓ Claude' : AI_KEY ? '✓ key found (add --ai flag)' : '✗ rule-based (no API key)'}`);
  console.log(`   Server:     ${SERVER_URL ? `✓ ${SERVER_URL}` : '✗ not configured'}`);
  console.log(`   Dry run:    ${DRY_RUN ? '✓ preview only' : '✗ will write output'}\n`);

  if (!fs.existsSync(IMPORTS_DIR)) {
    fs.mkdirSync(IMPORTS_DIR, { recursive: true });
    console.log('Created imports/ folder. Add your CSV/JSON/XML files there and run again.\n');
    return;
  }

  const files = fs.readdirSync(IMPORTS_DIR)
    .filter(f => /\.(csv|tsv|json|xml|rss)$/i.test(f) && !f.startsWith('.'))
    .map(f => path.join(IMPORTS_DIR, f));

  if (files.length === 0) {
    console.log('No files found in imports/. Add CSV, JSON, or XML product files and run again.\n');
    return;
  }

  console.log(`📁 Files: ${files.map(f => path.basename(f)).join(', ')}\n`);

  const allRaw: Array<{ raw: RawProduct; filename: string }> = [];
  for (const file of files) {
    const rows = parseFile(file);
    allRaw.push(...rows.map(r => ({ raw: r, filename: path.basename(file) })));
    console.log(`  ✓ ${path.basename(file)}: ${rows.length} rows`);
  }

  const seen = new Set<string>();
  const products = [];

  for (const { raw, filename } of allRaw) {
    const f = extractFields(raw);
    const name = cleanText(f.name);
    const price = parsePrice(f.price ?? f.salePrice);
    const link = f.affiliateLink;
    if (!name || name.length < 3 || !price || price <= 0 || !link) continue;
    const merchant = cleanText(f.merchantName) ||
      filename.replace(/\.(csv|json|xml|tsv)$/i, '').replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    const key = `${name.toLowerCase().slice(0, 60)}|${merchant.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const category = detectCategory(name, f.category || '', cleanText(f.description));
    products.push({
      id: buildId(name, merchant),
      name,
      description: cleanText(f.description).slice(0, 500),
      category,
      price,
      priceRange: detectPriceRange(price),
      imageUrl: f.imageUrl || 'https://images.unsplash.com/photo-1549476464-37392f717541?w=600&q=80',
      affiliateLink: link,
      affiliateNetwork: 'amazon' as const,
      merchantName: merchant,
      brand: cleanText(f.brand) || undefined,
      rating: parseFloat(f.rating || '0') || undefined,
      reviewCount: parseInt(f.reviewCount || '0', 10) || undefined,
      popularityScore: Math.min(100, Math.round(
        ((parseFloat(f.rating || '3') / 5) * 60) +
        ((Math.min(parseInt(f.reviewCount || '0', 10), 5000) / 5000) * 40)
      )),
    });
  }

  console.log(`\n📦 ${products.length} unique products after dedup`);
  if (products.length === 0) {
    console.log('No valid products found. Check that your files have name, price, and affiliate_url columns.\n');
    return;
  }

  console.log(`\n🏷  Tagging ${products.length} products (${USE_AI && AI_KEY ? 'Claude AI' : 'rule-based'})...`);

  const BATCH = 40;
  const tagged = [];

  for (let i = 0; i < products.length; i += BATCH) {
    const chunk = products.slice(i, i + BATCH);
    process.stdout.write(`\r  ${Math.min(i + BATCH, products.length)}/${products.length} tagged...`);
    const aiTags = USE_AI && AI_KEY ? await tagWithAI(chunk) : null;
    for (let j = 0; j < chunk.length; j++) {
      const p = chunk[j];
      const tags = aiTags?.[j] ?? ruleTags(p.name, p.description, p.category);
      tagged.push({
        ...p,
        styleTags: ((tags as any).style ?? (tags as any).styleTags ?? []).slice(0, 3),
        occasionTags: ((tags as any).occasion ?? (tags as any).occasionTags ?? []).slice(0, 4),
        interestTags: ((tags as any).interest ?? (tags as any).interestTags ?? []).slice(0, 3),
        recipientTags: ((tags as any).recipient ?? (tags as any).recipientTags ?? []).slice(0, 6),
      });
    }
  }
  process.stdout.write('\n');

  if (DRY_RUN) {
    console.log('\n📋 Sample output (first 3 products):');
    tagged.slice(0, 3).forEach(p => {
      console.log(`\n  ${p.name} ($${p.price}) — ${p.merchantName}`);
      console.log(`    Category:  ${p.category}`);
      console.log(`    Style:     ${p.styleTags.join(', ')}`);
      console.log(`    Occasion:  ${p.occasionTags.join(', ')}`);
      console.log(`    Recipient: ${p.recipientTags.join(', ')}`);
    });
    console.log(`\n  Total: ${tagged.length} products ready to write.\n`);
    return;
  }

  // Write local file (kept for fallback)
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
    reviewCount: ${p.reviewCount ?? null},
    popularityScore: ${p.popularityScore},
    styleTags: ${JSON.stringify(p.styleTags)} as any,
    occasionTags: ${JSON.stringify(p.occasionTags)} as any,
    interestTags: ${JSON.stringify(p.interestTags)},
    recipientTags: ${JSON.stringify(p.recipientTags)},
  }`).join(',\n');

  const output = [
    `// AUTO-GENERATED — DO NOT EDIT MANUALLY`,
    `// Generated: ${new Date().toISOString()}`,
    `// Products: ${tagged.length}`,
    `// Regenerate: npx tsx scripts/import-products.ts`,
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
  console.log(`\n✅ Written → src/data/products.generated.ts`);
  console.log(`   ${tagged.length} products ready for the app.`);

  // Push to server
  await pushToServer(tagged);

  console.log(`\nNext: push OTA update to all users:`);
  console.log(`   eas update --channel production --message "New products"\n`);
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e.message);
  process.exit(1);
});