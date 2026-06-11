import { Product, ScoredProduct, Profile, GiftPreferences, GiftFilters, SortOption, DiscoveryType, StyleTag, OccasionTag } from '../types';
import { PRODUCTS } from '../data/products';
import { getProductInteractions } from '../database/db';

// ─────────────────────────────────────────────
//  BUDGET SCORING
// ─────────────────────────────────────────────

const BUDGET_MAP: Record<string, number> = {
  very_budget: 40,
  budget: 75,
  moderate: 150,
  premium: 350,
  luxury: 999,
};

function scoreBudget(product: Product, budgetSensitivity: string, typicalBudget?: number): number {
  const maxBudget = typicalBudget ?? BUDGET_MAP[budgetSensitivity] ?? 150;
  const price = product.price;

  if (price <= maxBudget * 0.5) return 0.75;  // Under budget but maybe cheap
  if (price <= maxBudget * 0.8) return 1.0;   // Sweet spot
  if (price <= maxBudget) return 0.85;         // Within budget
  if (price <= maxBudget * 1.2) return 0.5;   // Slightly over
  if (price <= maxBudget * 1.5) return 0.25;  // Moderately over
  return 0.1;                                  // Way over budget
}

// ─────────────────────────────────────────────
//  STYLE SCORING
// ─────────────────────────────────────────────

function scoreStyle(product: Product, userStyles: StyleTag[]): number {
  if (!userStyles?.length) return 0.5;
  const matches = product.styleTags.filter(tag => userStyles.includes(tag));
  const score = matches.length / Math.max(product.styleTags.length, 1);
  return Math.min(score * 1.5, 1.0);  // Amplify partial matches
}

// ─────────────────────────────────────────────
//  OCCASION SCORING
// ─────────────────────────────────────────────

function scoreOccasion(product: Product, occasion?: OccasionTag): number {
  if (!occasion) return 0.5;
  return product.occasionTags.includes(occasion) ? 1.0 : 0.2;
}

// ─────────────────────────────────────────────
//  PREFERENCE SCORING
// ─────────────────────────────────────────────

function scorePreferences(
  product: Product,
  profile: Profile | null,
  giftPrefs: GiftPreferences | null
): number {
  let score = 0;
  let factors = 0;

  // Category preferences
  if (giftPrefs?.favoriteCategories?.length) {
    factors++;
    score += giftPrefs.favoriteCategories.includes(product.category) ? 1 : 0.2;
  }

  // Jewelry preferences
  if (giftPrefs?.jewelryPreferences?.length && product.category === 'jewelry') {
    factors++;
    const jewelMatch = giftPrefs.jewelryPreferences.some(j =>
      product.description.toLowerCase().includes(j.toLowerCase()) ||
      product.styleTags.some(s => s.toLowerCase().includes(j.toLowerCase()))
    );
    score += jewelMatch ? 1 : 0.5;
  }

  // Brand preferences
  if (giftPrefs?.favoriteBrands?.length && product.brand) {
    factors++;
    score += giftPrefs.favoriteBrands.some(b =>
      b.toLowerCase() === product.brand?.toLowerCase() ||
      product.merchantName.toLowerCase().includes(b.toLowerCase())
    ) ? 1 : 0.3;
  }

  // Store preferences
  if (giftPrefs?.favoriteStores?.length) {
    factors++;
    score += giftPrefs.favoriteStores.some(s =>
      product.merchantName.toLowerCase().includes(s.toLowerCase())
    ) ? 1 : 0.3;
  }

  // Luxury vs Practical alignment
  if (giftPrefs?.luxuryVsPractical) {
    factors++;
    const isLuxury = product.priceRange === 'luxury' || product.styleTags.includes('luxury');
    const isPractical = !product.styleTags.includes('luxury') && product.priceRange !== 'luxury';
    if (giftPrefs.luxuryVsPractical === 'luxury' && isLuxury) score += 1;
    else if (giftPrefs.luxuryVsPractical === 'practical' && isPractical) score += 1;
    else score += 0.5;
  }

  return factors > 0 ? score / factors : 0.5;
}

