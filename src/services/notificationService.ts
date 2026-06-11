import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Profile } from '../types';

// ─────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Cherish Her Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C8956A',
    });
  }

  return true;
}

// ─────────────────────────────────────────────
//  CANCEL ALL EXISTING
// ─────────────────────────────────────────────

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─────────────────────────────────────────────
//  BIRTHDAY REMINDERS
// ─────────────────────────────────────────────

const BIRTHDAY_DAYS_BEFORE = [30, 14, 7, 3, 1];

export async function scheduleBirthdayReminders(
  birthday: string,
  partnerName?: string
): Promise<void> {
  const name = partnerName ?? 'her';
  const birthdayDate = new Date(birthday);
  const now = new Date();

  // Calculate this year's birthday
  let thisYearBirthday = new Date(now.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate());
  if (thisYearBirthday < now) {
    // Birthday passed this year, schedule for next year
    thisYearBirthday = new Date(now.getFullYear() + 1, birthdayDate.getMonth(), birthdayDate.getDate());
  }

  const titles: Record<number, string> = {
    30: `${name.charAt(0).toUpperCase() + name.slice(1)}'s birthday is in 30 days! 🎂`,
    14: `2 weeks until ${name}'s birthday! Start planning now.`,
    7: `${name}'s birthday is ONE WEEK away! 🎁`,
    3: `3 days until ${name}'s birthday — have you got her gift? 💕`,
    1: `Tomorrow is ${name}'s birthday! Don't forget to celebrate her. 🥳`,
  };

  for (const daysBefore of BIRTHDAY_DAYS_BEFORE) {
    const triggerDate = new Date(thisYearBirthday);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(10, 0, 0, 0);

    if (triggerDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💕 Cherish Her',
        body: titles[daysBefore],
        data: { type: 'birthday', daysBefore },
        sound: true,
      },
      trigger: {
        date: triggerDate,
        channelId: 'reminders',
      },
    });
  }
}

// ─────────────────────────────────────────────
//  ANNIVERSARY REMINDERS
// ─────────────────────────────────────────────

const ANNIVERSARY_DAYS_BEFORE = [30, 14, 7, 3, 1];

export async function scheduleAnniversaryReminders(
  anniversaryDate: string,
  partnerName?: string
): Promise<void> {
  const name = partnerName ?? 'her';
  const annivDate = new Date(anniversaryDate);
  const now = new Date();

  let thisYearAnniversary = new Date(
    now.getFullYear(),
    annivDate.getMonth(),
    annivDate.getDate()
  );
  if (thisYearAnniversary < now) {
    thisYearAnniversary = new Date(
      now.getFullYear() + 1,
      annivDate.getMonth(),
      annivDate.getDate()
    );
  }

  const titles: Record<number, string> = {
    30: `Your anniversary is in 30 days! Start planning something special. 💕`,
    14: `2 weeks until your anniversary — don't leave it to the last minute!`,
    7: `Your anniversary is ONE WEEK away! 💍`,
    3: `3 days until your anniversary — book that restaurant now! 🌹`,
    1: `Tomorrow is your anniversary! Make it unforgettable. ✨`,
  };

  for (const daysBefore of ANNIVERSARY_DAYS_BEFORE) {
    const triggerDate = new Date(thisYearAnniversary);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 30, 0, 0);

    if (triggerDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💕 Cherish Her',
        body: titles[daysBefore],
        data: { type: 'anniversary', daysBefore },
        sound: true,
      },
      trigger: {
        date: triggerDate,
        channelId: 'reminders',
      },
    });
  }
}

// ─────────────────────────────────────────────
//  WEEKEND DATE REMINDER
// ─────────────────────────────────────────────

export async function scheduleWeekendDateReminders(): Promise<void> {
  // Every Friday at 6 PM — suggest a date idea
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💕 Date Night Idea',
      body: 'The weekend is coming! Open Cherish Her for a date night idea she\'ll love.',
      data: { type: 'weekend_date' },
      sound: true,
    },
    trigger: {
      weekday: 6,  // Friday (1=Sunday, 6=Friday in Expo)
      hour: 18,
      minute: 0,
      repeats: true,
      channelId: 'reminders',
    },
  });
}

// ─────────────────────────────────────────────
//  SEASONAL / HOLIDAY REMINDERS
// ─────────────────────────────────────────────

export async function scheduleHolidayReminders(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();

  const holidays = [
    {
      date: new Date(year, 1, 1, 9, 0),   // Feb 1 — Valentine's warning
      body: "Valentine's Day is 2 weeks away! Find a thoughtful gift now. ❤️",
    },
    {
      date: new Date(year, 11, 1, 9, 0),  // Dec 1 — Christmas shopping
      body: "December is here! Start Christmas shopping early for the best gifts. 🎄",
    },
    {
      date: new Date(year, 3, 15, 9, 0),  // Apr 15 — Mother's Day warning
      body: "Mother's Day is coming up! Plan something special for her. 🌹",
    },
  ];

  for (const holiday of holidays) {
    if (holiday.date <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💕 Cherish Her',
        body: holiday.body,
        data: { type: 'holiday' },
        sound: true,
      },
      trigger: {
        date: holiday.date,
        channelId: 'reminders',
      },
    });
  }
}

// ─────────────────────────────────────────────
//  REFRESH ALL REMINDERS
// ─────────────────────────────────────────────

export async function refreshAllReminders(
  profile: Profile | null,
  config: {
    birthdayReminders: boolean;
    anniversaryReminders: boolean;
    weekendDateReminder: boolean;
    holidayGiftReminder: boolean;
  }
): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await cancelAllScheduledNotifications();

  if (config.birthdayReminders && profile?.birthday) {
    await scheduleBirthdayReminders(profile.birthday, profile.partnerName);
  }

  if (config.anniversaryReminders && profile?.anniversaryDate) {
    await scheduleAnniversaryReminders(profile.anniversaryDate, profile.partnerName);
  }

  if (config.weekendDateReminder) {
    await scheduleWeekendDateReminders();
  }

  if (config.holidayGiftReminder) {
    await scheduleHolidayReminders();
  }
}
