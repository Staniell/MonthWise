// Database migrations - forward-only schema changes
import type * as SQLite from "expo-sqlite";

/**
 * Run all pending migrations based on current schema version
 */
export async function runMigrations(db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> {
  console.log(`Running migrations from v${fromVersion} to v${toVersion}`);

  // Always ensure year column exists (idempotent check)
  await migrateAddYearToAllowanceSources(db);

  // Always ensure profiles support exists (idempotent check)
  // This runs regardless of version to handle any edge cases
  await migrateAddProfiles(db);
}

/**
 * Migration: Add year column to allowance_sources
 * Sets all existing records to year 2026
 */
async function migrateAddYearToAllowanceSources(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log("=== MIGRATION START: Adding year column ===");

  try {
    // Check current table structure
    const tableInfo = await db.getAllAsync<{ name: string; type: string }>("PRAGMA table_info(allowance_sources)");
    console.log("Current columns:", tableInfo.map((c) => c.name).join(", "));

    const hasYearColumn = tableInfo.some((col) => col.name === "year");
    console.log("Has year column already:", hasYearColumn);

    if (!hasYearColumn) {
      console.log("Attempting to add year column...");
      await db.runAsync("ALTER TABLE allowance_sources ADD COLUMN year INTEGER NOT NULL DEFAULT 2026");
      console.log("SUCCESS: Added year column to allowance_sources");
    } else {
      console.log("Year column already exists, skipping");
    }
  } catch (error: unknown) {
    console.error("MIGRATION ERROR:", error);
    // Column might already exist with a different error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("duplicate column")) {
      throw error;
    }
  }

  console.log("=== MIGRATION END ===");
}

/**
 * Migration: Add profiles table and link existing data to Default profile
 */
async function migrateAddProfiles(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log("=== MIGRATION START: Adding profiles support ===");

  try {
    // Check if profiles table exists
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'"
    );

    if (tables.length === 0) {
      // Create profiles table
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      console.log("Created profiles table");

      // Insert default profile
      await db.runAsync("INSERT INTO profiles (id, name) VALUES (1, 'Default')");
      console.log("Inserted Default profile");
    }

    // Add profile_id to months if not exists
    const monthsInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(months)");
    const monthsHasProfile = monthsInfo.some((col) => col.name === "profile_id");

    if (!monthsHasProfile) {
      await db.runAsync("ALTER TABLE months ADD COLUMN profile_id INTEGER NOT NULL DEFAULT 1");
      console.log("Added profile_id to months");
    }

    // Add profile_id to allowance_sources if not exists
    const allowanceInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(allowance_sources)");
    const allowanceHasProfile = allowanceInfo.some((col) => col.name === "profile_id");

    if (!allowanceHasProfile) {
      await db.runAsync("ALTER TABLE allowance_sources ADD COLUMN profile_id INTEGER NOT NULL DEFAULT 1");
      console.log("Added profile_id to allowance_sources");
    }

    // Create indexes
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_months_profile ON months(profile_id)");
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_allowance_sources_profile ON allowance_sources(profile_id)");
  } catch (error: unknown) {
    console.error("MIGRATION ERROR (profiles):", error);
    throw error;
  }

  console.log("=== MIGRATION END ===");
}
