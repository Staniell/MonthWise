import { AppText, Button, Card, Input } from "@/components/common";
import { useAppStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Alert, FlatList, Modal, SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";

const MAX_PROFILES = 10;

export default function ProfileScreen() {
  const profiles = useAppStore((state) => state.profiles);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const switchProfile = useAppStore((state) => state.switchProfile);
  const createProfile = useAppStore((state) => state.createProfile);
  const deleteProfile = useAppStore((state) => state.deleteProfile);
  const renameProfile = useAppStore((state) => state.renameProfile);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    setLoading(true);
    try {
      await createProfile(newProfileName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewProfileName("");
      setCreateModalVisible(false);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameProfile = async () => {
    if (!newProfileName.trim() || !editingProfileId) return;
    setLoading(true);
    try {
      await renameProfile(editingProfileId, newProfileName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewProfileName("");
      setEditingProfileId(null);
      setRenameModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = (id: number, name: string) => {
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete "${name}"? All data in this profile will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProfile(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete profile");
            }
          },
        },
      ]
    );
  };

  const handleSwitchProfile = async (id: number) => {
    if (id === currentProfileId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await switchProfile(id);
  };

  const openRenameModal = (id: number, name: string) => {
    setEditingProfileId(id);
    setNewProfileName(name);
    setRenameModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="display">Profiles</AppText>
        {profiles.length < MAX_PROFILES && (
          <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <AppText variant="caption" color={colors.textMuted} style={styles.subtitle}>
        {profiles.length} of {MAX_PROFILES} profiles used
      </AppText>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={[styles.profileCard, item.id === currentProfileId && styles.activeCard]}>
            <TouchableOpacity
              onPress={() => handleSwitchProfile(item.id)}
              onLongPress={() => openRenameModal(item.id, item.name)}
              style={styles.profileContent}
            >
              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}>
                  <Ionicons
                    name={item.id === currentProfileId ? "person-circle" : "person-circle-outline"}
                    size={24}
                    color={item.id === currentProfileId ? colors.primary : colors.textMuted}
                  />
                  <AppText
                    variant="bodyMedium"
                    style={{ marginLeft: layout.spacing.s }}
                    color={item.id === currentProfileId ? colors.primary : colors.text}
                  >
                    {item.name}
                  </AppText>
                  {item.id === currentProfileId && (
                    <View style={styles.activeBadge}>
                      <AppText variant="caption" color={colors.primaryForeground}>
                        Active
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
              {profiles.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleDeleteProfile(item.id, item.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Create Profile Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <AppText variant="heading3" style={{ marginBottom: layout.spacing.m }}>
              New Profile
            </AppText>
            <Input placeholder="Profile name" value={newProfileName} onChangeText={setNewProfileName} autoFocus />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setNewProfileName("");
                  setCreateModalVisible(false);
                }}
                style={{ flex: 1, marginRight: layout.spacing.s }}
              />
              <Button
                title="Create"
                onPress={handleCreateProfile}
                loading={loading}
                disabled={!newProfileName.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Rename Profile Modal */}
      <Modal
        visible={isRenameModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <AppText variant="heading3" style={{ marginBottom: layout.spacing.m }}>
              Rename Profile
            </AppText>
            <Input placeholder="Profile name" value={newProfileName} onChangeText={setNewProfileName} autoFocus />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setNewProfileName("");
                  setEditingProfileId(null);
                  setRenameModalVisible(false);
                }}
                style={{ flex: 1, marginRight: layout.spacing.s }}
              />
              <Button
                title="Save"
                onPress={handleRenameProfile}
                loading={loading}
                disabled={!newProfileName.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: layout.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.spacing.m,
    marginBottom: layout.spacing.xs,
  },
  addButton: {
    padding: layout.spacing.xs,
  },
  subtitle: {
    paddingHorizontal: layout.spacing.m,
    marginBottom: layout.spacing.m,
  },
  listContent: {
    paddingHorizontal: layout.spacing.m,
    paddingBottom: layout.spacing.xl,
  },
  profileCard: {
    marginBottom: layout.spacing.s,
    padding: layout.spacing.m,
  },
  activeCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: layout.spacing.s,
    paddingVertical: 2,
    borderRadius: layout.borderRadius.s,
    marginLeft: layout.spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    paddingHorizontal: layout.spacing.m,
  },
  modalContent: {
    padding: layout.spacing.l,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: layout.spacing.m,
  },
});
