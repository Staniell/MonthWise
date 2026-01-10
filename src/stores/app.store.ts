import { AllowanceRepository, CategoryRepository, ExpenseRepository, MonthRepository } from "@/database";
import { CalculationService } from "@/services";
import type {
  AllowanceSource,
  Category,
  CreateAllowanceSourceDTO,
  CreateExpenseDTO,
  Expense,
  MonthSummary,
  UpdateAllowanceSourceDTO,
  UpdateExpenseDTO,
} from "@/types";
import { getCurrentYear } from "@/utils";
import { create } from "zustand";

interface AppState {
  // --- Data ---
  selectedYear: number;
  allowanceSources: AllowanceSource[];
  categories: Category[];
  monthSummaries: MonthSummary[];

  // Current month detail view
  selectedMonthId: number | null;
  selectedMonthExpenses: Expense[];

  // --- Loading States ---
  isLoading: boolean;
  isLoadingExpenses: boolean;

  // --- Computed Values ---
  defaultAllowanceCents: number;
  totalExcessCents: number;

  // --- Actions: Navigation ---
  setSelectedYear: (year: number) => void;
  selectMonth: (year: number, month: number) => Promise<void>;
  clearSelectedMonth: () => void;

  // --- Actions: Data Loading ---
  initialize: () => Promise<void>;
  loadYearData: (year: number) => Promise<void>;
  refreshData: () => Promise<void>;

  // --- Actions: Allowance Sources ---
  addAllowanceSource: (dto: CreateAllowanceSourceDTO) => Promise<AllowanceSource>;
  updateAllowanceSource: (id: number, dto: UpdateAllowanceSourceDTO) => Promise<AllowanceSource>;
  deleteAllowanceSource: (id: number) => Promise<void>;

  // --- Actions: Month Allowance Override ---
  setMonthAllowanceOverride: (year: number, month: number, amountCents: number | null) => Promise<void>;

  // --- Actions: Expenses ---
  addExpense: (dto: CreateExpenseDTO) => Promise<Expense>;
  updateExpense: (id: number, dto: UpdateExpenseDTO) => Promise<Expense>;
  deleteExpense: (id: number) => Promise<void>;

  // --- Actions: Categories ---
  loadCategories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // --- Initial State ---
  selectedYear: getCurrentYear(),
  allowanceSources: [],
  categories: [],
  monthSummaries: [],
  selectedMonthId: null,
  selectedMonthExpenses: [],
  isLoading: false,
  isLoadingExpenses: false,
  defaultAllowanceCents: 0,
  totalExcessCents: 0,

  // --- Navigation ---
  setSelectedYear: (year: number) => {
    const MIN_YEAR = 2026;
    const MAX_YEAR = 2030;
    if (year < MIN_YEAR || year > MAX_YEAR) return;
    set({ selectedYear: year });
    get().loadYearData(year);
  },

  selectMonth: async (year: number, month: number) => {
    set({ isLoadingExpenses: true });
    try {
      // Ensure month record exists
      const monthRecord = await MonthRepository.getOrCreate(year, month);
      const expenses = await ExpenseRepository.findByMonthId(monthRecord.id);

      set({
        selectedMonthId: monthRecord.id,
        selectedMonthExpenses: expenses,
        isLoadingExpenses: false,
      });
    } catch (error) {
      console.error("Failed to select month:", error);
      set({ isLoadingExpenses: false });
    }
  },

  clearSelectedMonth: () => {
    set({
      selectedMonthId: null,
      selectedMonthExpenses: [],
    });
  },

  // --- Data Loading ---
  initialize: async () => {
    set({ isLoading: true });
    try {
      await get().loadCategories();
      await get().loadYearData(get().selectedYear);
    } finally {
      set({ isLoading: false });
    }
  },

  loadYearData: async (year: number) => {
    if (get().isLoading) return; // Prevent concurrent loads
    set({ isLoading: true });
    try {
      // Load allowance sources
      const sources = await AllowanceRepository.findAllActive();
      const defaultAllowance = CalculationService.calculateTotalAllowance(sources);

      // Load months for the year
      const monthRecords = await MonthRepository.findByYear(year);

      // Build summaries for all 12 months in parallel
      const summaryPromises = Array.from({ length: 12 }, async (_, i) => {
        const m = i + 1;
        const monthRecord = monthRecords.find((r) => r.month === m) ?? null;
        let expenses: Expense[] = [];

        if (monthRecord) {
          expenses = await ExpenseRepository.findByMonthId(monthRecord.id);
        }

        return CalculationService.createMonthSummary(year, m, monthRecord, defaultAllowance, expenses);
      });

      const summaries = await Promise.all(summaryPromises);
      const totalExcess = CalculationService.calculateTotalExcess(summaries);

      set({
        selectedYear: year,
        allowanceSources: sources,
        monthSummaries: summaries,
        defaultAllowanceCents: defaultAllowance,
        totalExcessCents: totalExcess,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load year data:", error);
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    await get().loadYearData(get().selectedYear);

    // If a month is selected, refresh its expenses too
    const { selectedMonthId } = get();
    if (selectedMonthId) {
      const expenses = await ExpenseRepository.findByMonthId(selectedMonthId);
      set({ selectedMonthExpenses: expenses });
    }
  },

  // --- Allowance Sources ---
  addAllowanceSource: async (dto: CreateAllowanceSourceDTO) => {
    const source = await AllowanceRepository.create(dto);
    await get().refreshData();
    return source;
  },

  updateAllowanceSource: async (id: number, dto: UpdateAllowanceSourceDTO) => {
    const source = await AllowanceRepository.update(id, dto);
    await get().refreshData();
    return source;
  },

  deleteAllowanceSource: async (id: number) => {
    await AllowanceRepository.softDelete(id);
    await get().refreshData();
  },

  // --- Month Override ---
  setMonthAllowanceOverride: async (year: number, month: number, amountCents: number | null) => {
    await MonthRepository.setAllowanceOverride(year, month, amountCents);
    await get().refreshData();
  },

  // --- Expenses ---
  addExpense: async (dto: CreateExpenseDTO) => {
    const expense = await ExpenseRepository.create(dto);
    await get().refreshData();
    return expense;
  },

  updateExpense: async (id: number, dto: UpdateExpenseDTO) => {
    const expense = await ExpenseRepository.update(id, dto);
    await get().refreshData();
    return expense;
  },

  deleteExpense: async (id: number) => {
    await ExpenseRepository.softDelete(id);
    await get().refreshData();
  },

  // --- Categories ---
  loadCategories: async () => {
    const categories = await CategoryRepository.findAll();
    set({ categories });
  },
}));
