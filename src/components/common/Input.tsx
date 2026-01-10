import { colors, layout, typography } from "@/theme";
import React from "react";
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from "react-native";
import { AppText } from "./AppText";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  containerStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <AppText variant="caption" color={colors.textMuted} style={styles.label}>
          {label}
        </AppText>
      )}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <AppText variant="small" color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: layout.spacing.m,
  },
  label: {
    marginBottom: layout.spacing.xs,
    marginLeft: layout.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: layout.borderRadius.l,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56, // Modern tall inputs
    paddingHorizontal: layout.spacing.m,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.m,
  },
  inputError: {
    borderColor: colors.danger,
  },
  leftIcon: {
    marginRight: layout.spacing.s,
  },
  rightIcon: {
    marginLeft: layout.spacing.s,
  },
  error: {
    marginTop: layout.spacing.xs,
    marginLeft: layout.spacing.xs,
  },
});
