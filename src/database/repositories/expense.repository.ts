import type { CreateExpenseDTO, Expense, ExpenseEntity, UpdateExpenseDTO } from "@/types";
import { getDatabase } from "../connection";

/**
 * Map database entity to UI model
 */
function mapToExpense(entity: ExpenseEntity): Expense {
  return {
    id: entity.id,
    monthId: entity.month_id,
    categoryId: entity.category_id,
    amountCents: entity.amount_cents,
    note: entity.note,
    expenseDate: entity.expense_date,
    isPaid: entity.is_paid === 1,
    isVerified: entity.is_verified === 1,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    deletedAt: entity.deleted_at,
  };
}

export const ExpenseRepository = {
  /**
   * Find expense by ID
   */
  async findById(id: number): Promise<Expense | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ExpenseEntity>("SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL", [
      id,
    ]);
    return result ? mapToExpense(result) : null;
  },

  /**
   * Get all expenses for a month
   */
  async findByMonthId(monthId: number): Promise<Expense[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<ExpenseEntity>(
      `SELECT * FROM expenses 
       WHERE month_id = ? AND deleted_at IS NULL 
       ORDER BY expense_date DESC, created_at DESC`,
      [monthId],
    );
    return results.map(mapToExpense);
  },

  /**
   * Get expenses by category for a month
   */
  async findByMonthAndCategory(monthId: number, categoryId: number): Promise<Expense[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<ExpenseEntity>(
      `SELECT * FROM expenses 
       WHERE month_id = ? AND category_id = ? AND deleted_at IS NULL 
       ORDER BY expense_date DESC, created_at DESC`,
      [monthId, categoryId],
    );
    return results.map(mapToExpense);
  },

  /**
   * Get all expenses (for export)
   */
  async findAll(): Promise<Expense[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<ExpenseEntity>(
      "SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC",
    );
    return results.map(mapToExpense);
  },

  /**
   * Get total spent for a month (PAID expenses only)
   */
  async getTotalForMonth(monthId: number): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number | null }>(
      "SELECT SUM(amount_cents) as total FROM expenses WHERE month_id = ? AND deleted_at IS NULL AND is_paid = 1",
      [monthId],
    );
    return result?.total ?? 0;
  },

  /**
   * Get total balance for a month (UNPAID expenses only)
   */
  async getBalanceForMonth(monthId: number): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number | null }>(
      "SELECT SUM(amount_cents) as total FROM expenses WHERE month_id = ? AND deleted_at IS NULL AND is_paid = 0",
      [monthId],
    );
    return result?.total ?? 0;
  },

  /**
   * Get spending breakdown by category for a month
   */
  async getCategoryBreakdown(monthId: number): Promise<{ categoryId: number; total: number }[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<{ category_id: number; total: number }>(
      `SELECT category_id, SUM(amount_cents) as total 
       FROM expenses 
       WHERE month_id = ? AND deleted_at IS NULL 
       GROUP BY category_id 
       ORDER BY total DESC`,
      [monthId],
    );
    return results.map((r) => ({ categoryId: r.category_id, total: r.total }));
  },

  /**
   * Create a new expense
   */
  async create(dto: CreateExpenseDTO): Promise<Expense> {
    const db = await getDatabase();
    const expenseDate = dto.expenseDate ?? new Date().toISOString().split("T")[0];

    const result = await db.runAsync(
      "INSERT INTO expenses (month_id, category_id, amount_cents, note, expense_date) VALUES (?, ?, ?, ?, ?)",
      [
        dto.monthId,
        dto.categoryId,
        dto.amountCents,
        dto.note ?? null,
        expenseDate ?? new Date().toISOString().split("T")[0] ?? "",
      ],
    );

    const created = await this.findById(result.lastInsertRowId);
    if (!created) {
      throw new Error("Failed to create expense");
    }
    return created;
  },

  /**
   * Update an existing expense
   */
  async update(id: number, dto: UpdateExpenseDTO): Promise<Expense> {
    const db = await getDatabase();
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

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
    if (dto.expenseDate !== undefined) {
      updates.push("expense_date = ?");
      values.push(dto.expenseDate);
    }
    if (dto.isPaid !== undefined) {
      updates.push("is_paid = ?");
      values.push(dto.isPaid ? 1 : 0);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error("Expense not found");
      return existing;
    }

    // Clear verification when expense is edited (any field change)
    updates.push("is_verified = 0");
    updates.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(`UPDATE expenses SET ${updates.join(", ")} WHERE id = ?`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Expense not found");
    }
    return updated;
  },

  /**
   * Soft delete an expense
   */
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE expenses SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [
      id,
    ]);
  },

  /**
   * Hard delete an expense (use with caution)
   */
  async hardDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
  },

  /**
   * Get expense count for a month
   */
  async getCountForMonth(monthId: number): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM expenses WHERE month_id = ? AND deleted_at IS NULL",
      [monthId],
    );
    return result?.count ?? 0;
  },

  /**
   * Bulk update paid status for multiple expenses
   */
  async bulkUpdatePaidStatus(ids: number[], isPaid: boolean): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDatabase();
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(`UPDATE expenses SET is_paid = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`, [
      isPaid ? 1 : 0,
      ...ids,
    ]);
  },

  /**
   * Bulk soft delete expenses
   */
  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDatabase();
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE expenses SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id IN (${placeholders})`,
      ids,
    );
  },

  /**
   * Verify all expenses for a month
   */
  async verifyAllForMonth(monthId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE expenses SET is_verified = 1, updated_at = datetime('now') WHERE month_id = ? AND deleted_at IS NULL",
      [monthId],
    );
  },

  /**
   * Clear verification for a single expense
   */
  async clearVerification(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE expenses SET is_verified = 0, updated_at = datetime('now') WHERE id = ?", [id]);
  },

  /**
   * Get verification status for a month
   */
  async getVerificationStatus(monthId: number): Promise<{ total: number; verified: number }> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number; verified: number }>(
      `SELECT 
         COUNT(*) as total, 
         SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified 
       FROM expenses 
       WHERE month_id = ? AND deleted_at IS NULL`,
      [monthId],
    );
    return { total: result?.total ?? 0, verified: result?.verified ?? 0 };
  },
};
