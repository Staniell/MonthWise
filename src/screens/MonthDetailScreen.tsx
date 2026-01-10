import { AppText, Button, Card, FAB } from "@/components/common";
import { AddExpenseModal } from "@/components/expense/AddExpenseModal";
import { ExpenseItem } from "@/components/expense/ExpenseItem";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { ExpenseWithCategory } from "@/types";
import { formatCurrency, formatWithSign, getMonthName } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export const MonthDetailScreen = () => {
  const router = useRouter();
  const { selectedMonthId, selectedMonthExpenses, monthSummaries, categories, clearSelectedMonth } = useAppStore();

  const { showAddExpenseModal, showEditExpenseModal } = useUIStore();

  const currentSummary = monthSummaries.find((m) => m.monthId === selectedMonthId);
  const monthName = currentSummary ? getMonthName(currentSummary.month) : "Month Detail";

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

  useEffect(() => {
    if (!currentSummary && !selectedMonthId) {
      router.back();
    }
  }, [currentSummary, selectedMonthId]);

  const renderHeader = () => {
    if (!currentSummary) return null;

    const { text: remainingText, isPositive, isNegative } = formatWithSign(currentSummary.remainingCents);
    let remainingColor: string = colors.textSecondary;
    if (isPositive) remainingColor = colors.success;
    if (isNegative) remainingColor = colors.danger;

    return (
      <View style={styles.header}>
        <Card style={styles.summaryCard}>
          <View style={styles.mainStat}>
            <AppText variant="caption" color={colors.textMuted}>
              Remaining Allowance
            </AppText>
            <AppText variant="display" color={remainingColor}>
              {remainingText}
            </AppText>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.statRow}>
              <AppText variant="body" color={colors.textMuted}>
                Allowance
              </AppText>
              <AppText variant="bodyMedium">{formatCurrency(currentSummary.allowanceCents)}</AppText>
            </View>
            <View style={styles.statRow}>
              <AppText variant="body" color={colors.textMuted}>
                Spent
              </AppText>
              <AppText variant="bodyMedium">{formatCurrency(currentSummary.spentCents)}</AppText>
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
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: monthName,
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
        renderItem={({ item }) => <ExpenseItem expense={item} onPress={() => showEditExpenseModal(item.id)} />}
        ListHeaderComponent={renderHeader}
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
