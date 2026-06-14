import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import type { OccasionTag } from '../../types';
import { STYLE_ARCHETYPES, COLOR_PALETTES } from '../../types/tasteProfile';
import type { StyleArchetype, ColorPalette } from '../../types/tasteProfile';

export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { label: 'Under $50',   min: 0, max: 50    },
  { label: 'Under $100',  min: 0, max: 100   },
  { label: 'Under $200',  min: 0, max: 200   },
  { label: 'Under $500',  min: 0, max: 500   },
  { label: 'Under $1000', min: 0, max: 1000  },
  { label: 'Under $2500', min: 0, max: 2500  },
  { label: 'No limit',    min: 0, max: 99999 },
];

const OCCASIONS = [
  { label: 'Birthday',     value: 'birthday'     },
  { label: 'Anniversary',  value: 'anniversary'  },
  { label: 'Valentines',   value: 'valentines'   },
  { label: 'Mothers Day',  value: 'mothers_day'  },
  { label: 'Graduation',   value: 'graduation'   },
  { label: 'Christmas',    value: 'christmas'    },
  { label: 'Just Because', value: 'just_because' },
];

export interface FilterBarProps {
  selectedOccasion:        OccasionTag | undefined;
  selectedPriceRange?:     PriceRange  | undefined;
  selectedSort?:           any;
  selectedStyleArchetype?: StyleArchetype | undefined;
  selectedColorPalette?:   ColorPalette | undefined;
  onOccasionChange:        (occasion: OccasionTag | undefined) => void;
  onPriceRangeChange?:     (range: PriceRange | undefined) => void;
  onSortChange?:           (sort: any) => void;
  onStyleArchetypeChange?: (style: StyleArchetype | undefined) => void;
  onColorPaletteChange?:   (palette: ColorPalette | undefined) => void;
}

export function FilterBar({ selectedOccasion, selectedPriceRange, selectedStyleArchetype, selectedColorPalette, onOccasionChange, onPriceRangeChange, onStyleArchetypeChange, onColorPaletteChange }: FilterBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>Budget</Text>
        {selectedPriceRange && (
          <TouchableOpacity onPress={() => onPriceRangeChange?.(undefined)}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PRICE_RANGES.map((range) => {
          const active = selectedPriceRange?.label === range.label;
          return (
            <TouchableOpacity key={range.label} style={[styles.chip, active && styles.chipActive]} onPress={() => onPriceRangeChange?.(active ? undefined : range)} activeOpacity={0.7}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{range.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[styles.rowHeader, { marginTop: 8 }]}>
        <Text style={styles.rowLabel}>Occasion</Text>
        {selectedOccasion && (
          <TouchableOpacity onPress={() => onOccasionChange(undefined)}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {OCCASIONS.map(({ label, value }) => {
          const active = selectedOccasion === value;
          return (
            <TouchableOpacity key={value} style={[styles.chip, active && styles.chipActive]} onPress={() => onOccasionChange(active ? undefined : value as OccasionTag)} activeOpacity={0.7}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onStyleArchetypeChange && (
        <>
          <View style={[styles.rowHeader, { marginTop: 8 }]}>
            <Text style={styles.rowLabel}>Style</Text>
            {selectedStyleArchetype && (
              <TouchableOpacity onPress={() => onStyleArchetypeChange(undefined)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {STYLE_ARCHETYPES.map((opt) => {
              const active = selectedStyleArchetype === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onStyleArchetypeChange(active ? undefined : opt.value)} activeOpacity={0.7}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.emoji} {opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {onColorPaletteChange && (
        <>
          <View style={[styles.rowHeader, { marginTop: 8 }]}>
            <Text style={styles.rowLabel}>Color</Text>
            {selectedColorPalette && (
              <TouchableOpacity onPress={() => onColorPaletteChange(undefined)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {COLOR_PALETTES.map((opt) => {
              const active = selectedColorPalette === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onColorPaletteChange(active ? undefined : opt.value)} activeOpacity={0.7}>
                  <View style={styles.colorChipContent}>
                    <View style={styles.colorSwatchPair}>
                      <View style={[styles.colorDot, { backgroundColor: opt.swatches[0] }]} />
                      <View style={[styles.colorDot, { backgroundColor: opt.swatches[1] }]} />
                    </View>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: 8, backgroundColor: colors.background, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 6 },
  rowLabel: { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 },
  clearText: { color: colors.primary, fontSize: 12 },
  scrollContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.background, fontWeight: '500' },
  colorChipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorSwatchPair: { flexDirection: 'row' },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: -3, borderWidth: 1, borderColor: colors.background },
});
