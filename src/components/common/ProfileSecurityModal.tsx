import { AuthService } from "@/services";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Input } from "./Input";

export const ProfileSecurityModal = () => {
  const { isProfileSecurityModalVisible, hideProfileSecurityModal } = useUIStore();
  const { currentProfileIsSecured, enableProfileSecurity, disableProfileSecurity, profiles, currentProfileId } =
    useAppStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isProfileSecurityModalVisible) {
      checkBiometricAvailability();
      setPassword("");
      setConfirmPassword("");
      setIsAuthenticated(!currentProfileIsSecured); // If not secured, no auth needed
    }
  }, [isProfileSecurityModalVisible, currentProfileIsSecured]);

  const checkBiometricAvailability = async () => {
    const result = await AuthService.checkBiometricAvailability();
    setBiometricAvailable(result.available);
    if (result.available) {
      setBiometricType(AuthService.getBiometricTypeName(result.types));
    }
  };

  const handleAuthenticate = async () => {
    setIsLoading(true);
    try {
      // Try biometric first
      if (biometricAvailable) {
        const success = await AuthService.authenticateWithBiometric("Authenticate to access security settings");
        if (success) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }

      // Fall back to password prompt
      Alert.prompt(
        "Enter Password",
        "Enter your security password to continue",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Verify",
            onPress: async (inputPassword?: string) => {
              if (!inputPassword || !currentProfile?.authPasswordHash) {
                Alert.alert("Error", "Invalid password");
                return;
              }
              const valid = await AuthService.verifyPassword(inputPassword, currentProfile.authPasswordHash);
              if (valid) {
                setIsAuthenticated(true);
              } else {
                Alert.alert("Error", "Incorrect password");
              }
            },
          },
        ],
        "secure-text",
      );
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Error", "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableSecurity = async () => {
    if (password.length < 4) {
      Alert.alert("Error", "Password must be at least 4 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await enableProfileSecurity(password);
      Alert.alert("Success", "Security enabled! You can now use password or fingerprint to verify expenses.");
      hideProfileSecurityModal();
    } catch (error) {
      console.error("Enable security error:", error);
      Alert.alert("Error", "Failed to enable security");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableSecurity = async () => {
    Alert.alert("Disable Security", "Are you sure you want to remove security from this profile?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await disableProfileSecurity();
            Alert.alert("Success", "Security has been removed");
            hideProfileSecurityModal();
          } catch (error) {
            console.error("Disable security error:", error);
            Alert.alert("Error", "Failed to disable security");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    hideProfileSecurityModal();
  };

  return (
    <Modal visible={isProfileSecurityModalVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <AppText variant="heading2">Profile Security</AppText>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current profile info */}
          <View style={styles.profileInfo}>
            <Ionicons name="person-circle" size={32} color={colors.primary} />
            <AppText variant="bodyMedium" style={{ marginLeft: layout.spacing.s }}>
              {currentProfile?.name ?? "Profile"}
            </AppText>
            {currentProfileIsSecured && (
              <View style={styles.securedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                <AppText variant="caption" color={colors.success} style={{ marginLeft: 4 }}>
                  Secured
                </AppText>
              </View>
            )}
          </View>

          {/* Content based on state */}
          {currentProfileIsSecured && !isAuthenticated ? (
            // Need to authenticate first
            <View style={styles.content}>
              <AppText
                variant="body"
                color={colors.textMuted}
                align="center"
                style={{ marginBottom: layout.spacing.l }}
              >
                Authenticate to manage security settings
              </AppText>
              <Button
                title={biometricAvailable ? `Use ${biometricType} or Password` : "Enter Password"}
                onPress={handleAuthenticate}
                loading={isLoading}
                icon={<Ionicons name="finger-print" size={20} color={colors.primaryForeground} />}
              />
            </View>
          ) : currentProfileIsSecured && isAuthenticated ? (
            // Authenticated - show disable option
            <View style={styles.content}>
              <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.l }}>
                Security is currently enabled. You can verify expenses using password or{" "}
                {biometricAvailable ? biometricType.toLowerCase() : "biometric"}.
              </AppText>
              <Button title="Remove Security" variant="danger" onPress={handleDisableSecurity} loading={isLoading} />
            </View>
          ) : (
            // Not secured - show enable form
            <View style={styles.content}>
              <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.m }}>
                Set a password to enable expense verification. You'll be able to use password or{" "}
                {biometricAvailable ? biometricType.toLowerCase() : "fingerprint"} to verify expenses.
              </AppText>

              {biometricAvailable && (
                <View style={styles.biometricInfo}>
                  <Ionicons name="finger-print" size={20} color={colors.success} />
                  <AppText variant="caption" color={colors.success} style={{ marginLeft: layout.spacing.xs }}>
                    {biometricType} available
                  </AppText>
                </View>
              )}

              <Input
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                containerStyle={{ marginBottom: layout.spacing.s }}
              />
              <Input
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                containerStyle={{ marginBottom: layout.spacing.l }}
              />
              <Button title="Enable Security" onPress={handleEnableSecurity} loading={isLoading} />
            </View>
          )}
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
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: layout.spacing.m,
    paddingHorizontal: layout.spacing.m,
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.m,
    marginBottom: layout.spacing.l,
  },
  securedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: colors.success + "20",
    paddingHorizontal: layout.spacing.s,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.s,
  },
  content: {
    paddingTop: layout.spacing.s,
  },
  biometricInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: layout.spacing.m,
    paddingVertical: layout.spacing.s,
    paddingHorizontal: layout.spacing.m,
    backgroundColor: colors.success + "10",
    borderRadius: layout.borderRadius.m,
  },
});
