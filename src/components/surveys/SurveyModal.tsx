import React from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';

interface SurveyModalProps {
  visible: boolean;
  title: string;
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  canAdvance: boolean;
  isLastStep: boolean;
  children: React.ReactNode;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({
  visible,
  title,
  currentStep,
  totalSteps,
  onClose,
  onNext,
  onBack,
  onComplete,
  canAdvance,
  isLastStep,
  children,
}) => {
  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.stepCounter}>
              {currentStep + 1} / {totalSteps}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {currentStep > 0 ? (
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <TouchableOpacity
              style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
              onPress={isLastStep ? onComplete : onNext}
              disabled={!canAdvance}
            >
              <Text style={styles.nextBtnText}>
                {isLastStep ? 'Done ✓' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// ─────────────────────────────────────────────
//  SURVEY STEP PRIMITIVES (shared across surveys)
// ─────────────────────────────────────────────

interface StepTitleProps {
  title: string;
  subtitle?: string;
}

export const StepTitle: React.FC<StepTitleProps> = ({ title, subtitle }) => (
  <View style={stepStyles.titleGroup}>
    <Text style={stepStyles.title}>{title}</Text>
    {subtitle ? <Text style={stepStyles.subtitle}>{subtitle}</Text> : null}
  </View>
);

interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export const OptionChip: React.FC<OptionChipProps> = ({
  label,
  selected,
  onPress,
  color = colors.primary,
}) => (
  <TouchableOpacity
    style={[
      stepStyles.chip,
      selected && { backgroundColor: color + '22', borderColor: color },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text
      style={[
        stepStyles.chipText,
        selected && { color, fontFamily: typography.fonts.bodyMedium },
      ]}
    >
      {selected ? '✓ ' : ''}{label}
    </Text>
  </TouchableOpacity>
);

interface ChipGridProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  color?: string;
}

export const ChipGrid: React.FC<ChipGridProps> = ({
  options,
  selected,
  onToggle,
  color,
}) => (
  <View style={stepStyles.chipGrid}>
    {options.map((opt) => (
      <OptionChip
        key={opt}
        label={opt}
        selected={selected.includes(opt)}
        onPress={() => onToggle(opt)}
        color={color}
      />
    ))}
  </View>
);

interface SingleSelectListProps<T extends string> {
  options: { value: T; label: string; icon?: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
  color?: string;
}

export function SingleSelectList<T extends string>({
  options,
  selected,
  onSelect,
  color = colors.primary,
}: SingleSelectListProps<T>) {
  return (
    <View style={stepStyles.singleSelectList}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[stepStyles.selectRow, active && { borderColor: color, backgroundColor: color + '15' }]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            {opt.icon ? <Text style={stepStyles.selectIcon}>{opt.icon}</Text> : null}
            <Text style={[stepStyles.selectLabel, active && { color }]}>
              {opt.label}
            </Text>
            {active && <Text style={[stepStyles.selectCheck, { color }]}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: colors.textSecondary, fontSize: 13 },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  stepCounter: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    minWidth: 36,
    textAlign: 'right',
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.surface,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.base,
    paddingTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtnText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  backPlaceholder: { width: 80 },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textInverse,
  },
});

const stepStyles = StyleSheet.create({
  titleGroup: { marginBottom: spacing.xl, gap: spacing.xs },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    lineHeight: typography.sizes['2xl'] * 1.3,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 23,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  singleSelectList: {
    gap: spacing.sm,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.base,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectIcon: { fontSize: 22 },
  selectLabel: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  selectCheck: {
    fontSize: 16,
  },
});
