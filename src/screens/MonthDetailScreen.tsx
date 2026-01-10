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
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

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
  } = useAppStore();

  const { showAddExpenseModal, showEditExpenseModal } = useUIStore();

  const currentSummary = monthSummaries.find((m) => m.monthId === selectedMonthId);
  const monthName = currentSummary ? getMonthName(currentSummary.month) : "Month Detail";

  // State for allowance editing
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [allowanceInput, setAllowanceInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
                clearSelectedMonth();
                router.back();
              }}
              icon={<Ionicons name="arrow-back" size={20} color={colors.primary} />}
            />
          ),
        }}
      />

      <FlatList
        data={expensesWithCategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            onPress={() => {
              showEditExpenseModal(item.id);
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              showEditExpenseModal(item.id);
            }}
          />
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

                  <View style={styles.statRow}>
                    <AppText variant="body" color={colors.textMuted}>
                      Spent
                    </AppText>
                    <AppText variant="bodyMedium">
                      {formatCurrency(currentSummary.spentCents, undefined, currency, hideCents)}
                    </AppText>
                  </View>
                </View>
              </Card>

              <View style={styles.listHeader}>
                <AppText variant="heading3">Expenses</AppText>
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
      />

      <FAB onPress={showAddExpenseModal} />

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
    padding: layout.spacing.m,
    paddingBottom: 100, // Space for FAB
  },
  summaryCard: {
    marginBottom: layout.spacing.l,
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
    alignItems: "baseline",
    marginBottom: layout.spacing.xs,
  },
  emptyState: {
    padding: layout.spacing.xl,
    alignItems: "center",
    gap: layout.spacing.s,
  },
});
