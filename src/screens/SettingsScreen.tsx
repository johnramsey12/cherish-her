import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radius } from '../constants/theme';
import { useSettingsStore, useProfileStore } from '../stores';
import { ScreenHeader } from '../components/common/index';
import { refreshAllReminders } from '../services/notificationService';

// ─── Row types ───────────────────────────────
interface ToggleRowProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  icon?: string;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, subtitle, value, onToggle, icon }) => (
  <View style={rowStyles.row}>
    <View style={rowStyles.rowLeft}>
      {icon ? <Text style={rowStyles.icon}>{icon}</Text> : null}
      <View style={rowStyles.rowText}>
        <Text style={rowStyles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={rowStyles.rowSub}>{subtitle}</Text> : null}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.surface, true: colors.primaryMuted }}
      thumbColor={value ? colors.primary : colors.textTertiary}
      ios_backgroundColor={colors.surface}
    />
  </View>
);

interface LinkRowProps {
  label: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
}

const LinkRow: React.FC<LinkRowProps> = ({ label, subtitle, icon, onPress, destructive }) => (
  <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={rowStyles.rowLeft}>
      {icon ? <Text style={rowStyles.icon}>{icon}</Text> : null}
      <View style={rowStyles.rowText}>
        <Text style={[rowStyles.rowLabel, destructive && { color: colors.error }]}>{label}</Text>
        {subtitle ? <Text style={rowStyles.rowSub}>{subtitle}</Text> : null}
      </View>
    </View>
    <Text style={[rowStyles.arrow, destructive && { color: colors.error }]}>›</Text>
  </TouchableOpacity>
);

const SectionLabel: React.FC<{ title: string }> = ({ title }) => (
  <Text style={sectionStyles.label}>{title}</Text>
);

const Divider: React.FC = () => <View style={sectionStyles.divider} />;

// ─── Main Screen ─────────────────────────────
export const SettingsScreen: React.FC = () => {
  const { reminderConfig, updateReminders, performReset } = useSettingsStore();
  const { profile } = useProfileStore();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Load saved API key on mount
  React.useEffect(() => {
    AsyncStorage.getItem('@cherish_anthropic_key').then((v) => {
      if (v) setApiKey(v);
    });
  }, []);

  const handleToggle = async (
    key: keyof typeof reminderConfig,
    value: boolean
  ) => {
    const next = { ...reminderConfig, [key]: value };
    await updateReminders({ [key]: value });
    await refreshAllReminders(profile, next);
  };

  const handleSaveApiKey = async () => {
    await AsyncStorage.setItem('@cherish_anthropic_key', apiKey.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your profiles, preferences, and saved items. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await performReset();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleRequestPermissions = async () => {
    const { requestNotificationPermissions } = await import('../services/notificationService');
    const granted = await requestNotificationPermissions();
    Alert.alert(
      granted ? 'Notifications enabled ✓' : 'Notifications blocked',
      granted
        ? 'You\'ll receive reminders for birthdays, anniversaries, and date nights.'
        : 'Please enable notifications for Cherish Her in your device Settings.'
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Settings" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── REMINDERS ── */}
        <SectionLabel title="REMINDERS" />
        <View style={styles.card}>
          <ToggleRow
            icon="🎂"
            label="Birthday Reminders"
            subtitle="30, 14, 7, 3, and 1 day before"
            value={reminderConfig.birthdayReminders}
            onToggle={(v) => handleToggle('birthdayReminders', v)}
          />
          <Divider />
          <ToggleRow
            icon="💕"
            label="Anniversary Reminders"
            subtitle="30, 14, 7, 3, and 1 day before"
            value={reminderConfig.anniversaryReminders}
            onToggle={(v) => handleToggle('anniversaryReminders', v)}
          />
          <Divider />
          <ToggleRow
            icon="🌙"
            label="Weekend Date Reminder"
            subtitle="Every Friday afternoon"
            value={reminderConfig.weekendDateReminder}
            onToggle={(v) => handleToggle('weekendDateReminder', v)}
          />
          <Divider />
          <ToggleRow
            icon="🎄"
            label="Holiday Gift Reminders"
            subtitle="Christmas, Valentine's Day, Mother's Day"
            value={reminderConfig.holidayGiftReminder}
            onToggle={(v) => handleToggle('holidayGiftReminder', v)}
          />
          <Divider />
          <LinkRow
            icon="🔔"
            label="Enable Notifications"
            subtitle="Grant permission to receive reminders"
            onPress={handleRequestPermissions}
          />
        </View>

        {/* ── AI SETTINGS ── */}
        <SectionLabel title="AI FEATURES" />
        <View style={styles.card}>
          <View style={styles.apiKeySection}>
            <Text style={styles.apiKeyTitle}>🤖 Anthropic API Key</Text>
            <Text style={styles.apiKeyDesc}>
              Adds AI-powered gift explanations and personalized insights. Optional — the app works fully without it.
            </Text>
            <View style={styles.apiKeyRow}>
              <TextInput
                style={styles.apiKeyInput}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-ant-..."
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!apiKeyVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.apiKeyToggle}
                onPress={() => setApiKeyVisible(!apiKeyVisible)}
              >
                <Text style={styles.apiKeyToggleText}>{apiKeyVisible ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.saveKeyBtn, apiKeySaved && styles.saveKeyBtnSuccess]}
              onPress={handleSaveApiKey}
            >
              <Text style={styles.saveKeyBtnText}>
                {apiKeySaved ? '✓ Saved' : 'Save Key'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}
            >
              <Text style={styles.apiKeyLink}>Get a free API key →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── DATA ── */}
        <SectionLabel title="DATA & PRIVACY" />
        <View style={styles.card}>
          <LinkRow
            icon="🗂"
            label="Your Data"
            subtitle="All data is stored only on this device"
            onPress={() => {}}
          />
          <Divider />
          <LinkRow
            icon="🗑"
            label="Reset All Data"
            subtitle="Delete everything and start fresh"
            onPress={handleReset}
            destructive
          />
        </View>

        {/* ── ABOUT ── */}
        <SectionLabel title="ABOUT" />
        <View style={styles.card}>
          <LinkRow
            icon="✨"
            label="About Cherish Her"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />
          <Divider />
          <LinkRow
            icon="⭐"
            label="Rate the App"
            subtitle="Leave a review on the App Store"
            onPress={() => {}}
          />
          <Divider />
          <LinkRow
            icon="💌"
            label="Send Feedback"
            subtitle="Help us make Cherish Her better"
            onPress={() => Linking.openURL('mailto:hello@cherishher.app')}
          />
          <Divider />
          <LinkRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://cherishher.app/privacy')}
          />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Made with love for the people you cherish.{'\n'}
          All data stays on your device, always.
        </Text>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['2xl'] },

  card: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },

  apiKeySection: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  apiKeyTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  apiKeyDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  apiKeyToggle: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  apiKeyToggleText: { fontSize: 16 },
  saveKeyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveKeyBtnSuccess: {
    backgroundColor: colors.success,
  },
  saveKeyBtnText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textInverse,
  },
  apiKeyLink: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    textAlign: 'center',
  },

  tagline: {
    fontFamily: typography.fonts.headingItalic,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  icon: { fontSize: 20, width: 24, textAlign: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
  },
  rowSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 22,
    color: colors.textTertiary,
  },
});

const sectionStyles = StyleSheet.create({
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.base + spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.base + 24 + spacing.md, // align with text, past icon
  },
});
