import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Linking,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';
import { useProfileStore, useSurveyStore } from '../stores';
import { LoadingView, EmptyState, ScreenHeader } from '../components/common/index';
import { DateSurvey } from '../components/surveys/DateSurveySteps';
import { fetchDates, fetchDatePackage, DateVenue } from '../services/api';

const VIBES = [
  { id: 'romantic',    label: 'Romantic',    icon: 'X' },
  { id: 'foodie',      label: 'Foodie',      icon: 'X' },
  { id: 'adventurous', label: 'Adventurous', icon: 'X' },
  { id: 'relaxed',     label: 'Relaxed',     icon: 'X' },
  { id: 'active',      label: 'Active',      icon: 'X' },
  { id: 'cultural',    label: 'Cultural',    icon: 'X' },
  { id: 'cozy',        label: 'Cozy',        icon: 'X' },
];

const BUDGETS: { id: 'low' | 'medium' | 'high' | 'luxury'; label: string }[] = [
  { id: 'low',    label: 'Under $30'  },
  { id: 'medium', label: '$30-$75'    },
  { id: 'high',   label: '$75-$150'   },
  { id: 'luxury', label: '$150+'      },
];

function PriceLevel({ level }: { level: number | null }) {
  if (!level) return null;
  const symbols = Array.from({ length: 4 }, (_, i) => (
    <Text key={i} style={{ color: i < level ? colors.primary : colors.textSecondary, fontSize: 11 }}>$</Text>
  ));
  return <View style={{ flexDirection: 'row' }}>{symbols}</View>;
}

function VenueCard({ venue }: { venue: DateVenue }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.name} numberOfLines={1}>{venue.name}</Text>
          <Text style={cardStyles.type} numberOfLines={1}>{venue.type}</Text>
        </View>
        {venue.openNow !== null && (
          <View style={[cardStyles.badge, { backgroundColor: venue.openNow ? '#1a3a2a' : '#3a1a1a' }]}>
            <Text style={[cardStyles.badgeText, { color: venue.openNow ? '#4caf82' : '#ef5350' }]}>
              {venue.openNow ? 'Open' : 'Closed'}
            </Text>
          </View>
        )}
      </View>

      <View style={cardStyles.meta}>
        {venue.rating && (
          <View style={cardStyles.metaItem}>
            <Text style={cardStyles.metaLabel}>Rating</Text>
            <Text style={cardStyles.metaValue}>{venue.rating.toFixed(1)} {venue.totalRatings ? `(${venue.totalRatings.toLocaleString()})` : ''}</Text>
          </View>
        )}
        <PriceLevel level={venue.priceLevel} />
      </View>

      <Text style={cardStyles.address} numberOfLines={2}>{venue.address}</Text>

      <TouchableOpacity
        style={cardStyles.mapsBtn}
        onPress={() => Linking.openURL(venue.mapsUrl)}
        activeOpacity={0.7}
      >
        <Text style={cardStyles.mapsBtnText}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  name: { fontFamily: typography.fonts.bodyMedium, fontSize: 15, color: colors.textPrimary, flex: 1 },
  type: { fontFamily: typography.fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: typography.fonts.bodyMedium },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  metaItem: {},
  metaLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: colors.textPrimary, fontFamily: typography.fonts.bodyMedium },
  address: { fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  mapsBtn: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mapsBtnText: { color: colors.primary, fontFamily: typography.fonts.bodyMedium, fontSize: 13 },
});

