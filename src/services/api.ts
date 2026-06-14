/**
 * api.ts
 * Fetches products and date recommendations from the Cherish Her server.
 * Falls back to local products if the server is unreachable.
 */

import { getDeviceId } from '../utils/deviceId';
import { computeProfileHash } from '../utils/profileHash';
import { useTasteProfileStore } from '../stores/useTasteProfileStore';

const SERVER_URL = 'https://cherish-her-server-production.up.railway.app';

export interface ServerProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceRange: string;
  imageUrl: string;
  affiliateLink: string;
  affiliateNetwork: string;
  merchantName: string;
  brand: string | null;
  rating: number | null;
  reviewCount: number | null;
  popularityScore: number;
  styleTags: string[];
  occasionTags: string[];
  interestTags: string[];
  recipientTags: string[];
  score?: number;
  matchReason?: string;
}

export interface DateVenue {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  priceLevel: number | null;
  rating: number | null;
  totalRatings: number | null;
  website: string | null;
  imageUrl: string | null;
  openNow: boolean | null;
  mapsUrl: string;
}

export interface GiftFilters {
  styleTags?:    string[];
  occasionTags?: string[];
  interestTags?: string[];
  minPrice?:     number;
  maxPrice?:     number;
  category?:     string;
  limit?:        number;
  offset?:       number;
  sort?:         'relevant' | 'price_asc' | 'price_desc' | 'trending' | 'newest';
}

export interface DateFilters {
  lat?:     number;
  lng?:     number;
  zip?:     string;
  vibe?:    string;
  budget?:  'low' | 'medium' | 'high' | 'luxury';
  radius?:  number;
  limit?:   number;
}

export interface GiftsResponse {
  products: ServerProduct[];
  total: number;
  hasMore: boolean;
}

export interface DatesResponse {
  venues: DateVenue[];
  location: { lat: number; lng: number };
  vibe: string;
  budget: string;
  total: number;
}

export interface DatePackageResponse {
  package: {
    dinner: DateVenue | null;
    activity: DateVenue | null;
    location: { lat: number; lng: number };
    vibe: string;
    budget: string;
  };
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${SERVER_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Server error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export async function logEvent(event: {
  eventType: 'view' | 'tap' | 'save' | 'shop' | 'purchase';
  productId?: string;
  styleTags?: string[];
  occasionTags?: string[];
  interestTags?: string[];
  occasion?: string;
  priceRange?: string;
}) {
  try {
    const deviceId = await getDeviceId();
    const profileHash = computeProfileHash(useTasteProfileStore.getState().tasteProfile);

    await fetch(`${SERVER_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, deviceId, profileHash }),
    });
  } catch {
    // Silent fail — event logging should never break the app
  }
}

export async function fetchGifts(filters: GiftFilters = {}): Promise<GiftsResponse> {
  return get<GiftsResponse>('/api/gifts', {
    styleTags:    filters.styleTags?.join(','),
    occasionTags: filters.occasionTags?.join(','),
    interestTags: filters.interestTags?.join(','),
    minPrice:     filters.minPrice,
    maxPrice:     filters.maxPrice,
    category:     filters.category,
    limit:        filters.limit ?? 50,
    offset:       filters.offset ?? 0,
    sort:         filters.sort ?? 'relevant',
  });
}

export async function fetchDates(filters: DateFilters = {}): Promise<DatesResponse> {
  return get<DatesResponse>('/api/dates', {
    lat:    filters.lat,
    lng:    filters.lng,
    zip:    filters.zip,
    vibe:   filters.vibe,
    budget: filters.budget ?? 'medium',
    radius: filters.radius ?? 10000,
    limit:  filters.limit ?? 15,
  });
}

export async function fetchDatePackage(filters: DateFilters = {}): Promise<DatePackageResponse> {
  return get<DatePackageResponse>('/api/dates/package', {
    lat:    filters.lat,
    lng:    filters.lng,
    zip:    filters.zip,
    vibe:   filters.vibe,
    budget: filters.budget ?? 'medium',
  });
}

export async function fetchDateVibes(): Promise<{ vibes: Array<{ id: string; label: string }> }> {
  return get('/api/dates/vibes');
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}