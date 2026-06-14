// Lightweight, dependency-free relevance search for the gift catalog.
// Tokenizes the query, applies light stemming + typo tolerance, and scores
// each product across weighted fields (name, brand, keywords, tags,
// description), returning results sorted by relevance. Empty/whitespace
// queries return the input unchanged.

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'to', 'of', 'with', 'and', 'or',
  'her', 'him', 'his', 'their', 'my', 'its',
  'gift', 'gifts', 'present', 'presents', 'idea', 'ideas',
]);

export interface SearchableProduct {
  name: string;
  brand?: string | null;
  merchantName?: string;
  category?: string;
  description?: string;
  styleTags?: string[];
  occasionTags?: string[];
  interestTags?: string[];
  searchKeywords?: string[];
}

const FIELD_WEIGHTS = {
  name: 100,
  brand: 70,
  searchKeywords: 60,
  merchant: 40,
  tags: 30,
  description: 15,
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// Light suffix stripping so plurals/verb forms match their root.
function stem(word: string): string {
  if (word.length > 4 && /[cs]hes$|xes$|sses$|zes$/.test(word)) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2);
  return word;
}

// True if edit distance between a and b is <= 1 (one typo: sub/insert/delete).
function withinEditDistance1(a: string, b: string): boolean {
  if (a === b) return true;
  const lenDiff = a.length - b.length;
  if (Math.abs(lenDiff) > 1) return false;

  if (lenDiff === 0) {
    let diffs = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        diffs++;
        if (diffs > 1) return false;
      }
    }
    return diffs === 1;
  }

  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let i = 0;
  let j = 0;
  let diffs = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
    } else {
      j++;
      diffs++;
      if (diffs > 1) return false;
    }
  }
  return true;
}

// Best match score for one query token against a block of text.
function fieldScore(queryToken: string, fieldText: string, weight: number): number {
  if (!fieldText) return 0;
  const fieldTokens = tokenize(fieldText);
  const qStem = stem(queryToken);

  for (const ft of fieldTokens) {
    if (ft === queryToken) return weight;
    if (stem(ft) === qStem) return weight * 0.9;
  }

  if (queryToken.length >= 3) {
    for (const ft of fieldTokens) {
      if (ft.startsWith(queryToken) || ft.startsWith(qStem)) return weight * 0.6;
    }
  }

  if (queryToken.length >= 4) {
    for (const ft of fieldTokens) {
      if (withinEditDistance1(ft, queryToken) || withinEditDistance1(stem(ft), qStem)) {
        return weight * 0.4;
      }
    }
  }

  return 0;
}

export function scoreProduct(p: SearchableProduct, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;

  const tagsBlob = [
    ...(p.styleTags ?? []),
    ...(p.occasionTags ?? []),
    ...(p.interestTags ?? []),
    p.category ?? '',
  ].join(' ');

  let total = 0;
  for (const qt of queryTokens) {
    let best = 0;
    best = Math.max(best, fieldScore(qt, p.name, FIELD_WEIGHTS.name));
    best = Math.max(best, fieldScore(qt, p.brand ?? '', FIELD_WEIGHTS.brand));
    best = Math.max(best, fieldScore(qt, (p.searchKeywords ?? []).join(' '), FIELD_WEIGHTS.searchKeywords));
    best = Math.max(best, fieldScore(qt, p.merchantName ?? '', FIELD_WEIGHTS.merchant));
    best = Math.max(best, fieldScore(qt, tagsBlob, FIELD_WEIGHTS.tags));
    best = Math.max(best, fieldScore(qt, p.description ?? '', FIELD_WEIGHTS.description));
    total += best;
  }
  return total;
}

// Returns products sorted by relevance (highest first), excluding products
// that match none of the query's meaningful tokens. Empty/stopword-only
// queries return the input unchanged.
export function searchProducts<T extends SearchableProduct>(products: T[], query: string): T[] {
  const tokens = tokenize(query).filter((t) => t.length > 0 && !STOP_WORDS.has(t));
  if (tokens.length === 0) return products;

  return products
    .map((p) => ({ item: p, score: scoreProduct(p, tokens) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}
