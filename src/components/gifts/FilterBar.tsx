import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../constants/theme';
import { OccasionTag, SortOption } from '../../types';
import { occasionLabels } from '../../constants/theme';

const OCCASIONS: OccasionTag[] = [
  'birthday', 'anniversary', 'christmas', 'valentines',
  'mothers_day', 'graduation', 'wedding', 'just_because', 'apology',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevant',   label: 'Most Relevant' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'trending',   label: 'Trending' },
  { value: 'newest',     label: 'Newest' },
  { value: 'luxury',     label: 'Luxury' },
  { value: 'budget',     label: 'Budget Friendly' },
];

interface FilterBarProps {
  selectedOccasion?: OccasionTag;
  selectedSort: SortOption;
  onOccasionChange: (occasion?: OccasionTag) => void;
  onSortChange: (sort: SortOption) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedOccasion,
  selectedSort,
  onOccasionChange,
  onSortChange,
}) => {
  const [showSortSheet, setShowSortSheet] = React.useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Occasion chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {/* "All" chip */}
        <TouchableOpacity
          style={[styles.chip, !selectedOccasion && styles.chipActive]}
          onPress={() => onOccasionChange(undefined)}
        >
          <Text style={[styles.chipText, !selectedOccasion && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {OCCASIONS.map((occ) => {
          const active = selectedOccasion === occ;
          return (
            <TouchableOpacity
              key={occ}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onOccasionChange(active ? undefined : occ)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {occasionLabels[occ]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sort button */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setShowSortSheet(!showSortSheet)}
        >
          <Text style={styles.sortIcon}>⇅</Text>
          <Text style={styles.sortLabel}>
            {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label ?? 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort sheet */}
      {showSortSheet && (
        <View style={styles.sortSheet}>
          {SORT_OPTIONS.map((opt) => {
            const active = selectedSort === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortOption, active && styles.sortOptionActive]}
                onPress={() => {
                  onSortChange(opt.value);
                  setShowSortSheet(false);
                }}
              >
                <Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyMedium,
  },
  sortRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  sortIcon: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  sortLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  sortSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortOptionActive: {
    backgroundColor: colors.primaryMuted,
  },
  sortOptionText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyMedium,
  },
  checkmark: {
    color: colors.primary,
    fontSize: 16,
  },
});