// ─────────────────────────────────────────────
//  HISTORY SCORING (local learning)
// ─────────────────────────────────────────────

async function buildHistoryScores(): Promise<Map<string, number>> {
  const interactions = await getProductInteractions();
  const scores = new Map<string, number>();

  const weights: Record<string, number> = {
    selected: 2.0,
    liked: 1.5,
    saved: 1.2,
    clicked: 0.8,
    viewed: 0.3,
    disliked: -1.5,
  };

  // Score by category patterns from interactions
  for (const interaction of interactions) {
    const product = PRODUCTS.find(p => p.id === interaction.productId);
    if (!product) continue;
    const weight = weights[interaction.type] ?? 0;
    // Boost/penalize same product
    scores.set(interaction.productId, (scores.get(interaction.productId) ?? 0) + weight);
  }

  return scores;
}

function scoreHistory(productId: string, historyScores: Map<string, number>): number {
  const raw = historyScores.get(productId) ?? 0;
  // Already interacted negatively = penalize
  if (raw < 0) return 0;
  // Normalize positive scores (cap at 1.0)
  return Math.min(raw / 4, 1.0);
}

// ─────────────────────────────────────────────
//  APPLY FILTERS
// ─────────────────────────────────────────────

function applyFilters(products: Product[], filters: GiftFilters): Product[] {
  return products.filter(product => {
    if (filters.occasion && !product.occasionTags.includes(filters.occasion)) return false;
    if (filters.priceRange && product.priceRange !== filters.priceRange) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    return true;
  });
}

// ─────────────────────────────────────────────
//  APPLY SORTING
// ─────────────────────────────────────────────

function applySorting(products: ScoredProduct[], sort: SortOption): ScoredProduct[] {
  const sorted = [...products];
  switch (sort) {
    case 'relevant':
      return sorted.sort((a, b) => b.totalScore - a.totalScore);
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'trending':
      return sorted.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.popularityScore - a.popularityScore);
    case 'newest':
      return sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.popularityScore - a.popularityScore);
    case 'luxury':
      const luxOrder = { luxury: 0, premium: 1, moderate: 2, budget: 3 };
      return sorted.sort((a, b) => (luxOrder[a.priceRange] ?? 4) - (luxOrder[b.priceRange] ?? 4));
    case 'budget':
      const budOrder = { budget: 0, moderate: 1, premium: 2, luxury: 3 };
      return sorted.sort((a, b) => (budOrder[a.priceRange] ?? 4) - (budOrder[b.priceRange] ?? 4));
    default:
      return sorted;
  }
}

// ─────────────────────────────────────────────
//  DISCOVERY INJECTION  (10–20% of feed)
// ─────────────────────────────────────────────

