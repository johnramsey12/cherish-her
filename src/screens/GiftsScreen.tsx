import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { ScoredProduct, OccasionTag, SortOption } from '../types';
import { useGiftStore, useProfileStore, useGiftPrefsStore, useSurveyStore } from '../stores';
import { ProductCard } from '../components/gifts/ProductCard';
import { ProductDetailModal } from '../components/gifts/ProductDetailModal';
import { FilterBar } from '../components/gifts/FilterBar';
import { LoadingView, EmptyState, ScreenHeader } from '../components/common/index';
import { GiftSurvey } from '../components/surveys/GiftSurveySteps';

export const GiftsScreen: React.FC = () => {
  const { profile } = useProfileStore();
  const { giftPrefs } = useGiftPrefsStore();
  const { surveyState, completeSurvey } = useSurveyStore();
  const {
    recommendations,
    filters,
    sort,
    isLoading,
    hasLoaded,
    setFilters,
    setSort,
    loadRecommendations,
    refresh,
    savedProducts,
  } = useGiftStore();

  const [selectedProduct, setSelectedProduct] = useState<ScoredProduct | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [surveyVisible, setSurveyVisible] = useState(false);

  // Show gift survey if not completed
  useEffect(() => {
    if (!surveyState.giftCompleted && surveyState.profileCompleted) {
      const timer = setTimeout(() => setSurveyVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [surveyState.giftCompleted, surveyState.profileCompleted]);

  // Load on mount
  useEffect(() => {
    if (!hasLoaded) {
      loadRecommendations(profile, giftPrefs);
    }
  }, [hasLoaded]);

  const handleOccasionChange = useCallback((occasion?: OccasionTag) => {
    setFilters({ ...filters, occasion });
    refresh(profile, giftPrefs);
  }, [filters, profile, giftPrefs]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    refresh(profile, giftPrefs);
  }, [profile, giftPrefs]);

  const handleRefresh = useCallback(() => {
    refresh(profile, giftPrefs);
  }, [profile, giftPrefs]);

  const handleProductPress = useCallback((product: ScoredProduct) => {
    setSelectedProduct(product);
    setDetailVisible(true);
  }, []);

  // Apply client-side occasion filter from current state
  const filtered = useMemo(() => {
    if (!filters.occasion) return recommendations;
    return recommendations.filter((p) =>
      p.occasionTags.includes(filters.occasion!)
    );
  }, [recommendations, filters.occasion]);

  const renderItem = useCallback(
    ({ item, index }: { item: ScoredProduct; index: number }) => (
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
      />
    ),
    [handleProductPress]
  );

  const renderSeparator = useCallback(() => (
    <View style={{ width: spacing.sm }} />
  ), []);

  if (isLoading && !hasLoaded) {
    return <LoadingView message="Finding perfect gifts…" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Gift Ideas"
        subtitle={
          filtered.length > 0
            ? `${filtered.length} recommendations for her`
            : undefined
        }
        rightElement={
          savedProducts.length > 0 ? (
            <TouchableOpacity style={styles.savedBadge}>
              <Text style={styles.savedBadgeText}>♥ {savedProducts.length}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FilterBar
        selectedOccasion={filters.occasion}
        selectedSort={sort}
        onOccasionChange={handleOccasionChange}
        onSortChange={handleSortChange}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="No gifts found"
          subtitle="Try adjusting the filters or refreshing to see more options."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={undefined}
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

      <ProductDetailModal
        product={selectedProduct}
        visible={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          setSelectedProduct(null);
        }}
      />

      <GiftSurvey
        visible={surveyVisible}
        onClose={() => setSurveyVisible(false)}
        onComplete={() => {
          setSurveyVisible(false);
          refresh(profile, giftPrefs);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  columnWrapper: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  savedBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.roseMuted,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.roseLight,
  },
  savedBadgeText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.roseLight,
  },
});
