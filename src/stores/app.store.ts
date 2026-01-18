import {
  AllowanceRepository,
  CategoryRepository,
  ExpenseRepository,
  MonthRepository,
  ProfileRepository,
  SettingsRepository,
} from "@/database";
import type { Profile } from "@/database/repositories/profile.repository";
import { CalculationService } from "@/services";
import type {
  AllowanceSource,
  Category,
  CreateAllowanceSourceDTO,
  CreateCategoryDTO,
  CreateExpenseDTO,
  Expense,
  MonthSummary,
  UpdateAllowanceSourceDTO,
  UpdateCategoryDTO,
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
  currency: string;
  hideCents: boolean;

  // Profile support
  currentProfileId: number;
  currentProfileIsSecured: boolean;
  profiles: Profile[];

  // Current month detail view
  selectedMonthId: number | null;
  selectedMonthExpenses: Expense[];

  // --- Loading States ---
  isLoading: boolean;
  isLoadingExpenses: boolean;

  // --- Computed Values ---
  defaultAllowanceCents: number;
  avgAllowanceCents: number;
  totalExcessCents: number;
  totalSpentCents: number;

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
  bulkUpdateExpensePaidStatus: (ids: number[], isPaid: boolean) => Promise<void>;
  bulkDeleteExpenses: (ids: number[]) => Promise<void>;

  // --- Actions: Categories ---
  loadCategories: () => Promise<void>;
  addCategory: (dto: CreateCategoryDTO) => Promise<Category>;
  updateCategory: (id: number, dto: UpdateCategoryDTO) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;

  // --- Actions: Settings ---
  setCurrency: (currency: string) => Promise<void>;
  setHideCents: (hideCents: boolean) => Promise<void>;

  // --- Actions: Profiles ---
  loadProfiles: () => Promise<void>;
  switchProfile: (profileId: number) => Promise<void>;
  createProfile: (name: string) => Promise<Profile>;
  deleteProfile: (id: number) => Promise<void>;
  renameProfile: (id: number, name: string) => Promise<void>;

  // --- Actions: Security ---
  enableProfileSecurity: () => Promise<void>;
  disableProfileSecurity: () => Promise<void>;
  verifyAllExpenses: () => Promise<void>;
  loadSecurityStatus: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // --- Initial State ---
  selectedYear: getCurrentYear(),
  allowanceSources: [],
  categories: [],
  monthSummaries: [],
  currency: "USD",
  hideCents: false,
  currentProfileId: 1,
  currentProfileIsSecured: false,
  profiles: [],
  selectedMonthId: null,
  selectedMonthExpenses: [],
  isLoading: false,
  isLoadingExpenses: false,
  defaultAllowanceCents: 0,
  avgAllowanceCents: 0,
  totalExcessCents: 0,
  totalSpentCents: 0,

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
    const profileId = get().currentProfileId;
    try {
      // Ensure month record exists for this profile
      const monthRecord = await MonthRepository.getOrCreate(year, month, profileId);
      const expenses = await ExpenseRepository.findByMonthId(monthRecord.id);

      // Update the specific month in monthSummaries locally (avoid reloading all data)
      const currentSummaries = get().monthSummaries;
      const updatedSummaries = currentSummaries.map((s) => {
        if (s.month === month && s.year === year) {
          return { ...s, monthId: monthRecord.id };
        }
        return s;
      });

      set({
        selectedMonthId: monthRecord.id,
        selectedMonthExpenses: expenses,
        monthSummaries: updatedSummaries,
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
      await get().loadProfiles();

      // Load saved profile preference
      const savedProfileId = await SettingsRepository.get("currentProfileId");
      if (savedProfileId) {
        const profileId = parseInt(savedProfileId, 10);
        const profiles = get().profiles;
        if (profiles.some((p) => p.id === profileId)) {
          set({ currentProfileId: profileId });
        }
      }

      // Load security status for current profile
      await get().loadSecurityStatus();

      // Load currency preference
      const savedCurrency = await SettingsRepository.get("currency");
      if (savedCurrency) {
        set({ currency: savedCurrency });
      }

      // Load hideCents preference
      const savedHideCents = await SettingsRepository.get("hideCents");
      if (savedHideCents) {
        set({ hideCents: savedHideCents === "true" });
      }

      await get().loadYearData(get().selectedYear);
    } finally {
      set({ isLoading: false });
    }
  },

  loadYearData: async (year: number) => {
    if (get().isLoading) return; // Prevent concurrent loads
    set({ isLoading: true });
    const profileId = get().currentProfileId;
    try {
      // Load allowance sources for the specific year and profile
      const sources = await AllowanceRepository.findAllActiveByYear(year, profileId);
      const defaultAllowance = CalculationService.calculateTotalAllowance(sources);

      // Load months for the year and profile
      const monthRecords = await MonthRepository.findByYear(year, profileId);

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

      // Calculate excess: only up to the current month for this year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      let upToMonth: number;
      if (year < currentYear) {
        // Past year: include all 12 months
        upToMonth = 12;
      } else if (year > currentYear) {
        // Future year: no excess yet
        upToMonth = 0;
      } else {
        // Current year: include only up to and including current month
        upToMonth = currentMonth;
      }

      const totalExcess = CalculationService.calculateTotalExcess(summaries, upToMonth);
      const totalSpent = summaries.reduce((sum, m) => sum + m.spentCents, 0);
      const avgAllowance = Math.round(summaries.reduce((sum, m) => sum + m.allowanceCents, 0) / 12);

      set({
        selectedYear: year,
        allowanceSources: sources,
        monthSummaries: summaries,
        defaultAllowanceCents: defaultAllowance,
        avgAllowanceCents: avgAllowance,
        totalExcessCents: totalExcess,
        totalSpentCents: totalSpent,
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
    const profileId = get().currentProfileId;
    const source = await AllowanceRepository.create(dto, profileId);
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
    const profileId = get().currentProfileId;
    await MonthRepository.setAllowanceOverride(year, month, amountCents, profileId);
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

  bulkUpdateExpensePaidStatus: async (ids: number[], isPaid: boolean) => {
    await ExpenseRepository.bulkUpdatePaidStatus(ids, isPaid);
    await get().refreshData();
  },

  bulkDeleteExpenses: async (ids: number[]) => {
    await ExpenseRepository.bulkDelete(ids);
    await get().refreshData();
  },

  // --- Categories ---
  loadCategories: async () => {
    const categories = await CategoryRepository.findAll();
    set({ categories });
  },

  addCategory: async (dto) => {
    const category = await CategoryRepository.create(dto);
    await get().loadCategories();
    return category;
  },

  updateCategory: async (id, dto) => {
    const category = await CategoryRepository.update(id, dto);
    await get().loadCategories();
    return category;
  },

  deleteCategory: async (id) => {
    await CategoryRepository.softDelete(id);
    await get().loadCategories();
  },

  setCurrency: async (currency: string) => {
    set({ currency });
    await SettingsRepository.set("currency", currency);
  },

  setHideCents: async (hideCents: boolean) => {
    set({ hideCents });
    await SettingsRepository.set("hideCents", hideCents ? "true" : "false");
  },

  // --- Profiles ---
  loadProfiles: async () => {
    const profiles = await ProfileRepository.getAll();
    if (profiles.length === 0) {
      // Ensure default profile exists
      const defaultProfile = await ProfileRepository.ensureDefaultExists();
      set({ profiles: [defaultProfile], currentProfileId: defaultProfile.id });
    } else {
      set({ profiles });
    }
  },

  switchProfile: async (profileId: number) => {
    // First update the profileId so loadYearData uses the correct one
    set({ currentProfileId: profileId });
    await SettingsRepository.set("currentProfileId", String(profileId));
    // Clear selected month when switching profiles
    set({ selectedMonthId: null, selectedMonthExpenses: [] });
    // Now load data for the new profile
    await get().loadYearData(get().selectedYear);
  },

  createProfile: async (name: string) => {
    const profile = await ProfileRepository.create(name);
    const profiles = await ProfileRepository.getAll();
    set({ profiles });
    return profile;
  },

  deleteProfile: async (id: number) => {
    const { currentProfileId } = get();
    await ProfileRepository.delete(id);
    const profiles = await ProfileRepository.getAll();

    // If we deleted the current profile, switch to the first available
    if (currentProfileId === id && profiles.length > 0) {
      await get().switchProfile(profiles[0]!.id);
    }
    set({ profiles });
  },

  renameProfile: async (id: number, name: string) => {
    await ProfileRepository.rename(id, name);
    const profiles = await ProfileRepository.getAll();
    set({ profiles });
  },

  // --- Security ---
  enableProfileSecurity: async () => {
    const { currentProfileId } = get();
    await ProfileRepository.enableSecurity(currentProfileId);
    set({ currentProfileIsSecured: true });
    await get().loadProfiles();
  },

  disableProfileSecurity: async () => {
    const { currentProfileId } = get();
    await ProfileRepository.disableSecurity(currentProfileId);
    set({ currentProfileIsSecured: false });
    await get().loadProfiles();
  },

  verifyAllExpenses: async () => {
    const { selectedMonthId } = get();
    if (!selectedMonthId) return;
    await ExpenseRepository.verifyAllForMonth(selectedMonthId);
    await get().refreshData();
  },

  loadSecurityStatus: async () => {
    const { currentProfileId } = get();
    const settings = await ProfileRepository.getSecuritySettings(currentProfileId);
    set({ currentProfileIsSecured: settings.isSecured });
  },
}));
