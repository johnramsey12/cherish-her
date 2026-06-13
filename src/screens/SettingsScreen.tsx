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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radius } from '../constants/theme';
import { useSettingsStore, useProfileStore } from '../stores';
import { ScreenHeader } from '../components/common/index';
import { refreshAllReminders } from '../services/notificationService';

const SERVER_URL = 'https://cherish-her-server-production.up.railway.app';

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

export const SettingsScreen: React.FC = () => {
  const { reminderConfig, updateReminders, performReset } = useSettingsStore();
  const { profile } = useProfileStore();

  // Creator code state
  const [creatorCode, setCreatorCode]         = useState('');
  const [codeInput, setCodeInput]             = useState('');
  const [creatorName, setCreatorName]         = useState('');
  const [codeVerifying, setCodeVerifying]     = useState(false);
  const [codeError, setCodeError]             = useState('');

  // Load saved creator code on mount
  React.useEffect(() => {
    AsyncStorage.getItem('@cherish_creator_code').then(code => {
      if (code) {
        setCreatorCode(code);
        setCodeInput(code);
      }
    });
    AsyncStorage.getItem('@cherish_creator_name').then(name => {
      if (name) setCreatorName(name);
    });
  }, []);

  const handleVerifyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCodeVerifying(true);
    setCodeError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/creators/verify/${code}`);
      if (res.ok) {
        const data = await res.json() as { valid: boolean; name: string };
        if (data.valid) {
          await AsyncStorage.setItem('@cherish_creator_code', code);
          await AsyncStorage.setItem('@cherish_creator_name', data.name);
          setCreatorCode(code);
          setCreatorName(data.name);
          setCodeError('');
        } else {
          setCodeError('Code not found. Check the code and try again.');
        }
      } else {
        setCodeError('Code not found. Check the code and try again.');
      }
    } catch {
      setCodeError('Could not connect to server. Try again.');
    } finally {
      setCodeVerifying(false);
    }
  };

  const handleClearCode = async () => {
    await AsyncStorage.removeItem('@cherish_creator_code');
    await AsyncStorage.removeItem('@cherish_creator_name');
    setCreatorCode('');
    setCreatorName('');
    setCodeInput('');
    setCodeError('');
  };

  const handleToggle = async (key: keyof typeof reminderConfig, value: boolean) => {
    const next = { ...reminderConfig, [key]: value };
    await updateReminders({ [key]: value });
    await refreshAllReminders(profile, next);
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

        {/* ── CREATOR PARTNERSHIP ── */}
        <SectionLabel title="CREATOR PARTNERSHIP" />
        <View style={styles.card}>
          <View style={styles.creatorSection}>

            {creatorCode ? (
              /* Active code state */
              <View style={styles.codeActive}>
                <View style={styles.codeActiveBadge}>
                  <Text style={styles.codeActiveIcon}>✦</Text>
                  <View style={styles.codeActiveText}>
                    <Text style={styles.codeActiveName}>{creatorName || creatorCode}</Text>
                    <Text style={styles.codeActiveSub}>Creator code active · {creatorCode}</Text>
                  </View>
                </View>
                <Text style={styles.codeActiveDesc}>
                  Purchases made through Cherish Her support this creator.
                </Text>
                <TouchableOpacity style={styles.clearCodeBtn} onPress={handleClearCode}>
                  <Text style={styles.clearCodeText}>Remove code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Code entry state */
              <View>
                <Text style={styles.creatorTitle}>Have a creator code?</Text>
                <Text style={styles.creatorDesc}>
                  Enter a code from your favorite creator. When you shop through the app, they earn a commission at no extra cost to you.
                </Text>
                <View style={styles.codeRow}>
                  <TextInput
                    style={styles.codeInput}
                    value={codeInput}
                    onChangeText={t => { setCodeInput(t.toUpperCase()); setCodeError(''); }}
                    placeholder="EMMA"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                  />
                  <TouchableOpacity
                    style={[styles.verifyBtn, (!codeInput.trim() || codeVerifying) && styles.verifyBtnDisabled]}
                    onPress={handleVerifyCode}
                    disabled={!codeInput.trim() || codeVerifying}
                    activeOpacity={0.7}
                  >
                    {codeVerifying
                      ? <ActivityIndicator size="small" color={colors.background} />
                      : <Text style={styles.verifyBtnText}>Apply</Text>
                    }
                  </TouchableOpacity>
                </View>
                {codeError ? (
                  <Text style={styles.codeError}>{codeError}</Text>
                ) : null}
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://johnramsey12.github.io/cherish-her/creators.html')}
                >
                  <Text style={styles.creatorLink}>Want your own creator code? Apply here →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

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

        {/* ── DATA & PRIVACY ── */}
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
            onPress={() => Linking.openURL('https://johnramsey12.github.io/cherish-her/privacy-policy.html')}
          />
        </View>

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

  // Creator section
  creatorSection: {
    padding: spacing.base,
  },
  creatorTitle: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  creatorDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  codeInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  verifyBtn: {
    height: 44,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  verifyBtnDisabled: {
    opacity: 0.4,
  },
  verifyBtnText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.background,
  },
  codeError: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  creatorLink: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  // Active code state
  codeActive: {
    gap: spacing.sm,
  },
  codeActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  codeActiveIcon: {
    fontSize: 22,
    color: colors.primary,
  },
  codeActiveText: {
    flex: 1,
  },
  codeActiveName: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    color: colors.primary,
  },
  codeActiveSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  codeActiveDesc: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  clearCodeBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearCodeText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
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
    marginLeft: spacing.base + 24 + spacing.md,
  },
});