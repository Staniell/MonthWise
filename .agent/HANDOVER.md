# MonthWise - Project Handover Document

> Last Updated: January 21, 2026

## Project Overview

**MonthWise** is an offline-first monthly expenditure tracking app built with React Native + Expo. All data is stored locally in SQLite—no backend, no cloud services.

### Tech Stack

| Layer            | Technology                |
| ---------------- | ------------------------- |
| Framework        | React Native + TypeScript |
| Build System     | Expo 54 (Dev Client)      |
| Database         | expo-sqlite               |
| State Management | Zustand                   |
| Navigation       | expo-router               |
| OTA Updates      | expo-updates (EAS)        |

---

## Current State (v1.0.4)

### Implemented Features

- **Year Overview**: Grid of 12 month cards showing allowance, spent, remaining
- **Month Detail**: Expenses grouped by category (SectionList)
- **Expense Management**: Add/Edit/Delete with category picker
- **Status Tracking**:
  - **Paid Status**: Mark expenses as paid/unpaid (long-press toggle)
  - **Verified Status**: Separate verification action with password protection (new)
- **Parent Status**: Category headers show status derived from children
- **Selection Mode**: Multi-select with bulk Mark Paid / Mark Unpaid / Delete
- **Profile Security**: Password protection per profile for expense verification
- **Allowance Sources**: Multiple income sources with override per month
- **Category Management**: Add/Edit/Delete/Reorder categories
- **Export/Import**: JSON backup and restore
- **Settings**: Currency selection, hide cents option
- **OTA Updates**: Check for updates from Settings screen

### Recent Work (January 2026 Session)

1. **Separate Paid & Verified Status**:
   - Added `is_verified` column to `expenses` table (SCHEMA_VERSION = 4)
   - Verification is now independent of payment status
   - UI indicators: Blue shield (verified), Green check (paid)
   - Verification resets on edits or when toggling from paid to unpaid

2. **Profile Security (Password-Only)**:
   - Created `auth.service.ts` with bcrypt-like password hashing (expo-crypto)
   - Added `password_hash` column to `profiles` table
   - `ProfileSecurityModal`: Set/Change/Remove password
   - `VerifyExpensesModal`: Bulk verification requiring profile password

3. **Robust Keyboard Handling**:
   - Manual keyboard height tracking on Android
   - `ScrollView` + `KeyboardAvoidingView` pattern for all modals
   - Aggressive safe area padding (96px minimum) for navigation bar clearance
   - See: `.agent/skills/keyboard-handling/SKILL.md`

4. **EAS Update Configuration**:
   - Added `expo-updates` to plugins in `app.json`
   - Created and linked `default` and `production` channels to `production` branch
   - OTA update flow verified and functional

---

## Architecture

```
src/
├── database/           # SQLite operations
│   ├── schema.ts       # Table definitions (SCHEMA_VERSION = 4)
│   ├── migrations.ts   # Version-controlled migrations
│   └── repositories/   # CRUD operations per entity
├── services/           # Business logic services
│   ├── auth.service.ts # Password hashing/verification
│   └── update.service.ts # OTA update handling
├── stores/             # Zustand stores
│   ├── app.store.ts    # Main app state + actions
│   └── ui.store.ts     # UI-only state (modals etc.)
├── screens/            # Screen components
├── components/         # Reusable UI
├── utils/              # Pure utilities (currency, date)
├── types/              # TypeScript definitions
└── theme/              # Colors, spacing, typography
```

### Key Files

| File                        | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| `MonthDetailScreen.tsx`     | Main expense list (categorized, selection mode) |
| `ExpenseItem.tsx`           | Individual expense row component                |
| `ProfileSecurityModal.tsx`  | Set/Change/Remove profile password              |
| `VerifyExpensesModal.tsx`   | Bulk expense verification with password         |
| `app.store.ts`              | Central state + database actions                |
| `expense.repository.ts`     | Expense CRUD operations + verification logic    |
| `auth.service.ts`           | Password hashing with expo-crypto               |
| `schema.ts`                 | Database table definitions                      |

---

## Database Schema (v4)

Key tables:

- `months` — Year/month with optional allowance override
- `expenses` — Individual expenses with `is_paid` and `is_verified` columns
- `categories` — User categories with icon/color/sort_order
- `profiles` — User profiles with optional `password_hash`
- `allowance_sources` — Income sources

Recent migrations:
- v3→v4: Added `is_verified` to expenses, `password_hash` to profiles

---

## Build & Distribution

### EAS Profiles (eas.json)

| Profile     | Channel    | Purpose           | Output |
| ----------- | ---------- | ----------------- | ------ |
| development | N/A        | Dev client        | N/A    |
| preview     | preview    | Internal testing  | APK    |
| production  | production | User distribution | APK    |

### Current Versions

- `version`: 1.0.4
- `versionCode`: 4

### EAS Channels

| Channel    | Linked Branch | Purpose                        |
| ---------- | ------------- | ------------------------------ |
| default    | production    | For apps without explicit channel |
| production | production    | Main release channel           |
| preview    | preview       | Testing channel                |

### Size Optimizations Applied

- ARM-only architectures (`reactNativeArchitectures=armeabi-v7a,arm64-v8a`)
- R8 minification enabled
- Resource shrinking enabled
- GIF/WebP support disabled

---

## Skills & Workflows

### Skills

| Skill               | Path                                      | Description                          |
| ------------------- | ----------------------------------------- | ------------------------------------ |
| keyboard-handling   | `.agent/skills/keyboard-handling/SKILL.md` | Standard modal keyboard handling    |

### Workflows

| Workflow               | Description                              |
| ---------------------- | ---------------------------------------- |
| `/daily-development`   | Dev server, type checking, debugging     |
| `/database-operations` | Schema changes, migrations, repositories |
| `/development-phases`  | Full project phases from scratch         |
| `/eas-build`           | EAS build, update, submission commands   |

---

## Known Considerations

1. **New Architecture Disabled**: `newArchEnabled: false` in `app.json` (stability)
2. **APK Distribution**: Currently distributing APK directly, not via Play Store
3. **iOS**: Not yet configured (requires Apple Developer account for TestFlight)
4. **Soft Delete**: All user data uses `deleted_at` pattern (recoverable)
5. **OTA Updates**: Requires a new native build when plugins change

---

## Immediate Next Steps (Potential)

- [ ] Play Store submission (change buildType to `app-bundle`)
- [ ] iOS build configuration
- [ ] Recurring expenses feature
- [ ] Data visualization (charts)
- [x] ~~App lock with biometrics~~ → Implemented as password protection per profile

---

## Useful Commands

```bash
# Start dev server
npm run android:debug

# Production build
eas build --platform android --profile production --non-interactive

# OTA update (JS only)
eas update --branch production --platform android --message "Description"

# List update channels
eas channel:list

# Link channel to branch
eas channel:edit <channel-name> --branch <branch-name>
```