function injectDiscoveryRecommendations(
  ranked: ScoredProduct[],
  all: Product[],
  profile: Profile | null
): ScoredProduct[] {
  const existingIds = new Set(ranked.map(p => p.id));
  const notYetShown = all.filter(p => !existingIds.has(p.id));

  if (notYetShown.length === 0) return ranked;

  const targetDiscovery = Math.ceil(ranked.length * 0.15);  // ~15%
  const discoveryProducts: ScoredProduct[] = [];

  // 1. Trending picks
  const trending = notYetShown.filter(p => p.isTrending).slice(0, 3);
  // 2. Hidden gems — high rating but low popularity score
  const hiddenGems = notYetShown
    .filter(p => (p.rating ?? 0) >= 4.7 && p.popularityScore < 80)
    .slice(0, 2);
  // 3. Luxury upgrades
  const luxuryUpgrades = notYetShown.filter(p => p.priceRange === 'luxury').slice(0, 2);
  // 4. Budget alternatives
  const budgetAlts = notYetShown.filter(p => p.priceRange === 'budget').slice(0, 2);
  // 5. Seasonal
  const now = new Date();
  const month = now.getMonth() + 1;
  const isHolidaySeason = month >= 11 || month <= 1;
  const seasonal = isHolidaySeason
    ? notYetShown.filter(p => p.occasionTags.includes('christmas')).slice(0, 2)
    : [];

  const discoveryPool: Array<{ product: Product; type: DiscoveryType }> = [
    ...trending.map(p => ({ product: p, type: 'trending' as DiscoveryType })),
    ...hiddenGems.map(p => ({ product: p, type: 'hidden_gem' as DiscoveryType })),
    ...luxuryUpgrades.map(p => ({ product: p, type: 'luxury_upgrade' as DiscoveryType })),
    ...budgetAlts.map(p => ({ product: p, type: 'budget_alternative' as DiscoveryType })),
    ...seasonal.map(p => ({ product: p, type: 'seasonal' as DiscoveryType })),
  ];

  // Take up to targetDiscovery unique items
  const seenDiscovery = new Set<string>();
  for (const item of discoveryPool) {
    if (discoveryProducts.length >= targetDiscovery) break;
    if (seenDiscovery.has(item.product.id)) continue;
    seenDiscovery.add(item.product.id);
    discoveryProducts.push({
      ...item.product,
      totalScore: 0.45,
      styleScore: 0,
      budgetScore: 0,
      occasionScore: 0,
      preferenceScore: 0,
      isDiscovery: true,
      discoveryType: item.type,
      matchReason: getDiscoveryReason(item.type),
    });
  }

  // Interleave discoveries at regular intervals through the ranked feed
  const result: ScoredProduct[] = [];
  const interval = Math.floor(ranked.length / (discoveryProducts.length + 1));
  let discoveryIdx = 0;

  for (let i = 0; i < ranked.length; i++) {
    if (discoveryIdx < discoveryProducts.length && i > 0 && i % interval === 0) {
      result.push(discoveryProducts[discoveryIdx++]);
    }
    result.push(ranked[i]);
  }

  // Add remaining discovery items at the end
  while (discoveryIdx < discoveryProducts.length) {
    result.push(discoveryProducts[discoveryIdx++]);
  }

  return result;
}

function getDiscoveryReason(type: DiscoveryType): string {
  const reasons: Record<DiscoveryType, string> = {
    trending: 'Trending right now — popular with people like you',
    seasonal: 'Seasonal pick — perfect for this time of year',
    luxury_upgrade: 'Luxury upgrade — for when only the best will do',
    budget_alternative: 'Smart value — exceptional quality at a great price',
    hidden_gem: 'Hidden gem — highly rated but under the radar',
    new_arrival: 'New arrival — just added to our recommendations',
  };
  return reasons[type];
}

// ─────────────────────────────────────────────
//  GENERATE MATCH REASON
// ─────────────────────────────────────────────

function generateMatchReason(
  product: Product,
  profile: Profile | null,
  giftPrefs: GiftPreferences | null,
  scoreBreakdown: Omit<ScoredProduct, keyof Product | 'totalScore' | 'isDiscovery'>
): string {
  const reasons: string[] = [];

  if (scoreBreakdown.occasionScore > 0.8) {
    reasons.push('perfect for this occasion');
  }
  if (scoreBreakdown.styleScore > 0.7 && profile?.stylePreferences?.length) {
    reasons.push(`matches her ${profile.stylePreferences[0]} style`);
  }
  if (scoreBreakdown.budgetScore > 0.8) {
    reasons.push('fits your budget perfectly');
  }
  if (giftPrefs?.favoriteCategories?.includes(product.category)) {
    reasons.push('in a category she loves');
  }
  if (product.isTrending) {
    reasons.push('trending right now');
  }
  if (product.popularityScore >= 90) {
    reasons.push('highly popular choice');
  }

  if (reasons.length === 0) return 'A thoughtful choice she\'ll appreciate';
  return `This is ${reasons.slice(0, 2).join(' and ')}.`;
}

