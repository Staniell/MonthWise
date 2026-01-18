import { AuthService } from "@/services";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";

export const ProfileSecurityModal = () => {
  const { isProfileSecurityModalVisible, hideProfileSecurityModal } = useUIStore();
  const { currentProfileIsSecured, enableProfileSecurity, disableProfileSecurity, profiles, currentProfileId } =
    useAppStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isProfileSecurityModalVisible) {
      checkBiometricAvailability();
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
    if (!biometricAvailable) {
      Alert.alert("Biometrics Required", "Please enroll fingerprint in device settings to use security features.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await AuthService.authenticateWithBiometric("Authenticate to access security settings");
      if (success) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Error", "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableSecurity = async () => {
    if (!biometricAvailable) {
      Alert.alert("Biometrics Required", "Please enroll fingerprint in device settings first.");
      return;
    }

    // Test biometric before enabling
    setIsLoading(true);
    try {
      const success = await AuthService.authenticateWithBiometric("Verify fingerprint to enable security");
      if (success) {
        await enableProfileSecurity();
        Alert.alert("Success", `Security enabled! You can now verify expenses using ${biometricType.toLowerCase()}.`);
        hideProfileSecurityModal();
      }
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
                title={`Use ${biometricType || "Fingerprint"}`}
                onPress={handleAuthenticate}
                loading={isLoading}
                icon={<Ionicons name="finger-print" size={20} color={colors.primaryForeground} />}
              />
            </View>
          ) : currentProfileIsSecured && isAuthenticated ? (
            // Authenticated - show disable option
            <View style={styles.content}>
              <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.l }}>
                Security is currently enabled. Expenses can be verified using{" "}
                {biometricType.toLowerCase() || "fingerprint"}.
              </AppText>
              <Button title="Remove Security" variant="danger" onPress={handleDisableSecurity} loading={isLoading} />
            </View>
          ) : (
            // Not secured - show enable option
            <View style={styles.content}>
              {biometricAvailable ? (
                <>
                  {/* Biometric ready section */}
                  <View style={styles.biometricSection}>
                    <View style={styles.biometricHeader}>
                      <Ionicons name="finger-print" size={32} color={colors.success} />
                      <View style={{ marginLeft: layout.spacing.m, flex: 1 }}>
                        <AppText variant="bodyMedium">{biometricType} Ready</AppText>
                        <AppText variant="caption" color={colors.textMuted}>
                          Use fingerprint to verify your expenses
                        </AppText>
                      </View>
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    </View>
                  </View>

                  <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.l }}>
                    Enable security to require {biometricType.toLowerCase()} verification before marking expenses as
                    verified.
                  </AppText>

                  <Button
                    title={`Enable ${biometricType} Security`}
                    onPress={handleEnableSecurity}
                    loading={isLoading}
                    icon={<Ionicons name="shield-checkmark" size={20} color={colors.primaryForeground} />}
                  />
                </>
              ) : (
                // No biometrics available
                <View style={styles.noBiometricSection}>
                  <Ionicons name="finger-print" size={48} color={colors.textMuted} />
                  <AppText variant="bodyMedium" style={{ marginTop: layout.spacing.m }} align="center">
                    Fingerprint Not Available
                  </AppText>
                  <AppText
                    variant="body"
                    color={colors.textMuted}
                    align="center"
                    style={{ marginTop: layout.spacing.s }}
                  >
                    To enable security features, please enroll your fingerprint in your device settings first.
                  </AppText>
                </View>
              )}
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
  biometricSection: {
    backgroundColor: colors.background,
    borderRadius: layout.borderRadius.m,
    padding: layout.spacing.m,
    marginBottom: layout.spacing.m,
  },
  biometricHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  noBiometricSection: {
    alignItems: "center",
    paddingVertical: layout.spacing.xl,
  },
});
