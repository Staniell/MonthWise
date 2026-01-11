import { AppText, Button, FAB, Input } from "@/components/common";
import { useAppStore } from "@/stores";
import { colors, layout } from "@/theme";
import { Category } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Curated list of category icons
const CATEGORY_ICONS = [
  "🐾",
  "🚗",
  "🍔",
  "💡",
  "🎬",
  "🛒",
  "🏥",
  "🏠",
  "📚",
  "💅",
  "💰",
  "📦",
  "✈️",
  "🎮",
  "🏋️",
  "💊",
  "🧾",
  "🎁",
  "👶",
  "🔧",
  "💻",
  "📱",
  "💸",
  "📊",
  "🚌",
  "🚲",
  "👔",
  "👗",
  "☕",
  "🍕",
];

// Curated list of category colors
const CATEGORY_COLORS = [
  "#FF9F43",
  "#4ECDC4",
  "#FF6B6B",
  "#FFE66D",
  "#95E1D3",
  "#DDA0DD",
  "#87CEEB",
  "#F4A460",
  "#9B59B6",
  "#E91E63",
  "#27AE60",
  "#95A5A6",
  "#A29BFE",
  "#FAB1A0",
  "#FF7675",
  "#FD79A8",
  "#55EFC4",
  "#81ECEC",
  "#74B9FF",
  "#0984E3",
  "#00CEC9",
  "#00B894",
];

interface CategoryEditorProps {
  visible: boolean;
  onClose: () => void;
  category?: Category;
}

const CategoryEditor = ({ visible, onClose, category }: CategoryEditorProps) => {
  const { addCategory, updateCategory, categories } = useAppStore();
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0]!);
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]!);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setName(category?.name ?? "");
      setIcon(category?.icon ?? CATEGORY_ICONS[0]!);
      setColor(category?.color ?? CATEGORY_COLORS[0]!);
      setError("");
    }
  }, [visible, category]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    // Check for duplicate name (case-insensitive)
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== category?.id
    );
    if (isDuplicate) {
      setError("Category name already exists");
      return;
    }

    setIsSaving(true);
    try {
      if (category) {
        await updateCategory(category.id, { name: trimmedName, icon, color });
      } else {
        await addCategory({ name: trimmedName, icon, color });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <AppText variant="heading3">{category ? "Edit Category" : "New Category"}</AppText>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={30} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Live Preview */}
          <View style={styles.previewContainer}>
            <View style={[styles.previewIcon, { backgroundColor: color + "20" }]}>
              <AppText style={{ fontSize: 50, lineHeight: 60, includeFontPadding: true }}>{icon}</AppText>
            </View>
            <AppText variant="heading3" style={{ marginTop: layout.spacing.s, color: color }}>
              {name || "Category Name"}
            </AppText>
          </View>

          <Input
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError("");
            }}
            placeholder="e.g., Groceries"
            error={error}
          />

          {/* Icon Picker */}
          <View style={styles.section}>
            <AppText variant="bodyMedium" style={styles.sectionTitle}>
              Icon
            </AppText>
            <View style={styles.grid}>
              {CATEGORY_ICONS.map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.gridItem, icon === i && styles.selectedGridItem]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIcon(i);
                  }}
                >
                  <AppText style={{ fontSize: 24 }}>{i}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.section}>
            <AppText variant="bodyMedium" style={styles.sectionTitle}>
              Color
            </AppText>
            <View style={styles.grid}>
              {CATEGORY_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorItem, { backgroundColor: c }, color === c && styles.selectedColorItem]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setColor(c);
                  }}
                >
                  {color === c && <Ionicons name="checkmark" size={16} color="white" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + layout.spacing.l }]}>
          <Button title="Save Category" onPress={handleSave} loading={isSaving} />
        </View>
      </View>
    </Modal>
  );
};

export default function ManageCategoriesScreen() {
  const { categories, deleteCategory, loadCategories } = useAppStore();
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsEditorVisible(true);
  };

  const handleAdd = () => {
    setEditingCategory(undefined);
    setIsEditorVisible(true);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"? Existing expenses will show as "Unknown" until you assign a new category.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(category.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Manage Categories", headerTitleAlign: "center" }} />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: (item.color || colors.textMuted) + "20" }]}>
                <AppText style={{ fontSize: 20 }}>{item.icon || "❓"}</AppText>
              </View>
              <AppText variant="bodyMedium" style={{ flex: 1, marginLeft: layout.spacing.m }}>
                {item.name}
              </AppText>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText color={colors.textMuted} align="center">
              No categories yet.
            </AppText>
            <AppText color={colors.textMuted} align="center" variant="caption">
              Tap + to add one.
            </AppText>
          </View>
        }
      />

      <FAB onPress={handleAdd} />

      <CategoryEditor visible={isEditorVisible} onClose={() => setIsEditorVisible(false)} category={editingCategory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: layout.spacing.m,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.m,
    padding: layout.spacing.m,
    marginBottom: layout.spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: layout.spacing.s,
  },
  actionButton: {
    padding: layout.spacing.s,
  },
  emptyState: {
    padding: layout.spacing.xl,
    alignItems: "center",
    gap: layout.spacing.s,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: layout.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalContent: {
    padding: layout.spacing.l,
    paddingBottom: 100,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: layout.spacing.xl,
  },
  previewIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: layout.spacing.l,
  },
  sectionTitle: {
    marginBottom: layout.spacing.s,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: layout.spacing.s,
  },
  gridItem: {
    width: 48,
    height: 48,
    borderRadius: layout.borderRadius.m,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedGridItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
    borderWidth: 2,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedColorItem: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  footer: {
    padding: layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
