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
  const { profiles, currentProfileId, selectedMonthExpenses, bulkUpdateExpenseVerifiedStatus } = useAppStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId);
  const hasPassword = !!currentProfile?.passwordHash;
  const unverifiedCount = selectedMonthExpenses.filter((e) => !e.isVerified).length;

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVerifyExpensesModalVisible) {
      setPassword("");
    }
  }, [isVerifyExpensesModalVisible]);

  const handleVerify = async () => {
    if (hasPassword && currentProfile?.passwordHash) {
      const isValid = await AuthService.verifyPassword(password, currentProfile.passwordHash);
      if (!isValid) {
        Alert.alert("Error", "Incorrect password");
        return;
      }
    }

    setIsLoading(true);
    try {
      const unverifiedIds = selectedMonthExpenses.filter((e) => !e.isVerified).map((e) => e.id);
      if (unverifiedIds.length > 0) {
        await bulkUpdateExpenseVerifiedStatus(unverifiedIds, true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `${unverifiedIds.length} expense(s) verified!`);
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
            <AppText variant="heading2">Verify Expenses</AppText>
            <TouchableOpacity onPress={hideVerifyExpensesModal}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
            </View>

            <AppText variant="body" color={colors.textMuted} align="center" style={{ marginBottom: layout.spacing.m }}>
              {unverifiedCount > 0
                ? `Mark ${unverifiedCount} unverified expense${unverifiedCount > 1 ? "s" : ""} as verified`
                : "All expenses are already verified"}
            </AppText>

            {unverifiedCount > 0 && (
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
                  title="Verify All"
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