export const DateIdeasScreen: React.FC = () => {
  const { profile } = useProfileStore();
  const { surveyState } = useSurveyStore();

  const [venues, setVenues] = useState<DateVenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [zip, setZip] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('romantic');
  const [selectedBudget, setSelectedBudget] = useState<'low' | 'medium' | 'high' | 'luxury'>('medium');
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const [datePackage, setDatePackage] = useState<{ dinner: DateVenue | null; activity: DateVenue | null } | null>(null);

  useEffect(() => {
    if (!surveyState.dateCompleted && surveyState.profileCompleted) {
      const t = setTimeout(() => setSurveyVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, [surveyState.dateCompleted, surveyState.profileCompleted]);

  const loadVenues = useCallback(async (zipCode: string, vibe: string, budget: string, refreshing = false) => {
    if (!zipCode || zipCode.length !== 5) return;
    if (refreshing) {} else setIsLoading(true);
    try {
      const resp = await fetchDates({
        zip: zipCode,
        vibe,
        budget: budget as any,
        limit: 15,
      });
      setVenues(resp.venues);
    } catch (err) {
      console.warn('Date fetch failed:', err);
      setVenues([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  const handleZipSearch = useCallback(() => {
    if (zipInput.length === 5) {
      setZip(zipInput);
      setDatePackage(null);
      loadVenues(zipInput, selectedVibe, selectedBudget);
    }
  }, [zipInput, selectedVibe, selectedBudget, loadVenues]);

  const handleVibeChange = useCallback((vibe: string) => {
    setSelectedVibe(vibe);
    setDatePackage(null);
    if (zip) loadVenues(zip, vibe, selectedBudget);
  }, [zip, selectedBudget, loadVenues]);

  const handleBudgetChange = useCallback((budget: 'low' | 'medium' | 'high' | 'luxury') => {
    setSelectedBudget(budget);
    setDatePackage(null);
    if (zip) loadVenues(zip, selectedVibe, budget);
  }, [zip, selectedVibe, loadVenues]);

  const handleBuildPackage = useCallback(async () => {
    if (!zip) return;
    setPackageLoading(true);
    try {
      const resp = await fetchDatePackage({ zip, vibe: selectedVibe, budget: selectedBudget });
      setDatePackage(resp.package);
    } catch (err) {
      console.warn('Package fetch failed:', err);
    } finally {
      setPackageLoading(false);
    }
  }, [zip, selectedVibe, selectedBudget]);

  const renderItem = useCallback(({ item }: { item: DateVenue }) => (
    <VenueCard venue={item} />
  ), []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Date Ideas" subtitle="Real nearby spots, picked for you" />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Location input */}
        <View style={styles.locationRow}>
          <TextInput
            style={styles.zipInput}
            placeholder="Enter zip code"
            placeholderTextColor={colors.textSecondary}
            value={zipInput}
            onChangeText={setZipInput}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="search"
            onSubmitEditing={handleZipSearch}
          />
          <TouchableOpacity
            style={[styles.searchBtn, zipInput.length !== 5 && styles.searchBtnDisabled]}
            onPress={handleZipSearch}
            disabled={zipInput.length !== 5}
            activeOpacity={0.7}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Vibe chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Vibe</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {VIBES.map((v) => {
            const active = selectedVibe === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleVibeChange(v.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{v.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Budget chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Budget</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {BUDGETS.map((b) => {
            const active = selectedBudget === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleBudgetChange(b.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{b.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date package */}
        {zip && (
          <View style={styles.packageSection}>
            <TouchableOpacity
              style={styles.packageBtn}
              onPress={handleBuildPackage}
              disabled={packageLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.packageBtnText}>
                {packageLoading ? 'Building...' : 'Build a Full Date Package'}
              </Text>
              <Text style={styles.packageBtnSub}>Dinner + activity picked for her</Text>
            </TouchableOpacity>

            {datePackage && (
              <View style={styles.packageResult}>
                {datePackage.dinner && (
                  <View>
                    <Text style={styles.packageLabel}>Dinner</Text>
                    <VenueCard venue={datePackage.dinner} />
                  </View>
                )}
                {datePackage.activity && (
                  <View>
                    <Text style={styles.packageLabel}>Then</Text>
                    <VenueCard venue={datePackage.activity} />
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Results */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Finding spots near you...</Text>
          </View>
        ) : !zip ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📍</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: typography.fonts.bodyMedium, textAlign: 'center' }}>Enter your zip code</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6 }}>We'll find the best nearby spots for your date</Text>
          </View>
        ) : venues.length === 0 && hasLoaded ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: typography.fonts.bodyMedium, textAlign: 'center' }}>No spots found</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6 }}>Try a different vibe or budget</Text>
          </View>
        ) : (
          <View>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionLabel}>{venues.length} Spots Near You</Text>
            </View>
            {venues.map((venue) => <VenueCard key={venue.placeId} venue={venue} />)}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <DateSurvey
        visible={surveyVisible}
        onClose={() => setSurveyVisible(false)}
        onComplete={() => setSurveyVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  locationRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  zipInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fonts.body,
  },
  searchBtn: {
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText: { color: colors.background, fontFamily: typography.fonts.bodyMedium, fontSize: 14 },
  sectionHeader: { paddingHorizontal: spacing.base, marginBottom: 8 },
  sectionLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  chipsRow: { paddingHorizontal: spacing.base, gap: 8, paddingBottom: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 13 },
  chipTextActive: { color: colors.background, fontWeight: '500' },
  packageSection: { paddingHorizontal: spacing.base, marginBottom: spacing.md },
  packageBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.base,
    alignItems: 'center',
  },
  packageBtnText: { color: colors.primary, fontFamily: typography.fonts.bodyMedium, fontSize: 15 },
  packageBtnSub: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  packageResult: { marginTop: spacing.md },
  packageLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
});