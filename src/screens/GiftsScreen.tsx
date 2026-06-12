import React, { useEffect, useState, useCallback } from 'react';
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
import { useProfileStore, useGiftPrefsStore, useSurveyStore } from '../stores';
import { ProductCard } from '../components/gifts/ProductCard';
import { ProductDetailModal } from '../components/gifts/ProductDetailModal';
import { FilterBar, PriceRange } from '../components/gifts/FilterBar';
import { LoadingView, EmptyState, ScreenHeader } from '../components/common/index';
import { GiftSurvey } from '../components/surveys/GiftSurveySteps';
import { fetchGifts, logEvent, ServerProduct } from '../services/api';

function serverProductToScored(p: ServerProduct): ScoredProduct {  // @ts-ignore
  return {
    id:              p.id,
    name:            p.name,
    description:     p.description,
    category:        p.category as any,
    price:           p.price,
    priceRange:      p.priceRange as any,
    imageUrl:        p.imageUrl,
    affiliateLink:   p.affiliateLink,
    affiliateNetwork:p.affiliateNetwork as any,
    merchantName:    p.merchantName,
    brand:           p.brand ?? undefined,
    rating:          p.rating ?? undefined,
    reviewCount:     p.reviewCount ?? undefined,
    popularityScore: p.popularityScore,
    styleTags:       p.styleTags as any,
    occasionTags:    p.occasionTags as any,
  };
}

export const GiftsScreen: React.FC = () => {
  const { profile }                       = useProfileStore();
  const { giftPrefs }                     = useGiftPrefsStore();
  const { surveyState }                   = useSurveyStore();

  const [products, setProducts]           = useState<ScoredProduct[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [hasLoaded, setHasLoaded]         = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | undefined>(undefined);
  const [sort, setSort]                   = useState<SortOption>('relevant' as any);
  const [selectedProduct, setSelectedProduct] = useState<ScoredProduct | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [surveyVisible, setSurveyVisible] = useState(false);

  const loadProducts = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const resp = await fetchGifts({
        styleTags:    profile?.stylePreferences ?? [],
        occasionTags: selectedOccasion ? [selectedOccasion] : [],
        interestTags: profile?.interests ?? [],
        minPrice:     selectedPriceRange?.min,
        maxPrice:     selectedPriceRange?.max,
        sort:         sort as any,
        limit:        60,
      });
      setProducts(resp.products.map(serverProductToScored));
    } catch (err) {
      console.warn('Server fetch failed, using local fallback:', err);
      try {
        const { GENERATED_PRODUCTS } = await import('../data/products.generated');
        setProducts(GENERATED_PRODUCTS as unknown as ScoredProduct[]);
      } catch {
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setHasLoaded(true);
    }
  }, [profile, selectedOccasion, selectedPriceRange, sort]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (hasLoaded) loadProducts();
  }, [selectedOccasion, selectedPriceRange, sort]);

  // Show gift survey if not completed
  useEffect(() => {
    if (!surveyState.giftCompleted && surveyState.profileCompleted) {
      const timer = setTimeout(() => setSurveyVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [surveyState.giftCompleted, surveyState.profileCompleted]);

  const handleOccasionChange = useCallback((occasion?: OccasionTag) => {
    setSelectedOccasion(occasion);
  }, []);

  const handlePriceRangeChange = useCallback((range?: PriceRange) => {
    setSelectedPriceRange(range);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

  const handleRefresh = useCallback(() => {
    loadProducts(true);
  }, [loadProducts]);

  const handleProductPress = useCallback((product: ScoredProduct) => {
    setSelectedProduct(product);
    setDetailVisible(true);
    logEvent({
      eventType:    'tap',
      productId:    product.id,
      styleTags:    profile?.stylePreferences ?? [],
      occasionTags: selectedOccasion ? [selectedOccasion] : [],
      interestTags: profile?.interests ?? [],
      occasion:     selectedOccasion,
      priceRange:   selectedPriceRange?.label,
    });
  }, [profile, selectedOccasion, selectedPriceRange]);

  const renderItem = useCallback(
    ({ item }: { item: ScoredProduct }) => (
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
      />
    ),
    [handleProductPress],
  );

  if (isLoading && !hasLoaded) {
    return <LoadingView message="Finding perfect gifts…" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Gift Ideas"
        subtitle={
          products.length > 0
            ? `${products.length} recommendations for her`
            : undefined
        }
      />

      <FilterBar
        selectedOccasion={selectedOccasion}
        selectedPriceRange={selectedPriceRange}
        selectedSort={sort}
        onOccasionChange={handleOccasionChange}
        onPriceRangeChange={handlePriceRangeChange}
        onSortChange={handleSortChange}
      />

      {products.length === 0 && !isLoading ? (
        <EmptyState
          icon="🎁"
          title="No gifts found"
          subtitle="Try adjusting the filters or pull down to refresh."
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
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
          loadProducts(true);
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
});