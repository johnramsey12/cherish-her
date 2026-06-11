import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { SurveyModal, StepTitle, ChipGrid, SingleSelectList } from './SurveyModal';
import { useDatePrefsStore, useSurveyStore } from '../../stores';
import { ActivityCategory } from '../../types';

const FOOD_OPTIONS = [
  'Italian', 'Japanese', 'Mexican', 'French', 'Indian',
  'Mediterranean', 'Thai', 'American', 'Korean', 'Chinese',
  'Seafood', 'Steakhouse', 'Vegan/Vegetarian', 'Brunch',
  'Wine Bar', 'Tapas', 'Sushi', 'Pizza',
];

const ACTIVITY_OPTIONS: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'dining',        label: 'Fine Dining',     icon: '🍽' },
  { value: 'outdoor',       label: 'Outdoors',        icon: '🌿' },
  { value: 'cultural',      label: 'Arts & Culture',  icon: '🎨' },
  { value: 'entertainment', label: 'Entertainment',   icon: '🎭' },
  { value: 'wellness',      label: 'Wellness',        icon: '🧘' },
  { value: 'adventure',     label: 'Adventure',       icon: '⛺' },
  { value: 'romantic',      label: 'Romance',         icon: '💕' },
  { value: 'indoor',        label: 'Cozy & Indoors',  icon: '🕯' },
  { value: 'seasonal',      label: 'Seasonal',        icon: '🌸' },
];

const INDOOR_OUTDOOR_OPTIONS = [
  { value: 'indoor',  label: 'Indoor — We prefer cozy, inside', icon: '🏠' },
  { value: 'outdoor', label: 'Outdoor — We love fresh air',     icon: '🌿' },
  { value: 'both',    label: 'Both — We enjoy variety',         icon: '⚖️' },
] as const;

const BUDGET_OPTIONS = [
  { value: 'budget',   label: 'Budget  (Under $50)',   icon: '💰' },
  { value: 'moderate', label: 'Moderate  ($50–$150)',  icon: '💵' },
  { value: 'premium',  label: 'Premium  ($150–$300)',  icon: '💳' },
  { value: 'luxury',   label: 'Splurge  ($300+)',      icon: '✨' },
] as const;

const TOTAL_STEPS = 5;

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface DateSurveyProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const DateSurvey: React.FC<DateSurveyProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const { datePrefs, updateDatePrefs } = useDatePrefsStore();
  const { completeSurvey } = useSurveyStore();

  const [step, setStep] = useState(0);
  const [foods, setFoods] = useState<string[]>(datePrefs?.favoriteFoods ?? []);
  const [activities, setActivities] = useState<ActivityCategory[]>(
    datePrefs?.activityPreferences ?? []
  );
  const [indoorOutdoor, setIndoorOutdoor] = useState<'indoor' | 'outdoor' | 'both'>(
    datePrefs?.indoorOutdoor ?? 'both'
  );
  const [zipCode, setZipCode] = useState(datePrefs?.zipCode ?? '');
  const [radius, setRadius] = useState(String(datePrefs?.travelRadius ?? '15'));
  const [budget, setBudget] = useState(
    datePrefs?.typicalDateBudget ? String(datePrefs.typicalDateBudget) : '100'
  );
  const [budgetTier, setBudgetTier] = useState<'budget' | 'moderate' | 'premium' | 'luxury'>('moderate');

  const canAdvance = (() => {
    switch (step) {
      case 0: return foods.length > 0;
      case 1: return activities.length > 0;
      case 2: return !!indoorOutdoor;
      case 3: return zipCode.length >= 5;
      case 4: return !!budgetTier;
      default: return false;
    }
  })();

  const handleComplete = async () => {
    const budgetMap = { budget: 50, moderate: 100, premium: 200, luxury: 400 };
    await updateDatePrefs({
      favoriteFoods: foods,
      favoriteRestaurants: [],
      activityPreferences: activities,
      indoorOutdoor,
      zipCode,
      travelRadius: parseInt(radius, 10) || 15,
      typicalDateBudget: budgetMap[budgetTier],
    });
    await completeSurvey('date');
    onComplete();
  };

  const stepContent = [
    // Step 0: Food preferences
    <View key="d0">
      <StepTitle
        title="What food does she love? 🍽"
        subtitle="Select all the cuisines she enjoys."
      />
      <ChipGrid
        options={FOOD_OPTIONS}
        selected={foods}
        onToggle={(v) => setFoods(toggleItem(foods, v))}
        color={colors.rose}
      />
    </View>,

    // Step 1: Activity preferences
    <View key="d1">
      <StepTitle
        title="Date activity vibes ✨"
        subtitle="Select all the kinds of dates you both enjoy."
      />
      <ChipGrid
        options={ACTIVITY_OPTIONS.map((o) => o.label)}
        selected={activities.map((a) => {
          const found = ACTIVITY_OPTIONS.find((o) => o.value === a);
          return found ? found.label : a;
        })}
        onToggle={(label) => {
          const opt = ACTIVITY_OPTIONS.find((o) => o.label === label);
          if (opt) setActivities(toggleItem(activities, opt.value));
        }}
        color={colors.rose}
      />
    </View>,

    // Step 2: Indoor/outdoor
    <View key="d2">
      <StepTitle
        title="Indoor or outdoor? 🌿"
        subtitle="What setting do you both prefer?"
      />
      <SingleSelectList
        options={INDOOR_OUTDOOR_OPTIONS}
        selected={indoorOutdoor}
        onSelect={setIndoorOutdoor}
      />
    </View>,

    // Step 3: Location
    <View key="d3">
      <StepTitle
        title="Your location 📍"
        subtitle="Enter your zip code so we can suggest places nearby."
      />
      <Text style={surveyStyles.inputLabel}>Zip Code</Text>
      <TextInput
        style={surveyStyles.input}
        value={zipCode}
        onChangeText={setZipCode}
        keyboardType="numeric"
        placeholder="e.g. 90210"
        placeholderTextColor={colors.textTertiary}
        maxLength={5}
        returnKeyType="next"
      />
      <Text style={[surveyStyles.inputLabel, { marginTop: spacing.md }]}>
        Travel radius (miles)
      </Text>
      <TextInput
        style={surveyStyles.input}
        value={radius}
        onChangeText={setRadius}
        keyboardType="numeric"
        placeholder="15"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="done"
      />
    </View>,

    // Step 4: Date budget
    <View key="d4">
      <StepTitle
        title="Typical date budget 💳"
        subtitle="What do you usually spend on a date night?"
      />
      <SingleSelectList
        options={BUDGET_OPTIONS}
        selected={budgetTier}
        onSelect={setBudgetTier}
      />
    </View>,
  ];

  return (
    <SurveyModal
      visible={visible}
      title="Date Preferences"
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
