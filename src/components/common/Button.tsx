import { colors, layout } from "@/theme";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { AppText } from "./AppText";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "s" | "m" | "l";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "m",
  loading = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const variantStyles = styles[variant];
  const sizeStyles = styles[size];
  const textVariant = size === "s" ? "small" : "bodyMedium";

  // Text color logic
  let textColor = colors.white;
  if (variant === "secondary") textColor = colors.text;
  if (variant === "ghost") textColor = colors.primary;
  if (variant === "primary") textColor = colors.primaryForeground;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, variantStyles, sizeStyles, isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <AppText variant={textVariant} color={textColor} style={icon ? { marginLeft: layout.spacing.s } : undefined}>
            {title}
          </AppText>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: layout.borderRadius.full,
  },
  // Sizes
  s: {
    height: 32,
    paddingHorizontal: layout.spacing.m,
  },
  m: {
    height: 48,
    paddingHorizontal: layout.spacing.l,
  },
  l: {
    height: 56,
    paddingHorizontal: layout.spacing.xl,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
});
