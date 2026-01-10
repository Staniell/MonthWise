# MonthWise - Project Rules & Conventions

## Technology Stack (Mandatory)

| Layer                | Technology                | Notes                                   |
| -------------------- | ------------------------- | --------------------------------------- |
| **Framework**        | React Native + TypeScript | Strict TypeScript mode enabled          |
| **Build System**     | Expo (Dev Client)         | Bare workflow for native SQLite access  |
| **Database**         | expo-sqlite               | Local SQLite database, NOT AsyncStorage |
| **State Management** | Zustand                   | Lightweight, offline-first compatible   |
| **File System**      | expo-file-system          | For export/import functionality         |
| **Navigation**       | expo-router               | File-based routing                      |

## Architecture Principles

### 1. Offline-First is Non-Negotiable

- **NO** network requests anywhere in the codebase
- **NO** cloud services, Firebase, Supabase, or any backend dependency
- All data lives locally on the device in SQLite
- App must function identically with airplane mode enabled

### 2. Separation of Concerns

```
src/
├── database/           # SQLite operations ONLY
│   ├── schema.ts       # Table definitions
│   ├── migrations.ts   # Version-controlled migrations
│   └── repositories/   # CRUD operations per entity
├── services/           # Business logic (calculations, validations)
├── stores/             # Zustand stores (UI state only, NOT data persistence)
├── components/         # Reusable UI components
├── screens/            # Screen-level components
├── hooks/              # Custom React hooks
├── utils/              # Pure utility functions
└── types/              # TypeScript type definitions
```

### 3. Data Flow Pattern

```
UI Component → Zustand Store → Repository → SQLite
     ↑              ↑              ↑
     └──────────────┴──────────────┘ (data flows back)
```

## Database Rules

### Schema Design

- Use INTEGER for monetary values (store cents, not dollars/decimals)
- Include `created_at` and `updated_at` timestamps on all tables
- Use foreign keys with proper ON DELETE CASCADE/SET NULL
- Never delete actual records - use `deleted_at` soft delete pattern

### Migrations

- Every schema change requires a numbered migration
- Migrations are forward-only (no down migrations)
- Version must increment: `v1`, `v2`, `v3`, etc.
- Test migrations with existing data before release

### Repository Pattern

```typescript
// Example: ExpenseRepository
export interface ExpenseRepository {
  create(expense: CreateExpenseDTO): Promise<Expense>;
  findById(id: number): Promise<Expense | null>;
  findByMonth(year: number, month: number): Promise<Expense[]>;
  update(id: number, expense: UpdateExpenseDTO): Promise<Expense>;
  softDelete(id: number): Promise<void>;
}
```

## Monetary Calculations

### CRITICAL: Avoid Floating-Point Errors

```typescript
// ❌ WRONG - floating point arithmetic
const total = 10.1 + 10.2; // Results in 20.299999999999997

// ✅ CORRECT - integer arithmetic in cents
const totalCents = 1010 + 1020; // 2030 cents = $20.30
const displayValue = totalCents / 100; // Only convert for display
```

### Calculation Service Requirements

- All internal calculations use integers (cents)
- Conversion to display format happens ONLY at the UI layer
- Use `Intl.NumberFormat` for currency formatting
- Round ONCE at the final display step

## TypeScript Rules

### Strict Mode Enabled

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Definitions

- Define separate types for: Database entities, DTOs, and UI models
- Use discriminated unions for complex states
- No `any` type - use `unknown` and type guards instead

```typescript
// Entity (matches database)
interface ExpenseEntity {
  id: number;
  month_id: number;
  category_id: number;
  amount_cents: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// DTO (for create/update operations)
interface CreateExpenseDTO {
  monthId: number;
  categoryId: number;
  amountCents: number;
  note?: string;
}

// UI Model (for components)
interface ExpenseViewModel {
  id: number;
  category: CategoryViewModel;
  amount: string; // Formatted: "$123.45"
  note: string;
}
```

## Component Guidelines

### Styling

- Use React Native StyleSheet API
- Define styles at bottom of component file
- Use a centralized theme for colors and spacing
- Support both light and dark modes

### Performance

- Use `React.memo` for list items
- Implement `FlashList` instead of `FlatList` for large lists
- Avoid inline function definitions in render
- Use `useCallback` and `useMemo` appropriately

### Accessibility

- Include `accessibilityLabel` on all interactive elements
- Support dynamic font scaling
- Ensure minimum touch target of 44x44 points

## Export/Import Format

### File Structure (JSON)

```typescript
interface ExportData {
  version: 1; // Increment on breaking changes
  exportedAt: string; // ISO 8601
  data: {
    allowanceSources: AllowanceSource[];
    months: Month[];
    expenses: Expense[];
    categories: Category[];
  };
}
```

### Validation Requirements

- Validate schema version before import
- Check referential integrity
- Provide clear error messages for invalid data
- Backup existing data before destructive import

## Testing Standards

### Unit Tests

- Test all calculation functions
- Test repository methods with in-memory SQLite
- Mock file system for export/import tests

### Integration Tests

- Test complete user flows (add expense → see updated totals)
- Test data migrations on sample databases

## Git Conventions

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Messages

```
type(scope): short description

- feat(expenses): add expense CRUD operations
- fix(calculations): correct floating-point rounding
- refactor(database): extract repository pattern
```

## Performance Targets

| Metric                    | Target       |
| ------------------------- | ------------ |
| App launch to interactive | < 2 seconds  |
| Add expense operation     | < 100ms      |
| Load year overview        | < 200ms      |
| Export 5 years of data    | < 5 seconds  |
| Import 5 years of data    | < 10 seconds |

## Security Considerations

- No sensitive data logged in development
- Clear data on app uninstall (default behavior)
- Optional: Add app lock with biometrics (future enhancement)
