---
description: Complete phased development workflow for MonthWise app from empty repository to production
---

# MonthWise Development Phases

## Overview

This workflow guides the complete development of MonthWise, an offline-first monthly expenditure tracking app. Each phase builds upon the previous and includes verification steps.

---

## Phase 0: Project Initialization

**Estimated Time: 30 minutes**

### 0.1 Create Expo Project

```bash
// turbo
npx -y create-expo-app@latest ./ --template tabs
```

### 0.2 Install Core Dependencies

```bash
// turbo
npx expo install expo-sqlite expo-file-system expo-document-picker expo-sharing @shopify/flash-list zustand
```

### 0.3 Install Dev Dependencies

```bash
// turbo
npm install -D @types/react @types/react-native
```

### 0.4 Configure TypeScript Strict Mode

Update `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### 0.5 Create Directory Structure

```
src/
├── database/
│   ├── schema.ts
│   ├── migrations.ts
│   ├── connection.ts
│   └── repositories/
│       ├── allowance.repository.ts
│       ├── month.repository.ts
│       ├── expense.repository.ts
│       └── category.repository.ts
├── services/
│   ├── calculation.service.ts
│   └── export-import.service.ts
├── stores/
│   ├── app.store.ts
│   └── ui.store.ts
├── components/
│   ├── common/
│   ├── month/
│   └── expense/
├── screens/
├── hooks/
├── utils/
│   ├── currency.ts
│   └── date.ts
├── types/
│   ├── database.types.ts
│   ├── dto.types.ts
│   └── ui.types.ts
└── theme/
    ├── colors.ts
    ├── spacing.ts
    └── typography.ts
