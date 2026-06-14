import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { Button } from '../common/Button';
import { useTasteProfileStore } from '../../stores/useTasteProfileStore';
import {
  STYLE_ARCHETYPES,
  COLOR_PALETTES,
  METAL_PREFERENCES,
  LOVE_LANGUAGES,
} from '../../types/tasteProfile';
import type {
  StyleArchetype,
  ColorPalette,
  MetalPreference,
  LoveLanguage,
} from '../../types/tasteProfile';

interface StyleProfileSurveyProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

export const StyleProfileSurvey: React.FC<StyleProfileSurveyProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const { tasteProfile, updateTasteProfile } = useTasteProfileStore();
  const [step, setStep] = useState(0);
  const [archetypes, setArchetypes] = useState<StyleArchetype[]>(tasteProfile.styleArchetypes ?? []);
  const [palettes, setPalettes] = useState<ColorPalette[]>(tasteProfile.colorPalette ?? []);
  const [metal, setMetal] = useState<MetalPreference | undefined>(tasteProfile.metalPreference);
  const [love, setLove] = useState<LoveLanguage | undefined>(tasteProfile.loveLanguage);

  const toggleArchetype = (v: StyleArchetype) => {
    setArchetypes((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      if (prev.length >= 3) return prev;
      return [...prev, v];
    });
  };

  const togglePalette = (v: ColorPalette) => {
    setPalettes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return archetypes.length > 0;
      case 1: return palettes.length > 0;
      case 2: return !!metal;
      case 3: return !!love;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    updateTasteProfile({
      styleArchetypes: archetypes,
      colorPalette: palettes,
      metalPreference: metal,
      loveLanguage: love,
    });
    onComplete();
  };

  const handleBack = () => {
    if (step === 0) {
      onClose();
      return;
    }
    setStep((s) => s - 1);
  };

  const resetAndClose = () => {
    setStep(0);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <SafeAreaView style={styles.container}>
        {/* Header / progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.headerBtnText}>{step === 0 ? '✕' : '←'}</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={resetAndClose} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Step 0 — Style Archetype */}
          {step === 0 && (
            <View>
              <Text style={styles.title}>Which styles feel most like her?</Text>
              <Text style={styles.subtitle}>Pick up to 3 — we'll rank them by the order you choose.</Text>
              <View style={styles.archetypeGrid}>
                {STYLE_ARCHETYPES.map((opt) => {
                  const idx = archetypes.indexOf(opt.value);
                  const selected = idx !== -1;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.archetypeCard, selected && styles.archetypeCardSelected]}
                      onPress={() => toggleArchetype(opt.value)}
                      activeOpacity={0.8}
                    >
                      {selected && (
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>{idx + 1}</Text>
                        </View>
                      )}
                      <Text style={styles.archetypeEmoji}>{opt.emoji}</Text>
                      <Text style={styles.archetypeLabel}>{opt.label}</Text>
                      <Text style={styles.archetypeDesc}>{opt.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 1 — Color Palette */}
          {step === 1 && (
            <View>
              <Text style={styles.title}>What colors does she gravitate toward?</Text>
              <Text style={styles.subtitle}>Pick all that feel right — there's no wrong answer.</Text>
              <View style={styles.paletteList}>
                {COLOR_PALETTES.map((opt) => {
                  const selected = palettes.includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.paletteRow, selected && styles.paletteRowSelected]}
                      onPress={() => togglePalette(opt.value)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.swatchRow}>
                        {opt.swatches.map((hex, i) => (
                          <View key={i} style={[styles.swatch, { backgroundColor: hex }]} />
                        ))}
                      </View>
                      <Text style={[styles.paletteLabel, selected && styles.paletteLabelSelected]}>
                        {opt.label}
                      </Text>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 2 — Metal Preference */}
          {step === 2 && (
            <View>
              <Text style={styles.title}>Gold, silver, or rose gold?</Text>
              <Text style={styles.subtitle}>This shapes which jewelry we show her.</Text>
              <View style={styles.metalGrid}>
                {METAL_PREFERENCES.map((opt) => {
                  const selected = metal === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.metalCard, selected && styles.metalCardSelected]}
                      onPress={() => setMetal(opt.value)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.metalSwatch, { backgroundColor: opt.swatch }]} />
                      <Text style={[styles.metalLabel, selected && styles.metalLabelSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 3 — Love Language */}
          {step === 3 && (
            <View>
              <Text style={styles.title}>What makes her feel most loved?</Text>
              <Text style={styles.subtitle}>This helps us balance gifts vs. experiences in your recommendations.</Text>
              <View style={styles.loveList}>
                {LOVE_LANGUAGES.map((opt) => {
                  const selected = love === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.loveCard, selected && styles.loveCardSelected]}
                      onPress={() => setLove(opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loveEmoji}>{opt.emoji}</Text>
                      <View style={styles.loveTextWrap}>
                        <Text style={[styles.loveLabel, selected && styles.loveLabelSelected]}>{opt.label}</Text>
                        <Text style={styles.loveDesc}>{opt.description}</Text>
                      </View>
                      {selected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={step < TOTAL_STEPS - 1 ? 'Next' : 'Done'}
            onPress={handleNext}
            fullWidth
            size="lg"
            variant="primary"
            disabled={!isStepValid()}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 18, color: colors.textSecondary },
  skipText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  progressTrack: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.primary },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.base, paddingBottom: spacing['3xl'] },

  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: typography.sizes['2xl'] * 1.25,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  // ── Step 0: Archetype grid ──
  archetypeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  archetypeCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
    minHeight: 110,
  },
  archetypeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: typography.fonts.bodyMedium,
  },
  archetypeEmoji: { fontSize: 24, marginBottom: 6 },
  archetypeLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  archetypeDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 16,
  },

  // ── Step 1: Color palette ──
  paletteList: { gap: spacing.sm },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  paletteRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  swatchRow: { flexDirection: 'row', marginRight: spacing.md },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    marginRight: -6,
    borderWidth: 1,
    borderColor: colors.background,
  },
  paletteLabel: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  paletteLabelSelected: { fontFamily: typography.fonts.bodyMedium, color: colors.primary },
  checkmark: { fontSize: 18, color: colors.primary },

  // ── Step 2: Metal preference ──
  metalGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  metalCard: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  metalCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  metalSwatch: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metalLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metalLabelSelected: { fontFamily: typography.fonts.bodyMedium, color: colors.primary },

  // ── Step 3: Love language ──
  loveList: { gap: spacing.sm },
  loveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  loveCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  loveEmoji: { fontSize: 24 },
  loveTextWrap: { flex: 1 },
  loveLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  loveLabelSelected: { color: colors.primary },
  loveDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },

  footer: {
    padding: spacing.base,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
