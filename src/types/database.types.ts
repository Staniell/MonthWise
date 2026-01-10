// Database types - matches SQLite schema
export interface AllowanceSourceEntity {
  id: number;
  name: string;
  amount_cents: number;
  is_active: number; // SQLite boolean (0 or 1)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoryEntity {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MonthEntity {
  id: number;
  year: number;
  month: number;
  allowance_override_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseEntity {
  id: number;
  month_id: number;
  category_id: number;
  amount_cents: number;
  note: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AppSettingEntity {
  key: string;
  value: string;
  updated_at: string;
}
