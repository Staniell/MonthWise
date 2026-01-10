import { getDatabase } from "../connection";

export const SettingsRepository = {
  /**
   * Get a setting value by key
   */
  async get(key: string): Promise<string | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = ?", [key]);
    return result ? result.value : null;
  },

  /**
   * Set a setting value
   */
  async set(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))", [
      key,
      value,
    ]);
  },
};
