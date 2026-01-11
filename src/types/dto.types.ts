// DTOs - Data Transfer Objects for create/update operations

export interface CreateAllowanceSourceDTO {
  year: number;
  name: string;
  amountCents: number;
  isActive?: boolean;
}

export interface UpdateAllowanceSourceDTO {
  name?: string;
  amountCents?: number;
  isActive?: boolean;
}

export interface CreateCategoryDTO {
  name: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDTO {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateMonthDTO {
  year: number;
  month: number;
  allowanceOverrideCents?: number | null;
}

export interface UpdateMonthDTO {
  allowanceOverrideCents?: number | null;
}

export interface CreateExpenseDTO {
  monthId: number;
  categoryId: number;
  amountCents: number;
  note?: string;
  expenseDate?: string;
}

export interface UpdateExpenseDTO {
  categoryId?: number;
  amountCents?: number;
  note?: string;
  expenseDate?: string;
  isPaid?: boolean;
}
