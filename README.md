# Cherish Her 💕

A local-first AI-assisted app to help you choose gifts, plan dates, and discover restaurants and activities for your partner. All data stays on-device — no account, no cloud sync.

---

## Features

- **Gift Recommendations** — Scored product feed with occasion filters, sort options, and affiliate links
- **Date Ideas** — Curated restaurant + activity combinations matched to her preferences
- **Smart Surveys** — Onboarding flow that learns her style, your budget, and your location
- **Emergency Mode** — Instant top picks when you're in a pinch
- **Reminders** — Birthday, anniversary, weekend date night, and holiday notifications
- **AI Explanations** — Optional Anthropic API integration for why-she'll-love-it write-ups

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native + Expo ~51 |
| Navigation | React Navigation v6 |
| State | Zustand v4 |
| Database | expo-sqlite v14 (async) |
| Fonts | Cormorant Garamond + Outfit |
| Notifications | expo-notifications |
| AI (optional) | Anthropic Claude API |

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- iOS Simulator (Xcode) or Android Emulator / physical device with Expo Go

### 2. Install

```bash
git clone https://github.com/yourname/cherish-her.git
cd cherish-her
npm install
```

### 3. Configure Environment (optional)

To enable AI-powered gift explanations, add your Anthropic API key:

**Option A — `app.json` (build-time)**

```json
{
  "expo": {
    "extra": {
      "anthropicApiKey": "sk-ant-your-key-here"
    }
  }
}
```

**Option B — Settings screen (runtime)**

Open the app → Settings → AI Features → paste your key and tap Save. The key is stored encrypted in AsyncStorage on-device only.

Get a free API key at [console.anthropic.com](https://console.anthropic.com/settings/keys).

### 4. Run

```bash
# Start Expo dev server
npm start

# Or target a specific platform
npm run ios
npm run android
```

---

## Project Structure

```
cherish-her/
├── App.tsx                          # Root entry — fonts, DB init, navigation
├── app.json                         # Expo config
├── src/
│   ├── types/index.ts               # All TypeScript types
│   ├── constants/theme.ts           # Colors, typography, spacing, radius
│   ├── database/db.ts               # SQLite schema + CRUD (expo-sqlite v14)
│   ├── stores/index.ts              # Zustand stores (profile, gifts, dates, etc.)
│   ├── engine/
│   │   ├── giftEngine.ts            # Scoring algorithm + emergency gifts
│   │   └── dateEngine.ts           # Date idea generation + emergency dates
│   ├── data/
│   │   ├── products.ts              # 35+ curated products with affiliate links
│   │   └── restaurants.ts          # 12 restaurants + 20 activities
│   ├── services/
│   │   ├── aiService.ts             # Anthropic API calls (with fallback)
│   │   └── notificationService.ts  # Push notification scheduling
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Native stack root
│   │   └── TabNavigator.tsx        # 5-tab bottom nav
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Hero, quick actions, emergency button
│   │   ├── GiftsScreen.tsx          # Product feed with filter/sort
│   │   ├── DateIdeasScreen.tsx      # 3-tab: All/Restaurants/Activities
│   │   ├── ProfileScreen.tsx        # Inline-editable partner profile
│   │   └── SettingsScreen.tsx      # Reminders, AI key, reset, about
│   └── components/
│       ├── common/                  # Button, Card, Badge, LoadingView, EmptyState, ScreenHeader
│       ├── gifts/                   # ProductCard, ProductDetailModal, FilterBar
│       ├── dates/                   # DateIdeaCard
│       ├── emergency/               # EmergencyModal
│       └── surveys/                 # SurveyModal, ProfileSurveySteps, GiftSurveySteps, DateSurveySteps
```

---

## Recommendation Engine

### Gift Scoring (giftEngine.ts)

| Factor | Weight |
|---|---|
| Style match | 28% |
| Budget fit | 25% |
| Occasion relevance | 22% |
| Category preference | 15% |
| Popularity | 6% |
| Interaction history | 4% |

~15% of the feed is **Discovery products** — trending picks, hidden gems, luxury upgrades, and budget alternatives injected at regular intervals.

### Date Scoring (dateEngine.ts)

Restaurants and activities are independently scored on cuisine preference, price range, indoor/outdoor preference, romantic tags, and activity category match. Combined date ideas pair top-scoring restaurants with matching activities.

---

## Affiliate Links

Products in `src/data/products.ts` use placeholder affiliate URLs. Before deploying:

1. Join the affiliate programs (Amazon Associates, CJ, Impact, Rakuten, ShareASale)
2. Replace `affiliateLink` values with your tracking URLs
3. Update `merchantName` and `affiliateNetwork` accordingly

The app earns a commission when the user taps **Shop on [Merchant]** in the product detail modal.

---

## Adding Products / Restaurants / Activities

**Products** — add to `src/data/products.ts`:

```ts
{
  id: 'prod_unique_id',
  name: 'Product Name',
  description: 'A compelling description.',
  category: 'skincare',
  price: 75,
  priceRange: 'moderate',
  styleTags: ['classic', 'luxury'],
  occasionTags: ['birthday', 'just_because'],
  imageUrl: 'https://...',
  affiliateLink: 'https://...',
  affiliateNetwork: 'amazon',
  merchantName: 'Merchant',
  popularityScore: 80,
  brand: 'Brand Name',
  rating: 4.7,
  reviewCount: 1200,
}
```

**Restaurants / Activities** — add to `src/data/restaurants.ts` in the `RESTAURANTS` or `ACTIVITIES` array.

---

## Notifications

Notifications are scheduled locally via `expo-notifications`. No server needed. The `refreshAllReminders()` function is called on each app launch and after settings changes. It:

1. Cancels all existing scheduled notifications
2. Re-schedules birthday, anniversary, weekend, and holiday reminders
3. Does nothing if notification permission hasn't been granted

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

Make sure to:
- Add real icon assets to `assets/`
- Set your real bundle identifier in `app.json`
- Add your Anthropic API key to `app.json` `extra` section (if using AI features)
- Replace all affiliate links in `src/data/products.ts`

---

## Design System

**Color Palette — Luxury Dark Romance**

| Token | Value | Use |
|---|---|---|
| `background` | `#0D0C0D` | Screen backgrounds |
| `primary` | `#C8956A` | Rose gold accent |
| `rose` | `#8B3A52` | Secondary accent |
| `gold` | `#D4AF6B` | Gold fleck |
| `textPrimary` | `#FAF8F5` | Headings & body |
| `textSecondary` | `#A89E98` | Supporting text |

**Typography**

- Headings: *Cormorant Garamond* (serif, elegant)
- Body: *Outfit* (sans-serif, readable)

---

## License

MIT — free to use, modify, and monetize.
