import { AppText } from "@/components/common";
import { colors, layout } from "@/theme";
import type { ExpenseWithCategory } from "@/types";
import { formatCurrency, formatDate } from "@/utils";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ExpenseItemProps {
  expense: ExpenseWithCategory;
  onPress?: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.iconContainer, { backgroundColor: expense.category.color || colors.border }]}>
        <AppText style={styles.icon}>{expense.category.icon || "💰"}</AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText variant="bodyMedium" numberOfLines={1}>
            {expense.category.name}
          </AppText>
          <AppText variant="bodyMedium" color={colors.text}>
            {formatCurrency(expense.amountCents)}
          </AppText>
        </View>

        <View style={styles.bottomRow}>
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={styles.note}>
            {expense.note ? expense.note : formatDate(expense.expenseDate)}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: layout.spacing.m,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  note: {
    flex: 1,
    marginRight: layout.spacing.s,
  },
});
