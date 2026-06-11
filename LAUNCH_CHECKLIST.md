# Cherish Her — App Store Launch Checklist
# Work through these phases in order. Each step has an estimated time.

## ─────────────────────────────────────────────
## PHASE 1: ACCOUNTS & TOOLS  (~45 min, today)
## ─────────────────────────────────────────────

### 1.1 Apple Developer Account
[ ] Go to: https://developer.apple.com/programs/enroll/
[ ] Sign in with your Apple ID (or create one)
[ ] Enroll as Individual (not Organization unless you have a business entity)
[ ] Pay $99/year fee — card required
[ ] Wait for approval email (usually instant, sometimes 24-48 hrs)
[ ] Note your Apple Team ID (visible in Certificates, IDs & Profiles)

### 1.2 Expo / EAS Account
[ ] Go to: https://expo.dev/signup
[ ] Create free account (username will appear in app.json → replace REPLACE_WITH_YOUR_EXPO_USERNAME)
[ ] Install EAS CLI:
      npm install -g eas-cli
[ ] Log in:
      eas login
[ ] Link your project:
      cd /path/to/cherish-her
      eas init
[ ] Copy the Project ID shown → paste into app.json at:
      "extra" → "eas" → "projectId"
      "updates" → "url" (replace the UUID part)

### 1.3 GitHub Repository (for Privacy Policy hosting)
[ ] Create a new public GitHub repository named: cherish-her
[ ] Push the project:
      cd /path/to/cherish-her
      git init
      git add .
      git commit -m "Initial commit"
      git branch -M main
      git remote add origin https://github.com/YOUR_USERNAME/cherish-her.git
      git push -u origin main
[ ] Go to repo Settings → Pages
[ ] Set Source: "Deploy from a branch"
[ ] Set Branch: main, Folder: /docs
[ ] Save — your privacy policy will be live at:
      https://YOUR_USERNAME.github.io/cherish-her/privacy-policy.html
[ ] Update APP_STORE_LISTING.md with your actual GitHub username
[ ] Update app.json privacy policy URL if you add it there


## ─────────────────────────────────────────────
## PHASE 2: APP ASSETS  (~2 hrs)
## ─────────────────────────────────────────────

### 2.1 App Icon (CRITICAL — blocks build without this)
Requirements:
  - 1024 × 1024 pixels
  - PNG format
  - NO transparency / alpha channel
  - No rounded corners (iOS adds them automatically)
  - Filename: assets/icon.png

