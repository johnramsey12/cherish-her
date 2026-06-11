import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { DateIdea } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.base * 2;

interface DateIdeaCardProps {
  idea: DateIdea;
  onPress: () => void;
}

export const DateIdeaCard: React.FC<DateIdeaCardProps> = ({ idea, onPress }) => {
  const imageUri =
    idea.restaurant?.imageUrl ??
    idea.activity?.imageUrl ??
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80';

  const hasBoth = !!(idea.restaurant && idea.activity);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Hero */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        {/* Tags overlaid on image */}
        <View style={styles.overlayContent}>
          <View style={styles.tagRow}>
            {idea.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.title}>{idea.title}</Text>
          <Text style={styles.cost}>${idea.estimatedTotalCost.toLocaleString()} est.</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.description} numberOfLines={3}>
          {idea.description}
        </Text>

        {/* Sub-items */}
        {hasBoth ? (
          <View style={styles.componentsRow}>
            <View style={styles.component}>
              <Text style={styles.componentIcon}>🍽</Text>
              <Text style={styles.componentName} numberOfLines={1}>
                {idea.restaurant!.name}
              </Text>
            </View>
            <Text style={styles.plus}>+</Text>
            <View style={styles.component}>
              <Text style={styles.componentIcon}>✨</Text>
              <Text style={styles.componentName} numberOfLines={1}>
                {idea.activity!.name}
              </Text>
            </View>
          </View>
        ) : idea.restaurant ? (
          <View style={styles.singleComponent}>
            <Text style={styles.componentIcon}>🍽</Text>
            <Text style={styles.componentName}>{idea.restaurant.name}</Text>
            <Text style={styles.componentSub}>{idea.restaurant.cuisine}</Text>
          </View>
        ) : idea.activity ? (
          <View style={styles.singleComponent}>
            <Text style={styles.componentIcon}>✨</Text>
            <Text style={styles.componentName}>{idea.activity.name}</Text>
            <Text style={styles.componentSub}>{idea.activity.duration ?? ''}</Text>
          </View>
        ) : null}

        {/* Why it matches */}
        {idea.whyItMatches ? (
          <View style={styles.matchRow}>
            <Text style={styles.matchIcon}>💕</Text>
            <Text style={styles.matchText} numberOfLines={2}>
              {idea.whyItMatches}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,12,13,0.55)',
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    justifyContent: 'flex-end',
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: 'rgba(200,149,106,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(200,149,106,0.4)',
  },
  tagText: {
    fontFamily: typography.fonts.body,
    fontSize: 10,
    color: colors.primaryLight,
    textTransform: 'capitalize',
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    lineHeight: typography.sizes.xl * 1.2,
  },
  cost: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  componentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  component: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  plus: {
    color: colors.textTertiary,
    fontSize: 16,
  },
  singleComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  componentIcon: { fontSize: 15 },
  componentName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  componentSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  matchIcon: { fontSize: 13, marginTop: 1 },
  matchText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    flex: 1,
    lineHeight: 17,
  },
});
