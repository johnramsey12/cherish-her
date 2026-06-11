import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, typography, spacing, radius } from '../constants/theme';
import { TabParamList } from '../types';
import { useProfileStore, useSurveyStore } from '../stores';
import { EmergencyModal } from '../components/emergency/EmergencyModal';
import { ProfileSurvey } from '../components/surveys/ProfileSurveySteps';

type NavProp = BottomTabNavigationProp<TabParamList>;

const QUICK_ACTIONS = [
  {
    icon: '🎁',
    title: 'Gifts',
    subtitle: 'Curated recommendations',
    tab: 'Gifts' as keyof TabParamList,
    accent: colors.primary,
  },
  {
    icon: '💕',
    title: 'Date Ideas',
    subtitle: 'Perfect plans for two',
    tab: 'DateIdeas' as keyof TabParamList,
    accent: colors.rose,
  },
  {
    icon: '🍽',
    title: 'Restaurants',
    subtitle: 'Great dining experiences',
    tab: 'DateIdeas' as keyof TabParamList,
    accent: colors.gold,
  },
  {
    icon: '✨',
    title: 'Activities',
    subtitle: 'Fun things to do together',
    tab: 'DateIdeas' as keyof TabParamList,
    accent: colors.discoveryHidden,
  },
];

const UPCOMING_REMINDERS = [
  { icon: '🎂', label: 'Birthday coming up', daysLeft: 12, color: colors.discoverySeasonal },
  { icon: '💕', label: 'Anniversary',         daysLeft: 28, color: colors.rose },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { profile } = useProfileStore();
  const { surveyState } = useSurveyStore();

  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [profileSurveyVisible, setProfileSurveyVisible] = useState(false);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const partnerName = profile?.partnerName;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} ✦</Text>
            <Text style={styles.headline}>
              {partnerName
                ? `What are you planning\nfor ${partnerName}?`
                : 'What do you need help\nchoosing today?'}
            </Text>
          </View>
          {!surveyState.profileCompleted && (
            <TouchableOpacity
              style={styles.setupBadge}
              onPress={() => setProfileSurveyVisible(true)}
            >
              <Text style={styles.setupBadgeText}>Set up profile →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upcoming reminders */}
        {surveyState.profileCompleted && (
          <View style={styles.remindersRow}>
            {UPCOMING_REMINDERS.map((r, i) => (
              <View key={i} style={[styles.reminderChip, { borderColor: r.color + '55' }]}>
                <Text style={styles.reminderIcon}>{r.icon}</Text>
                <View>
                  <Text style={styles.reminderLabel}>{r.label}</Text>
                  <Text style={[styles.reminderDays, { color: r.color }]}>
                    {r.daysLeft} days away
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick action grid */}
        <Text style={styles.sectionTitle}>What are you looking for?</Text>
        <View style={styles.actionGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.tab)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBg, { backgroundColor: action.accent + '20' }]}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency button */}
        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => setEmergencyVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.emergencyIcon}>⚡</Text>
          <View style={styles.emergencyTextGroup}>
            <Text style={styles.emergencyTitle}>I Don't Know What To Do</Text>
            <Text style={styles.emergencySubtitle}>
              Get instant recommendations right now
            </Text>
          </View>
          <Text style={styles.emergencyArrow}>›</Text>
        </TouchableOpacity>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Cherish Her helps you plan the moments that matter.
        </Text>
      </ScrollView>

      <EmergencyModal
        visible={emergencyVisible}
        onClose={() => setEmergencyVisible(false)}
        onNavigateToGifts={() => navigation.navigate('Gifts')}
        onNavigateToDates={() => navigation.navigate('DateIdeas')}
      />

      <ProfileSurvey
        visible={profileSurveyVisible}
        onClose={() => setProfileSurveyVisible(false)}
        onComplete={() => setProfileSurveyVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  greeting: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['3xl'],
    color: colors.textPrimary,
    lineHeight: typography.sizes['3xl'] * 1.2,
  },
  setupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  setupBadgeText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },

  // Reminders
  remindersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.base,
    padding: spacing.sm,
    flex: 1,
    minWidth: 140,
  },
  reminderIcon: { fontSize: 20 },
  reminderLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
  },
  reminderDays: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
  },

  // Section
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },

  // Action grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionIcon: { fontSize: 24 },
  actionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  actionSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 16,
  },

  // Emergency
  emergencyBtn: {
    marginHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  emergencyIcon: { fontSize: 26 },
  emergencyTextGroup: { flex: 1 },
  emergencyTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  emergencySubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emergencyArrow: {
    fontSize: 24,
    color: colors.textTertiary,
  },

  // Tagline
  tagline: {
    fontFamily: typography.fonts.headingItalic,
    fontSize: typography.sizes.base,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
    lineHeight: 24,
  },
});
