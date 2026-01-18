import { ProfileRepository } from "@/database";
import { AuthService } from "@/services";
import { useAppStore, useUIStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Input } from "./Input";

export const ProfileSecurityModal = () => {
  const { isProfileSecurityModalVisible, hideProfileSecurityModal } = useUIStore();
  const { profiles, currentProfileId, loadProfiles } = useAppStore();

  const currentProfile = profiles.find((p) => p.id === currentProfileId);
  const hasPassword = !!currentProfile?.passwordHash;

  const [mode, setMode] = useState<"view" | "set" | "change" | "remove">("view");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isProfileSecurityModalVisible) {
      resetForm();
      setMode("view");
    }
  }, [isProfileSecurityModalVisible]);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 4) {
      Alert.alert("Error", "Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const hash = await AuthService.hashPassword(newPassword);
      await ProfileRepository.setPassword(currentProfileId, hash);
      await loadProfiles();
      Alert.alert("Success", "Password has been set. Remember this password!");
      hideProfileSecurityModal();
    } catch (error) {
      console.error("Set password error:", error);
      Alert.alert("Error", "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentProfile?.passwordHash) return;

    // Verify current password
    const isValid = await AuthService.verifyPassword(currentPassword, currentProfile.passwordHash);
    if (!isValid) {
      Alert.alert("Error", "Current password is incorrect");
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert("Error", "New password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const hash = await AuthService.hashPassword(newPassword);
      await ProfileRepository.setPassword(currentProfileId, hash);
      await loadProfiles();
      Alert.alert("Success", "Password has been changed");
      hideProfileSecurityModal();
    } catch (error) {
      console.error("Change password error:", error);
      Alert.alert("Error", "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!currentProfile?.passwordHash) return;

    // Verify current password
    const isValid = await AuthService.verifyPassword(currentPassword, currentProfile.passwordHash);
    if (!isValid) {
      Alert.alert("Error", "Password is incorrect");
      return;
    }

    setIsLoading(true);
    try {
      await ProfileRepository.removePassword(currentProfileId);
      await loadProfiles();
      Alert.alert("Success", "Password has been removed");
      hideProfileSecurityModal();
    } catch (error) {
      console.error("Remove password error:", error);
      Alert.alert("Error", "Failed to remove password");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (mode === "set") {
      return (
        <>
          <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.m }}>
            Set a password to protect this profile. You will need it to verify expenses.
          </AppText>
          <Input
            placeholder="New password (min 4 characters)"
            value={newPassword}
            onChangeText={setNewPassword}
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
          <Button title="Set Password" onPress={handleSetPassword} loading={isLoading} />
          <TouchableOpacity onPress={() => setMode("view")} style={{ marginTop: layout.spacing.m }}>
            <AppText variant="caption" color={colors.textMuted} align="center">
              Cancel
            </AppText>
          </TouchableOpacity>
        </>
      );
    }

    if (mode === "change") {
      return (
        <>
          <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.m }}>
            Enter your current password, then set a new one.
          </AppText>
          <Input
            placeholder="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            containerStyle={{ marginBottom: layout.spacing.m }}
          />
          <Input
            placeholder="New password (min 4 characters)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            containerStyle={{ marginBottom: layout.spacing.s }}
          />
          <Input
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            containerStyle={{ marginBottom: layout.spacing.l }}
          />
          <Button title="Change Password" onPress={handleChangePassword} loading={isLoading} />
          <TouchableOpacity onPress={() => setMode("view")} style={{ marginTop: layout.spacing.m }}>
            <AppText variant="caption" color={colors.textMuted} align="center">
              Cancel
            </AppText>
          </TouchableOpacity>
        </>
      );
    }

    if (mode === "remove") {
      return (
        <>
          <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.m }}>
            Enter your current password to remove security from this profile.
          </AppText>
          <Input
            placeholder="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            containerStyle={{ marginBottom: layout.spacing.l }}
          />
          <Button title="Remove Password" variant="danger" onPress={handleRemovePassword} loading={isLoading} />
          <TouchableOpacity onPress={() => setMode("view")} style={{ marginTop: layout.spacing.m }}>
            <AppText variant="caption" color={colors.textMuted} align="center">
              Cancel
            </AppText>
          </TouchableOpacity>
        </>
      );
    }

    // View mode
    return (
      <>
        <View style={styles.profileInfo}>
          <Ionicons name="person-circle" size={32} color={colors.primary} />
          <AppText variant="bodyMedium" style={{ marginLeft: layout.spacing.s }}>
            {currentProfile?.name ?? "Profile"}
          </AppText>
          {hasPassword && (
            <View style={styles.securedBadge}>
              <Ionicons name="lock-closed" size={14} color={colors.success} />
              <AppText variant="caption" color={colors.success} style={{ marginLeft: 4 }}>
                Protected
              </AppText>
            </View>
          )}
        </View>

        {hasPassword ? (
          <>
            <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.l }}>
              This profile is protected. You need to enter your password to verify expenses.
            </AppText>
            <Button
              title="Change Password"
              onPress={() => {
                resetForm();
                setMode("change");
              }}
              style={{ marginBottom: layout.spacing.s }}
            />
            <Button
              title="Remove Password"
              variant="danger"
              onPress={() => {
                resetForm();
                setMode("remove");
              }}
            />
          </>
        ) : (
          <>
            <AppText variant="body" color={colors.textMuted} style={{ marginBottom: layout.spacing.l }}>
              No password is set for this profile. Anyone can verify expenses without authentication.
            </AppText>
            <Button
              title="Set Password"
              onPress={() => {
                resetForm();
                setMode("set");
              }}
            />
          </>
        )}
      </>
    );
  };

  return (
    <Modal visible={isProfileSecurityModalVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <AppText variant="heading2">Profile Security</AppText>
              <TouchableOpacity onPress={hideProfileSecurityModal}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>{renderContent()}</View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    width: "100%",
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
});
