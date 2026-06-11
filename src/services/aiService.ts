import Constants from 'expo-constants';
import { Product, Profile, GiftPreferences } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function getApiKey(): string {
  return Constants.expoConfig?.extra?.anthropicApiKey ?? '';
}

// ─────────────────────────────────────────────
//  GENERATE GIFT EXPLANATION
// ─────────────────────────────────────────────

export async function generateGiftExplanation(
  product: Product,
  profile: Profile | null,
  giftPrefs: GiftPreferences | null,
  occasion?: string
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return getStaticExplanation(product, profile, occasion);
  }

  const profileSummary = buildProfileSummary(profile, giftPrefs);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 100,
        system: `You are a thoughtful gift advisor. Given a product and personal preferences, write a warm, 1-2 sentence explanation of why this specific gift is a great choice for this specific person. Be personal and specific, not generic. No filler phrases.`,
        messages: [
          {
            role: 'user',
            content: `Product: "${product.name}" — ${product.description.slice(0, 100)}
Price: $${product.price} (${product.priceRange})
${occasion ? `Occasion: ${occasion}` : ''}
${profileSummary}

Write a 1-2 sentence personalized explanation of why this is a great choice. Be warm and specific.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return getStaticExplanation(product, profile, occasion);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? getStaticExplanation(product, profile, occasion);
  } catch {
    return getStaticExplanation(product, profile, occasion);
  }
}

// ─────────────────────────────────────────────
//  GENERATE DATE IDEA EXPLANATION
// ─────────────────────────────────────────────

export async function generateDateExplanation(
  ideaTitle: string,
  ideaDescription: string,
  profile: Profile | null,
  datePrefs: any
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return 'A thoughtful choice tailored to her preferences and your budget.';
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 80,
        system: 'You are a romantic date advisor. Write a warm, 1-2 sentence explanation of why this date idea is perfect for this couple. Be specific and heartfelt.',
        messages: [
          {
            role: 'user',
            content: `Date idea: "${ideaTitle}"
Food preferences: ${datePrefs?.favoriteFoods?.slice(0, 3).join(', ') ?? 'various'}
Activity preferences: ${datePrefs?.activityPreferences?.slice(0, 3).join(', ') ?? 'various'}

Write a 1-2 sentence warm explanation.`,
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text ?? 'A perfect evening she\'ll remember fondly.';
  } catch {
    return 'A perfect evening she\'ll remember fondly.';
  }
}

// ─────────────────────────────────────────────
//  SUMMARIZE PROFILE (for use in recommendations)
// ─────────────────────────────────────────────

export async function summarizePreferences(
  profile: Profile | null,
  giftPrefs: GiftPreferences | null
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) return '';

  const profileSummary = buildProfileSummary(profile, giftPrefs);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        system: 'Create a concise 2-3 sentence summary of this person\'s gift preferences. Write as if describing the person, not listing preferences.',
        messages: [{ role: 'user', content: profileSummary }],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text ?? '';
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function buildProfileSummary(profile: Profile | null, giftPrefs: GiftPreferences | null): string {
  if (!profile) return 'No profile information available.';

  const parts: string[] = [];
  if (profile.stylePreferences?.length) {
    parts.push(`Style: ${profile.stylePreferences.join(', ')}`);
  }
  if (profile.interests?.length) {
    parts.push(`Interests: ${profile.interests.slice(0, 4).join(', ')}`);
  }
  if (profile.hobbies?.length) {
    parts.push(`Hobbies: ${profile.hobbies.slice(0, 4).join(', ')}`);
  }
  if (giftPrefs?.favoriteCategories?.length) {
    parts.push(`Favorite gift categories: ${giftPrefs.favoriteCategories.join(', ')}`);
  }
  if (giftPrefs?.typicalBudget) {
    parts.push(`Typical budget: $${giftPrefs.typicalBudget}`);
  }
  if (giftPrefs?.luxuryVsPractical) {
    parts.push(`Prefers: ${giftPrefs.luxuryVsPractical} gifts`);
  }

  return parts.join('\n') || 'General preferences';
}

function getStaticExplanation(
  product: Product,
  profile: Profile | null,
  occasion?: string
): string {
  const occasionPhrases: Record<string, string> = {
    birthday: 'a perfect birthday surprise',
    anniversary: 'a meaningful anniversary gift',
    valentines: 'a romantic Valentine\'s Day gesture',
    christmas: 'a wonderful holiday gift',
    mothers_day: 'a touching Mother\'s Day present',
    just_because: 'a thoughtful just-because gesture',
  };

  const occasionPhrase = occasion ? occasionPhrases[occasion] : 'a thoughtful choice';
  const priceNote = product.priceRange === 'budget' ? 'great value' : product.priceRange === 'luxury' ? 'pure luxury' : 'perfectly priced';

  return `This is ${occasionPhrase} she\'ll genuinely love — ${priceNote} and something that speaks to her style.`;
}
