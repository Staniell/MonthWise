// UI types - view models for components

export interface AllowanceSource {
  id: number;
  year: number;
  name: string;
  amountCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface Month {
  id: number;
  year: number;
  month: number;
  allowanceOverrideCents: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  monthId: number;
  categoryId: number;
  amountCents: number;
  note: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MonthSummary {
  year: number;
  month: number;
  monthId: number | null;
  allowanceCents: number;
  spentCents: number;
  remainingCents: number;
  expenseCount: number;
}

export interface ExpenseWithCategory extends Expense {
  category: Category;
}

export interface YearSummary {
  year: number;
  totalAllowanceCents: number;
  totalSpentCents: number;
  totalExcessCents: number;
  months: MonthSummary[];
}
