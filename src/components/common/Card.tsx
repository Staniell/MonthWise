import { colors, layout } from "@/theme";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "outlined" | "flat";
}

export const Card: React.FC<CardProps> = ({ children, style, variant = "default", ...props }) => {
  return (
    <View
      style={[styles.card, variant === "outlined" && styles.outlined, variant === "flat" && styles.flat, style]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.xl,
    padding: layout.spacing.m,
    // Subtle shadow for elegance
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: colors.card,
  },
});
