import type { AllowanceSource, Expense, Month, MonthSummary } from "@/types";

/**
 * Calculation service for monetary operations
 * All calculations use integer cents to avoid floating-point errors
 */
export const CalculationService = {
  /**
   * Calculate total monthly allowance from active sources
   * @param sources - Array of allowance sources
   * @returns Total in cents
   */
  calculateTotalAllowance(sources: AllowanceSource[]): number {
    return sources.filter((s) => s.isActive && !s.deletedAt).reduce((sum, source) => sum + source.amountCents, 0);
  },

  /**
   * Get effective allowance for a specific month
   * Uses override if set, otherwise uses default allowance
   * @param month - Month record (may have override)
   * @param defaultAllowanceCents - Default allowance from sources
   * @returns Effective allowance in cents
   */
  getMonthlyAllowance(month: Month | null, defaultAllowanceCents: number): number {
    if (month?.allowanceOverrideCents !== null && month?.allowanceOverrideCents !== undefined) {
      return month.allowanceOverrideCents;
    }
    return defaultAllowanceCents;
  },

  /**
   * Calculate total spent from expenses
   * @param expenses - Array of expenses (should exclude deleted)
   * @returns Total in cents
   */
  calculateTotalSpent(expenses: Expense[]): number {
    return expenses.filter((e) => !e.deletedAt).reduce((sum, expense) => sum + expense.amountCents, 0);
  },

  /**
   * Calculate remaining amount (allowance - spent)
   * Positive = excess/surplus, Negative = deficit/overspent
   * @returns Remaining in cents
   */
  calculateRemaining(allowanceCents: number, spentCents: number): number {
    return allowanceCents - spentCents;
  },

  /**
   * Calculate total excess across all months
   * Only counts positive remainders (savings)
   * @param summaries - Array of month summaries
   * @returns Total excess in cents
   */
  calculateTotalExcess(summaries: MonthSummary[]): number {
    return summaries.filter((m) => m.remainingCents > 0).reduce((sum, m) => sum + m.remainingCents, 0);
  },

  /**
   * Calculate total deficit across all months
   * Only counts negative remainders (overspending)
   * @returns Total deficit as positive number in cents
   */
  calculateTotalDeficit(summaries: MonthSummary[]): number {
    return summaries.filter((m) => m.remainingCents < 0).reduce((sum, m) => sum + Math.abs(m.remainingCents), 0);
  },

  /**
   * Calculate net savings (excess - deficit)
   * @returns Net amount in cents (can be negative)
   */
  calculateNetSavings(summaries: MonthSummary[]): number {
    return summaries.reduce((sum, m) => sum + m.remainingCents, 0);
  },

  /**
   * Create a month summary from raw data
   */
  createMonthSummary(
    year: number,
    month: number,
    monthRecord: Month | null,
    defaultAllowanceCents: number,
    expenses: Expense[]
  ): MonthSummary {
    const allowanceCents = this.getMonthlyAllowance(monthRecord, defaultAllowanceCents);
    const spentCents = this.calculateTotalSpent(expenses);
    const remainingCents = this.calculateRemaining(allowanceCents, spentCents);

    return {
      year,
      month,
      monthId: monthRecord?.id ?? null,
      allowanceCents,
      spentCents,
      remainingCents,
      expenseCount: expenses.filter((e) => !e.deletedAt).length,
    };
  },

  /**
   * Calculate spending by category
   * @returns Array sorted by total descending
   */
  calculateCategoryBreakdown(expenses: Expense[]): { categoryId: number; totalCents: number; count: number }[] {
    const breakdown = new Map<number, { totalCents: number; count: number }>();

    for (const expense of expenses) {
      if (expense.deletedAt) continue;

      const existing = breakdown.get(expense.categoryId) ?? { totalCents: 0, count: 0 };
      breakdown.set(expense.categoryId, {
        totalCents: existing.totalCents + expense.amountCents,
        count: existing.count + 1,
      });
    }

    return Array.from(breakdown.entries())
      .map(([categoryId, data]) => ({ categoryId, ...data }))
      .sort((a, b) => b.totalCents - a.totalCents);
  },

  /**
   * Calculate percentage of allowance spent
   * @returns Percentage (0-100+), null if no allowance
   */
  calculateSpentPercentage(spentCents: number, allowanceCents: number): number | null {
    if (allowanceCents === 0) return null;
    return Math.round((spentCents / allowanceCents) * 100);
  },

  /**
   * Calculate average daily spending for a month
   * @param daysInMonth - Number of days in the month
   * @returns Average in cents
   */
  calculateDailyAverage(spentCents: number, daysInMonth: number): number {
    if (daysInMonth === 0) return 0;
    return Math.round(spentCents / daysInMonth);
  },

  /**
   * Get number of days in a month
   */
  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  },
};
