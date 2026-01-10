import type { Category, CategoryEntity, CreateCategoryDTO, UpdateCategoryDTO } from "@/types";
import { getDatabase } from "../connection";

/**
 * Map database entity to UI model
 */
function mapToCategory(entity: CategoryEntity): Category {
  return {
    id: entity.id,
    name: entity.name,
    icon: entity.icon,
    color: entity.color,
    sortOrder: entity.sort_order,
  };
}

export const CategoryRepository = {
  /**
   * Find category by ID
   */
  async findById(id: number): Promise<Category | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<CategoryEntity>(
      "SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return result ? mapToCategory(result) : null;
  },

  /**
   * Get all active categories
   */
  async findAll(): Promise<Category[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<CategoryEntity>(
      "SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY sort_order ASC"
    );
    return results.map(mapToCategory);
  },

  /**
   * Get all categories including deleted (for export)
   */
  async findAllIncludingDeleted(): Promise<Category[]> {
    const db = await getDatabase();
    const results = await db.getAllAsync<CategoryEntity>("SELECT * FROM categories ORDER BY sort_order ASC");
    return results.map(mapToCategory);
  },

  /**
   * Create a new category
   */
  async create(dto: CreateCategoryDTO): Promise<Category> {
    const db = await getDatabase();

    // Get next sort order if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const result = await db.getFirstAsync<{ maxOrder: number | null }>(
        "SELECT MAX(sort_order) as maxOrder FROM categories"
      );
      sortOrder = (result?.maxOrder ?? -1) + 1;
    }

    const result = await db.runAsync("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)", [
      dto.name,
      dto.icon ?? null,
      dto.color ?? null,
      sortOrder,
    ]);

    const created = await this.findById(result.lastInsertRowId);
    if (!created) {
      throw new Error("Failed to create category");
    }
    return created;
  },

  /**
   * Update an existing category
   */
  async update(id: number, dto: UpdateCategoryDTO): Promise<Category> {
    const db = await getDatabase();
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (dto.name !== undefined) {
      updates.push("name = ?");
      values.push(dto.name);
    }
    if (dto.icon !== undefined) {
      updates.push("icon = ?");
      values.push(dto.icon);
    }
    if (dto.color !== undefined) {
      updates.push("color = ?");
      values.push(dto.color);
    }
    if (dto.sortOrder !== undefined) {
      updates.push("sort_order = ?");
      values.push(dto.sortOrder);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error("Category not found");
      return existing;
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await db.runAsync(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Category not found");
    }
    return updated;
  },

  /**
   * Soft delete a category
   */
  async softDelete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE categories SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [
      id,
    ]);
  },
};
