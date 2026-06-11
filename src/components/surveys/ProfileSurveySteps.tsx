import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';
import { SurveyModal, StepTitle, ChipGrid, SingleSelectList } from './SurveyModal';
import { useProfileStore, useSurveyStore } from '../../stores';
import { StyleTag, BudgetSensitivity } from '../../types';

const STYLE_OPTIONS: StyleTag[] = [
  'classic', 'modern', 'bohemian', 'minimalist',
  'romantic', 'sporty', 'luxury', 'casual', 'artistic', 'vintage',
];

const COLOR_OPTIONS = [
  '🌸 Pink', '❤️ Red', '💜 Purple', '💙 Blue', '💚 Green',
  '🤍 White', '🖤 Black', '🧡 Orange', '💛 Yellow', '🤎 Brown',
  'Rose Gold', 'Silver', 'Gold',
];

const INTEREST_OPTIONS = [
  'Reading', 'Cooking', 'Travel', 'Music', 'Art', 'Yoga', 'Fitness',
  'Fashion', 'Photography', 'Gardening', 'Wine', 'Coffee',
  'Movies', 'Theater', 'Dancing', 'Hiking', 'Meditation', 'DIY',
];

const HOBBY_OPTIONS = [
  'Knitting', 'Painting', 'Writing', 'Baking', 'Running',
  'Cycling', 'Swimming', 'Pilates', 'Pottery', 'Journaling',
  'Candle Making', 'Sewing', 'Gaming', 'Volunteering', 'Singing',
];

const BUDGET_OPTIONS: { value: BudgetSensitivity; label: string; icon: string }[] = [
  { value: 'very_budget', label: 'Very Budget  (Under $25)', icon: '💰' },
  { value: 'budget',      label: 'Budget  ($25–$75)',        icon: '💵' },
  { value: 'moderate',    label: 'Moderate  ($75–$200)',     icon: '💳' },
  { value: 'premium',     label: 'Premium  ($200–$500)',     icon: '💎' },
  { value: 'luxury',      label: 'Luxury  ($500+)',          icon: '✨' },
];

const TOTAL_STEPS = 6;

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface ProfileSurveyProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ProfileSurvey: React.FC<ProfileSurveyProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const { profile, updateProfile } = useProfileStore();
  const { completeSurvey } = useSurveyStore();

  const [step, setStep] = useState(0);
  const [partnerName, setPartnerName] = useState(profile?.partnerName ?? '');
  const [birthday, setBirthday] = useState(profile?.birthday ?? '');
  const [anniversary, setAnniversary] = useState(profile?.anniversaryDate ?? '');
  const [styles_, setStyles] = useState<StyleTag[]>(profile?.stylePreferences ?? []);
  const [colors_, setColors] = useState<string[]>(profile?.favoriteColors ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [hobbies, setHobbies] = useState<string[]>(profile?.hobbies ?? []);
  const [budget, setBudget] = useState<BudgetSensitivity>(profile?.budgetSensitivity ?? 'moderate');

  const canAdvance = (() => {
    switch (step) {
      case 0: return true; // name is optional
      case 1: return true; // birthday optional
      case 2: return styles_.length > 0;
      case 3: return colors_.length > 0;
      case 4: return interests.length > 0;
      case 5: return !!budget;
      default: return false;
    }
  })();

  const handleComplete = async () => {
    await updateProfile({
      partnerName: partnerName || undefined,
      birthday: birthday || undefined,
      anniversaryDate: anniversary || undefined,
      stylePreferences: styles_,
      favoriteColors: colors_,
      interests,
      hobbies,
      budgetSensitivity: budget,
    });
    await completeSurvey('profile');
    onComplete();
  };

  const stepContent = [
    // Step 0: Name + dates
    <View key="s0">
      <StepTitle
        title="Tell us about her 💕"
        subtitle="This helps personalize all recommendations."
      />
      <Text style={inputStyles.label}>Her name (optional)</Text>
      <TextInput
        style={inputStyles.input}
        value={partnerName}
        onChangeText={setPartnerName}
        placeholder="e.g. Emma"
        placeholderTextColor={colors.textTertiary}
        returnKeyType="next"
      />
    </View>,

    // Step 1: Birthday & anniversary
    <View key="s1">
      <StepTitle
        title="Important dates 📅"
        subtitle="We'll remind you before her birthday and your anniversary."
      />
      <Text style={inputStyles.label}>Birthday (YYYY-MM-DD)</Text>
      <TextInput
        style={inputStyles.input}
        value={birthday}
        onChangeText={setBirthday}
        placeholder="e.g. 1992-06-15"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numbers-and-punctuation"
      />
      <Text style={[inputStyles.label, { marginTop: spacing.md }]}>
        Anniversary Date (YYYY-MM-DD)
      </Text>
      <TextInput
        style={inputStyles.input}
        value={anniversary}
        onChangeText={setAnniversary}
        placeholder="e.g. 2019-09-22"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numbers-and-punctuation"
      />
    </View>,

    // Step 2: Style
    <View key="s2">
      <StepTitle
        title="Her style ✨"
        subtitle="Select all that describe her style. Pick as many as you like."
      />
      <ChipGrid
        options={STYLE_OPTIONS}
        selected={styles_}
        onToggle={(v) => setStyles(toggleItem(styles_, v as StyleTag))}
      />
    </View>,

    // Step 3: Colors
    <View key="s3">
      <StepTitle
        title="Favorite colors 🎨"
        subtitle="What colors does she gravitate towards?"
      />
      <ChipGrid
        options={COLOR_OPTIONS}
        selected={colors_}
        onToggle={(v) => setColors(toggleItem(colors_, v))}
      />
    </View>,

    // Step 4: Interests
    <View key="s4">
      <StepTitle
        title="What does she love? 💖"
        subtitle="Select her main interests and hobbies."
      />
      <Text style={inputStyles.sectionLabel}>Interests</Text>
      <ChipGrid
        options={INTEREST_OPTIONS}
        selected={interests}
        onToggle={(v) => setInterests(toggleItem(interests, v))}
      />
      <Text style={[inputStyles.sectionLabel, { marginTop: spacing.lg }]}>Hobbies</Text>
      <ChipGrid
        options={HOBBY_OPTIONS}
        selected={hobbies}
        onToggle={(v) => setHobbies(toggleItem(hobbies, v))}
      />
    </View>,

    // Step 5: Budget
    <View key="s5">
      <StepTitle
        title="Your gift budget 💳"
        subtitle="What's your typical budget range for her gifts?"
      />
      <SingleSelectList
        options={BUDGET_OPTIONS}
        selected={budget}
        onSelect={setBudget}
      />
    </View>,
  ];

  return (
    <SurveyModal
      visible={visible}
      title="Profile Setup"
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

const inputStyles = StyleSheet.create({
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
