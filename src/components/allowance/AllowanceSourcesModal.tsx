import { AppText, Button, Card, Input } from "@/components/common";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { AllowanceSource, MonthSummary } from "@/types";
import { formatCurrency, formatForInput, getMonthName, parseToCents } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

export const AllowanceSourcesModal = () => {
  const { isAllowanceSourcesModalVisible, hideAllowanceSourcesModal } = useUIStore();
  const {
    allowanceSources,
    addAllowanceSource,
    updateAllowanceSource,
    deleteAllowanceSource,
    currency,
    hideCents,
    selectedYear,
    monthSummaries,
  } = useAppStore();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Get months with custom overrides for the selected year
  const monthsWithOverrides = monthSummaries.filter(
    (m) => m.year === selectedYear && m.allowanceOverrideCents !== null
  );

  const handleEdit = (source: AllowanceSource) => {
    setName(source.name);
    setAmount(formatForInput(source.amountCents));
    setEditingId(source.id);
  };

  const handleReset = () => {
    setName("");
    setAmount("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name || !amount) return;
    const amountCents = parseToCents(amount);
    if (amountCents === null) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateAllowanceSource(editingId, { name, amountCents });
      } else {
        await addAllowanceSource({ year: selectedYear, name, amountCents, isActive: true });
      }
      handleReset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await deleteAllowanceSource(id);
      if (editingId === id) handleReset();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: AllowanceSource }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <AppText variant="bodyMedium">{item.name}</AppText>
        <AppText variant="body">{formatCurrency(item.amountCents, undefined, currency, hideCents)}</AppText>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOverrideItem = ({ item }: { item: MonthSummary }) => (
    <View style={styles.overrideItem}>
      <View style={styles.overrideInfo}>
        <AppText variant="bodyMedium">{getMonthName(item.month)}</AppText>
        <View style={styles.overrideBadge}>
          <AppText variant="caption" color={colors.primaryForeground}>
            Custom
          </AppText>
        </View>
      </View>
      <AppText variant="body">{formatCurrency(item.allowanceOverrideCents!, undefined, currency, hideCents)}</AppText>
    </View>
  );

  if (!isAllowanceSourcesModalVisible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={hideAllowanceSourcesModal}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={hideAllowanceSourcesModal}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <Card style={styles.modalContent}>
          <View style={styles.header}>
            <AppText variant="heading3">Allowance Sources</AppText>
            <TouchableOpacity
              onPress={hideAllowanceSourcesModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <Input
                placeholder="Source Name (e.g. Salary)"
                value={name}
                onChangeText={setName}
                style={{ marginBottom: layout.spacing.s }}
              />
              <View style={styles.amountRow}>
                <Input
                  placeholder="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                />
              </View>
              <Button
                title={editingId ? "Update" : "Add"}
                onPress={handleSubmit}
                loading={loading}
                disabled={!name || !amount}
                style={styles.addButton}
              />
              {editingId && (
                <TouchableOpacity onPress={handleReset}>
                  <AppText variant="caption" color={colors.textMuted} align="right" style={{ marginTop: 4 }}>
                    Cancel Edit
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            {/* Source List */}
            <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
              Monthly Income ({selectedYear})
            </AppText>
            {allowanceSources
              .filter((s) => !s.deletedAt)
              .map((item) => (
                <View key={item.id}>
                  {renderItem({ item })}
                  <View style={styles.separator} />
                </View>
              ))}
            {allowanceSources.filter((s) => !s.deletedAt).length === 0 && (
              <AppText
                variant="body"
                color={colors.textMuted}
                align="center"
                style={{ paddingVertical: layout.spacing.l }}
              >
                No income sources yet
              </AppText>
            )}

            {/* Monthly Overrides Section */}
            {monthsWithOverrides.length > 0 && (
              <>
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  style={[styles.sectionLabel, { marginTop: layout.spacing.l }]}
                >
                  Monthly Overrides ({selectedYear})
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: layout.spacing.s }}>
                  These months have custom allowance values that differ from the default.
                </AppText>
                {monthsWithOverrides.map((item) => (
                  <View key={`${item.year}-${item.month}`}>
                    {renderOverrideItem({ item })}
                    <View style={styles.separator} />
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    padding: layout.spacing.l,
    height: "75%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.l,
  },
  scrollContent: {
    flex: 1,
  },
  form: {
    marginBottom: layout.spacing.l,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: layout.spacing.s,
  },
  addButton: {
    marginTop: layout.spacing.s,
  },
  sectionLabel: {
    marginBottom: layout.spacing.s,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: layout.spacing.m,
  },
  itemInfo: {
    gap: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: layout.spacing.m,
  },
  iconButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.separator,
  },
  overrideItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: layout.spacing.m,
  },
  overrideInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.spacing.s,
  },
  overrideBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.s,
  },
});
