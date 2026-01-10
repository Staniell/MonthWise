---
description: Database schema changes, migrations, and repository patterns for MonthWise
---

# Database Operations Workflow

## Schema Change Process

### 1. Never Modify Existing Tables Directly

- Always use migrations for changes
- Preserve existing data integrity
- Support users upgrading from any version

### 2. Steps for Schema Changes

1. **Plan the change**

   - Document what needs to change and why
   - Consider impact on existing data

2. **Increment schema version**

   ```typescript
   // src/database/schema.ts
   export const SCHEMA_VERSION = 2; // was 1
   ```

3. **Write migration function**

   ```typescript
   // src/database/migrations.ts
   export async function migrateV1toV2(db: SQLiteDatabase): Promise<void> {
     // Add new column with default value
     await db.execAsync(`
       ALTER TABLE expenses ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;
     `);
   }
   ```

4. **Update migration runner**

   ```typescript
   async function runMigrations(db, from, to) {
     if (from < 2 && to >= 2) {
       await migrateV1toV2(db);
     }
     // Future migrations here
   }
   ```

5. **Update TypeScript types**

   - Add new field to entity type
   - Update DTOs if needed

6. **Test migration**
   - Create data with old schema
   - Run migration
   - Verify data preserved
   - Verify new functionality works

---

## Repository Pattern

### Standard Repository Interface

```typescript
export interface BaseRepository<T, CreateDTO, UpdateDTO> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(dto: CreateDTO): Promise<T>;
  update(id: number, dto: UpdateDTO): Promise<T>;
  softDelete(id: number): Promise<void>;
}
```

### Example Implementation

```typescript
// src/database/repositories/expense.repository.ts
import { getDatabase } from "../connection";
import type { Expense, CreateExpenseDTO, UpdateExpenseDTO } from "@/types";

export const ExpenseRepository = {
  async findById(id: number): Promise<Expense | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ExpenseRow>("SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL", [
      id,
    ]);
    return result ? mapToExpense(result) : null;
  },

  async findByMonthId(monthId: number): Promise<Expense[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<ExpenseRow>(
      `SELECT * FROM expenses 
       WHERE month_id = ? AND deleted_at IS NULL 
       ORDER BY expense_date DESC, created_at DESC`,
      [monthId]
    );
    return results.map(mapToExpense);
  },

  async create(dto: CreateExpenseDTO): Promise<Expense> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO expenses (month_id, category_id, amount_cents, note, expense_date)
       VALUES (?, ?, ?, ?, ?)`,
      [dto.monthId, dto.categoryId, dto.amountCents, dto.note ?? null, dto.expenseDate]
    );
    return this.findById(result.lastInsertRowId)!;
  },

  async update(id: number, dto: UpdateExpenseDTO): Promise<Expense> {
    const db = await getDatabase();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (dto.categoryId !== undefined) {
      updates.push("category_id = ?");
      values.push(dto.categoryId);
    }
    if (dto.amountCents !== undefined) {
      updates.push("amount_cents = ?");
      values.push(dto.amountCents);
    }
    if (dto.note !== undefined) {
      updates.push("note = ?");
      values.push(dto.note);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(`UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`, values);

    return this.findById(id)!;
  },

  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE expenses SET deleted_at = datetime('now') WHERE id = ?", [id]);
  },

  async hardDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
  },
};

// Map database row to domain entity
function mapToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    monthId: row.month_id,
    categoryId: row.category_id,
    amountCents: row.amount_cents,
    note: row.note,
    expenseDate: row.expense_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
```

---

## Soft Delete Pattern

All user-modifiable data uses soft delete:

```typescript
// Mark as deleted (recoverable)
await db.runAsync("UPDATE expenses SET deleted_at = datetime('now') WHERE id = ?", [id]);

// Query excludes deleted
await db.getAllAsync("SELECT * FROM expenses WHERE deleted_at IS NULL");

// Include deleted for export/admin
await db.getAllAsync(
  "SELECT * FROM expenses" // No deleted_at filter
);
```

---

## Transaction Pattern

For operations affecting multiple tables:

```typescript
async function transferExpense(expenseId: number, newMonthId: number) {
  const db = await getDatabase();

  await db.execAsync("BEGIN TRANSACTION");

  try {
    // Update expense
    await db.runAsync("UPDATE expenses SET month_id = ? WHERE id = ?", [newMonthId, expenseId]);

    // Update source month totals (if cached)
    // ...

    // Update destination month totals (if cached)
    // ...

    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
```

---

## Performance Considerations

### Use Prepared Statements for Repeated Queries

```typescript
const findByIdStmt = await db.prepareAsync("SELECT * FROM expenses WHERE id = ?");

// Reuse for multiple queries
const expense1 = await findByIdStmt.executeAsync([1]);
const expense2 = await findByIdStmt.executeAsync([2]);

// Finalize when done
await findByIdStmt.finalizeAsync();
```

### Batch Inserts

```typescript
async function bulkCreateExpenses(expenses: CreateExpenseDTO[]) {
  const db = await getDatabase();

  await db.execAsync("BEGIN TRANSACTION");

  try {
    for (const expense of expenses) {
      await db.runAsync(
        `INSERT INTO expenses (month_id, category_id, amount_cents, note)
         VALUES (?, ?, ?, ?)`,
        [expense.monthId, expense.categoryId, expense.amountCents, expense.note]
      );
    }
    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
```

### Index Strategy

```sql
-- Already defined in schema, ensure these exist:
CREATE INDEX IF NOT EXISTS idx_expenses_month_id ON expenses(month_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_months_year ON months(year);

-- Add more indexes if query patterns require:
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
```
