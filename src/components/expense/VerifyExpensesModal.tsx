import { AuthService } from "@/services";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "../common/AppText";

export const VerifyExpensesModal = () => {
  const { isVerifyExpensesModalVisible, hideVerifyExpensesModal } = useUIStore();
  const { verifyAllExpenses, selectedMonthExpenses } = useAppStore();

  const unverifiedCount = selectedMonthExpenses.filter((e) => !e.isVerified).length;

  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");

  useEffect(() => {
    if (isVerifyExpensesModalVisible) {
      checkBiometricAvailability();
    }
  }, [isVerifyExpensesModalVisible]);

  const checkBiometricAvailability = async () => {
    const result = await AuthService.checkBiometricAvailability();
    setBiometricAvailable(result.available);
    if (result.available) {
      setBiometricType(AuthService.getBiometricTypeName(result.types));
    }
  };

  const handleBiometricVerify = async () => {
    setIsLoading(true);
    try {
      const success = await AuthService.authenticateWithBiometric("Verify all expenses for this month");
      if (success) {
        await verifyAllExpenses();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "All expenses have been verified!");
        hideVerifyExpensesModal();
      }
    } catch (error) {
      console.error("Biometric verification error:", error);
      Alert.alert("Error", "Verification failed");
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
                ? `Verify ${unverifiedCount} unverified expense${unverifiedCount > 1 ? "s" : ""} for this month`
                : "All expenses are already verified"}
            </AppText>

            {unverifiedCount > 0 && (
              <>
                {biometricAvailable ? (
                  <View style={styles.biometricPrimary}>
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={handleBiometricVerify}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="finger-print" size={48} color={colors.primaryForeground} />
                      <AppText
                        variant="bodyMedium"
                        color={colors.primaryForeground}
                        style={{ marginTop: layout.spacing.s }}
                      >
                        Verify with {biometricType}
                      </AppText>
                    </TouchableOpacity>
                    <AppText
                      variant="caption"
                      color={colors.textMuted}
                      align="center"
                      style={{ marginTop: layout.spacing.s }}
                    >
                      Tap to authenticate
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.noBiometricInfo}>
                    <Ionicons name="finger-print" size={32} color={colors.textMuted} />
                    <AppText
                      variant="bodyMedium"
                      color={colors.textMuted}
                      align="center"
                      style={{ marginTop: layout.spacing.m }}
                    >
                      Fingerprint Not Available
                    </AppText>
                    <AppText
                      variant="caption"
                      color={colors.textMuted}
                      align="center"
                      style={{ marginTop: layout.spacing.s }}
                    >
                      Enroll fingerprint in device settings to verify expenses.
                    </AppText>
                  </View>
                )}
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
  biometricPrimary: {
    alignItems: "center",
    marginBottom: layout.spacing.m,
  },
  biometricButton: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.l,
    paddingVertical: layout.spacing.l,
    paddingHorizontal: layout.spacing.xl,
    alignItems: "center",
    width: "100%",
  },
  noBiometricInfo: {
    alignItems: "center",
    backgroundColor: colors.background,
    padding: layout.spacing.l,
    borderRadius: layout.borderRadius.m,
  },
});
