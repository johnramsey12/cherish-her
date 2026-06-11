import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';

// ─────────────────────────────────────────────
//  BADGE
// ─────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = colors.textInverse,
  backgroundColor = colors.primary,
  style,
  textStyle,
}) => (
  <View style={[badgeStyles.container, { backgroundColor }, style]}>
    <Text style={[badgeStyles.text, { color }, textStyle]}>{label}</Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────
//  LOADING VIEW
// ─────────────────────────────────────────────
interface LoadingViewProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Loading…',
  style,
}) => (
  <View style={[loadingStyles.container, style]}>
    <ActivityIndicator size="large" color={colors.primary} />
    {message ? (
      <Text style={loadingStyles.text}>{message}</Text>
    ) : null}
  </View>
);

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  text: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
});

// ─────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '✨',
  title,
  subtitle,
  style,
}) => (
  <View style={[emptyStyles.container, style]}>
    <Text style={emptyStyles.icon}>{icon}</Text>
    <Text style={emptyStyles.title}>{title}</Text>
    {subtitle ? <Text style={emptyStyles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  icon: { fontSize: 48, marginBottom: spacing.sm },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

// ─────────────────────────────────────────────
//  SCREEN HEADER
// ─────────────────────────────────────────────
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  style,
}) => (
  <View style={[headerStyles.container, style]}>
    <View style={headerStyles.textGroup}>
      <Text style={headerStyles.title}>{title}</Text>
      {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
    </View>
    {rightElement ? <View style={headerStyles.right}>{rightElement}</View> : null}
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  textGroup: { flex: 1, gap: 4 },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['2xl'],
    color: colors.textPrimary,
    lineHeight: typography.sizes['2xl'] * 1.2,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  right: { marginLeft: spacing.md },
});
