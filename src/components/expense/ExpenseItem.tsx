import { AppText } from "@/components/common";
import { useAppStore } from "@/stores";
import { colors, layout } from "@/theme";
import type { ExpenseWithCategory } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ExpenseItemProps {
  expense: ExpenseWithCategory;
  onPress?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  style?: any;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  onPress,
  onLongPress,
  isSelected = false,
  isSelectionMode = false,
  style,
}) => {
  const currency = useAppStore((state) => state.currency);
  const hideCents = useAppStore((state) => state.hideCents);

  return (
    <TouchableOpacity
      style={[styles.container, expense.isPaid && styles.containerPaid, isSelected && styles.containerSelected, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
        </View>
      )}

      {/* Category icon */}
      <View style={[styles.iconContainer, { backgroundColor: expense.category.color || colors.border }]}>
        <AppText style={styles.icon}>{expense.category.icon || "💰"}</AppText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText variant="bodyMedium" numberOfLines={1} style={expense.isPaid && styles.textPaid}>
            {expense.category.name}
          </AppText>
          <View style={styles.amountContainer}>
            {expense.isPaid && (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark" size={12} color={colors.white} />
              </View>
            )}
            <AppText variant="bodyMedium" color={expense.isPaid ? colors.textMuted : colors.text}>
              {formatCurrency(expense.amountCents, undefined, currency, hideCents)}
            </AppText>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <AppText
            variant="caption"
            color={colors.textMuted}
            numberOfLines={1}
            style={[styles.note, expense.isPaid && styles.textPaid]}
          >
            {expense.note || ""}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatDateTime(expense.createdAt)}
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
    paddingVertical: layout.spacing.m, // Increased back to m (16)
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  containerPaid: {
    opacity: 0.7,
  },
  containerSelected: {
    backgroundColor: colors.primary + "15",
  },
  checkbox: {
    width: 20, // Reduced from 24
    height: 20, // Reduced from 24
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: layout.spacing.s,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.primaryForeground,
    fontSize: 12, // Reduced from 14
    fontWeight: "bold",
  },
  iconContainer: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: layout.spacing.s, // Reduced margin
  },
  icon: {
    fontSize: 18, // Reduced from 20
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0, // Reduced from 2
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // Reduced from 6
  },
  paidBadge: {
    width: 14, // Reduced from 16
    height: 14, // Reduced from 16
    borderRadius: 7,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  textPaid: {
    textDecorationLine: "line-through",
    opacity: 0.6,
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
