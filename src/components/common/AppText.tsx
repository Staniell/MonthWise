import { colors, textVariants } from "@/theme";
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

interface AppTextProps extends TextProps {
  variant?: keyof typeof textVariants;
  color?: string;
  align?: "left" | "center" | "right";
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  style,
  variant = "body",
  color = colors.text,
  align = "left",
  ...props
}) => {
  const variantStyle = textVariants[variant];

  return (
    <Text style={[styles.base, variantStyle, { color, textAlign: align }, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
