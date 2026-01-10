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

  // Always show the calculated remaining amount, even for future months (for budget planning)
  const displayRemaining = summary.remainingCents;
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText variant="heading3" style={styles.monthName}>
              {getMonthName(summary.month)}
            </AppText>
            {summary.allowanceOverrideCents !== null && (
              <View style={styles.customBadge}>
                <AppText variant="caption" color={colors.primary} style={{ fontSize: 8, fontWeight: "bold" }}>
                  *
                </AppText>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText variant="caption" color={colors.textMuted} style={{ marginRight: 4 }}>
              Allowance:
            </AppText>
            <AppText variant="bodyMedium" color={colors.textSecondary}>
              {formatCurrency(summary.allowanceCents, undefined, currency, hideCents)}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
          </View>
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
            <AppText variant="heading3" color={colors.warning}>
              {formatCurrency(summary.spentCents, undefined, currency, hideCents)}
            </AppText>
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
  customBadge: {
    marginLeft: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
