import { AllowanceSourcesModal } from "@/components/allowance/AllowanceSourcesModal";
import { AppText, Card } from "@/components/common";
import { MonthCard } from "@/components/month/MonthCard";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { formatCurrency, formatWithSign } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export const YearOverviewScreen = () => {
  const router = useRouter();
  const {
    selectedYear,
    monthSummaries,
    loadYearData,
    setSelectedYear,
    selectMonth,
    totalExcessCents,
    defaultAllowanceCents,
  } = useAppStore();

  const { showAllowanceSourcesModal } = useUIStore();

  useEffect(() => {
    loadYearData(selectedYear);
  }, [selectedYear]);

  const handleMonthPress = (month: number) => {
    Haptics.selectionAsync();
    selectMonth(selectedYear, month);
    router.push("/month-detail" as any);
  };

  const handleYearChange = (increment: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedYear(selectedYear + increment);
  };

  const renderHeader = () => {
    const { text: excessText, isPositive, isNegative } = formatWithSign(totalExcessCents);
    let excessColor: string = colors.textSecondary;
    if (isPositive) excessColor = colors.success;
    if (isNegative) excessColor = colors.danger;

    return (
      <View style={styles.header}>
        {/* Year Selector */}
        <View style={styles.yearSelector}>
          <TouchableOpacity
            onPress={() => handleYearChange(-1)}
            style={styles.yearButton}
            disabled={selectedYear <= 2026}
          >
            <Ionicons name="chevron-back" size={24} color={selectedYear <= 2026 ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
          <AppText variant="display" color={colors.primary}>
            {selectedYear}
          </AppText>
          <TouchableOpacity onPress={() => handleYearChange(1)} style={styles.yearButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Annual Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <AppText variant="caption" color={colors.textMuted}>
              Total Excess
            </AppText>
            <AppText variant="heading2" color={excessColor}>
              {excessText}
            </AppText>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.statItem} onPress={showAllowanceSourcesModal} activeOpacity={0.7}>
            <AppText variant="caption" color={colors.textMuted}>
              Monthly Allowance ✏️
            </AppText>
            <AppText variant="heading3">{formatCurrency(defaultAllowanceCents)}</AppText>
          </TouchableOpacity>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={monthSummaries}
        keyExtractor={(item) => item.month.toString()}
        renderItem={({ item }) => {
          const currentMonth = new Date().getMonth() + 1;
          const isNearCurrent = item.month >= currentMonth - 1 && item.month <= currentMonth + 1;
          const dimmed = selectedYear === 2026 && !isNearCurrent;
          return <MonthCard summary={item} onPress={() => handleMonthPress(item.month)} dimmed={dimmed} />;
        }}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <AllowanceSourcesModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: layout.spacing.m,
    paddingBottom: layout.spacing.xxl,
  },
  header: {
    marginBottom: layout.spacing.l,
  },
  yearSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.l,
    paddingHorizontal: layout.spacing.l,
  },
  yearButton: {
    padding: layout.spacing.s,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: layout.spacing.l,
  },
  statItem: {
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: colors.separator,
  },
});
