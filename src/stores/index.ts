import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Profile,
  GiftPreferences,
  DatePreferences,
  SurveyState,
  GiftFilters,
  SortOption,
  ScoredProduct,
  DateIdea,
  ReminderConfig,
} from '../types';
import {
  getProfile, saveProfile,
  getGiftPreferences, saveGiftPreferences,
  getDatePreferences, saveDatePreferences,
  getSurveyState, markSurveyCompleted, resetSurveyState,
  getReminderConfig, saveReminderConfig,
  resetAllData,
} from '../database/db';
import { generateGiftRecommendations } from '../engine/giftEngine';
import { generateCombinedDateIdeas, generateRestaurantRecommendations, generateActivityRecommendations } from '../engine/dateEngine';

// ─────────────────────────────────────────────
//  PROFILE STORE
// ─────────────────────────────────────────────

interface ProfileStore {
  profile: Profile | null;
  isLoaded: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoaded: false,

  loadProfile: async () => {
    const profile = await getProfile();
    set({ profile, isLoaded: true });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    await saveProfile(updates);
    const profile = await getProfile();
    set({ profile });
  },
}));

// ─────────────────────────────────────────────
//  GIFT PREFERENCES STORE
// ─────────────────────────────────────────────

interface GiftPrefsStore {
  giftPrefs: GiftPreferences | null;
  isLoaded: boolean;
  loadGiftPrefs: () => Promise<void>;
  updateGiftPrefs: (updates: Partial<GiftPreferences>) => Promise<void>;
}

export const useGiftPrefsStore = create<GiftPrefsStore>((set) => ({
  giftPrefs: null,
  isLoaded: false,

  loadGiftPrefs: async () => {
    const giftPrefs = await getGiftPreferences();
    set({ giftPrefs, isLoaded: true });
  },

  updateGiftPrefs: async (updates: Partial<GiftPreferences>) => {
    await saveGiftPreferences(updates);
    const giftPrefs = await getGiftPreferences();
    set({ giftPrefs });
  },
}));

// ─────────────────────────────────────────────
//  DATE PREFERENCES STORE
// ─────────────────────────────────────────────

interface DatePrefsStore {
  datePrefs: DatePreferences | null;
  isLoaded: boolean;
  loadDatePrefs: () => Promise<void>;
  updateDatePrefs: (updates: Partial<DatePreferences>) => Promise<void>;
}

export const useDatePrefsStore = create<DatePrefsStore>((set) => ({
  datePrefs: null,
  isLoaded: false,

  loadDatePrefs: async () => {
    const datePrefs = await getDatePreferences();
    set({ datePrefs, isLoaded: true });
  },

  updateDatePrefs: async (updates: Partial<DatePreferences>) => {
    await saveDatePreferences(updates);
    const datePrefs = await getDatePreferences();
    set({ datePrefs });
  },
}));

// ─────────────────────────────────────────────
//  SURVEY STORE
// ─────────────────────────────────────────────

interface SurveyStore {
  surveyState: SurveyState;
  isLoaded: boolean;
  loadSurveyState: () => Promise<void>;
  completeSurvey: (type: 'profile' | 'gift' | 'date') => Promise<void>;
  resetSurveys: () => Promise<void>;
}

export const useSurveyStore = create<SurveyStore>((set) => ({
  surveyState: {
    profileCompleted: false,
    giftCompleted: false,
    dateCompleted: false,
  },
  isLoaded: false,

  loadSurveyState: async () => {
    const surveyState = await getSurveyState();
    set({ surveyState, isLoaded: true });
  },

  completeSurvey: async (type: 'profile' | 'gift' | 'date') => {
    await markSurveyCompleted(type);
    const surveyState = await getSurveyState();
    set({ surveyState });
  },

  resetSurveys: async () => {
    await resetSurveyState();
    const surveyState = await getSurveyState();
    set({ surveyState });
  },
}));

// ─────────────────────────────────────────────
//  GIFT RECOMMENDATIONS STORE
// ─────────────────────────────────────────────

interface GiftStore {
  recommendations: ScoredProduct[];
  filters: GiftFilters;
  sort: SortOption;
  isLoading: boolean;
  hasLoaded: boolean;
  savedProducts: string[];
  likedProducts: string[];
  dislikedProducts: string[];

  setFilters: (filters: GiftFilters) => void;
  setSort: (sort: SortOption) => void;
  loadRecommendations: (profile: Profile | null, giftPrefs: GiftPreferences | null) => Promise<void>;
  refresh: (profile: Profile | null, giftPrefs: GiftPreferences | null) => Promise<void>;
  toggleSave: (productId: string) => void;
  recordInteraction: (productId: string, type: string) => void;
}

