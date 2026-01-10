import { getDatabase } from "../connection";

export interface Profile {
  id: number;
  name: string;
  createdAt: string;
}

interface ProfileRow {
  id: number;
  name: string;
  created_at: string;
}

const MAX_PROFILES = 10;

export const ProfileRepository = {
  async getAll(): Promise<Profile[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ProfileRow>("SELECT * FROM profiles ORDER BY id ASC");
    return rows.map(mapRowToProfile);
  },

  async getById(id: number): Promise<Profile | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ProfileRow>("SELECT * FROM profiles WHERE id = ?", [id]);
    return row ? mapRowToProfile(row) : null;
  },

  async create(name: string): Promise<Profile> {
    const db = await getDatabase();

    // Check limit
    const count = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM profiles");
    if (count && count.count >= MAX_PROFILES) {
      throw new Error(`Maximum of ${MAX_PROFILES} profiles allowed`);
    }

    const result = await db.runAsync("INSERT INTO profiles (name) VALUES (?)", [name]);
    const created = await this.getById(result.lastInsertRowId);
    if (!created) throw new Error("Failed to create profile");
    return created;
  },

  async rename(id: number, name: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE profiles SET name = ? WHERE id = ?", [name, id]);
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase();

    // Prevent deleting the last profile
    const count = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM profiles");
    if (count && count.count <= 1) {
      throw new Error("Cannot delete the last profile");
    }

    // Delete profile and cascade to months/allowance_sources (via FK CASCADE)
    await db.runAsync("DELETE FROM profiles WHERE id = ?", [id]);
  },

  async getCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM profiles");
    return result?.count ?? 0;
  },

  async ensureDefaultExists(): Promise<Profile> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<ProfileRow>("SELECT * FROM profiles WHERE id = 1");
    if (existing) {
      return mapRowToProfile(existing);
    }
    await db.runAsync("INSERT INTO profiles (id, name) VALUES (1, 'Default')");
    return { id: 1, name: "Default", createdAt: new Date().toISOString() };
  },
};

function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}
