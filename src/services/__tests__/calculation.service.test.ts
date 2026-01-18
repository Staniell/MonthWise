import type { AllowanceSource, Expense, MonthSummary } from "@/types";
import { CalculationService } from "../calculation.service";

describe("CalculationService", () => {
  describe("calculateTotalAllowance", () => {
    it("should return 0 for empty array", () => {
      expect(CalculationService.calculateTotalAllowance([])).toBe(0);
    });

    it("should sum only active, non-deleted sources", () => {
      const sources: AllowanceSource[] = [
        {
          id: 1,
          year: 2026,
          name: "Salary",
          amountCents: 500000,
          isActive: true,
          deletedAt: null,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 2,
          year: 2026,
          name: "Side job",
          amountCents: 100000,
          isActive: true,
          deletedAt: null,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 3,
          year: 2026,
          name: "Inactive",
          amountCents: 50000,
          isActive: false,
          deletedAt: null,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 4,
          year: 2026,
          name: "Deleted",
          amountCents: 30000,
          isActive: true,
          deletedAt: "2026-01-01",
          createdAt: "",
          updatedAt: "",
        },
      ];
      expect(CalculationService.calculateTotalAllowance(sources)).toBe(600000); // 5000 + 1000
    });
  });

  describe("calculateTotalSpent", () => {
    it("should return 0 for empty array", () => {
      expect(CalculationService.calculateTotalSpent([])).toBe(0);
    });

    it("should sum non-deleted expenses", () => {
      const expenses: Expense[] = [
        {
          id: 1,
          monthId: 1,
          categoryId: 1,
          amountCents: 1000,
          note: null,
          expenseDate: "2026-01-01",
          isPaid: true,
          isVerified: false,
          createdAt: "",
          updatedAt: "",
          deletedAt: null,
        },
        {
          id: 2,
          monthId: 1,
          categoryId: 2,
          amountCents: 2500,
          note: null,
          expenseDate: "2026-01-02",
          isPaid: true,
          isVerified: false,
          createdAt: "",
          updatedAt: "",
          deletedAt: null,
        },
        {
          id: 3,
          monthId: 1,
          categoryId: 1,
          amountCents: 500,
          note: null,
          expenseDate: "2026-01-03",
          isPaid: true,
          isVerified: false,
          createdAt: "",
          updatedAt: "",
          deletedAt: "2026-01-04",
        },
      ];
      expect(CalculationService.calculateTotalSpent(expenses)).toBe(3500); // 1000 + 2500
    });
  });

  describe("calculateRemaining", () => {
    it("should return positive when under budget", () => {
      expect(CalculationService.calculateRemaining(10000, 7000)).toBe(3000);
    });

    it("should return negative when over budget", () => {
      expect(CalculationService.calculateRemaining(10000, 12000)).toBe(-2000);
    });

    it("should return zero when exactly on budget", () => {
      expect(CalculationService.calculateRemaining(10000, 10000)).toBe(0);
    });
  });

  describe("calculateTotalExcess", () => {
    const summaries: MonthSummary[] = [
      {
        year: 2026,
        month: 1,
        monthId: 1,
        allowanceCents: 10000,
        allowanceOverrideCents: null,
        spentCents: 8000,
        balanceCents: 0,
        remainingCents: 2000,
        expenseCount: 5,
      },
      {
        year: 2026,
        month: 2,
        monthId: 2,
        allowanceCents: 10000,
        allowanceOverrideCents: null,
        spentCents: 12000,
        balanceCents: 0,
        remainingCents: -2000,
        expenseCount: 8,
      },
      {
        year: 2026,
        month: 3,
        monthId: 3,
        allowanceCents: 10000,
        allowanceOverrideCents: null,
        spentCents: 5000,
        balanceCents: 0,
        remainingCents: 5000,
        expenseCount: 3,
      },
    ];

    it("should sum only positive remainders up to specified month", () => {
      // Up to month 3: 2000 (Jan) + 5000 (Mar) = 7000
      expect(CalculationService.calculateTotalExcess(summaries, 3)).toBe(7000);
    });

    it("should filter by month correctly", () => {
      // Up to month 1: only 2000 (Jan)
      expect(CalculationService.calculateTotalExcess(summaries, 1)).toBe(2000);
    });

    it("should return 0 if upToMonth is 0", () => {
      expect(CalculationService.calculateTotalExcess(summaries, 0)).toBe(0);
    });
  });

  describe("getMonthlyAllowance", () => {
    it("should return default when no month record", () => {
      expect(CalculationService.getMonthlyAllowance(null, 50000)).toBe(50000);
    });

    it("should return default when no override set", () => {
      const month = { id: 1, year: 2026, month: 1, allowanceOverrideCents: null, createdAt: "", updatedAt: "" };
      expect(CalculationService.getMonthlyAllowance(month, 50000)).toBe(50000);
    });

    it("should return override when set", () => {
      const month = { id: 1, year: 2026, month: 1, allowanceOverrideCents: 75000, createdAt: "", updatedAt: "" };
      expect(CalculationService.getMonthlyAllowance(month, 50000)).toBe(75000);
    });
  });

  describe("calculateSpentPercentage", () => {
    it("should calculate percentage correctly", () => {
      expect(CalculationService.calculateSpentPercentage(5000, 10000)).toBe(50);
    });

    it("should return null when allowance is 0", () => {
      expect(CalculationService.calculateSpentPercentage(5000, 0)).toBeNull();
    });

    it("should handle over 100%", () => {
      expect(CalculationService.calculateSpentPercentage(15000, 10000)).toBe(150);
    });
  });
});
