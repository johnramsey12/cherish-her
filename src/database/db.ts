import * as SQLite from 'expo-sqlite';
import {
  Profile,
  GiftPreferences,
  DatePreferences,
  SurveyState,
  ProductInteraction,
  DateInteraction,
  ReminderConfig,
} from '../types';

let _db: SQLite.SQLiteDatabase | null = null;

// ─────────────────────────────────────────────
//  DATABASE INITIALIZATION
// ─────────────────────────────────────────────

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('cherish_her.db');
  await initSchema(_db);
  return _db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync('PRAGMA journal_mode = WAL;');
  await db.runAsync('PRAGMA foreign_keys = ON;');

  // Profile
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY DEFAULT 'main',
      partner_name TEXT,
      birthday TEXT,
      anniversary_date TEXT,
      style_preferences TEXT DEFAULT '[]',
      jewelry_preferences TEXT DEFAULT '[]',
      favorite_colors TEXT DEFAULT '[]',
      favorite_clothing_brands TEXT DEFAULT '[]',
      favorite_stores TEXT DEFAULT '[]',
      interests TEXT DEFAULT '[]',
      hobbies TEXT DEFAULT '[]',
      food_preferences TEXT DEFAULT '[]',
      activity_preferences TEXT DEFAULT '[]',
      ring_size TEXT,
      wrist_size TEXT,
      clothing_sizes TEXT DEFAULT '{}',
      shoe_size TEXT,
      budget_sensitivity TEXT DEFAULT 'moderate',
      zip_code TEXT,
      travel_radius INTEGER DEFAULT 25,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Gift preferences
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS gift_preferences (
      id TEXT PRIMARY KEY DEFAULT 'main',
      luxury_vs_practical TEXT DEFAULT 'balanced',
      jewelry_preferences TEXT DEFAULT '[]',
      favorite_categories TEXT DEFAULT '[]',
      favorite_stores TEXT DEFAULT '[]',
      typical_budget REAL DEFAULT 100,
      favorite_brands TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Date preferences
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS date_preferences (
      id TEXT PRIMARY KEY DEFAULT 'main',
      favorite_foods TEXT DEFAULT '[]',
      favorite_restaurants TEXT DEFAULT '[]',
      activity_preferences TEXT DEFAULT '[]',
      indoor_outdoor TEXT DEFAULT 'both',
      travel_radius INTEGER DEFAULT 25,
      typical_date_budget REAL DEFAULT 100,
      zip_code TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Survey completion tracking
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS survey_state (
      id TEXT PRIMARY KEY DEFAULT 'main',
      profile_completed INTEGER DEFAULT 0,
      gift_completed INTEGER DEFAULT 0,
      date_completed INTEGER DEFAULT 0,
      profile_completed_at TEXT,
      gift_completed_at TEXT,
      date_completed_at TEXT
    );
  `);

  // Insert default survey state if not present
  await db.runAsync(`
    INSERT OR IGNORE INTO survey_state (id) VALUES ('main');
  `);

  // Product interaction history
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS product_interactions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      occasion TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create index for fast lookups
  await db.runAsync(`
    CREATE INDEX IF NOT EXISTS idx_product_interactions_product_id
    ON product_interactions(product_id);
  `);

  // Date idea interaction history
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS date_interactions (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      notes TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
  `);

  // Reminder config
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS reminder_config (
      id TEXT PRIMARY KEY DEFAULT 'main',
      birthday_reminders INTEGER DEFAULT 1,
      anniversary_reminders INTEGER DEFAULT 1,
      weekend_date_reminder INTEGER DEFAULT 1,
      seasonal_gift_reminder INTEGER DEFAULT 1,
      holiday_gift_reminder INTEGER DEFAULT 1
    );
  `);

  await db.runAsync(`
    INSERT OR IGNORE INTO reminder_config (id) VALUES ('main');
  `);

  // App metadata
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

// ─────────────────────────────────────────────
//  PROFILE CRUD
// ─────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM profile WHERE id = ?', ['main']);
  if (!row) return null;
  return dbRowToProfile(row);
}

export async function saveProfile(profile: Partial<Profile>): Promise<void> {
  const db = await getDatabase();
  const existing = await getProfile();

  if (!existing) {
    await db.runAsync(
      `INSERT INTO profile (
        id, partner_name, birthday, anniversary_date,
        style_preferences, jewelry_preferences, favorite_colors,
        favorite_clothing_brands, favorite_stores, interests, hobbies,
        food_preferences, activity_preferences, ring_size, wrist_size,
        clothing_sizes, shoe_size, budget_sensitivity, zip_code, travel_radius,
        created_at, updated_at
      ) VALUES (
        'main', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        datetime('now'), datetime('now')
      )`,
      [
        profile.partnerName ?? null,
        profile.birthday ?? null,
        profile.anniversaryDate ?? null,
        JSON.stringify(profile.stylePreferences ?? []),
        JSON.stringify(profile.jewelryPreferences ?? []),
        JSON.stringify(profile.favoriteColors ?? []),
        JSON.stringify(profile.favoriteClothingBrands ?? []),
        JSON.stringify(profile.favoriteStores ?? []),
        JSON.stringify(profile.interests ?? []),
        JSON.stringify(profile.hobbies ?? []),
        JSON.stringify(profile.foodPreferences ?? []),
        JSON.stringify(profile.activityPreferences ?? []),
        profile.ringSize ?? null,
        profile.wristSize ?? null,
        JSON.stringify(profile.clothingSizes ?? {}),
        profile.shoeSize ?? null,
        profile.budgetSensitivity ?? 'moderate',
        profile.zipCode ?? null,
        profile.travelRadius ?? 25,
      ]
    );
  } else {
    const merged = { ...existing, ...profile };
    await db.runAsync(
      `UPDATE profile SET
        partner_name = ?, birthday = ?, anniversary_date = ?,
        style_preferences = ?, jewelry_preferences = ?, favorite_colors = ?,
        favorite_clothing_brands = ?, favorite_stores = ?, interests = ?,
        hobbies = ?, food_preferences = ?, activity_preferences = ?,
        ring_size = ?, wrist_size = ?, clothing_sizes = ?, shoe_size = ?,
        budget_sensitivity = ?, zip_code = ?, travel_radius = ?,
        updated_at = datetime('now')
       WHERE id = 'main'`,
      [
        merged.partnerName ?? null,
        merged.birthday ?? null,
        merged.anniversaryDate ?? null,
        JSON.stringify(merged.stylePreferences ?? []),
        JSON.stringify(merged.jewelryPreferences ?? []),
        JSON.stringify(merged.favoriteColors ?? []),
        JSON.stringify(merged.favoriteClothingBrands ?? []),
        JSON.stringify(merged.favoriteStores ?? []),
        JSON.stringify(merged.interests ?? []),
        JSON.stringify(merged.hobbies ?? []),
        JSON.stringify(merged.foodPreferences ?? []),
        JSON.stringify(merged.activityPreferences ?? []),
        merged.ringSize ?? null,
        merged.wristSize ?? null,
        JSON.stringify(merged.clothingSizes ?? {}),
        merged.shoeSize ?? null,
        merged.budgetSensitivity ?? 'moderate',
        merged.zipCode ?? null,
        merged.travelRadius ?? 25,
      ]
    );
  }
}

function dbRowToProfile(row: any): Profile {
  return {
    id: row.id,
    partnerName: row.partner_name ?? undefined,
    birthday: row.birthday ?? undefined,
    anniversaryDate: row.anniversary_date ?? undefined,
    stylePreferences: JSON.parse(row.style_preferences || '[]'),
    jewelryPreferences: JSON.parse(row.jewelry_preferences || '[]'),
    favoriteColors: JSON.parse(row.favorite_colors || '[]'),
    favoriteClothingBrands: JSON.parse(row.favorite_clothing_brands || '[]'),
    favoriteStores: JSON.parse(row.favorite_stores || '[]'),
    interests: JSON.parse(row.interests || '[]'),
    hobbies: JSON.parse(row.hobbies || '[]'),
    foodPreferences: JSON.parse(row.food_preferences || '[]'),
    activityPreferences: JSON.parse(row.activity_preferences || '[]'),
    ringSize: row.ring_size ?? undefined,
    wristSize: row.wrist_size ?? undefined,
    clothingSizes: JSON.parse(row.clothing_sizes || '{}'),
    shoeSize: row.shoe_size ?? undefined,
    budgetSensitivity: row.budget_sensitivity || 'moderate',
    zipCode: row.zip_code ?? undefined,
    travelRadius: row.travel_radius ?? 25,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────
//  GIFT PREFERENCES
// ─────────────────────────────────────────────

export async function getGiftPreferences(): Promise<GiftPreferences | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM gift_preferences WHERE id = ?', ['main']);
  if (!row) return null;
  return {
    luxuryVsPractical: row.luxury_vs_practical || 'balanced',
    jewelryPreferences: JSON.parse(row.jewelry_preferences || '[]'),
    favoriteCategories: JSON.parse(row.favorite_categories || '[]'),
    favoriteStores: JSON.parse(row.favorite_stores || '[]'),
    typicalBudget: row.typical_budget || 100,
    favoriteBrands: JSON.parse(row.favorite_brands || '[]'),
  };
}

export async function saveGiftPreferences(prefs: Partial<GiftPreferences>): Promise<void> {
  const db = await getDatabase();
  const existing = await getGiftPreferences();
  const merged = { ...existing, ...prefs };

  await db.runAsync(
    `INSERT OR REPLACE INTO gift_preferences (
      id, luxury_vs_practical, jewelry_preferences, favorite_categories,
      favorite_stores, typical_budget, favorite_brands, updated_at
    ) VALUES ('main', ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      merged.luxuryVsPractical ?? 'balanced',
      JSON.stringify(merged.jewelryPreferences ?? []),
      JSON.stringify(merged.favoriteCategories ?? []),
      JSON.stringify(merged.favoriteStores ?? []),
      merged.typicalBudget ?? 100,
      JSON.stringify(merged.favoriteBrands ?? []),
    ]
  );
}

