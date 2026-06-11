import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { ScoredProduct } from '../../types';
import { useGiftStore } from '../../stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

const DISCOVERY_META: Record<string, { label: string; color: string }> = {
  trending:          { label: '🔥 Trending',     color: colors.discoveryTrending },
  seasonal:          { label: '🌸 Seasonal',     color: colors.discoverySeasonal },
  luxury_upgrade:    { label: '✨ Luxury Pick',  color: colors.discoveryLuxury },
  budget_alternative:{ label: '💙 Budget Pick',  color: colors.discoveryBudget },
  hidden_gem:        { label: '💎 Hidden Gem',   color: colors.discoveryHidden },
  new_arrival:       { label: '🆕 New',          color: colors.primary },
};

interface ProductCardProps {
  product: ScoredProduct;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { savedProducts, toggleSave, recordInteraction } = useGiftStore();
  const isSaved = savedProducts.includes(product.id);

  const handleSave = useCallback(() => {
    toggleSave(product.id);
    recordInteraction(product.id, isSaved ? 'viewed' : 'saved');
  }, [product.id, isSaved, toggleSave, recordInteraction]);

  const discovery = product.isDiscovery && product.discoveryType
    ? DISCOVERY_META[product.discoveryType]
    : null;

  const priceStr = `$${product.price.toLocaleString()}`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Discovery badge */}
        {discovery && (
          <View style={[styles.discoveryBadge, { backgroundColor: discovery.color + '22' }]}>
            <Text style={[styles.discoveryText, { color: discovery.color }]}>
              {discovery.label}
            </Text>
          </View>
        )}
        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
          onPress={handleSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.saveIcon}>{isSaved ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        {product.brand ? (
          <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{priceStr}</Text>
          {product.rating ? (
            <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
          ) : null}
        </View>
        {product.matchReason ? (
          <Text style={styles.matchReason} numberOfLines={2}>
            {product.matchReason}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  imageWrapper: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discoveryBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  discoveryText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  saveBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(13,12,13,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: {
    backgroundColor: colors.roseMuted,
  },
  saveIcon: {
    fontSize: 17,
    color: colors.primaryLight,
  },
  info: {
    padding: spacing.sm,
    gap: 3,
  },
  brand: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.primary,
  },
  rating: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.gold,
  },
  matchReason: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 15,
    marginTop: 2,
  },
});
