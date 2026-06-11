import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';
import { useProfileStore, useGiftPrefsStore, useDatePrefsStore, useSurveyStore } from '../stores';
import { ScreenHeader } from '../components/common/index';
import { ProfileSurvey } from '../components/surveys/ProfileSurveySteps';
import { GiftSurvey } from '../components/surveys/GiftSurveySteps';
import { DateSurvey } from '../components/surveys/DateSurveySteps';

// ─── Inline editable field ───────────────────
interface FieldRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, placeholder, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <View style={fieldStyles.row}>
      <Text style={fieldStyles.label}>{label}</Text>
      {editing ? (
        <View style={fieldStyles.editRow}>
          <TextInput
            style={fieldStyles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder ?? label}
            placeholderTextColor={colors.textTertiary}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={commit}
          />
          <TouchableOpacity style={fieldStyles.saveBtn} onPress={commit}>
            <Text style={fieldStyles.saveBtnText}>✓</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={fieldStyles.valueRow} onPress={() => { setDraft(value); setEditing(true); }}>
          <Text style={value ? fieldStyles.value : fieldStyles.placeholder}>
            {value || (placeholder ?? 'Tap to add')}
          </Text>
          <Text style={fieldStyles.editIcon}>✏️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Tag display row ─────────────────────────
const TagsRow: React.FC<{ label: string; tags: string[]; onEdit: () => void }> = ({
  label, tags, onEdit,
}) => (
  <View style={fieldStyles.row}>
    <View style={fieldStyles.labelRow}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TouchableOpacity onPress={onEdit}>
        <Text style={fieldStyles.editLink}>Edit →</Text>
      </TouchableOpacity>
    </View>
    {tags.length > 0 ? (
      <View style={fieldStyles.tagsWrap}>
        {tags.map((t) => (
          <View key={t} style={fieldStyles.tag}>
            <Text style={fieldStyles.tagText}>{t}</Text>
          </View>
        ))}
      </View>
    ) : (
      <TouchableOpacity onPress={onEdit}>
        <Text style={fieldStyles.placeholder}>Tap to add →</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Section Header ──────────────────────────
const SectionHeader: React.FC<{ title: string; emoji: string; onEdit?: () => void }> = ({
  title, emoji, onEdit,
}) => (
  <View style={sectionStyles.header}>
    <Text style={sectionStyles.title}>{emoji} {title}</Text>
    {onEdit && (
      <TouchableOpacity style={sectionStyles.editBtn} onPress={onEdit}>
        <Text style={sectionStyles.editBtnText}>Re-take Survey</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main Screen ─────────────────────────────
export const ProfileScreen: React.FC = () => {
  const { profile, updateProfile } = useProfileStore();
  const { giftPrefs } = useGiftPrefsStore();
  const { datePrefs } = useDatePrefsStore();
  const { surveyState } = useSurveyStore();

  const [profileSurveyVisible, setProfileSurveyVisible] = useState(false);
  const [giftSurveyVisible, setGiftSurveyVisible] = useState(false);
  const [dateSurveyVisible, setDateSurveyVisible] = useState(false);

  const hasProfile = !!profile;
  const hasGiftPrefs = !!giftPrefs;
  const hasDatePrefs = !!datePrefs;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Her Profile"
        subtitle="All your saved preferences"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Completion status */}
        <View style={styles.statusRow}>
          {[
            { label: 'Profile', done: surveyState.profileCompleted, onPress: () => setProfileSurveyVisible(true) },
            { label: 'Gifts', done: surveyState.giftCompleted,   onPress: () => setGiftSurveyVisible(true) },
            { label: 'Dates', done: surveyState.dateCompleted,   onPress: () => setDateSurveyVisible(true) },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.statusChip, item.done && styles.statusChipDone]}
              onPress={item.onPress}
            >
              <Text style={styles.statusIcon}>{item.done ? '✓' : '+'}</Text>
              <Text style={[styles.statusLabel, item.done && styles.statusLabelDone]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PERSONAL ── */}
        <SectionHeader
          title="Personal"
          emoji="💕"
          onEdit={() => setProfileSurveyVisible(true)}
        />
        <View style={styles.section}>
          <FieldRow
            label="Her Name"
            value={profile?.partnerName ?? ''}
            placeholder="e.g. Emma"
            onSave={(v) => updateProfile({ partnerName: v || undefined })}
          />
          <FieldRow
            label="Birthday"
            value={profile?.birthday ?? ''}
            placeholder="YYYY-MM-DD"
            onSave={(v) => updateProfile({ birthday: v || undefined })}
          />
          <FieldRow
            label="Anniversary"
            value={profile?.anniversaryDate ?? ''}
            placeholder="YYYY-MM-DD"
            onSave={(v) => updateProfile({ anniversaryDate: v || undefined })}
          />
          <TagsRow
            label="Style"
            tags={profile?.stylePreferences ?? []}
            onEdit={() => setProfileSurveyVisible(true)}
          />
          <TagsRow
            label="Favorite Colors"
            tags={profile?.favoriteColors ?? []}
            onEdit={() => setProfileSurveyVisible(true)}
          />
          <TagsRow
            label="Interests"
            tags={profile?.interests ?? []}
            onEdit={() => setProfileSurveyVisible(true)}
          />
          <TagsRow
            label="Hobbies"
            tags={profile?.hobbies ?? []}
            onEdit={() => setProfileSurveyVisible(true)}
          />
        </View>

        {/* ── SIZES ── */}
        <SectionHeader title="Sizes" emoji="📏" />
        <View style={styles.section}>
          <FieldRow
            label="Ring Size"
            value={profile?.ringSize ?? ''}
            placeholder="e.g. 6"
            onSave={(v) => updateProfile({ ringSize: v || undefined })}
          />
          <FieldRow
            label="Wrist Size"
            value={profile?.wristSize ?? ''}
            placeholder={`e.g. 6.5"`}
            onSave={(v) => updateProfile({ wristSize: v || undefined })}
          />
          <FieldRow
            label="Clothing Top"
            value={profile?.clothingSizes?.top ?? ''}
            placeholder="e.g. S, M, L"
            onSave={(v) =>
              updateProfile({
                clothingSizes: { ...(profile?.clothingSizes ?? {}), top: v || undefined },
              })
            }
          />
          <FieldRow
            label="Clothing Bottom"
            value={profile?.clothingSizes?.bottom ?? ''}
            placeholder="e.g. 28, 4, M"
            onSave={(v) =>
              updateProfile({
                clothingSizes: { ...(profile?.clothingSizes ?? {}), bottom: v || undefined },
              })
            }
          />
          <FieldRow
            label="Shoe Size"
            value={profile?.shoeSize ?? ''}
            placeholder="e.g. 8.5"
            onSave={(v) => updateProfile({ shoeSize: v || undefined })}
          />
        </View>

        {/* ── GIFT PREFS ── */}
        <SectionHeader
          title="Gift Preferences"
          emoji="🎁"
          onEdit={() => setGiftSurveyVisible(true)}
        />
        <View style={styles.section}>
          {hasGiftPrefs ? (
            <>
              <View style={fieldStyles.row}>
                <Text style={fieldStyles.label}>Gift Style</Text>
                <Text style={fieldStyles.value}>
                  {giftPrefs!.luxuryVsPractical === 'luxury' ? '✨ Loves luxury'
                    : giftPrefs!.luxuryVsPractical === 'practical' ? '🎯 Practical gifts'
                    : '⚖️ Balanced'}
                </Text>
              </View>
              <View style={fieldStyles.row}>
                <Text style={fieldStyles.label}>Typical Budget</Text>
                <Text style={fieldStyles.value}>${giftPrefs!.typicalBudget}</Text>
              </View>
              <TagsRow
                label="Fav Categories"
                tags={giftPrefs!.favoriteCategories}
                onEdit={() => setGiftSurveyVisible(true)}
              />
              <TagsRow
                label="Fav Brands"
                tags={giftPrefs!.favoriteBrands}
                onEdit={() => setGiftSurveyVisible(true)}
              />
            </>
          ) : (
            <TouchableOpacity
              style={styles.setupPrompt}
              onPress={() => setGiftSurveyVisible(true)}
            >
              <Text style={styles.setupPromptText}>
                Complete the Gift Survey for better recommendations →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── DATE PREFS ── */}
        <SectionHeader
          title="Date Preferences"
          emoji="💕"
          onEdit={() => setDateSurveyVisible(true)}
        />
        <View style={styles.section}>
          {hasDatePrefs ? (
            <>
              <FieldRow
                label="Zip Code"
                value={datePrefs!.zipCode}
                placeholder="e.g. 90210"
                onSave={(v) => {}}
              />
              <View style={fieldStyles.row}>
                <Text style={fieldStyles.label}>Travel Radius</Text>
                <Text style={fieldStyles.value}>{datePrefs!.travelRadius} miles</Text>
              </View>
              <View style={fieldStyles.row}>
                <Text style={fieldStyles.label}>Date Budget</Text>
                <Text style={fieldStyles.value}>${datePrefs!.typicalDateBudget}</Text>
              </View>
              <TagsRow
                label="Favorite Foods"
                tags={datePrefs!.favoriteFoods}
                onEdit={() => setDateSurveyVisible(true)}
              />
            </>
          ) : (
            <TouchableOpacity
              style={styles.setupPrompt}
              onPress={() => setDateSurveyVisible(true)}
            >
              <Text style={styles.setupPromptText}>
                Complete the Date Survey for personalized ideas →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      <ProfileSurvey
        visible={profileSurveyVisible}
        onClose={() => setProfileSurveyVisible(false)}
        onComplete={() => setProfileSurveyVisible(false)}
      />
      <GiftSurvey
        visible={giftSurveyVisible}
        onClose={() => setGiftSurveyVisible(false)}
        onComplete={() => setGiftSurveyVisible(false)}
      />
      <DateSurvey
        visible={dateSurveyVisible}
        onClose={() => setDateSurveyVisible(false)}
        onComplete={() => setDateSurveyVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['3xl'] },

  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  statusChip: {
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
  statusChipDone: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  statusIcon: { fontSize: 13, color: colors.primary },
  statusLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  statusLabelDone: { color: colors.primary },

  section: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  setupPrompt: {
    padding: spacing.base,
  },
  setupPromptText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.primary,
  },
});

const fieldStyles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  editIcon: { fontSize: 14 },
  editLink: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderFocus,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  saveBtn: {
    width: 32, height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: colors.textInverse, fontSize: 15 },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  tagText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    textTransform: 'capitalize',
  },
});

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
