import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { SurveyModal, StepTitle, ChipGrid, SingleSelectList } from './SurveyModal';
import { useGiftPrefsStore, useSurveyStore } from '../../stores';
import { CategoryTag } from '../../types';

const CATEGORY_OPTIONS: { value: CategoryTag; label: string; icon: string }[] = [
  { value: 'jewelry',      label: 'Jewelry',       icon: '💎' },
  { value: 'skincare',     label: 'Skincare',       icon: '✨' },
  { value: 'fashion',      label: 'Fashion',        icon: '👗' },
  { value: 'spa_wellness', label: 'Spa & Wellness', icon: '🧖' },
  { value: 'experiences',  label: 'Experiences',    icon: '🎭' },
  { value: 'home_decor',   label: 'Home Décor',     icon: '🏠' },
  { value: 'food_drink',   label: 'Food & Drink',   icon: '🍷' },
  { value: 'tech',         label: 'Tech',           icon: '💻' },
  { value: 'books',        label: 'Books',          icon: '📚' },
  { value: 'fitness',      label: 'Fitness',        icon: '🏃' },
  { value: 'art_craft',    label: 'Art & Craft',    icon: '🎨' },
  { value: 'personalized', label: 'Personalized',   icon: '✏️' },
  { value: 'flowers_plants', label: 'Flowers',      icon: '🌸' },
  { value: 'subscription', label: 'Subscriptions',  icon: '📦' },
  { value: 'travel',       label: 'Travel',         icon: '✈️' },
];

const LUXURY_OPTIONS = [
  { value: 'luxury',    label: 'Luxury — She deserves the best',    icon: '✨' },
  { value: 'balanced',  label: 'Balanced — Quality + value',        icon: '⚖️' },
  { value: 'practical', label: 'Practical — Useful & thoughtful',   icon: '🎯' },
] as const;

const JEWELRY_OPTIONS = [
  'Diamonds', 'Gold', 'Silver', 'Rose Gold', 'Gemstones',
  'Pearls', 'Minimalist', 'Statement', 'Layered', 'Vintage',
];

const STORE_OPTIONS = [
  'Nordstrom', 'Bloomingdale\'s', 'Sephora', 'Amazon', 'Anthropologie',
  'Free People', 'Tiffany & Co.', 'Madewell', 'Revolve', 'ASOS',
  'Etsy', 'Net-a-Porter', 'Glossier', 'Lululemon', 'Mejuri',
];

const BRAND_OPTIONS = [
  'Lululemon', 'Nike', 'Gucci', 'Chanel', 'Coach', 'Kate Spade',
  'Tory Burch', 'Levi\'s', 'Patagonia', 'Apple', 'Dyson',
  'Charlotte Tilbury', 'La Mer', 'Skims', 'Madewell',
];

const TOTAL_STEPS = 5;

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface GiftSurveyProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const GiftSurvey: React.FC<GiftSurveyProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const { giftPrefs, updateGiftPrefs } = useGiftPrefsStore();
  const { completeSurvey } = useSurveyStore();

  const [step, setStep] = useState(0);
  const [luxuryVsPractical, setLuxuryVsPractical] = useState<'luxury' | 'practical' | 'balanced'>(
    giftPrefs?.luxuryVsPractical ?? 'balanced'
  );
  const [jewelry, setJewelry] = useState<string[]>(giftPrefs?.jewelryPreferences ?? []);
  const [categories, setCategories] = useState<CategoryTag[]>(giftPrefs?.favoriteCategories ?? []);
  const [stores, setStores] = useState<string[]>(giftPrefs?.favoriteStores ?? []);
  const [brands, setBrands] = useState<string[]>(giftPrefs?.favoriteBrands ?? []);
  const [budget, setBudget] = useState(
    giftPrefs?.typicalBudget ? String(giftPrefs.typicalBudget) : '100'
  );

  const canAdvance = (() => {
    switch (step) {
      case 0: return !!luxuryVsPractical;
      case 1: return true; // jewelry optional
      case 2: return categories.length > 0;
      case 3: return true; // stores optional
      case 4: return true; // brands optional
      default: return false;
    }
  })();

  const handleComplete = async () => {
    await updateGiftPrefs({
      luxuryVsPractical,
      jewelryPreferences: jewelry,
      favoriteCategories: categories,
      favoriteStores: stores,
      favoriteBrands: brands,
      typicalBudget: parseFloat(budget) || 100,
    });
    await completeSurvey('gift');
    onComplete();
  };

  const stepContent = [
    // Step 0: Luxury vs Practical
    <View key="g0">
      <StepTitle
        title="Her gift style 🎁"
        subtitle="How would you describe her preference when it comes to gifts?"
      />
      <SingleSelectList
        options={LUXURY_OPTIONS}
        selected={luxuryVsPractical}
        onSelect={setLuxuryVsPractical}
      />
    </View>,

    // Step 1: Jewelry
    <View key="g1">
      <StepTitle
        title="Jewelry preferences 💍"
        subtitle="What type of jewelry does she like? (optional)"
      />
      <ChipGrid
        options={JEWELRY_OPTIONS}
        selected={jewelry}
        onToggle={(v) => setJewelry(toggleItem(jewelry, v))}
      />
    </View>,

    // Step 2: Categories
    <View key="g2">
      <StepTitle
        title="Gift categories 🛍"
        subtitle="What categories does she appreciate most?"
      />
      <View style={surveyStyles.categoryGrid}>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = categories.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[surveyStyles.categoryCard, active && surveyStyles.categoryCardActive]}
              onPress={() => setCategories(toggleItem(categories, opt.value))}
              activeOpacity={0.8}
            >
              <Text style={surveyStyles.categoryIcon}>{opt.icon}</Text>
              <Text style={[surveyStyles.categoryLabel, active && surveyStyles.categoryLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>,

    // Step 3: Stores + budget
    <View key="g3">
      <StepTitle
        title="Where does she shop? 🛒"
        subtitle="Select her favorite stores."
      />
      <ChipGrid
        options={STORE_OPTIONS}
        selected={stores}
        onToggle={(v) => setStores(toggleItem(stores, v))}
      />
      <Text style={[surveyStyles.inputLabel, { marginTop: spacing.xl }]}>
        Typical gift budget ($)
      </Text>
      <TextInput
        style={surveyStyles.input}
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
        placeholder="100"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="done"
      />
    </View>,

    // Step 4: Brands
    <View key="g4">
      <StepTitle
        title="Favorite brands ✨"
        subtitle="Select brands she loves or aspires to. (optional)"
      />
      <ChipGrid
        options={BRAND_OPTIONS}
        selected={brands}
        onToggle={(v) => setBrands(toggleItem(brands, v))}
      />
    </View>,
  ];

  return (
    <SurveyModal
      visible={visible}
      title="Gift Preferences"
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      onClose={onClose}
      onNext={() => setStep((s) => s + 1)}
      onBack={() => setStep((s) => s - 1)}
      onComplete={handleComplete}
      canAdvance={canAdvance}
      isLastStep={step === TOTAL_STEPS - 1}
    >
      {stepContent[step]}
    </SurveyModal>
  );
};

const surveyStyles = StyleSheet.create({
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyMedium,
  },
  inputLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
});