export const useGiftStore = create<GiftStore>((set, get) => ({
  recommendations: [],
  filters: {},
  sort: 'relevant',
  isLoading: false,
  hasLoaded: false,
  savedProducts: [],
  likedProducts: [],
  dislikedProducts: [],

  setFilters: (filters) => set({ filters }),
  setSort: (sort) => set({ sort }),

  toggleSave: (productId: string) => {
    const { savedProducts } = get();
    const next = savedProducts.includes(productId)
      ? savedProducts.filter((id) => id !== productId)
      : [...savedProducts, productId];
    set({ savedProducts: next });
    AsyncStorage.setItem('@cherish_saved_products', JSON.stringify(next)).catch(() => {});
  },

  recordInteraction: (productId: string, type: string) => {
    if (type === 'liked') {
      set((s) => ({ likedProducts: [...new Set([...s.likedProducts, productId])] }));
    } else if (type === 'disliked') {
      set((s) => ({ dislikedProducts: [...new Set([...s.dislikedProducts, productId])] }));
    }
    // Interaction is tracked in-memory for recommendation learning
  },

  loadRecommendations: async (profile, giftPrefs) => {
    if (get().hasLoaded) return;
    set({ isLoading: true });
    try {
      const recommendations = await generateGiftRecommendations({
        profile,
        giftPrefs,
        filters: get().filters,
        sort: get().sort,
      });
      set({ recommendations, isLoading: false, hasLoaded: true });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  refresh: async (profile, giftPrefs) => {
    set({ isLoading: true, hasLoaded: false });
    try {
      const recommendations = await generateGiftRecommendations({
        profile,
        giftPrefs,
        filters: get().filters,
        sort: get().sort,
      });
      set({ recommendations, isLoading: false, hasLoaded: true });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));

// ─────────────────────────────────────────────
//  DATE IDEAS STORE
// ─────────────────────────────────────────────

interface DateStore {
  dateIdeas: DateIdea[];
  restaurants: any[];
  activities: any[];
  isLoading: boolean;
  hasLoaded: boolean;
  activeTab: 'all' | 'restaurants' | 'activities';
  setActiveTab: (tab: 'all' | 'restaurants' | 'activities') => void;
  loadDateIdeas: (datePrefs: DatePreferences | null, profile: Profile | null) => Promise<void>;
  refresh: (datePrefs: DatePreferences | null, profile: Profile | null) => Promise<void>;
}

export const useDateStore = create<DateStore>((set, get) => ({
  dateIdeas: [],
  restaurants: [],
  activities: [],
  isLoading: false,
  hasLoaded: false,
  activeTab: 'all',

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadDateIdeas: async (datePrefs, profile) => {
    if (get().hasLoaded) return;
    set({ isLoading: true });
    try {
      const options = { datePrefs, profile };
      const dateIdeas = generateCombinedDateIdeas(options);
      const restaurants = generateRestaurantRecommendations(options);
      const activities = generateActivityRecommendations(options);
      set({ dateIdeas, restaurants, activities, isLoading: false, hasLoaded: true });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  refresh: async (datePrefs, profile) => {
    set({ isLoading: true, hasLoaded: false });
    try {
      const options = { datePrefs, profile };
      const dateIdeas = generateCombinedDateIdeas(options);
      const restaurants = generateRestaurantRecommendations(options);
      const activities = generateActivityRecommendations(options);
      set({ dateIdeas, restaurants, activities, isLoading: false, hasLoaded: true });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));

// ─────────────────────────────────────────────
//  SETTINGS STORE
// ─────────────────────────────────────────────

interface SettingsStore {
  reminderConfig: ReminderConfig;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateReminders: (config: Partial<ReminderConfig>) => Promise<void>;
  performReset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  reminderConfig: {
    birthdayReminders: true,
    anniversaryReminders: true,
    weekendDateReminder: true,
    seasonalGiftReminder: true,
    holidayGiftReminder: true,
  },
  isLoaded: false,

  loadSettings: async () => {
    const reminderConfig = await getReminderConfig();
    set({ reminderConfig, isLoaded: true });
  },

  updateReminders: async (config: Partial<ReminderConfig>) => {
    await saveReminderConfig(config);
    const reminderConfig = await getReminderConfig();
    set({ reminderConfig });
  },

  performReset: async () => {
    await resetAllData();
    // Reset all stores
    useProfileStore.getState().loadProfile();
    useGiftPrefsStore.getState().loadGiftPrefs();
    useDatePrefsStore.getState().loadDatePrefs();
    useSurveyStore.getState().loadSurveyState();
    useGiftStore.setState({ recommendations: [], hasLoaded: false, filters: {}, sort: 'relevant' });
    useDateStore.setState({ dateIdeas: [], restaurants: [], activities: [], hasLoaded: false });
  },
}));

// ─────────────────────────────────────────────
//  INITIALIZE ALL STORES
// ─────────────────────────────────────────────

export async function initializeAllStores() {
  await Promise.all([
    useProfileStore.getState().loadProfile(),
    useGiftPrefsStore.getState().loadGiftPrefs(),
    useDatePrefsStore.getState().loadDatePrefs(),
    useSurveyStore.getState().loadSurveyState(),
    useSettingsStore.getState().loadSettings(),
  ]);
}
