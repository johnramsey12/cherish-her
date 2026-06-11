import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';

import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
} from '@expo-google-fonts/outfit';

import { getDatabase } from './src/database/db';
import { initializeAllStores } from './src/stores';
import { refreshAllReminders } from './src/services/notificationService';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/constants/theme';

// Dark navigation theme
const DARK_THEME = {
  dark: true,
  colors: {
    primary:       colors.primary,
    background:    colors.background,
    card:          colors.backgroundSecondary,
    text:          colors.textPrimary,
    border:        colors.border,
    notification:  colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '700' },
    heavy:   { fontFamily: 'System', fontWeight: '800' },
  },
};

// ─────────────────────────────────────────────
//  SPLASH / LOADING SCREEN
// ─────────────────────────────────────────────
const SplashScreen: React.FC<{ message?: string }> = ({ message }) => (
  <View style={splash.container}>
    <StatusBar barStyle="light-content" backgroundColor={colors.background} />
    <Text style={splash.logo}>✦</Text>
    <Text style={splash.name}>Cherish Her</Text>
    {message ? <Text style={splash.message}>{message}</Text> : null}
  </View>
);

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 40,
    color: colors.primary,
    marginBottom: 4,
  },
  name: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  message: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 12,
  },
});

// ─────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  const bootstrap = useCallback(async () => {
    try {
      // 1. Initialize database
      await getDatabase();

      // 2. Load all Zustand stores from DB
      await initializeAllStores();

      // 3. Load saved products into gift store
      const saved = await AsyncStorage.getItem('@cherish_saved_products');
      if (saved) {
        try {
          const { useGiftStore } = await import('./src/stores');
          const ids: string[] = JSON.parse(saved);
          if (ids.length) {
            useGiftStore.setState({ savedProducts: ids });
          }
        } catch {}
      }

      // 4. Schedule reminders in the background (non-blocking)
      const { useProfileStore, useSettingsStore } = await import('./src/stores');
      const profile = useProfileStore.getState().profile;
      const { reminderConfig } = useSettingsStore.getState();
      refreshAllReminders(profile, reminderConfig).catch(() => {});

      setAppReady(true);
    } catch (e) {
      console.error('Bootstrap error:', e);
      setInitError('Failed to start. Please restart the app.');
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      bootstrap();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <SplashScreen message="Loading fonts…" />;
  }

  if (!appReady) {
    if (initError) {
      return <SplashScreen message={initError} />;
    }
    return <SplashScreen message="Setting up your experience…" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <NavigationContainer theme={DARK_THEME}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
