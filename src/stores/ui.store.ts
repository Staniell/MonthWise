import { create } from "zustand";

interface UIState {
  // Modal states
  isAddExpenseModalVisible: boolean;
  isEditExpenseModalVisible: boolean;
  isAllowanceSourcesModalVisible: boolean;
  isMonthOverrideModalVisible: boolean;
  isExportImportModalVisible: boolean;
  isProfileSecurityModalVisible: boolean;
  isVerifyExpensesModalVisible: boolean;

  // Edit targets
  editingExpenseId: number | null;
  editingAllowanceSourceId: number | null;

  // Actions
  showAddExpenseModal: () => void;
  showEditExpenseModal: (expenseId: number) => void;
  hideExpenseModal: () => void;

  showAllowanceSourcesModal: () => void;
  hideAllowanceSourcesModal: () => void;
  setEditingAllowanceSource: (id: number | null) => void;

  showMonthOverrideModal: () => void;
  hideMonthOverrideModal: () => void;

  showExportImportModal: () => void;
  hideExportImportModal: () => void;

  showProfileSecurityModal: () => void;
  hideProfileSecurityModal: () => void;

  showVerifyExpensesModal: () => void;
  hideVerifyExpensesModal: () => void;

  hideAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isAddExpenseModalVisible: false,
  isEditExpenseModalVisible: false,
  isAllowanceSourcesModalVisible: false,
  isMonthOverrideModalVisible: false,
  isExportImportModalVisible: false,
  isProfileSecurityModalVisible: false,
  isVerifyExpensesModalVisible: false,
  editingExpenseId: null,
  editingAllowanceSourceId: null,

  // Expense modal actions
  showAddExpenseModal: () =>
    set({
      isAddExpenseModalVisible: true,
      isEditExpenseModalVisible: false,
      editingExpenseId: null,
    }),

  showEditExpenseModal: (expenseId: number) =>
    set({
      isAddExpenseModalVisible: false,
      isEditExpenseModalVisible: true,
      editingExpenseId: expenseId,
    }),

  hideExpenseModal: () =>
    set({
      isAddExpenseModalVisible: false,
      isEditExpenseModalVisible: false,
      editingExpenseId: null,
    }),

  // Allowance modal actions
  showAllowanceSourcesModal: () =>
    set({
      isAllowanceSourcesModalVisible: true,
      editingAllowanceSourceId: null,
    }),

  hideAllowanceSourcesModal: () =>
    set({
      isAllowanceSourcesModalVisible: false,
      editingAllowanceSourceId: null,
    }),

  setEditingAllowanceSource: (id: number | null) => set({ editingAllowanceSourceId: id }),

  // Month override modal
  showMonthOverrideModal: () => set({ isMonthOverrideModalVisible: true }),
  hideMonthOverrideModal: () => set({ isMonthOverrideModalVisible: false }),

  // Export/Import modal
  showExportImportModal: () => set({ isExportImportModalVisible: true }),
  hideExportImportModal: () => set({ isExportImportModalVisible: false }),

  // Profile Security modal
  showProfileSecurityModal: () => set({ isProfileSecurityModalVisible: true }),
  hideProfileSecurityModal: () => set({ isProfileSecurityModalVisible: false }),

  // Verify Expenses modal
  showVerifyExpensesModal: () => set({ isVerifyExpensesModalVisible: true }),
  hideVerifyExpensesModal: () => set({ isVerifyExpensesModalVisible: false }),

  // Reset all
  hideAllModals: () =>
    set({
      isAddExpenseModalVisible: false,
      isEditExpenseModalVisible: false,
      isAllowanceSourcesModalVisible: false,
      isMonthOverrideModalVisible: false,
      isExportImportModalVisible: false,
      isProfileSecurityModalVisible: false,
      isVerifyExpensesModalVisible: false,
      editingExpenseId: null,
      editingAllowanceSourceId: null,
    }),
}));
