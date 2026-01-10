import type { Month, MonthEntity, UpdateMonthDTO } from "@/types";
import { getDatabase } from "../connection";

/**
 * Map database entity to UI model
 */
function mapToMonth(entity: MonthEntity): Month {
  return {
    id: entity.id,
    year: entity.year,
    month: entity.month,
    allowanceOverrideCents: entity.allowance_override_cents,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

export const MonthRepository = {
  /**
   * Find month by ID
   */
  async findById(id: number): Promise<Month | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<MonthEntity>("SELECT * FROM months WHERE id = ?", [id]);
    return result ? mapToMonth(result) : null;
  },

  /**
   * Find month by year and month number
   */
  async findByYearMonth(year: number, month: number): Promise<Month | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<MonthEntity>("SELECT * FROM months WHERE year = ? AND month = ?", [
      year,
      month,
    ]);
    return result ? mapToMonth(result) : null;
  },

  /**
   * Get all months for a specific year
   */
  async findByYear(year: number): Promise<Month[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<MonthEntity>("SELECT * FROM months WHERE year = ? ORDER BY month ASC", [year]);
    return results.map(mapToMonth);
  },

  /**
   * Get all months (for export)
   */
  async findAll(): Promise<Month[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<MonthEntity>("SELECT * FROM months ORDER BY year DESC, month ASC");
    return results.map(mapToMonth);
  },

  /**
   * Get all years that have data
   */
  async getYearsWithData(): Promise<number[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<{ year: number }>("SELECT DISTINCT year FROM months ORDER BY year DESC");
    return results.map((r) => r.year);
  },

  /**
   * Create or get a month record
   */
  async getOrCreate(year: number, month: number): Promise<Month> {
    const existing = await this.findByYearMonth(year, month);
    if (existing) {
      return existing;
    }

    const db = await getDatabase();
    const result = await db.runAsync("INSERT INTO months (year, month) VALUES (?, ?)", [year, month]);

    const created = await this.findById(result.lastInsertRowId);
    if (!created) {
      throw new Error("Failed to create month");
    }
    return created;
  },

  /**
   * Update a month's allowance override
   */
  async update(id: number, dto: UpdateMonthDTO): Promise<Month> {
    const db = await getDatabase();

    await db.runAsync("UPDATE months SET allowance_override_cents = ?, updated_at = datetime('now') WHERE id = ?", [
      dto.allowanceOverrideCents ?? null,
      id,
    ]);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Month not found");
    }
    return updated;
  },

  /**
   * Set allowance override for a specific year/month
   */
  async setAllowanceOverride(year: number, month: number, amountCents: number | null): Promise<Month> {
    const monthRecord = await this.getOrCreate(year, month);
    return this.update(monthRecord.id, { allowanceOverrideCents: amountCents });
  },

  /**
   * Clear allowance override (use default)
   */
  async clearAllowanceOverride(year: number, month: number): Promise<Month> {
    return this.setAllowanceOverride(year, month, null);
  },
};