// ─────────────────────────────────────────────
//  DATE PREFERENCES
// ─────────────────────────────────────────────

export async function getDatePreferences(): Promise<DatePreferences | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM date_preferences WHERE id = ?', ['main']);
  if (!row) return null;
  return {
    favoriteFoods: JSON.parse(row.favorite_foods || '[]'),
    favoriteRestaurants: JSON.parse(row.favorite_restaurants || '[]'),
    activityPreferences: JSON.parse(row.activity_preferences || '[]'),
    indoorOutdoor: row.indoor_outdoor || 'both',
    travelRadius: row.travel_radius || 25,
    typicalDateBudget: row.typical_date_budget || 100,
    zipCode: row.zip_code || '',
  };
}

export async function saveDatePreferences(prefs: Partial<DatePreferences>): Promise<void> {
  const db = await getDatabase();
  const existing = await getDatePreferences();
  const merged = { ...existing, ...prefs };

  await db.runAsync(
    `INSERT OR REPLACE INTO date_preferences (
      id, favorite_foods, favorite_restaurants, activity_preferences,
      indoor_outdoor, travel_radius, typical_date_budget, zip_code, updated_at
    ) VALUES ('main', ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      JSON.stringify(merged.favoriteFoods ?? []),
      JSON.stringify(merged.favoriteRestaurants ?? []),
      JSON.stringify(merged.activityPreferences ?? []),
      merged.indoorOutdoor ?? 'both',
      merged.travelRadius ?? 25,
      merged.typicalDateBudget ?? 100,
      merged.zipCode ?? '',
    ]
  );
}

// ─────────────────────────────────────────────
//  SURVEY STATE
// ─────────────────────────────────────────────

export async function getSurveyState(): Promise<SurveyState> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM survey_state WHERE id = ?', ['main']);
  if (!row) {
    return { profileCompleted: false, giftCompleted: false, dateCompleted: false };
  }
  return {
    profileCompleted: !!row.profile_completed,
    giftCompleted: !!row.gift_completed,
    dateCompleted: !!row.date_completed,
    profileCompletedAt: row.profile_completed_at ?? undefined,
    giftCompletedAt: row.gift_completed_at ?? undefined,
    dateCompletedAt: row.date_completed_at ?? undefined,
  };
}

export async function markSurveyCompleted(type: 'profile' | 'gift' | 'date'): Promise<void> {
  const db = await getDatabase();
  const col = type === 'profile' ? 'profile' : type === 'gift' ? 'gift' : 'date';
  await db.runAsync(
    `UPDATE survey_state SET ${col}_completed = 1, ${col}_completed_at = datetime('now') WHERE id = 'main'`
  );
}

export async function resetSurveyState(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE survey_state SET
      profile_completed = 0, gift_completed = 0, date_completed = 0,
      profile_completed_at = NULL, gift_completed_at = NULL, date_completed_at = NULL
     WHERE id = 'main'`
  );
}

