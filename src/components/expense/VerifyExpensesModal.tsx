import { ExpenseRepository } from "@/database";
import { AuthService } from "@/services";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "../common/AppText";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export const VerifyExpensesModal = () => {
  const { isVerifyExpensesModalVisible, hideVerifyExpensesModal } = useUIStore();
  const { profiles, currentProfileId, selectedMonthExpenses, selectedMonthId, refreshData } = useAppStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId);
  const hasPassword = !!currentProfile?.passwordHash;
  const unpaidCount = selectedMonthExpenses.filter((e) => !e.isPaid).length;

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVerifyExpensesModalVisible) {
      setPassword("");
    }
  }, [isVerifyExpensesModalVisible]);

  const handleVerify = async () => {
    // If profile has a password, verify it first
    if (hasPassword && currentProfile?.passwordHash) {
      const isValid = await AuthService.verifyPassword(password, currentProfile.passwordHash);
      if (!isValid) {
        Alert.alert("Error", "Incorrect password");
        return;
      }
    }

    setIsLoading(true);
    try {
      // Mark all unpaid expenses as paid
      const unpaidIds = selectedMonthExpenses.filter((e) => !e.isPaid).map((e) => e.id);
      if (unpaidIds.length > 0) {
        await ExpenseRepository.bulkUpdatePaidStatus(unpaidIds, true);
        await refreshData();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `${unpaidIds.length} expense(s) marked as paid!`);
      hideVerifyExpensesModal();
    } catch (error) {
      console.error("Verify expenses error:", error);
      Alert.alert("Error", "Failed to verify expenses");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={isVerifyExpensesModalVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <AppText variant="heading2">Verify & Pay Expenses</AppText>
            <TouchableOpacity onPress={hideVerifyExpensesModal}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
            </View>

            <AppText variant="body" color={colors.textMuted} align="center" style={{ marginBottom: layout.spacing.m }}>
              {unpaidCount > 0
                ? `Mark ${unpaidCount} unpaid expense${unpaidCount > 1 ? "s" : ""} as paid`
                : "All expenses are already paid"}
            </AppText>

            {unpaidCount > 0 && (
              <>
                {hasPassword ? (
                  <>
                    <AppText
                      variant="caption"
                      color={colors.textMuted}
                      align="center"
                      style={{ marginBottom: layout.spacing.m }}
                    >
                      Enter your profile password to verify
                    </AppText>
                    <Input
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      containerStyle={{ marginBottom: layout.spacing.l }}
                    />
                  </>
                ) : (
                  <AppText
                    variant="caption"
                    color={colors.warning}
                    align="center"
                    style={{ marginBottom: layout.spacing.l }}
                  >
                    No password set. Consider adding one in Profile Security.
                  </AppText>
                )}

                <Button
                  title="Mark All as Paid"
                  onPress={handleVerify}
                  loading={isLoading}
                  disabled={hasPassword && password.length === 0}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xxl,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.spacing.l,
  },
  content: {
    paddingTop: layout.spacing.s,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: layout.spacing.l,
  },
});
