import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import { colors, typography } from '../constants/theme';

import { HomeScreen }      from '../screens/HomeScreen';
import { GiftsScreen }     from '../screens/GiftsScreen';
import { DateIdeasScreen } from '../screens/DateIdeasScreen';
import { ProfileScreen }   from '../screens/ProfileScreen';
import { SettingsScreen }  from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, { active: string; inactive: string }> = {
  Home:      { active: '✦', inactive: '✧' },
  Gifts:     { active: '🎁', inactive: '🎁' },
  DateIdeas: { active: '💕', inactive: '🤍' },
  Profile:   { active: '👤', inactive: '👤' },
  Settings:  { active: '⚙️', inactive: '⚙️' },
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {focused ? icons.active : icons.inactive}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Gifts"     component={GiftsScreen}     options={{ tabBarLabel: 'Gifts' }} />
      <Tab.Screen name="DateIdeas" component={DateIdeasScreen} options={{ tabBarLabel: 'Dates' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ tabBarLabel: 'Profile' }} />
      <Tab.Screen name="Settings"  component={SettingsScreen}  options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBarBorder,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 62,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  tabLabel: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconActive: {
    // tint applied via tabBarActiveTintColor
  },
});