// ─────────────────────────────────────────────
//  MAIN ENGINE FUNCTION
// ─────────────────────────────────────────────

export interface GiftEngineOptions {
  profile: Profile | null;
  giftPrefs: GiftPreferences | null;
  filters: GiftFilters;
  sort: SortOption;
  includeDiscovery?: boolean;
}

export async function generateGiftRecommendations(
  options: GiftEngineOptions
): Promise<ScoredProduct[]> {
  const { profile, giftPrefs, filters, sort, includeDiscovery = true } = options;

  // 1. Apply hard filters
  const filtered = applyFilters(PRODUCTS, filters);

  // 2. Build history scores for local learning
  const historyScores = await buildHistoryScores();

  // 3. Score all products
  const scored: ScoredProduct[] = filtered.map(product => {
    const styleScore = scoreStyle(product, profile?.stylePreferences ?? []);
    const budgetScore = scoreBudget(
      product,
      profile?.budgetSensitivity ?? 'moderate',
      giftPrefs?.typicalBudget
    );
    const occasionScore = scoreOccasion(product, filters.occasion);
    const preferenceScore = scorePreferences(product, profile, giftPrefs);
    const popularityScore = product.popularityScore / 100;
    const historyScore = scoreHistory(product.id, historyScores);

    // Weighted total — satisfaction is primary signal
    const totalScore =
      styleScore * 0.28 +
      budgetScore * 0.25 +
      occasionScore * 0.22 +
      preferenceScore * 0.15 +
      popularityScore * 0.06 +
      historyScore * 0.04;

    const matchReason = generateMatchReason(
      product, profile, giftPrefs,
      { styleScore, budgetScore, occasionScore, preferenceScore }
    );

    return {
      ...product,
      totalScore,
      styleScore,
      budgetScore,
      occasionScore,
      preferenceScore,
      isDiscovery: false,
      matchReason,
    };
  });

  // 4. Filter out explicitly disliked products
  const dislikedIds = new Set(
    Array.from(historyScores.entries())
      .filter(([, score]) => score < 0)
      .map(([id]) => id)
  );
  const withoutDisliked = scored.filter(p => !dislikedIds.has(p.id));

  // 5. Sort by relevance (always rank by score first)
  const ranked = withoutDisliked.sort((a, b) => b.totalScore - a.totalScore);

  // 6. Inject discovery (15%)
  const withDiscovery = includeDiscovery
    ? injectDiscoveryRecommendations(ranked, PRODUCTS, profile)
    : ranked;

  // 7. Apply user-selected sort (after discovery injection to preserve interleaving)
  if (sort !== 'relevant') {
    return applySorting(withDiscovery, sort);
  }

  return withDiscovery;
}

// ─────────────────────────────────────────────
//  EMERGENCY RECOMMENDATIONS
// ─────────────────────────────────────────────

export async function getEmergencyGifts(
  urgency: 'fast' | 'birthday' | 'anniversary',
  budget?: number
): Promise<ScoredProduct[]> {
  const maxBudget = budget ?? 100;

  // Fast, practical, high-popularity gifts
  const fastGifts = PRODUCTS
    .filter(p => {
      if (p.price > maxBudget * 1.3) return false;
      if (urgency === 'birthday') return p.occasionTags.includes('birthday');
      if (urgency === 'anniversary') return p.occasionTags.includes('anniversary');
      return p.popularityScore >= 85;
    })
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 12)
    .map(p => ({
      ...p,
      totalScore: p.popularityScore / 100,
      styleScore: 0.5,
      budgetScore: p.price <= maxBudget ? 1.0 : 0.5,
      occasionScore: 0.8,
      preferenceScore: 0.5,
      isDiscovery: false,
      matchReason: 'Quick, reliable choice that ships fast.',
    }));

  return fastGifts;
}