```

### Phase 0 Verification

- [ ] `npx expo start` launches without errors
- [ ] TypeScript strict mode is enforced
- [ ] All directories exist

---

## Phase 1: Database Foundation

**Estimated Time: 2-3 hours**

### 1.1 Define Database Schema (`src/database/schema.ts`)

```typescript
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
  -- Allowance sources (salary, side income, etc.)
  CREATE TABLE IF NOT EXISTS allowance_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  -- Categories for expenses
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  -- Months with optional allowance override
  CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
    allowance_override_cents INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(year, month)
  );

  -- Individual expenses
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
    note TEXT,
    expense_date TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  -- App settings and metadata
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_expenses_month_id ON expenses(month_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
  CREATE INDEX IF NOT EXISTS idx_months_year ON months(year);
`;
```

### 1.2 Implement Database Connection (`src/database/connection.ts`)

```typescript
import * as SQLite from "expo-sqlite";
import { CREATE_TABLES, SCHEMA_VERSION } from "./schema";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;

  database = await SQLite.openDatabaseAsync("monthwise.db");
  await initializeDatabase(database);
  return database;
}

async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Check current version
  const result = await db
    .getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'schema_version'")
    .catch(() => null);

  const currentVersion = result ? parseInt(result.value, 10) : 0;

  if (currentVersion < SCHEMA_VERSION) {
    await db.execAsync(CREATE_TABLES);
    await runMigrations(db, currentVersion, SCHEMA_VERSION);
    await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('schema_version', ?)", [
      SCHEMA_VERSION.toString(),
    ]);
  }

  // Seed default categories if empty
  await seedDefaultCategories(db);
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories WHERE deleted_at IS NULL"
  );

  if (count && count.count === 0) {
    const defaultCategories = [
      { name: "Food & Dining", icon: "🍔", color: "#FF6B6B" },
      { name: "Transportation", icon: "🚗", color: "#4ECDC4" },
      { name: "Utilities", icon: "💡", color: "#FFE66D" },
      { name: "Entertainment", icon: "🎬", color: "#95E1D3" },
      { name: "Shopping", icon: "🛒", color: "#DDA0DD" },
      { name: "Healthcare", icon: "🏥", color: "#87CEEB" },
      { name: "Other", icon: "📦", color: "#C9C9C9" },
    ];

    for (const cat of defaultCategories) {
      await db.runAsync("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)", [
        cat.name,
        cat.icon,
        cat.color,
        defaultCategories.indexOf(cat),
      ]);
    }
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase, from: number, to: number): Promise<void> {
  // Future migrations go here
  // if (from < 2 && to >= 2) { await migrateV1toV2(db); }
}
```

### 1.3 Implement Repositories

Create repository files for each entity following the pattern in rules.md.

### Phase 1 Verification

- [ ] Database initializes on first app launch
- [ ] Default categories are seeded
- [ ] All CRUD operations work via repositories
- [ ] Foreign key constraints enforce data integrity
- [ ] Schema version is stored and checked

---

## Phase 2: Core Business Logic

**Estimated Time: 2-3 hours**

### 2.1 Implement Calculation Service (`src/services/calculation.service.ts`)

```typescript
export class CalculationService {
  /**
   * Calculate total allowance from all active sources
   * @returns Total in cents
   */
  calculateTotalAllowance(sources: AllowanceSource[]): number {
    return sources.filter((s) => s.isActive && !s.deletedAt).reduce((sum, source) => sum + source.amountCents, 0);
  }

  /**
   * Get effective allowance for a month (override or default)
   * @returns Amount in cents
   */
  getMonthlyAllowance(month: Month, defaultAllowanceCents: number): number {
    return month.allowanceOverrideCents ?? defaultAllowanceCents;
  }

  /**
   * Calculate total spent for a month
   * @returns Total in cents
   */
  calculateTotalSpent(expenses: Expense[]): number {
    return expenses.filter((e) => !e.deletedAt).reduce((sum, expense) => sum + expense.amountCents, 0);
  }

  /**
   * Calculate remaining amount (positive = excess, negative = deficit)
   * @returns Amount in cents
   */
  calculateRemaining(allowanceCents: number, spentCents: number): number {
    return allowanceCents - spentCents;
  }

  /**
   * Calculate total excess across all months
   * @returns Total excess in cents (only positive remainders)
   */
  calculateTotalExcess(monthSummaries: MonthSummary[]): number {
    return monthSummaries.filter((m) => m.remainingCents > 0).reduce((sum, m) => sum + m.remainingCents, 0);
  }
}
```

### 2.2 Implement Currency Utilities (`src/utils/currency.ts`)

```typescript
/**
 * Convert cents to display string
 * @param cents Amount in cents
 * @param locale User's locale (default: 'en-US')
 * @param currency Currency code (default: 'USD')
 */
export function formatCurrency(cents: number, locale: string = "en-US", currency: string = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse user input to cents
 * Handles various input formats: "10.50", "10,50", "$10.50"
 * @returns Amount in cents or null if invalid
 */
export function parseToCents(input: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = input.replace(/[^0-9.,\-]/g, "").trim();

  if (!cleaned) return null;

  // Handle comma as decimal separator
  const normalized = cleaned.replace(",", ".");

  const parsed = parseFloat(normalized);

  if (isNaN(parsed)) return null;

  // Convert to cents and round to avoid floating point issues
  return Math.round(parsed * 100);
}

/**
 * Format cents for input field (without currency symbol)
 */
export function formatForInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

### Phase 2 Verification

- [ ] All calculations use integer cents internally
- [ ] Currency formatting works correctly
- [ ] Edge cases handled (zero, negative, large numbers)
- [ ] No floating-point errors in calculations

---

## Phase 3: State Management

**Estimated Time: 1-2 hours**

### 3.1 Create App Store (`src/stores/app.store.ts`)

```typescript
import { create } from "zustand";
import { AllowanceRepository, MonthRepository, ExpenseRepository } from "@/database/repositories";
import { CalculationService } from "@/services/calculation.service";

interface AppState {
  // Data
  selectedYear: number;
  allowanceSources: AllowanceSource[];
  monthSummaries: MonthSummary[];

  // Loading states
  isLoading: boolean;

  // Actions
  setSelectedYear: (year: number) => void;
  loadYearData: (year: number) => Promise<void>;
  refreshData: () => Promise<void>;

  // Allowance actions
  addAllowanceSource: (source: CreateAllowanceSourceDTO) => Promise<void>;
  updateAllowanceSource: (id: number, source: UpdateAllowanceSourceDTO) => Promise<void>;
  deleteAllowanceSource: (id: number) => Promise<void>;

  // Month actions
  overrideMonthAllowance: (year: number, month: number, amountCents: number | null) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedYear: new Date().getFullYear(),
  allowanceSources: [],
  monthSummaries: [],
  isLoading: false,

  setSelectedYear: (year) => {
    set({ selectedYear: year });
    get().loadYearData(year);
  },

  loadYearData: async (year) => {
    set({ isLoading: true });
    try {
      // Load data from database
      const sources = await AllowanceRepository.findAllActive();
      const monthsData = await MonthRepository.findByYear(year);

      // Calculate summaries
      const calcService = new CalculationService();
      const defaultAllowance = calcService.calculateTotalAllowance(sources);

      const summaries = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const monthNum = i + 1;
          const monthData = monthsData.find((m) => m.month === monthNum);
          const expenses = monthData ? await ExpenseRepository.findByMonthId(monthData.id) : [];

          const allowance = monthData?.allowanceOverrideCents ?? defaultAllowance;
          const spent = calcService.calculateTotalSpent(expenses);
          const remaining = calcService.calculateRemaining(allowance, spent);

          return {
            year,
            month: monthNum,
            monthId: monthData?.id ?? null,
            allowanceCents: allowance,
            spentCents: spent,
            remainingCents: remaining,
            expenseCount: expenses.length,
          };
        })
      );

      set({
        allowanceSources: sources,
        monthSummaries: summaries,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load year data:", error);
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    await get().loadYearData(get().selectedYear);
  },

  // ... implement other actions
}));
```

### Phase 3 Verification

- [ ] Store initializes with current year
- [ ] Year data loads from database
- [ ] State updates trigger UI re-renders
- [ ] Actions persist changes to database

---

## Phase 4: UI Implementation

**Estimated Time: 4-6 hours**

### 4.1 Create Theme System

Implement `src/theme/` with colors, spacing, and typography.

### 4.2 Build Common Components

- `Card` - Reusable card container
- `Button` - Primary/secondary/danger variants
- `Input` - Text and currency inputs
- `Modal` - Bottom sheet modal
- `AmountDisplay` - Formatted currency with color coding

### 4.3 Build Month Card Component

Display:

- Month name
- Starting allowance
- Total spent
- Remaining (with color: green for excess, red for deficit)

### 4.4 Build Main Screen (Year Overview)

- Year selector at top
- Grid/list of 12 month cards
- Total excess summary section
- Navigation to settings

### 4.5 Build Month Detail Screen

- Month header with allowance info
- Expenses list (using FlashList)
- Add expense FAB
- Edit allowance override option

### 4.6 Build Expense Management

- Add/Edit expense modal
- Category picker
- Amount input with validation
- Delete confirmation

### 4.7 Build Allowance Sources Screen

- List of income sources
- Add/Edit/Delete functionality
- Total calculation display

### Phase 4 Verification

- [ ] All screens render correctly
- [ ] Navigation works between screens
- [ ] Forms validate input properly
- [ ] Loading states are shown
- [ ] Empty states are handled
- [ ] Dark mode works

---

## Phase 5: Export/Import Feature

**Estimated Time: 2-3 hours**

### 5.1 Implement Export Service

```typescript
export interface ExportData {
  version: 1;
  exportedAt: string;
  appVersion: string;
  data: {
    allowanceSources: AllowanceSourceExport[];
    categories: CategoryExport[];
    months: MonthExport[];
    expenses: ExpenseExport[];
  };
}

