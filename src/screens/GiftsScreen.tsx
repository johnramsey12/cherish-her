import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';
import { ScoredProduct, OccasionTag, SortOption } from '../types';
import { useProfileStore, useGiftPrefsStore, useSurveyStore, useGiftStore } from '../stores';
import { ProductCard } from '../components/gifts/ProductCard';
import { ProductDetailModal } from '../components/gifts/ProductDetailModal';
import { FilterBar, PriceRange } from '../components/gifts/FilterBar';
import { LoadingView, EmptyState, ScreenHeader } from '../components/common/index';
import { GiftSurvey } from '../components/surveys/GiftSurveySteps';
import { fetchGifts, logEvent, ServerProduct } from '../services/api';
import { useTasteProfileStore } from '../stores/useTasteProfileStore';
import { StyleProfileSurvey } from '../components/surveys/StyleProfileSurvey';
import type { StyleArchetype, ColorPalette } from '../types/tasteProfile';
import { searchProducts } from '../utils/search';
import { applyPersonalization } from '../utils/personalization';

function serverProductToScored(p: ServerProduct): ScoredProduct {
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
  } as unknown as ScoredProduct;
}

export const GiftsScreen: React.FC = () => {
  const { profile }       = useProfileStore();
  const { giftPrefs }     = useGiftPrefsStore();
  const { surveyState }   = useSurveyStore();
  const { savedProducts } = useGiftStore();

  const [products, setProducts]                   = useState<ScoredProduct[]>([]);
  const [isLoading, setIsLoading]                 = useState(false);
  const [isRefreshing, setIsRefreshing]           = useState(false);
  const [hasLoaded, setHasLoaded]                 = useState(false);
  const [selectedOccasion, setSelectedOccasion]   = useState<OccasionTag | undefined>(undefined);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | undefined>(undefined);
  const [sort, setSort]                           = useState<SortOption>('relevant' as any);
  const [selectedProduct, setSelectedProduct]     = useState<ScoredProduct | null>(null);
  const [detailVisible, setDetailVisible]         = useState(false);
  const [surveyVisible, setSurveyVisible]         = useState(false);
  const [searchQuery, setSearchQuery]             = useState('');
  const [showSaved, setShowSaved]                 = useState(false);
  const [selectedStyleArchetype, setSelectedStyleArchetype] = useState<StyleArchetype | undefined>(undefined);
  const [selectedColorPalette, setSelectedColorPalette] = useState<ColorPalette | undefined>(undefined);
  const [styleSurveyVisible, setStyleSurveyVisible] = useState(false);
  const { tasteProfile, styleProfileCompleted } = useTasteProfileStore();

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

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { if (hasLoaded) loadProducts(); }, [selectedOccasion, selectedPriceRange, sort]);

  useEffect(() => {
    if (!surveyState.giftCompleted && surveyState.profileCompleted) {
      const timer = setTimeout(() => setSurveyVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [surveyState.giftCompleted, surveyState.profileCompleted]);

  const filteredProducts = products.filter(p => {
    const matchesSaved = !showSaved || savedProducts.includes(p.id);
    const matchesStyle = !selectedStyleArchetype || (p.styleTags ?? []).includes(selectedStyleArchetype as any);
    const matchesColor = !selectedColorPalette || (p.styleTags ?? []).includes(selectedColorPalette as any);
    return matchesSaved && matchesStyle && matchesColor;
  });

  const displayProducts = searchQuery.trim() === ''
    ? applyPersonalization(filteredProducts, tasteProfile)
    : searchProducts(filteredProducts, searchQuery);

  const handleOccasionChange   = useCallback((o?: OccasionTag) => setSelectedOccasion(o), []);
  const handlePriceRangeChange = useCallback((r?: PriceRange) => setSelectedPriceRange(r), []);
  const handleSortChange       = useCallback((s: SortOption) => setSort(s), []);
  const handleRefresh          = useCallback(() => loadProducts(true), [loadProducts]);

  const handleProductPress = useCallback((product: ScoredProduct) => {
    setSelectedProduct(product);
    setDetailVisible(true);
    logEvent({
      eventType:    'tap',
      productId:    product.id,
      styleTags:    profile?.stylePreferences ?? [],
      occasionTags: selectedOccasion ? [selectedOccasion] : [],
      occasion:     selectedOccasion,
      priceRange:   selectedPriceRange?.label,
    });
  }, [profile, selectedOccasion, selectedPriceRange]);

  const renderItem = useCallback(
    ({ item }: { item: ScoredProduct }) => (
      <ProductCard product={item} onPress={() => handleProductPress(item)} />
    ),
    [handleProductPress],
  );

  if (isLoading && !hasLoaded) return <LoadingView message="Finding perfect gifts..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Gift Ideas"
        subtitle={displayProducts.length > 0 ? displayProducts.length + " recommendations for her" : undefined}
        rightElement={
          <TouchableOpacity
            style={[styles.savedBtn, showSaved && styles.savedBtnActive]}
            onPress={() => setShowSaved(s => !s)}
          >
            <Text style={[styles.savedBtnText, showSaved && styles.savedBtnTextActive]}>
              {showSaved ? "Saved" : "Saved"}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search gifts, brands..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FilterBar
        selectedOccasion={selectedOccasion}
        selectedPriceRange={selectedPriceRange}
        selectedSort={sort}
        selectedStyleArchetype={selectedStyleArchetype}
        selectedColorPalette={selectedColorPalette}
        onOccasionChange={handleOccasionChange}
        onPriceRangeChange={handlePriceRangeChange}
        onSortChange={handleSortChange}
        onStyleArchetypeChange={setSelectedStyleArchetype}
        onColorPaletteChange={setSelectedColorPalette}
      />

      {!styleProfileCompleted && (
        <TouchableOpacity style={styleBannerStyles.banner} onPress={() => setStyleSurveyVisible(true)} activeOpacity={0.85}>
          <Text style={styleBannerStyles.bannerEmoji}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styleBannerStyles.bannerTitle}>Get more tailored picks</Text>
            <Text style={styleBannerStyles.bannerSub}>Tell us her style — takes about 90 seconds</Text>
          </View>
          <Text style={styleBannerStyles.bannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {displayProducts.length === 0 && !isLoading ? (
        <EmptyState
          icon="🎁"
          title={showSaved ? "No saved gifts yet" : "No gifts found"}
          subtitle={showSaved ? "Tap the heart on any gift to save it." : "Try adjusting the filters or pull down to refresh."}
        />
      ) : (
        <FlatList
          data={displayProducts}
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
        onClose={() => { setDetailVisible(false); setSelectedProduct(null); }}
      />

      <GiftSurvey
        visible={surveyVisible}
        onClose={() => setSurveyVisible(false)}
        onComplete={() => { setSurveyVisible(false); loadProducts(true); }}
      />

      <StyleProfileSurvey
        visible={styleSurveyVisible}
        onClose={() => setStyleSurveyVisible(false)}
        onComplete={() => { setStyleSurveyVisible(false); loadProducts(true); }}
      />
    </SafeAreaView>
  );
};

const styleBannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bannerEmoji: { fontSize: 22 },
  bannerTitle: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.sm, color: colors.primary },
  bannerSub: { fontFamily: typography.fonts.body, fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  bannerArrow: { fontSize: 22, color: colors.primary },
});

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.background },
  columnWrapper:   { paddingHorizontal: spacing.base, gap: spacing.sm },
  listContent:     { paddingTop: spacing.md, paddingBottom: spacing["3xl"] },
  searchRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  searchInput: {
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
  },
  savedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  savedBtnActive: {
    backgroundColor: colors.roseMuted,
    borderColor: colors.primary,
  },
  savedBtnText:       { fontSize: 12, color: colors.textSecondary },
  savedBtnTextActive: { color: colors.primary, fontWeight: "500" },
});
