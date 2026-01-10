import { getDatabase } from "@/database";
import { AllowanceRepository, CategoryRepository, ExpenseRepository, MonthRepository } from "@/database/repositories";
import type { AllowanceSource, Category, Expense, Month } from "@/types";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// Current export format version
const EXPORT_VERSION = 1;

/**
 * Export data structure
 */
export interface ExportData {
  version: number;
  exportedAt: string;
  appVersion: string;
  data: {
    allowanceSources: AllowanceSource[];
    categories: Category[];
    months: Month[];
    expenses: Expense[];
  };
}

export interface ImportResult {
  success: boolean;
  recordsImported: number;
  message?: string;
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

/**
 * Export all app data to JSON string
 */
export async function exportAllData(): Promise<string> {
  const allowanceSources = await AllowanceRepository.findAll();
  const categories = await CategoryRepository.findAll();
  const months = await MonthRepository.findAll();
  const expenses = await ExpenseRepository.findAll();

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? "1.0.0",
    data: {
      allowanceSources,
      categories,
      months,
      expenses,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export data and trigger share sheet
 */
export async function exportAndShare(): Promise<boolean> {
  try {
    const jsonData = await exportAllData();
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `monthwise-backup-${timestamp}.json`;
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error("Cache directory not available");
    }
    const filePath = `${cacheDir}${fileName}`;

    // Write to temp file
    await FileSystem.writeAsStringAsync(filePath, jsonData);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Sharing is not available on this device");
    }

    // Open share sheet
    await Sharing.shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Export MonthWise Data",
    });

    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
}

/**
 * Validate export data structure
 */
function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "number") return false;
  if (typeof obj.exportedAt !== "string") return false;
  if (!obj.data || typeof obj.data !== "object") return false;

  const dataObj = obj.data as Record<string, unknown>;
  if (!Array.isArray(dataObj.allowanceSources)) return false;
  if (!Array.isArray(dataObj.categories)) return false;
  if (!Array.isArray(dataObj.months)) return false;
  if (!Array.isArray(dataObj.expenses)) return false;

  return true;
}

/**
 * Import data from JSON string
 */
export async function importData(jsonString: string): Promise<ImportResult> {
  let data: unknown;

  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new ImportError("Invalid JSON format");
  }

  // Validate structure
  if (!validateExportData(data)) {
    throw new ImportError("Invalid export file structure");
  }

  // Check version compatibility
  if (data.version > EXPORT_VERSION) {
    throw new ImportError(`Export file is from a newer app version (v${data.version}). Please update the app.`);
  }

  const db = await getDatabase();

  // Use transaction for atomicity
  await db.execAsync("BEGIN TRANSACTION");

  try {
    // Clear existing data in reverse dependency order
    await db.execAsync("DELETE FROM expenses");
    await db.execAsync("DELETE FROM months");
    await db.execAsync("DELETE FROM categories");
    await db.execAsync("DELETE FROM allowance_sources");

    // Import categories
    for (const cat of data.data.categories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, sort_order, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [cat.id, cat.name, cat.icon ?? null, cat.color ?? null, cat.sortOrder]
      );
    }

    // Import allowance sources
    for (const src of data.data.allowanceSources) {
      await db.runAsync(
        `INSERT INTO allowance_sources (id, name, amount_cents, is_active, created_at, updated_at, deleted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [src.id, src.name, src.amountCents, src.isActive ? 1 : 0, src.createdAt, src.updatedAt, src.deletedAt ?? null]
      );
    }

    // Import months
    for (const month of data.data.months) {
      await db.runAsync(
        `INSERT INTO months (id, year, month, allowance_override_cents, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [month.id, month.year, month.month, month.allowanceOverrideCents ?? null, month.createdAt, month.updatedAt]
      );
    }

    // Import expenses
    for (const exp of data.data.expenses) {
      await db.runAsync(
        `INSERT INTO expenses (id, month_id, category_id, amount_cents, note, expense_date, created_at, updated_at, deleted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          exp.id,
          exp.monthId,
          exp.categoryId,
          exp.amountCents,
          exp.note ?? null,
          exp.expenseDate,
          exp.createdAt,
          exp.updatedAt,
          exp.deletedAt ?? null,
        ]
      );
    }

    await db.execAsync("COMMIT");

    const totalRecords =
      data.data.allowanceSources.length +
      data.data.categories.length +
      data.data.months.length +
      data.data.expenses.length;

    return {
      success: true,
      recordsImported: totalRecords,
      message: `Successfully imported ${totalRecords} records`,
    };
  } catch (error) {
    await db.execAsync("ROLLBACK");
    console.error("Import failed:", error);
    throw new ImportError(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Pick a file and import data
 */
export async function pickAndImport(): Promise<ImportResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const file = result.assets[0];
    if (!file) {
      throw new ImportError("No file selected");
    }

    const content = await FileSystem.readAsStringAsync(file.uri);

    return await importData(content);
  } catch (error) {
    if (error instanceof ImportError) {
      throw error;
    }
    throw new ImportError(`Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
