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
  const { verifyAllExpenses, profiles, currentProfileId, selectedMonthExpenses } = useAppStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId);
  const unverifiedCount = selectedMonthExpenses.filter((e) => !e.isVerified).length;

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");

  useEffect(() => {
    if (isVerifyExpensesModalVisible) {
      checkBiometricAvailability();
      setPassword("");
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

  const handlePasswordVerify = async () => {
    if (!password || !currentProfile?.authPasswordHash) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const valid = await AuthService.verifyPassword(password, currentProfile.authPasswordHash);
      if (valid) {
        await verifyAllExpenses();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "All expenses have been verified!");
        hideVerifyExpensesModal();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Incorrect password");
      }
    } catch (error) {
      console.error("Password verification error:", error);
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
                {/* Primary biometric option */}
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
                    <Ionicons name="finger-print" size={24} color={colors.textMuted} />
                    <AppText
                      variant="caption"
                      color={colors.textMuted}
                      style={{ marginLeft: layout.spacing.s, flex: 1 }}
                    >
                      Fingerprint not available. Enroll in device settings to use.
                    </AppText>
                  </View>
                )}

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <AppText variant="caption" color={colors.textMuted} style={{ paddingHorizontal: layout.spacing.s }}>
                    {biometricAvailable ? "or use password" : "Use password"}
                  </AppText>
                  <View style={styles.divider} />
                </View>

                <Input
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  containerStyle={{ marginBottom: layout.spacing.m }}
                />

                <Button
                  title="Verify with Password"
                  variant={biometricAvailable ? "secondary" : "primary"}
                  onPress={handlePasswordVerify}
                  loading={isLoading}
                  disabled={!password}
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: layout.spacing.m,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    marginBottom: layout.spacing.m,
  },
});
