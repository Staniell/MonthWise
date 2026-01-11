import { AppText, Button, Card, FAB, Input } from "@/components/common";
import { AddExpenseModal } from "@/components/expense/AddExpenseModal";
import { ExpenseItem } from "@/components/expense/ExpenseItem";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { ExpenseWithCategory } from "@/types";
import { formatCurrency, formatForInput, formatWithSign, getMonthName, parseToCents } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from "react-native";

export const MonthDetailScreen = () => {
  const router = useRouter();
  const {
    selectedMonthId,
    selectedMonthExpenses,
    monthSummaries,
    categories,
    clearSelectedMonth,
    currency,
    hideCents,
    setMonthAllowanceOverride,
    defaultAllowanceCents,
    bulkUpdateExpensePaidStatus,
    bulkDeleteExpenses,
  } = useAppStore();

  const { showAddExpenseModal, showEditExpenseModal } = useUIStore();

  const currentSummary = monthSummaries.find((m) => m.monthId === selectedMonthId);
  const monthName = currentSummary ? getMonthName(currentSummary.month) : "Month Detail";

  // State for allowance editing
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [allowanceInput, setAllowanceInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // State for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Join expenses with categories
  const expensesWithCategories: ExpenseWithCategory[] = selectedMonthExpenses.map((expense) => {
    const category = categories.find((c) => c.id === expense.categoryId) || {
      id: 0,
      name: "Unknown",
      icon: "❓",
      color: colors.textMuted,
      sortOrder: 999,
    };
    return { ...expense, category };
  });

  // Group expenses by category
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());

  // 1. Group expenses
  const expensesByCategory = expensesWithCategories.reduce((acc, expense) => {
    const catId = expense.category.id;
    if (!acc[catId]) {
      acc[catId] = {
        category: expense.category,
        data: [],
        totalCents: 0,
        id: catId,
      };
    }
    acc[catId].data.push(expense);
    acc[catId].totalCents += expense.amountCents;
    return acc;
  }, {} as Record<number, { category: any; data: ExpenseWithCategory[]; totalCents: number; id: number }>);

  // 2. Sort categories and expenses
  const sortedSections = Object.values(expensesByCategory)
    .map((section) => ({
      ...section,
      // Calculate fully paid status
      isFullyPaid: section.data.length > 0 && section.data.every((e) => e.isPaid),
      // Sort expenses by id descending (latest first) within category
      data: section.data.sort((a, b) => b.id - a.id),
      // Original count for display even when collapsed
      originalDataCount: section.data.length,
    }))
    .sort((a, b) => {
      // Sort by Paid status first (Unpaid first)
      if (a.isFullyPaid !== b.isFullyPaid) {
        return a.isFullyPaid ? 1 : -1;
      }
      // Then by sort order
      return (a.category.sortOrder ?? 999) - (b.category.sortOrder ?? 999);
    });

  // 3. Prepare sections for SectionList (filtering collapsed)
  const sections = sortedSections.map((section) => ({
    ...section,
    // If collapsed, provide empty data array
    data: collapsedCategories.has(section.id) ? [] : section.data,
  }));

  const toggleCategoryCollapse = (catId: number) => {
    Haptics.selectionAsync();
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(catId)) {
      newCollapsed.delete(catId);
    } else {
      newCollapsed.add(catId);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleAllowancePress = () => {
    if (!currentSummary) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllowanceInput(formatForInput(currentSummary.allowanceCents));
    setIsEditingAllowance(!isEditingAllowance);
  };

  const handleSaveAllowance = async () => {
    if (!currentSummary) return;
    const cents = parseToCents(allowanceInput);
    if (cents === null) return;

    setIsSaving(true);
    try {
      await setMonthAllowanceOverride(currentSummary.year, currentSummary.month, cents);
      setIsEditingAllowance(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllowance = async () => {
    if (!currentSummary) return;
    setIsSaving(true);
    try {
      await setMonthAllowanceOverride(currentSummary.year, currentSummary.month, null);
      setIsEditingAllowance(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelectionMode) {
      setSelectedIds(new Set());
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleSelection = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleTogglePaidStatus = async (id: number) => {
    const expense = selectedMonthExpenses.find((e) => e.id === id);
    if (!expense) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await bulkUpdateExpensePaidStatus([id], !expense.isPaid);
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await bulkUpdateExpensePaidStatus(Array.from(selectedIds), true);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkMarkUnpaid = async () => {
    if (selectedIds.size === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await bulkUpdateExpensePaidStatus(Array.from(selectedIds), false);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      "Delete Expenses",
      `Are you sure you want to delete ${selectedIds.size} selected expenses? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await bulkDeleteExpenses(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: monthName,
          headerTitleAlign: "center",
          headerLeft: () => (
            <Button
              title="Back"
              variant="ghost"
              size="s"
              onPress={() => {
                if (isSelectionMode) {
                  toggleSelectionMode();
                } else {
                  clearSelectedMonth();
                  router.back();
                }
              }}
              icon={<Ionicons name="arrow-back" size={20} color={colors.primary} />}
            />
          ),
          headerRight: () => null,
        }}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(item.id)}
            onPress={() => {
              if (isSelectionMode) {
                toggleSelection(item.id);
              } else {
                showEditExpenseModal(item.id);
              }
            }}
            onLongPress={() => {
              if (!isSelectionMode) {
                handleTogglePaidStatus(item.id);
              }
            }}
            style={styles.expenseItem}
          />
        )}
        renderSectionHeader={({ section: { category, totalCents, originalDataCount, isFullyPaid } }) => (
          <TouchableOpacity
            style={[styles.sectionHeader, isFullyPaid && styles.sectionHeaderPaid]}
            onPress={() => toggleCategoryCollapse(category.id)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: (category.color || colors.textMuted) + "20" }]}>
                {isFullyPaid ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                ) : (
                  <AppText style={{ fontSize: 18 }}>{category.icon || "❓"}</AppText>
                )}
              </View>
              <View>
                <AppText variant="heading3" style={[{ fontSize: 18 }, isFullyPaid && styles.textPaid]}>
                  {category.name}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {originalDataCount} items
                </AppText>
              </View>
            </View>
            <View style={styles.sectionHeaderRight}>
              <AppText variant="bodyMedium" style={isFullyPaid && styles.textPaid}>
                {formatCurrency(totalCents, undefined, currency, hideCents)}
              </AppText>
              <Ionicons
                name={collapsedCategories.has(category.id) ? "chevron-down" : "chevron-up"}
                size={18}
                color={colors.textMuted}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          currentSummary ? (
            <View style={styles.header}>
              <Card style={styles.summaryCard}>
                <View style={styles.mainStat}>
                  <AppText variant="caption" color={colors.textMuted}>
                    Remaining Allowance
                  </AppText>
                  <AppText
                    variant="display"
                    color={
                      currentSummary.remainingCents > 0
                        ? colors.success
                        : currentSummary.remainingCents < 0
                        ? colors.danger
                        : colors.textSecondary
                    }
                  >
                    {formatWithSign(currentSummary.remainingCents, undefined, currency, hideCents).text}
                  </AppText>
                </View>

                <View style={styles.secondaryStats}>
                  <TouchableOpacity style={styles.statRow} onPress={handleAllowancePress} activeOpacity={0.7}>
                    <View style={styles.allowanceLabel}>
                      <AppText variant="body" color={colors.textMuted}>
                        Allowance
                      </AppText>
                      {currentSummary.allowanceOverrideCents !== null && (
                        <View style={styles.overrideBadge}>
                          <AppText variant="caption" color={colors.primaryForeground}>
                            Custom
                          </AppText>
                        </View>
                      )}
                    </View>
                    <View style={styles.allowanceValue}>
                      <AppText variant="bodyMedium">
                        {formatCurrency(currentSummary.allowanceCents, undefined, currency, hideCents)}
                      </AppText>
                      <Ionicons
                        name={isEditingAllowance ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                  </TouchableOpacity>

                  {isEditingAllowance && (
                    <View style={styles.allowanceEditor}>
                      <Input
                        placeholder="Custom allowance"
                        value={allowanceInput}
                        onChangeText={setAllowanceInput}
                        keyboardType="numeric"
                        containerStyle={{ marginBottom: layout.spacing.s }}
                      />
                      <View style={styles.editorButtons}>
                        <Button
                          title="Save"
                          size="s"
                          onPress={handleSaveAllowance}
                          loading={isSaving}
                          style={{ flex: 1 }}
                        />
                        {currentSummary.allowanceOverrideCents !== null && (
                          <Button
                            title="Reset"
                            size="s"
                            variant="secondary"
                            onPress={handleResetAllowance}
                            loading={isSaving}
                            style={{ flex: 1 }}
                          />
                        )}
                      </View>
                      {currentSummary.allowanceOverrideCents !== null && (
                        <AppText variant="caption" color={colors.textMuted} style={{ marginTop: layout.spacing.xs }}>
                          Default: {formatCurrency(defaultAllowanceCents, undefined, currency, hideCents)}
                        </AppText>
                      )}
                    </View>
                  )}

                  {/* Spent (Paid expenses) */}
                  <View style={styles.statRow}>
                    <View style={styles.statLabel}>
                      <AppText variant="body" color={colors.textMuted}>
                        Spent
                      </AppText>
                      <AppText variant="caption" color={colors.success}>
                        (paid)
                      </AppText>
                    </View>
                    <AppText variant="bodyMedium" color={colors.success}>
                      {formatCurrency(currentSummary.spentCents, undefined, currency, hideCents)}
                    </AppText>
                  </View>

                  {/* Balance (Unpaid expenses) */}
                  <View style={styles.statRow}>
                    <View style={styles.statLabel}>
                      <AppText variant="body" color={colors.textMuted}>
                        Balance
                      </AppText>
                      <AppText variant="caption" color={colors.warning}>
                        (unpaid)
                      </AppText>
                    </View>
                    <AppText variant="bodyMedium" color={colors.warning}>
                      {formatCurrency(currentSummary.balanceCents, undefined, currency, hideCents)}
                    </AppText>
                  </View>
                </View>
              </Card>

              <View style={styles.listHeader}>
                <View style={styles.titleRow}>
                  <AppText variant="heading3">Expenses</AppText>
                  <TouchableOpacity
                    onPress={toggleSelectionMode}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isSelectionMode ? "close-circle" : "pencil"}
                      size={20}
                      color={isSelectionMode ? colors.textMuted : colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {selectedMonthExpenses.length} transactions
                </AppText>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText color={colors.textMuted} align="center">
              No expenses yet.
            </AppText>
            <AppText color={colors.textMuted} align="center" variant="caption">
              Tap + to add one.
            </AppText>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
        stickySectionHeadersEnabled={false}
      />

      {/* Floating action bar for selection mode */}
      {isSelectionMode && selectedIds.size > 0 && (
        <View style={styles.selectionBar}>
          <AppText variant="bodyMedium" color={colors.white}>
            {selectedIds.size} selected
          </AppText>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionButton} onPress={handleBulkMarkPaid}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} style={{ paddingRight: 4 }} />
              <AppText variant="bodyMedium" color={colors.success}>
                Paid
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectionButton} onPress={handleBulkMarkUnpaid}>
              <Ionicons name="close-circle-outline" size={20} color={colors.warning} style={{ paddingRight: 4 }} />
              <AppText variant="bodyMedium" color={colors.warning}>
                Unpaid
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectionButton} onPress={handleBulkDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isSelectionMode && <FAB onPress={showAddExpenseModal} />}

      <AddExpenseModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: layout.spacing.l,
  },
  listContent: {
    paddingVertical: layout.spacing.m,
    paddingBottom: 100, // Space for FAB
  },
  summaryCard: {
    marginBottom: layout.spacing.l,
    marginHorizontal: layout.spacing.m,
    padding: layout.spacing.l,
  },
  mainStat: {
    alignItems: "center",
    marginBottom: layout.spacing.l,
  },
  secondaryStats: {
    gap: layout.spacing.s,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.spacing.xs,
  },
  allowanceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.spacing.s,
  },
  allowanceValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.spacing.xs,
  },
  overrideBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.s,
  },
  allowanceEditor: {
    backgroundColor: colors.background,
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    marginTop: layout.spacing.s,
  },
  editorButtons: {
    flexDirection: "row",
    gap: layout.spacing.s,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.xs,
    paddingHorizontal: layout.spacing.m,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.spacing.s,
  },
  emptyState: {
    padding: layout.spacing.xl,
    alignItems: "center",
    gap: layout.spacing.s,
  },
  selectionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.spacing.m,
    paddingVertical: layout.spacing.s,
    paddingBottom: layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectionActions: {
    flexDirection: "row",
    gap: layout.spacing.s,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: layout.spacing.s,
    paddingHorizontal: layout.spacing.s,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: layout.spacing.s,
    paddingHorizontal: layout.spacing.m,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: layout.spacing.s,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.spacing.s,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseItem: {
    paddingLeft: layout.spacing.l, // Decreased from 32 (l+8) to 24 (l)
    paddingRight: layout.spacing.l, // Increased from 16 (m) to 24 (l)
  },
  sectionHeaderPaid: {
    opacity: 0.7,
  },
  textPaid: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
});