Design guidance (matches app's luxury dark aesthetic):
  - Background: #0D0C0D (near-black)
  - Foreground: Rose gold "C" letterform or heart motif in #C8956A
  - Add subtle gold sparkle accent
  - Keep it minimal — icons are tiny at 60px

Tools:
  - Figma (free): design at 1024×1024, export as PNG
  - Canva (free): use their app icon template
  - Adobe Express (free tier available)

After creating icon.png (1024×1024):
[ ] Place at: assets/icon.png
[ ] Create a 1024×1024 version with extra padding (20%) for Android adaptive icon
[ ] Place at: assets/adaptive-icon.png  (foreground only, transparent bg)
[ ] Create a 64×64 version: assets/notification-icon.png (white icon, transparent bg)
[ ] Create a 1242×2688 splash image: assets/splash.png
    (just the logo/wordmark centered on #0D0C0D background)

### 2.2 Screenshots  (~1 hr — do after TestFlight build)
See APP_STORE_LISTING.md for exact specifications.
Easiest approach: run app in Xcode Simulator (iPhone 14 Pro Max) and take screenshots
with Cmd+S, then add text overlays in Figma/Canva.


## ─────────────────────────────────────────────
## PHASE 3: AFFILIATE LINKS  (~2 hrs, important for monetization)
## ─────────────────────────────────────────────

The current products.ts has placeholder affiliate URLs. Before launch:

[ ] Join Amazon Associates: https://affiliate-program.amazon.com/
    (approval usually same-day; need a website — use your GitHub Pages URL)
[ ] Join Rakuten Advertising: https://rakuten.com/us/
    (for Nordstrom, Macy's, Sephora, etc.)
[ ] Optional — CJ Affiliate: https://cj.com
    (for brands not on Amazon/Rakuten)

[ ] Once approved, replace affiliate URLs in:
    src/data/products.ts — each product's affiliateLink field
    
    Amazon format: https://www.amazon.com/dp/ASIN?tag=YOUR-TAG-20
    Rakuten format: https://click.linksynergy.com/...
    
[ ] Update affiliateNetwork field to match: 'amazon' | 'rakuten' | 'cj' | 'direct'


## ─────────────────────────────────────────────
## PHASE 4: PRODUCTION CONFIG  (~30 min)
## ─────────────────────────────────────────────

[ ] Open eas.json and replace:
    - REPLACE_WITH_YOUR_APPLE_ID_EMAIL → your Apple ID email
    - REPLACE_WITH_APPLE_TEAM_ID → from developer.apple.com → Membership
    (Leave ascAppId blank for now — you'll get it from App Store Connect later)

[ ] If you have an Anthropic API key for the AI features:
    Run: eas secret:create --scope project --name ANTHROPIC_API_KEY --value sk-ant-...
    Then in eas.json production env: "ANTHROPIC_API_KEY": "$ANTHROPIC_API_KEY"
    
[ ] Add expo-build-properties to package.json dependencies:
    npm install expo-build-properties


## ─────────────────────────────────────────────
## PHASE 5: TESTFLIGHT BUILD  (~30 min setup, ~25 min build time)
## ─────────────────────────────────────────────

[ ] Make sure you have at least placeholder assets in assets/ folder
    (EAS will fail if icon.png doesn't exist)

[ ] Run the preview build (goes to TestFlight):
    eas build --platform ios --profile preview

    This will:
    - Ask you to log into Apple Developer (first time)
    - Automatically create provisioning profiles and certificates
    - Build in EAS cloud (~20-25 min)
    - Upload to TestFlight automatically

[ ] Go to: https://appstoreconnect.apple.com
    - My Apps → + New App
    - Platform: iOS
    - Name: Cherish Her
    - Primary Language: English (U.S.)
    - Bundle ID: com.cherishher.app (should appear in dropdown after build)
    - SKU: CHERISH-HER-001
    
[ ] Note the App ID number — paste into eas.json → submit → production → ios → ascAppId

[ ] In App Store Connect → TestFlight:
    - Your build should appear within a few minutes of EAS completing
    - Add yourself as an internal tester
    - Install TestFlight on your iPhone: https://apps.apple.com/app/testflight/id899247664
    - Open invitation email → install the app
    
[ ] TEST EVERYTHING on a real device:
    [ ] Complete Profile Survey end to end
    [ ] Browse gifts, save a few
    [ ] Open product detail, tap Shop button (should open external browser)
    [ ] Check Date Ideas tab
    [ ] Set reminders in Settings, verify notification fires
    [ ] Test Emergency Mode
    [ ] Test Settings → Reset All Data


## ─────────────────────────────────────────────
## PHASE 6: APP STORE CONNECT SETUP  (~1-2 hrs)
## ─────────────────────────────────────────────

Go to https://appstoreconnect.apple.com → Your App → App Store tab

[ ] App Information:
    - Name: Cherish Her
    - Subtitle: Gift & Date Ideas for Her
    - Privacy Policy URL: https://YOUR_USERNAME.github.io/cherish-her/privacy-policy.html
    - Category: Lifestyle / Shopping

[ ] Pricing and Availability:
    - Price: Free
    - Availability: All territories (or select specific ones)

[ ] App Privacy:
    - Data Not Collected (our app collects nothing on servers)
    - Under "Data Collection" answer NO to all categories
    - This gets you the "Privacy: Data Not Linked to You" badge — a big selling point!

[ ] Version Information (1.0 Submission):
    - Screenshots: upload 6.7" and 6.5" screenshots
    - Promotional Text: (from APP_STORE_LISTING.md)
    - Description: (from APP_STORE_LISTING.md)
    - Keywords: (from APP_STORE_LISTING.md)
    - Support URL: your GitHub Pages URL
    - What's New: (from APP_STORE_LISTING.md)

[ ] Build: select the TestFlight build you tested

[ ] Age Rating: complete questionnaire
    - Select "Alcohol, Tobacco, or Drug References: Infrequent/Mild" (wine gifts)
    - Everything else: None
    - Final rating should be 12+

[ ] App Review Information:
    - Demo Account: Not required (check "No")
    - Notes: paste from APP_STORE_LISTING.md → App Review Notes section
    - Attachment: optional — can attach a short screen recording


## ─────────────────────────────────────────────
## PHASE 7: PRODUCTION BUILD & SUBMIT  (~30 min)
## ─────────────────────────────────────────────

[ ] Run production build:
    eas build --platform ios --profile production

[ ] Submit to App Store:
    eas submit --platform ios --latest
    (uses eas.json submit config automatically)

    OR manually in App Store Connect:
    - Go to your app → + Version → 1.0
    - Select the production build
    - Click "Submit for Review"
    - Answer export compliance questions: No (no encryption)

[ ] Wait for Apple review: typically 24-72 hours (average ~24 hrs in 2024)
[ ] You'll receive email: "Your app has been approved" 🎉
[ ] Click "Release" in App Store Connect (or set to auto-release)


## ─────────────────────────────────────────────
## PHASE 8: POST-LAUNCH  (after App Store approval)
## ─────────────────────────────────────────────

[ ] Share your App Store link with beta testers and early users
[ ] Monitor TestFlight crash logs in App Store Connect → Crashes
[ ] Set up OTA updates (no App Store review needed for JS-only changes):
    eas update --channel production --message "Bug fixes"
[ ] Respond to initial App Store reviews promptly
[ ] Plan version 1.1 improvements based on feedback


## ─────────────────────────────────────────────
## TOTAL TIMELINE ESTIMATE
## ─────────────────────────────────────────────

Day 1:   Phase 1 (accounts) + Phase 3 (affiliate signups)
Day 2:   Phase 2 (app assets — icon + screenshots)
Day 3:   Phase 4-5 (config + TestFlight build + real device testing)
Day 4:   Phase 6 (App Store Connect setup + screenshots + metadata)
Day 5:   Phase 7 (submit for review)
Day 6-8: Apple review period
Day 9:   🚀 LIVE ON THE APP STORE


## ─────────────────────────────────────────────
## COMMON REJECTION REASONS (and how we've avoided them)
## ─────────────────────────────────────────────

✓ Missing privacy policy URL → Added to app.json and App Store Connect
✓ Affiliate links not disclosed → App shows "Affiliate link" label in product modals
✓ Broken functionality → All features work without API key (graceful fallback)
✓ Missing demo account instructions → App works without login; noted in review notes
✓ Generic app / not enough value → App solves a specific, real problem
✓ Placeholder content → Replace all placeholder affiliate links before submission
✓ Crashes on launch → Test thoroughly in TestFlight first
✓ Missing required permission descriptions → All added to app.json infoPlist

One common catch: if app.json is missing NSLocationWhenInUseUsageDescription but 
expo-location is linked, you'll get rejected. Our app.json has this covered.