export async function exportAllData(): Promise<string> {
  const db = await getDatabase();

  const exportData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? "1.0.0",
    data: {
      allowanceSources: await AllowanceRepository.findAll(),
      categories: await CategoryRepository.findAll(),
      months: await MonthRepository.findAll(),
      expenses: await ExpenseRepository.findAll(),
    },
  };

  return JSON.stringify(exportData, null, 2);
}
```

### 5.2 Implement Import Service

```typescript
export async function importData(jsonString: string): Promise<ImportResult> {
  const data = JSON.parse(jsonString) as ExportData;

  // Validate version
  if (data.version > CURRENT_EXPORT_VERSION) {
    throw new ImportError("Export file is from a newer app version");
  }

  // Validate structure
  validateExportStructure(data);

  // Begin transaction
  const db = await getDatabase();
  await db.execAsync("BEGIN TRANSACTION");

  try {
    // Clear existing data (user confirmed)
    await clearAllTables(db);

    // Import in dependency order
    await importCategories(db, data.data.categories);
    await importAllowanceSources(db, data.data.allowanceSources);
    await importMonths(db, data.data.months);
    await importExpenses(db, data.data.expenses);

    await db.execAsync("COMMIT");

    return { success: true, recordsImported: countRecords(data) };
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
```

### 5.3 Build Export/Import UI

- Settings screen with export button
- Share sheet integration for export
- Document picker for import
- Confirmation dialogs
- Progress indicators
- Success/error feedback

### Phase 5 Verification

- [ ] Export creates valid JSON file
- [ ] Export can be shared via system share sheet
- [ ] Import correctly parses exported files
- [ ] Import validates data before applying
- [ ] Import shows confirmation before overwriting
- [ ] Imported data maintains referential integrity
- [ ] Round-trip test: export → import → verify identical data

---

## Phase 6: Polish & Optimization

**Estimated Time: 2-3 hours**

### 6.1 Performance Optimization

- Profile database queries
- Implement query result caching
- Lazy load year data
- Optimize list rendering

### 6.2 Error Handling

- Implement error boundaries
- Add user-friendly error messages
- Implement crash recovery

### 6.3 Accessibility

- Add accessibility labels
- Test with screen reader
- Verify touch target sizes
- Support dynamic font sizes

### 6.4 Final UI Polish

- Refine animations
- Add haptic feedback
- Ensure consistent styling
- Test on various screen sizes

### Phase 6 Verification

- [ ] App launches in under 2 seconds
- [ ] Large data sets (5+ years) don't cause lag
- [ ] No memory leaks
- [ ] Accessibility audit passes
- [ ] Works on both iOS and Android

---

## Phase 7: Testing & Documentation

**Estimated Time: 2-3 hours**

### 7.1 Write Tests

- Unit tests for calculation service
- Integration tests for repositories
- E2E tests for critical flows

### 7.2 Documentation

- Update README with setup instructions
- Document database schema
- Create user guide

### 7.3 Pre-release Checklist

- [ ] All features implemented per requirements
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Works completely offline
- [ ] Export/Import round-trip verified
- [ ] Tested on iOS device/simulator
- [ ] Tested on Android device/emulator
- [ ] App icon and splash screen configured
- [ ] App name and bundle ID configured

---

## Quick Command Reference

```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build for production (EAS)
eas build --platform all

# Run TypeScript check
npx tsc --noEmit

# Run tests
npm test
```
