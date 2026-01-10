import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";
import { CREATE_TABLES, SCHEMA_VERSION } from "./schema";

let database: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Default expense categories with icons and colors
 */
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "🍔", color: "#FF6B6B" },
  { name: "Transportation", icon: "🚗", color: "#4ECDC4" },
  { name: "Utilities", icon: "💡", color: "#FFE66D" },
  { name: "Entertainment", icon: "🎬", color: "#95E1D3" },
  { name: "Shopping", icon: "🛒", color: "#DDA0DD" },
  { name: "Healthcare", icon: "🏥", color: "#87CEEB" },
  { name: "Housing", icon: "🏠", color: "#F4A460" },
  { name: "Education", icon: "📚", color: "#9B59B6" },
  { name: "Personal Care", icon: "💅", color: "#E91E63" },
  { name: "Savings", icon: "💰", color: "#27AE60" },
  { name: "Other", icon: "📦", color: "#95A5A6" },
] as const;

/**
 * Get the database instance, initializing if needed
 * Uses a promise lock to prevent concurrent initialization
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Already initialized
  if (database) {
    return database;
  }

  // Initialization in progress - wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync("monthwise.db");
      await initializeDatabase(db);
      database = db;
      return db;
    } catch (error) {
      initPromise = null; // Reset on error so retry is possible
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
    initPromise = null;
  }
}

/**
 * Initialize database with schema and seed data
 */
async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Create tables if they don't exist
  await db.execAsync(CREATE_TABLES);

  // Check current schema version
  let currentVersion = 0;
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'schema_version'"
    );
    if (result) {
      currentVersion = parseInt(result.value, 10);
    }
  } catch {
    // Table might not exist yet on first run, that's ok
    currentVersion = 0;
  }

  // Run migrations if needed
  if (currentVersion < SCHEMA_VERSION) {
    if (currentVersion > 0) {
      await runMigrations(db, currentVersion, SCHEMA_VERSION);
    }

    // Update schema version
    await db.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('schema_version', ?, datetime('now'))",
      [SCHEMA_VERSION.toString()]
    );
  }

  // Seed default categories if empty
  await seedDefaultCategories(db);

  console.log(`Database initialized with schema version ${SCHEMA_VERSION}`);
}

/**
 * Seed default expense categories if none exist
 */
async function seedDefaultCategories(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories WHERE deleted_at IS NULL"
  );

  if (result && result.count === 0) {
    console.log("Seeding default categories...");

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      if (cat) {
        await db.runAsync("INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)", [
          cat.name,
          cat.icon,
          cat.color,
          i,
        ]);
      }
    }

    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
  }
}

/**
 * Reset database (for development/testing only)
 */
export async function resetDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
    initPromise = null;
  }

  await SQLite.deleteDatabaseAsync("monthwise.db");
  console.log("Database reset complete");
}