// ─────────────────────────────────────────────
//  PRODUCT INTERACTIONS
// ─────────────────────────────────────────────

export async function recordProductInteraction(
  productId: string,
  type: ProductInteraction['type'],
  occasion?: string
): Promise<void> {
  const db = await getDatabase();
  const id = `${productId}_${type}_${Date.now()}`;
  await db.runAsync(
    `INSERT OR REPLACE INTO product_interactions (id, product_id, interaction_type, occasion, timestamp)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [id, productId, type, occasion ?? null]
  );
}

export async function getProductInteractions(): Promise<ProductInteraction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM product_interactions ORDER BY timestamp DESC LIMIT 500'
  );
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    type: r.interaction_type,
    timestamp: r.timestamp,
    occasion: r.occasion ?? undefined,
  }));
}

export async function getInteractedProductIds(type?: string): Promise<string[]> {
  const db = await getDatabase();
  if (type) {
    const rows = await db.getAllAsync<any>(
      'SELECT DISTINCT product_id FROM product_interactions WHERE interaction_type = ?',
      [type]
    );
    return rows.map((r) => r.product_id);
  }
  const rows = await db.getAllAsync<any>(
    'SELECT DISTINCT product_id FROM product_interactions'
  );
  return rows.map((r) => r.product_id);
}

// ─────────────────────────────────────────────
//  DATE INTERACTIONS
// ─────────────────────────────────────────────

export async function recordDateInteraction(
  ideaId: string,
  type: DateInteraction['type'],
  notes?: string
): Promise<void> {
  const db = await getDatabase();
  const id = `${ideaId}_${type}_${Date.now()}`;
  await db.runAsync(
    `INSERT OR REPLACE INTO date_interactions (id, idea_id, interaction_type, notes, timestamp)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [id, ideaId, type, notes ?? null]
  );
}

