import { colors, layout } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface FABProps extends TouchableOpacityProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon = "add", style, ...props }) => {
  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Add Expense"
      accessibilityHint="Opens the add expense modal"
      {...props}
    >
      <Ionicons name={icon} size={32} color={colors.primaryForeground} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: layout.spacing.l,
    right: layout.spacing.l,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    // Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
