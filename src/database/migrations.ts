// Database migrations - forward-only schema changes
import type * as SQLite from "expo-sqlite";

/**
 * Run all pending migrations based on current schema version
 */
export async function runMigrations(db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> {
  console.log(`Running migrations from v${fromVersion} to v${toVersion}`);

  // Future migrations go here in order
  // if (fromVersion < 2 && toVersion >= 2) {
  //   await migrateV1toV2(db);
  // }
  // if (fromVersion < 3 && toVersion >= 3) {
  //   await migrateV2toV3(db);
  // }
}

// Example migration template for future use:
// async function migrateV1toV2(db: SQLite.SQLiteDatabase): Promise<void> {
//   console.log('Migrating from v1 to v2...');
//   await db.execAsync(`
//     ALTER TABLE expenses ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;
//   `);
//   console.log('Migration v1 -> v2 complete');
// }
