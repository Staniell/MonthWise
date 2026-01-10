import { AppText, Card } from "@/components/common";
import { useAppStore } from "@/stores";
import { colors, layout } from "@/theme";
import type { MonthSummary } from "@/types";
import { formatCurrency, formatWithSign, getMonthName } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface MonthCardProps {
  summary: MonthSummary;
  onPress: () => void;
  dimmed?: boolean;
}

export const MonthCard: React.FC<MonthCardProps> = ({ summary, onPress, dimmed = false }) => {
  const currency = useAppStore((state) => state.currency);
  const hideCents = useAppStore((state) => state.hideCents);
  const selectedYear = useAppStore((state) => state.selectedYear);

  // Determine if this month is in the future
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && summary.month > currentMonth);

  // For future months, show 0 remaining
  const displayRemaining = isFutureMonth ? 0 : summary.remainingCents;
  const {
    isPositive,
    isNegative,
    text: remainingText,
  } = formatWithSign(displayRemaining, undefined, currency, hideCents);

  let statusColor: string = colors.textMuted;
  if (isPositive) statusColor = colors.success;
  if (isNegative) statusColor = colors.danger;

  // Calculate progress for visual indicator
  // Cap at 100% for bar width
  const spentRatio = summary.allowanceCents > 0 ? Math.min(summary.spentCents / summary.allowanceCents, 1) : 0;

  const progressBarColor: string = isNegative ? colors.danger : colors.primary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={[styles.container, dimmed && { opacity: 0.4 }]}>
        <View style={styles.header}>
          <AppText variant="heading3" style={styles.monthName}>
            {getMonthName(summary.month)}
          </AppText>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        <View style={styles.statsRow}>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              Remaining
            </AppText>
            <AppText variant="heading2" color={statusColor}>
              {remainingText}
            </AppText>
          </View>
          <View style={styles.spentContainer}>
            <AppText variant="caption" color={colors.textMuted}>
              Spent
            </AppText>
            <AppText variant="bodyMedium">{formatCurrency(summary.spentCents, undefined, currency, hideCents)}</AppText>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressBar, { width: `${spentRatio * 100}%` as any, backgroundColor: progressBarColor }]}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: layout.spacing.m,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.s,
  },
  monthName: {
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: layout.spacing.m,
  },
  spentContainer: {
    alignItems: "flex-end",
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
});
