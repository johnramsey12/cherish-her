import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius, categoryLabels, occasionLabels } from '../../constants/theme';
import { ScoredProduct } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/index';
import { useGiftStore } from '../../stores';
import { generateGiftExplanation } from '../../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProductDetailModalProps {
  product: ScoredProduct | null;
  visible: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  visible,
  onClose,
}) => {
  const { savedProducts, toggleSave, recordInteraction } = useGiftStore();
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  const isSaved = product ? savedProducts.includes(product.id) : false;

  useEffect(() => {
    if (visible && product) {
      recordInteraction(product.id, 'viewed');
      setAiExplanation('');
      loadExplanation(product);
    }
  }, [visible, product?.id]);

  const loadExplanation = async (p: ScoredProduct) => {
    setLoadingAI(true);
    try {
      const explanation = await generateGiftExplanation(p, null, null, p.occasionTags[0]);
      setAiExplanation(explanation);
    } catch {
      setAiExplanation(p.matchReason || `${p.name} is a thoughtful choice that matches her style and your budget.`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAffiliate = async () => {
    if (!product) return;
    recordInteraction(product.id, 'clicked');

    const creatorCode = await AsyncStorage.getItem('@cherish_creator_code');
    let url = product.affiliateLink;

    if (creatorCode) {
      const SERVER_URL = 'https://cherish-her-server-production.up.railway.app';
      url = `${SERVER_URL}/api/creators/track?creator=${creatorCode}&product=${product.id}&network=${product.affiliateNetwork}&link=${encodeURIComponent(product.affiliateLink)}`;
    }

    Linking.openURL(url).catch(() => {});
  };

  const handleSave = () => {
    if (!product) return;
    toggleSave(product.id);
    recordInteraction(product.id, isSaved ? 'viewed' : 'saved');
  };

  const handleLike = () => {
    if (!product) return;
    recordInteraction(product.id, 'liked');
  };

  const handleDislike = () => {
    if (!product) return;
    recordInteraction(product.id, 'disliked');
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveHeaderBtn, isSaved && styles.saveHeaderBtnActive]}
            onPress={handleSave}
          >
            <Text style={styles.saveHeaderIcon}>{isSaved ? '♥' : '♡'}</Text>
            <Text style={styles.saveHeaderText}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero image */}
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <View style={styles.content}>
            {/* Brand / name */}
            {product.brand ? (
              <Text style={styles.brand}>{product.brand.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.name}>{product.name}</Text>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>${product.price.toLocaleString()}</Text>
              {product.rating ? (
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>
                    {product.rating.toFixed(1)}
                    {product.reviewCount ? ` (${product.reviewCount.toLocaleString()})` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Merchant */}
            <Text style={styles.merchant}>Sold by {product.merchantName}</Text>

            {/* Tags */}
            <View style={styles.tagRow}>
              <Badge
                label={categoryLabels[product.category] ?? product.category}
                backgroundColor={colors.primaryMuted}
                color={colors.primary}
              />
              {product.occasionTags.slice(0, 2).map((occ) => (
                <Badge
                  key={occ}
                  label={occasionLabels[occ] ?? occ}
                  backgroundColor={colors.roseMuted}
                  color={colors.roseLight}
                />
              ))}
            </View>

            {/* Description */}
            <Text style={styles.sectionTitle}>About this gift</Text>
            <Text style={styles.description}>{product.description}</Text>

            {/* AI explanation */}
            <View style={styles.aiCard}>
              <Text style={styles.aiLabel}>✨ Why she'll love it</Text>
              {loadingAI ? (
                <Text style={styles.aiText}>Thinking…</Text>
              ) : (
                <Text style={styles.aiText}>{aiExplanation}</Text>
              )}
            </View>

            {/* Style tags */}
            {product.styleTags.length > 0 && (
              <View style={styles.styleTagRow}>
                {product.styleTags.map((tag) => (
                  <View key={tag} style={styles.styleTag}>
                    <Text style={styles.styleTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Feedback row */}
            <Text style={styles.sectionTitle}>Is this a good match?</Text>
            <View style={styles.feedbackRow}>
              <TouchableOpacity style={styles.feedbackBtn} onPress={handleLike}>
                <Text style={styles.feedbackIcon}>👍</Text>
                <Text style={styles.feedbackText}>Good match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackBtn} onPress={handleDislike}>
                <Text style={styles.feedbackIcon}>👎</Text>
                <Text style={styles.feedbackText}>Not for her</Text>
              </TouchableOpacity>
            </View>

            {/* CTA spacer */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View style={styles.ctaContainer}>
          <Button
            label={`Shop on ${product.merchantName} →`}
            onPress={handleAffiliate}
            fullWidth
            size="lg"
            variant="primary"
          />
          <Text style={styles.ctaDisclaimer}>
            Opens {product.merchantName} · Affiliate link
          </Text>
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
  closeBtn: {
    width: 36, height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: colors.textSecondary, fontSize: 14 },
  saveHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  saveHeaderBtnActive: {
    backgroundColor: colors.roseMuted,
    borderColor: colors.roseLight,
  },
  saveHeaderIcon: { fontSize: 15, color: colors.primary },
  saveHeaderText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  scroll: { flex: 1 },
  heroImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.38,
    backgroundColor: colors.surface,
  },
  content: { padding: spacing.base, gap: spacing.sm },
  brand: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    lineHeight: typography.sizes['2xl'] * 1.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.primary,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  star: { color: colors.gold, fontSize: 14 },
  ratingText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  merchant: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    marginTop: -spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.base,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  aiLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  aiText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: 23,
  },
  styleTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  styleTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  styleTagText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackIcon: { fontSize: 18 },
  feedbackText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  ctaContainer: {
    padding: spacing.base,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  ctaDisclaimer: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
