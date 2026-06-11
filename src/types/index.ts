// ─────────────────────────────────────────────
//  CORE ENTITIES
// ─────────────────────────────────────────────

export type PriceRange = 'budget' | 'moderate' | 'premium' | 'luxury';
export type SortOption = 'relevant' | 'price_asc' | 'price_desc' | 'trending' | 'newest' | 'luxury' | 'budget';
export type OccasionTag =
  | 'birthday'
  | 'anniversary'
  | 'christmas'
  | 'valentines'
  | 'mothers_day'
  | 'graduation'
  | 'wedding'
  | 'just_because'
  | 'apology'
  | 'custom';

export type StyleTag =
  | 'classic'
  | 'modern'
  | 'bohemian'
  | 'minimalist'
  | 'romantic'
  | 'sporty'
  | 'luxury'
  | 'casual'
  | 'artistic'
  | 'vintage';

export type CategoryTag =
  | 'jewelry'
  | 'skincare'
  | 'fashion'
  | 'books'
  | 'home_decor'
  | 'experiences'
  | 'tech'
  | 'fitness'
  | 'food_drink'
  | 'travel'
  | 'spa_wellness'
  | 'art_craft'
  | 'subscription'
  | 'flowers_plants'
  | 'personalized';

export type AffiliateNetwork = 'cj' | 'impact' | 'rakuten' | 'amazon' | 'shareasale' | 'direct';

// ─────────────────────────────────────────────
//  PRODUCT / AFFILIATE
// ─────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  category: CategoryTag;
  price: number;
  priceRange: PriceRange;
  styleTags: StyleTag[];
  occasionTags: OccasionTag[];
  sizeCompatibility?: string[];
  imageUrl: string;
  affiliateLink: string;
  affiliateNetwork: AffiliateNetwork;
  merchantName: string;
  popularityScore: number; // 0-100
  isNew?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  brand?: string;
  rating?: number;       // 0-5
  reviewCount?: number;
}

export interface ScoredProduct extends Product {
  totalScore: number;
  styleScore: number;
  budgetScore: number;
  occasionScore: number;
  preferenceScore: number;
  isDiscovery: boolean;
  discoveryType?: DiscoveryType;
  matchReason?: string;
}

export type DiscoveryType =
  | 'trending'
  | 'seasonal'
  | 'luxury_upgrade'
  | 'budget_alternative'
  | 'hidden_gem'
  | 'new_arrival';

// ─────────────────────────────────────────────
//  DATE IDEAS
// ─────────────────────────────────────────────

export type ActivityCategory =
  | 'dining'
  | 'outdoor'
  | 'indoor'
  | 'entertainment'
  | 'wellness'
  | 'adventure'
  | 'cultural'
  | 'seasonal'
  | 'romantic';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  priceRange: PriceRange;
  estimatedCostForTwo: number;
  address?: string;
  zipCodes?: string[];     // zip codes this restaurant applies to
  rating?: number;
  imageUrl: string;
  reservationLink?: string;
  tags: string[];
  isRomantic?: boolean;
  openLate?: boolean;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  estimatedCost: number;
  priceRange: PriceRange;
  duration?: string;        // e.g. "2-3 hours"
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  imageUrl: string;
  tags: string[];
  isSeasonal?: boolean;
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  isRomantic?: boolean;
  requiresBooking?: boolean;
}

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  restaurant?: Restaurant;
  activity?: Activity;
  estimatedTotalCost: number;
  priceRange: PriceRange;
  whyItMatches?: string;
  score?: number;
  tags: string[];
}

// ─────────────────────────────────────────────
//  USER PROFILE
// ─────────────────────────────────────────────

export type BudgetSensitivity = 'very_budget' | 'budget' | 'moderate' | 'premium' | 'luxury';

export interface Profile {
  id: string;
  partnerName?: string;
  birthday?: string;           // ISO date string YYYY-MM-DD
  anniversaryDate?: string;    // ISO date string YYYY-MM-DD
  stylePreferences: StyleTag[];
  jewelryPreferences: string[];
  favoriteColors: string[];
  favoriteClothingBrands: string[];
  favoriteStores: string[];
  interests: string[];
  hobbies: string[];
  foodPreferences: string[];
  activityPreferences: ActivityCategory[];
  ringSize?: string;
  wristSize?: string;
  clothingSizes?: { top?: string; bottom?: string; dress?: string };
  shoeSize?: string;
  budgetSensitivity: BudgetSensitivity;
  zipCode?: string;
  travelRadius?: number;       // miles
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
//  SURVEY SYSTEM
// ─────────────────────────────────────────────

export type SurveyType = 'profile' | 'gift' | 'date';

export interface SurveyState {
  profileCompleted: boolean;
  giftCompleted: boolean;
  dateCompleted: boolean;
  profileCompletedAt?: string;
  giftCompletedAt?: string;
  dateCompletedAt?: string;
}

export interface GiftPreferences {
  luxuryVsPractical: 'luxury' | 'practical' | 'balanced';
  jewelryPreferences: string[];
  favoriteCategories: CategoryTag[];
  favoriteStores: string[];
  typicalBudget: number;
  favoriteBrands: string[];
}

export interface DatePreferences {
  favoriteFoods: string[];
  favoriteRestaurants: string[];
  activityPreferences: ActivityCategory[];
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  travelRadius: number;
  typicalDateBudget: number;
  zipCode: string;
}

// ─────────────────────────────────────────────
//  INTERACTION HISTORY
// ─────────────────────────────────────────────

export type InteractionType = 'viewed' | 'clicked' | 'saved' | 'selected' | 'liked' | 'disliked';

export interface ProductInteraction {
  id: string;
  productId: string;
  type: InteractionType;
  timestamp: string;
  occasion?: OccasionTag;
}

export interface DateInteraction {
  id: string;
  ideaId: string;
  type: InteractionType;
  timestamp: string;
  notes?: string;
}

// ─────────────────────────────────────────────
//  GIFT FILTERS
// ─────────────────────────────────────────────

export interface GiftFilters {
  occasion?: OccasionTag;
  priceRange?: PriceRange;
  category?: CategoryTag;
  minPrice?: number;
  maxPrice?: number;
}

// ─────────────────────────────────────────────
//  EMERGENCY MODE
// ─────────────────────────────────────────────

export type EmergencyType =
  | 'gift_fast'
  | 'date_tonight'
  | 'restaurant_now'
  | 'last_minute'
  | 'anniversary_help'
  | 'birthday_help';

// ─────────────────────────────────────────────
//  NOTIFICATION
// ─────────────────────────────────────────────

export interface ReminderConfig {
  birthdayReminders: boolean;
  anniversaryReminders: boolean;
  weekendDateReminder: boolean;
  seasonalGiftReminder: boolean;
  holidayGiftReminder: boolean;
}

// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
  ProductDetail: { product: ScoredProduct };
  RestaurantDetail: { restaurant: Restaurant };
  ActivityDetail: { activity: Activity };
  DateIdeaDetail: { idea: DateIdea };
  Emergency: { type?: EmergencyType };
};

export type TabParamList = {
  Home: undefined;
  Gifts: undefined;
  DateIdeas: undefined;
  Profile: undefined;
  Settings: undefined;
};
