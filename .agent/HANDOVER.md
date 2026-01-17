# MonthWise - Project Handover Document

> Last Updated: January 17, 2026

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

---

## Current State (v1.0.3)

### Implemented Features

- **Year Overview**: Grid of 12 month cards showing allowance, spent, remaining
- **Month Detail**: Expenses grouped by category (SectionList)
- **Expense Management**: Add/Edit/Delete with category picker
- **Paid Status**: Mark expenses as paid/unpaid (long-press toggle)
- **Parent Paid Status**: Category headers show paid state derived from children
- **Selection Mode**: Multi-select with bulk Mark Paid / Mark Unpaid / Delete
- **Allowance Sources**: Multiple income sources with override per month
- **Category Management**: Add/Edit/Delete/Reorder categories
- **Export/Import**: JSON backup and restore
- **Settings**: Currency selection, hide cents option

### Recent Work (This Session)

1. **Categorized Expense List**: Refactored from FlatList to SectionList grouped by category
2. **Parent Paid Status Logic**: Categories marked as "paid" only when ALL children are paid
3. **Smart Sorting**: Unpaid categories sort to top
4. **Selection Mode UI**: Fixed checkbox alignment, compacted action bar for mobile
5. **Edge-to-Edge Highlights**: Selection highlights span full screen width
6. **Size Optimization**: ~57 MB production APK (ARM-only, R8 enabled)
7. **EAS Production Build**: Successfully published v1.0.3

---

## Architecture

```
src/
├── database/           # SQLite operations
│   ├── schema.ts       # Table definitions (SCHEMA_VERSION = 3)
│   ├── migrations.ts   # Version-controlled migrations
│   └── repositories/   # CRUD operations per entity
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

| File                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `MonthDetailScreen.tsx` | Main expense list (categorized, selection mode) |
| `ExpenseItem.tsx`       | Individual expense row component                |
| `app.store.ts`          | Central state + database actions                |
| `expense.repository.ts` | Expense CRUD operations                         |
| `schema.ts`             | Database table definitions                      |

---

## Database Schema (v3)

Key tables:

- `months` — Year/month with optional allowance override
- `expenses` — Individual expenses with `is_paid` column
- `categories` — User categories with icon/color/sort_order
- `allowance_sources` — Income sources

The `is_paid` column was added in migration v2→v3.

---

## Build & Distribution

### EAS Profiles (eas.json)

| Profile     | Purpose           | Output |
| ----------- | ----------------- | ------ |
| development | Dev client        | N/A    |
| preview     | Internal testing  | APK    |
| production  | User distribution | APK    |

### Current Versions

- `version`: 1.0.3
- `versionCode`: 3

### Size Optimizations Applied

- ARM-only architectures (`reactNativeArchitectures=armeabi-v7a,arm64-v8a`)
- R8 minification enabled
- Resource shrinking enabled
- GIF/WebP support disabled

---

## Workflows Available

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

---

## Immediate Next Steps (Potential)

- [ ] Play Store submission (change buildType to `app-bundle`)
- [ ] iOS build configuration
- [ ] Recurring expenses feature
- [ ] Data visualization (charts)
- [ ] App lock with biometrics

---

## Useful Commands

```bash
# Start dev server
npm run android:debug

# Production build
eas build --platform android --profile production --non-interactive

# OTA update (JS only)
eas update --branch production --message "Description"
```
