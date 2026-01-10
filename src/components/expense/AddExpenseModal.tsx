import { AppText, Button, Card, Input } from "@/components/common";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { CreateExpenseDTO, UpdateExpenseDTO } from "@/types";
import { formatForInput, getCurrencySymbol, parseToCents } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export const AddExpenseModal = () => {
  const { isAddExpenseModalVisible, isEditExpenseModalVisible, editingExpenseId, hideExpenseModal } = useUIStore();

  const { addExpense, updateExpense, deleteExpense, selectedMonthExpenses, selectedMonthId, categories, currency } =
    useAppStore();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Determine if we are in edit mode
  const isEditing = isEditExpenseModalVisible && editingExpenseId !== null;

  useEffect(() => {
    if (isEditing) {
      const expense = selectedMonthExpenses.find((e) => e.id === editingExpenseId);
      if (expense) {
        setAmount(formatForInput(expense.amountCents));
        setNote(expense.note || "");
        setCategoryId(expense.categoryId);
      }
    } else {
      // Reset for add mode
      setAmount("");
      setNote("");
      // Default to first category or null
      setCategoryId(categories.length > 0 ? categories[0]!.id : null);
    }
  }, [isAddExpenseModalVisible, isEditExpenseModalVisible, editingExpenseId]);

  const handleSubmit = async () => {
    if (!selectedMonthId || !categoryId || !amount) return;

    const amountCents = parseToCents(amount);
    if (amountCents === null) return;

    setLoading(true);
    try {
      if (isEditing) {
        const updateDto: UpdateExpenseDTO = {
          amountCents,
          categoryId,
          note: note.trim() || undefined,
        };
        await updateExpense(editingExpenseId!, updateDto);
      } else {
        const createDto: CreateExpenseDTO = {
          monthId: selectedMonthId,
          categoryId,
          amountCents,
          note: note.trim() || undefined,
          expenseDate: new Date().toISOString().split("T")[0]!,
        };
        await addExpense(createDto);
      }
      hideExpenseModal();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !editingExpenseId) return;
    setLoading(true);
    try {
      await deleteExpense(editingExpenseId);
      hideExpenseModal();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAddExpenseModalVisible && !isEditExpenseModalVisible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={hideExpenseModal}>
      <TouchableWithoutFeedback onPress={hideExpenseModal}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
              <Card style={styles.modalContent}>
                <View style={styles.header}>
                  <AppText variant="heading3">{isEditing ? "Edit Expense" : "New Expense"}</AppText>
                  <TouchableOpacity onPress={hideExpenseModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <Input
                  label="Amount"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  leftIcon={<AppText color={colors.textMuted}>{getCurrencySymbol(currency)}</AppText>}
                  autoFocus={!isEditing}
                />

                <Input label="Note (Optional)" placeholder="Dinner, Groceries..." value={note} onChangeText={setNote} />

                <AppText variant="caption" color={colors.textMuted} style={styles.categoryLabel}>
                  Category
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        categoryId === cat.id && styles.categoryChipSelected,
                        { borderColor: cat.color || colors.border },
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <AppText style={styles.categoryIcon}>{cat.icon || "📦"}</AppText>
                      <AppText variant="small" color={categoryId === cat.id ? colors.primaryForeground : colors.text}>
                        {cat.name}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.actions}>
                  {isEditing && (
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={handleDelete}
                      loading={loading}
                      style={{ flex: 1, marginRight: layout.spacing.s }}
                    />
                  )}
                  <Button
                    title="Save"
                    onPress={handleSubmit}
                    loading={loading}
                    style={{ flex: 2 }}
                    disabled={!amount || !categoryId}
                  />
                </View>
              </Card>
            </KeyboardAvoidingView>
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
  keyboardView: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.l,
  },
  categoryLabel: {
    marginLeft: layout.spacing.xs,
    marginBottom: layout.spacing.s,
  },
  categoryList: {
    flexDirection: "row",
    marginBottom: layout.spacing.xl,
    maxHeight: 50,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.spacing.m,
    paddingVertical: layout.spacing.s,
    borderRadius: layout.borderRadius.full,
    borderWidth: 1,
    marginRight: layout.spacing.s,
    backgroundColor: "transparent",
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    marginRight: layout.spacing.xs,
  },
  actions: {
    flexDirection: "row",
  },
});
