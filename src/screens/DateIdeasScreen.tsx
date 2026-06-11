import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';
import { DateIdea, Restaurant, Activity } from '../types';
import { useDateStore, useProfileStore, useDatePrefsStore, useSurveyStore } from '../stores';
import { DateIdeaCard } from '../components/dates/DateIdeaCard';
import { LoadingView, EmptyState, ScreenHeader } from '../components/common/index';
import { DateSurvey } from '../components/surveys/DateSurveySteps';

type Tab = 'all' | 'restaurants' | 'activities';

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'all',         label: 'All Ideas',    icon: '💕' },
  { value: 'restaurants', label: 'Restaurants',  icon: '🍽' },
  { value: 'activities',  label: 'Activities',   icon: '✨' },
];

export const DateIdeasScreen: React.FC = () => {
  const { profile } = useProfileStore();
  const { datePrefs } = useDatePrefsStore();
  const { surveyState } = useSurveyStore();
  const {
    dateIdeas,
    restaurants,
    activities,
    isLoading,
    hasLoaded,
    activeTab,
    setActiveTab,
    loadDateIdeas,
    refresh,
  } = useDateStore();

  const [surveyVisible, setSurveyVisible] = useState(false);

  // Show survey if not done
  useEffect(() => {
    if (!surveyState.dateCompleted && surveyState.profileCompleted) {
      const t = setTimeout(() => setSurveyVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, [surveyState.dateCompleted, surveyState.profileCompleted]);

  // Load on mount
  useEffect(() => {
    if (!hasLoaded) {
      loadDateIdeas(datePrefs, profile);
    }
  }, [hasLoaded]);

  const handleRefresh = useCallback(() => {
    refresh(datePrefs, profile);
  }, [datePrefs, profile]);

  // Map restaurants/activities into DateIdea-like cards
  const restaurantIdeas: DateIdea[] = restaurants.map((r: Restaurant) => ({
    id: `r-${r.id}`,
    title: r.name,
    description: r.description,
    restaurant: r,
    estimatedTotalCost: r.estimatedCostForTwo,
    priceRange: r.priceRange,
    tags: r.tags,
    whyItMatches: `${r.cuisine} cuisine — ${r.isRomantic ? 'romantic atmosphere' : 'great dining experience'}`,
  }));

  const activityIdeas: DateIdea[] = activities.map((a: Activity) => ({
    id: `a-${a.id}`,
    title: a.name,
    description: a.description,
    activity: a,
    estimatedTotalCost: a.estimatedCost,
    priceRange: a.priceRange,
    tags: a.tags,
    whyItMatches: a.duration ? `${a.duration} · ${a.indoorOutdoor}` : a.indoorOutdoor,
  }));

  const feedData: DateIdea[] =
    activeTab === 'all' ? dateIdeas
    : activeTab === 'restaurants' ? restaurantIdeas
    : activityIdeas;

  const renderItem = useCallback(({ item }: { item: DateIdea }) => (
    <DateIdeaCard
      idea={item}
      onPress={() => {}}
    />
  ), []);

  if (isLoading && !hasLoaded) {
    return <LoadingView message="Planning the perfect date…" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Date Ideas"
        subtitle="Curated plans for the two of you"
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = activeTab === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.value)}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {feedData.length === 0 ? (
        <EmptyState
          icon="💕"
          title="No ideas yet"
          subtitle="Complete the date survey for personalized suggestions, or pull to refresh."
        />
      ) : (
        <FlatList
          data={feedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <DateSurvey
        visible={surveyVisible}
        onClose={() => setSurveyVisible(false)}
        onComplete={() => {
          setSurveyVisible(false);
          refresh(datePrefs, profile);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyMedium,
  },

  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
});
