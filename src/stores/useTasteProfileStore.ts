import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  TasteProfile,
  StyleArchetype,
  ColorPalette,
  MetalPreference,
  LoveLanguage,
} from '../types/tasteProfile';

interface TasteProfileState {
  tasteProfile: TasteProfile;
  styleProfileCompleted: boolean;

  updateTasteProfile: (updates: Partial<TasteProfile>) => void;
  setStyleArchetypes: (v: StyleArchetype[]) => void;
  setColorPalette: (v: ColorPalette[]) => void;
  setMetalPreference: (v: MetalPreference) => void;
  setLoveLanguage: (v: LoveLanguage) => void;
  resetTasteProfile: () => void;
}

export const useTasteProfileStore = create<TasteProfileState>()(
  persist(
    (set) => ({
      tasteProfile: {},
      styleProfileCompleted: false,

      updateTasteProfile: (updates) =>
        set((state) => ({
          tasteProfile: { ...state.tasteProfile, ...updates },
          styleProfileCompleted: true,
        })),

      setStyleArchetypes: (v) =>
        set((state) => ({ tasteProfile: { ...state.tasteProfile, styleArchetypes: v } })),

      setColorPalette: (v) =>
        set((state) => ({ tasteProfile: { ...state.tasteProfile, colorPalette: v } })),

      setMetalPreference: (v) =>
        set((state) => ({ tasteProfile: { ...state.tasteProfile, metalPreference: v } })),

      setLoveLanguage: (v) =>
        set((state) => ({ tasteProfile: { ...state.tasteProfile, loveLanguage: v } })),

      resetTasteProfile: () => set({ tasteProfile: {}, styleProfileCompleted: false }),
    }),
    {
      name: 'cherish-taste-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