// ─────────────────────────────────────────────
//  REMINDER CONFIG
// ─────────────────────────────────────────────

export async function getReminderConfig(): Promise<ReminderConfig> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM reminder_config WHERE id = ?', ['main']);
  if (!row) {
    return {
      birthdayReminders: true,
      anniversaryReminders: true,
      weekendDateReminder: true,
      seasonalGiftReminder: true,
      holidayGiftReminder: true,
    };
  }
  return {
    birthdayReminders: !!row.birthday_reminders,
    anniversaryReminders: !!row.anniversary_reminders,
    weekendDateReminder: !!row.weekend_date_reminder,
    seasonalGiftReminder: !!row.seasonal_gift_reminder,
    holidayGiftReminder: !!row.holiday_gift_reminder,
  };
}

export async function saveReminderConfig(config: Partial<ReminderConfig>): Promise<void> {
  const db = await getDatabase();
  const existing = await getReminderConfig();
  const merged = { ...existing, ...config };
  await db.runAsync(
    `UPDATE reminder_config SET
      birthday_reminders = ?, anniversary_reminders = ?,
      weekend_date_reminder = ?, seasonal_gift_reminder = ?,
      holiday_gift_reminder = ?
     WHERE id = 'main'`,
    [
      merged.birthdayReminders ? 1 : 0,
      merged.anniversaryReminders ? 1 : 0,
      merged.weekendDateReminder ? 1 : 0,
      merged.seasonalGiftReminder ? 1 : 0,
      merged.holidayGiftReminder ? 1 : 0,
    ]
  );
}

// ─────────────────────────────────────────────
//  APP META
// ─────────────────────────────────────────────

export async function getAppMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT value FROM app_meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setAppMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// ─────────────────────────────────────────────
//  RESET ALL DATA
// ─────────────────────────────────────────────

export async function resetAllData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM profile');
  await db.runAsync('DELETE FROM gift_preferences');
  await db.runAsync('DELETE FROM date_preferences');
  await db.runAsync('DELETE FROM product_interactions');
  await db.runAsync('DELETE FROM date_interactions');
  await db.runAsync('DELETE FROM app_meta');
  await db.runAsync(
    `UPDATE survey_state SET
      profile_completed = 0, gift_completed = 0, date_completed = 0,
      profile_completed_at = NULL, gift_completed_at = NULL, date_completed_at = NULL
     WHERE id = 'main'`
  );
  await db.runAsync(
    `UPDATE reminder_config SET
      birthday_reminders = 1, anniversary_reminders = 1,
      weekend_date_reminder = 1, seasonal_gift_reminder = 1,
      holiday_gift_reminder = 1
     WHERE id = 'main'`
  );
}
