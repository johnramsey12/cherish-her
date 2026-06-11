import { Restaurant, Activity, DateIdea, DatePreferences, Profile } from '../types';
import { RESTAURANTS } from '../data/restaurants';
import { ACTIVITIES } from '../data/restaurants';

// ─────────────────────────────────────────────
//  RESTAURANT SCORING
// ─────────────────────────────────────────────

function scoreRestaurant(
  restaurant: Restaurant,
  datePrefs: DatePreferences | null,
  budget?: number
): number {
  let score = 0;
  let factors = 0;

  // Food preference match
  if (datePrefs?.favoriteFoods?.length) {
    factors++;
    const foodMatch = datePrefs.favoriteFoods.some(food =>
      restaurant.cuisine.toLowerCase().includes(food.toLowerCase()) ||
      restaurant.tags.some(t => t.toLowerCase().includes(food.toLowerCase())) ||
      restaurant.description.toLowerCase().includes(food.toLowerCase())
    );
    score += foodMatch ? 1.0 : 0.3;
  }

  // Budget match
  if (datePrefs?.typicalDateBudget || budget) {
    factors++;
    const maxBudget = budget ?? datePrefs?.typicalDateBudget ?? 100;
    const cost = restaurant.estimatedCostForTwo;
    if (cost <= maxBudget * 0.7) score += 0.75;
    else if (cost <= maxBudget) score += 1.0;
    else if (cost <= maxBudget * 1.3) score += 0.6;
    else score += 0.2;
  }

  // Romantic bonus
  if (restaurant.isRomantic) {
    score += 0.2;
  }

  // Rating bonus
  if (restaurant.rating) {
    factors++;
    score += Math.min((restaurant.rating - 3.5) / 1.5, 1.0);
  }

  return factors > 0 ? Math.min(score / factors + (restaurant.isRomantic ? 0.1 : 0), 1.0) : 0.5;
}

// ─────────────────────────────────────────────
//  ACTIVITY SCORING
// ─────────────────────────────────────────────

function scoreActivity(
  activity: Activity,
  datePrefs: DatePreferences | null,
  budget?: number
): number {
  let score = 0;
  let factors = 0;

  // Activity preference match
  if (datePrefs?.activityPreferences?.length) {
    factors++;
    const actMatch = datePrefs.activityPreferences.includes(activity.category);
    score += actMatch ? 1.0 : 0.3;
  }

  // Indoor/outdoor preference
  if (datePrefs?.indoorOutdoor) {
    factors++;
    const pref = datePrefs.indoorOutdoor;
    if (pref === 'both') score += 1.0;
    else if (activity.indoorOutdoor === pref) score += 1.0;
    else if (activity.indoorOutdoor === 'both') score += 0.7;
    else score += 0.2;
  }

  // Budget match
  if (datePrefs?.typicalDateBudget || budget) {
    factors++;
    const maxBudget = (budget ?? datePrefs?.typicalDateBudget ?? 100) * 0.4;  // Activities are part of budget
    const cost = activity.estimatedCost;
    if (cost <= maxBudget * 0.7) score += 0.85;
    else if (cost <= maxBudget) score += 1.0;
    else if (cost <= maxBudget * 1.5) score += 0.5;
    else score += 0.2;
  }

  // Seasonal bonus (current season)
  if (activity.isSeasonal) {
    const month = new Date().getMonth() + 1;
    const season = getSeasonFromMonth(month);
    if (activity.season === season || activity.season === 'all') {
      score += 0.15;
    } else {
      score -= 0.1;
    }
  }

  // Romantic bonus
  if (activity.isRomantic) score += 0.1;

  return factors > 0 ? Math.min(score / factors + (activity.isRomantic ? 0.05 : 0), 1.0) : 0.5;
}

