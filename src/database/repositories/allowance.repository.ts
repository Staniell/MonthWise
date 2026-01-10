import type {
  AllowanceSource,
  AllowanceSourceEntity,
  CreateAllowanceSourceDTO,
  UpdateAllowanceSourceDTO,
} from "@/types";
import { getDatabase } from "../connection";

/**
 * Map database entity to UI model
 */
function mapToAllowanceSource(entity: AllowanceSourceEntity): AllowanceSource {
  return {
    id: entity.id,
    year: entity.year,
    name: entity.name,
    amountCents: entity.amount_cents,
    isActive: entity.is_active === 1,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    deletedAt: entity.deleted_at,
  };
}

export const AllowanceRepository = {
  /**
   * Find allowance source by ID
   */
  async findById(id: number): Promise<AllowanceSource | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<AllowanceSourceEntity>(
      "SELECT * FROM allowance_sources WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return result ? mapToAllowanceSource(result) : null;
  },

  /**
   * Get all active allowance sources for a specific year and profile
   */
  async findAllActiveByYear(year: number, profileId: number = 1): Promise<AllowanceSource[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<AllowanceSourceEntity>(
      "SELECT * FROM allowance_sources WHERE profile_id = ? AND year = ? AND deleted_at IS NULL AND is_active = 1 ORDER BY created_at ASC",
      [profileId, year]
    );
    return results.map(mapToAllowanceSource);
  },

  /**
   * Get all allowance sources for a profile (including inactive, excluding deleted)
   */
  async findAll(profileId?: number): Promise<AllowanceSource[]> {
    const db = await getDatabase();
    if (profileId !== undefined) {
      const results = await db.getAllAsync<AllowanceSourceEntity>(
        "SELECT * FROM allowance_sources WHERE profile_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        [profileId]
      );
      return results.map(mapToAllowanceSource);
    }
    const results = await db.getAllAsync<AllowanceSourceEntity>(
      "SELECT * FROM allowance_sources WHERE deleted_at IS NULL ORDER BY created_at ASC"
    );
    return results.map(mapToAllowanceSource);
  },

  /**
   * Get all including deleted (for export)
   */
  async findAllIncludingDeleted(profileId?: number): Promise<AllowanceSource[]> {
    const db = await getDatabase();
    if (profileId !== undefined) {
      const results = await db.getAllAsync<AllowanceSourceEntity>(
        "SELECT * FROM allowance_sources WHERE profile_id = ? ORDER BY created_at ASC",
        [profileId]
      );
      return results.map(mapToAllowanceSource);
    }
    const results = await db.getAllAsync<AllowanceSourceEntity>(
      "SELECT * FROM allowance_sources ORDER BY created_at ASC"
    );
    return results.map(mapToAllowanceSource);
  },

  /**
   * Create a new allowance source for a profile
   */
  async create(dto: CreateAllowanceSourceDTO, profileId: number = 1): Promise<AllowanceSource> {
    const db = await getDatabase();
    const result = await db.runAsync(
      "INSERT INTO allowance_sources (profile_id, year, name, amount_cents, is_active) VALUES (?, ?, ?, ?, ?)",
      [profileId, dto.year, dto.name, dto.amountCents, dto.isActive !== false ? 1 : 0]
    );

    const created = await this.findById(result.lastInsertRowId);
    if (!created) {
      throw new Error("Failed to create allowance source");
    }
    return created;
  },

  /**
   * Update an existing allowance source
   */
  async update(id: number, dto: UpdateAllowanceSourceDTO): Promise<AllowanceSource> {
    const db = await getDatabase();
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (dto.name !== undefined) {
      updates.push("name = ?");
      values.push(dto.name);
    }
    if (dto.amountCents !== undefined) {
      updates.push("amount_cents = ?");
      values.push(dto.amountCents);
    }
    if (dto.isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(dto.isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error("Allowance source not found");
      return existing;
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(`UPDATE allowance_sources SET ${updates.join(", ")} WHERE id = ?`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Allowance source not found");
    }
    return updated;
  },

  /**
   * Soft delete an allowance source
   */
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE allowance_sources SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  },

  /**
   * Calculate total monthly allowance from all active sources for a profile/year
   */
  async calculateTotalAllowance(year: number, profileId: number = 1): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number | null }>(
      "SELECT SUM(amount_cents) as total FROM allowance_sources WHERE profile_id = ? AND year = ? AND deleted_at IS NULL AND is_active = 1",
      [profileId, year]
    );
    return result?.total ?? 0;
  },
};
