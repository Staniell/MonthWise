import { AppText, Button, Card, Input } from "@/components/common";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { AllowanceSource } from "@/types";
import { formatCurrency, formatForInput, parseToCents } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

export const AllowanceSourcesModal = () => {
  const { isAllowanceSourcesModalVisible, hideAllowanceSourcesModal } = useUIStore();
  const { allowanceSources, addAllowanceSource, updateAllowanceSource, deleteAllowanceSource, currency } =
    useAppStore();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
        await addAllowanceSource({ name, amountCents, isActive: true });
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
        <AppText variant="body">{formatCurrency(item.amountCents, undefined, currency)}</AppText>
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

  if (!isAllowanceSourcesModalVisible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={hideAllowanceSourcesModal}>
      <TouchableWithoutFeedback onPress={hideAllowanceSourcesModal}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
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

              <FlatList
                data={allowanceSources.filter((s) => !s.deletedAt)}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                style={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </Card>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    height: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.l,
  },
  form: {
    marginBottom: layout.spacing.l,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-start", // Align top since Input has margin
    gap: layout.spacing.s,
  },
  addButton: {
    marginTop: layout.spacing.s,
  },
  list: {
    flex: 1,
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
});