function getSeasonFromMonth(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

// ─────────────────────────────────────────────
//  GENERATE DATE IDEAS
// ─────────────────────────────────────────────

export interface DateEngineOptions {
  datePrefs: DatePreferences | null;
  profile: Profile | null;
  budget?: number;
  type?: 'all' | 'dining' | 'activities' | 'combined';
}

export interface ScoredRestaurant extends Restaurant {
  score: number;
  whyItMatches?: string;
}

export interface ScoredActivity extends Activity {
  score: number;
  whyItMatches?: string;
}

export function generateRestaurantRecommendations(
  options: DateEngineOptions
): ScoredRestaurant[] {
  const { datePrefs, budget } = options;

  const scored: ScoredRestaurant[] = RESTAURANTS.map(restaurant => {
    const score = scoreRestaurant(restaurant, datePrefs, budget);
    const whyItMatches = generateRestaurantReason(restaurant, datePrefs, score);
    return { ...restaurant, score, whyItMatches };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export function generateActivityRecommendations(
  options: DateEngineOptions
): ScoredActivity[] {
  const { datePrefs, budget } = options;

  const scored: ScoredActivity[] = ACTIVITIES.map(activity => {
    const score = scoreActivity(activity, datePrefs, budget);
    const whyItMatches = generateActivityReason(activity, datePrefs, score);
    return { ...activity, score, whyItMatches };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export function generateCombinedDateIdeas(options: DateEngineOptions): DateIdea[] {
  const restaurants = generateRestaurantRecommendations(options).slice(0, 8);
  const activities = generateActivityRecommendations(options).slice(0, 8);
  const budget = options.budget ?? options.datePrefs?.typicalDateBudget ?? 100;

  const ideas: DateIdea[] = [];

  // 1. Restaurant-only ideas
  restaurants.slice(0, 4).forEach(restaurant => {
    ideas.push({
      id: `date_r_${restaurant.id}`,
      title: `Dinner at ${restaurant.name}`,
      description: restaurant.description,
      restaurant,
      estimatedTotalCost: restaurant.estimatedCostForTwo,
      priceRange: restaurant.priceRange,
      whyItMatches: restaurant.whyItMatches,
      score: restaurant.score,
      tags: restaurant.tags,
    });
  });

  // 2. Activity-only ideas
  activities.slice(0, 4).forEach(activity => {
    ideas.push({
      id: `date_a_${activity.id}`,
      title: activity.name,
      description: activity.description,
      activity,
      estimatedTotalCost: activity.estimatedCost,
      priceRange: activity.priceRange,
      whyItMatches: activity.whyItMatches,
      score: activity.score,
      tags: activity.tags,
    });
  });

  // 3. Combined restaurant + activity pairings (top 4)
  const topRestaurants = restaurants.slice(0, 2);
  const topActivities = activities.slice(0, 2);

  topRestaurants.forEach(restaurant => {
    topActivities.forEach(activity => {
      const totalCost = restaurant.estimatedCostForTwo + activity.estimatedCost;
      if (totalCost <= budget * 1.4) {
        ideas.push({
          id: `date_combo_${restaurant.id}_${activity.id}`,
          title: `${activity.name} + Dinner at ${restaurant.name}`,
          description: `Start with ${activity.name.toLowerCase()}, then enjoy dinner at ${restaurant.name}. ${activity.whyItMatches ?? ''} ${restaurant.whyItMatches ?? ''}`,
          restaurant,
          activity,
          estimatedTotalCost: totalCost,
          priceRange: totalCost > 150 ? 'premium' : totalCost > 75 ? 'moderate' : 'budget',
          whyItMatches: `A perfect pairing: ${activity.tags[0]} followed by ${restaurant.cuisine.toLowerCase()} dining.`,
          score: (restaurant.score + activity.score) / 2,
          tags: [...new Set([...restaurant.tags, ...activity.tags])].slice(0, 6),
        });
      }
    });
  });

  // Sort by score and return top 15
  return ideas.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 15);
}

// ─────────────────────────────────────────────
//  REASON GENERATION
// ─────────────────────────────────────────────

function generateRestaurantReason(
  restaurant: Restaurant,
  datePrefs: DatePreferences | null,
  score: number
): string {
  const reasons: string[] = [];

  if (restaurant.isRomantic) reasons.push('highly romantic atmosphere');
  if (score > 0.8 && datePrefs?.favoriteFoods?.length) {
    reasons.push(`matches her love of ${datePrefs.favoriteFoods[0]}`);
  }
  if (restaurant.rating && restaurant.rating >= 4.7) reasons.push('exceptionally rated');
  if (restaurant.openLate) reasons.push('perfect for a late evening');
  if (restaurant.priceRange === 'luxury') reasons.push('a truly special occasion choice');

  if (reasons.length === 0) {
    return 'A great choice for a memorable evening together.';
  }
  return reasons.slice(0, 2).join(' and ').replace(/^./, c => c.toUpperCase()) + '.';
}

function generateActivityReason(
  activity: Activity,
  datePrefs: DatePreferences | null,
  score: number
): string {
  const reasons: string[] = [];

  if (activity.isRomantic) reasons.push('naturally romantic setting');
  if (score > 0.8 && datePrefs?.activityPreferences?.includes(activity.category)) {
    reasons.push(`matches her love of ${activity.category} activities`);
  }
  if (!activity.requiresBooking) reasons.push('no booking required');
  if (activity.estimatedCost <= 30) reasons.push('very affordable');
  if (activity.isSeasonal) reasons.push('perfect for this time of year');

  if (reasons.length === 0) {
    return 'A fun activity she\'ll genuinely enjoy.';
  }
  return reasons.slice(0, 2).join(' and ').replace(/^./, c => c.toUpperCase()) + '.';
}

// ─────────────────────────────────────────────
//  EMERGENCY DATE IDEAS
// ─────────────────────────────────────────────

export function getEmergencyDateIdeas(type: 'tonight' | 'restaurant_now' | 'last_minute'): DateIdea[] {
  if (type === 'restaurant_now') {
    return RESTAURANTS
      .filter(r => r.openLate)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 5)
      .map(r => ({
        id: `emergency_r_${r.id}`,
        title: r.name,
        description: r.description,
        restaurant: r,
        estimatedTotalCost: r.estimatedCostForTwo,
        priceRange: r.priceRange,
        whyItMatches: 'Open now, highly rated, and ready for you.',
        score: (r.rating ?? 4) / 5,
        tags: r.tags,
      }));
  }

  // Tonight / last minute — fast, no-booking activities
  return ACTIVITIES
    .filter(a => !a.requiresBooking)
    .sort((a, b) => (b.isRomantic ? 1 : 0) - (a.isRomantic ? 1 : 0))
    .slice(0, 6)
    .map(a => ({
      id: `emergency_a_${a.id}`,
      title: a.name,
      description: a.description,
      activity: a,
      estimatedTotalCost: a.estimatedCost,
      priceRange: a.priceRange,
      whyItMatches: 'No booking needed — you can start right now.',
      score: 0.8,
      tags: a.tags,
    }));
}
