import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { EmergencyType } from '../../types';
import { useGiftStore, useDateStore, useProfileStore } from '../../stores';

const EMERGENCY_OPTIONS: {
  type: EmergencyType;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}[] = [
  {
    type: 'gift_fast',
    icon: '🎁',
    title: 'Need a Gift Fast',
    subtitle: 'Best gifts available right now',
    color: colors.primary,
  },
  {
    type: 'date_tonight',
    icon: '🌙',
    title: 'Date Idea Tonight',
    subtitle: 'Perfect plans for this evening',
    color: colors.rose,
  },
  {
    type: 'restaurant_now',
    icon: '🍽',
    title: 'Restaurant Right Now',
    subtitle: 'Great dinner spots nearby',
    color: colors.gold,
  },
  {
    type: 'anniversary_help',
    icon: '💕',
    title: 'Anniversary Help',
    subtitle: 'Make your anniversary special',
    color: colors.roseLight,
  },
  {
    type: 'birthday_help',
    icon: '🎂',
    title: 'Birthday Help',
    subtitle: 'Celebrate her birthday right',
    color: colors.discoverySeasonal,
  },
  {
    type: 'last_minute',
    icon: '⚡',
    title: 'Last-Minute Idea',
    subtitle: 'Quick ideas that still impress',
    color: colors.discoveryTrending,
  },
];

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToGifts: () => void;
  onNavigateToDates: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  visible,
  onClose,
  onNavigateToGifts,
  onNavigateToDates,
}) => {
  const { profile } = useProfileStore();
  const { giftPrefs, setFilters, setSort, refresh: refreshGifts } = useGiftStore();
  const { datePrefs, refresh: refreshDates } = useDateStore();

  const handleEmergency = useCallback((type: EmergencyType) => {
    onClose();
    switch (type) {
      case 'gift_fast':
      case 'anniversary_help':
      case 'birthday_help':
      case 'last_minute': {
        const occasion =
          type === 'anniversary_help' ? 'anniversary'
          : type === 'birthday_help' ? 'birthday'
          : undefined;
        if (occasion) setFilters({ occasion });
        setSort('relevant');
        refreshGifts(profile, giftPrefs);
        onNavigateToGifts();
        break;
      }
      case 'date_tonight':
      case 'restaurant_now': {
        refreshDates(datePrefs, profile);
        onNavigateToDates();
        break;
      }
    }
  }, [profile, giftPrefs, datePrefs]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <SafeAreaView>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Title */}
            <View style={styles.titleRow}>
              <Text style={styles.title}>⚡ Emergency Mode</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              What do you need help with right now?
            </Text>

            {/* Options */}
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {EMERGENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  style={styles.option}
                  onPress={() => handleEmergency(opt.type)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIcon, { backgroundColor: opt.color + '22' }]}>
                    <Text style={styles.optionIconText}>{opt.icon}</Text>
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
              <View style={{ height: spacing.xl }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  optionsList: {
    paddingHorizontal: spacing.base,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 48, height: 48,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconText: { fontSize: 22 },
  optionText: { flex: 1, gap: 2 },
  optionTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  optionSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  arrow: {
    fontSize: 22,
    color: colors.textTertiary,
  },
});
