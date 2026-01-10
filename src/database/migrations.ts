// Database migrations - forward-only schema changes
import type * as SQLite from "expo-sqlite";

/**
 * Run all pending migrations based on current schema version
 */
export async function runMigrations(db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> {
  console.log(`Running migrations from v${fromVersion} to v${toVersion}`);

  // Always ensure year column exists (idempotent check)
  await migrateAddYearToAllowanceSources(db);
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
