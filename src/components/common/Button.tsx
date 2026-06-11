import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
}) => {
  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    textStyle as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gold' ? colors.textInverse : colors.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={labelStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  // Variants
  variant_primary: {
    backgroundColor: colors.primary,
  },
  variant_secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: colors.error,
  },
  variant_gold: {
    backgroundColor: colors.gold,
  },

  // Sizes
  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minHeight: 34 },
  size_md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, minHeight: 44 },
  size_lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 52 },

  // Labels
  label: {
    fontFamily: typography.fonts.bodyMedium,
    letterSpacing: 0.3,
  },
  label_primary: { color: colors.textInverse },
  label_secondary: { color: colors.textPrimary },
  label_ghost: { color: colors.primary },
  label_danger: { color: '#fff' },
  label_gold: { color: colors.textInverse },

  labelSize_sm: { fontSize: typography.sizes.sm },
  labelSize_md: { fontSize: typography.sizes.base },
  labelSize_lg: { fontSize: typography.sizes.md },
});
