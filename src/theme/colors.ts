/**
 * MonthWise Semantic Color Palette
 * Theme: Premium Dark Mode
 */

const PALETTE = {
  // Deep Slate Blue scale
  slate900: "#1a2634",
  slate800: "#2C3E50", // Primary Background
  slate700: "#34495e", // Secondary Background / Cards
  slate600: "#465f75",
  slate500: "#5D778D",
  slate400: "#7F93A4",
  slate300: "#AAB8C3",
  slate200: "#DDE3E8",
  slate100: "#F0F3F5",
  white: "#FFFFFF",

  // Soft Gold scale (Accents)
  gold500: "#F1C40F", // Primary Accent
  gold600: "#F39C12",
  gold100: "#FEF9E7",

  // Semantic Status Colors
  emerald500: "#2ECC71", // Success/Excess
  coral500: "#E74C3C", // Danger/Deficit
  blue500: "#3498DB", // Info
  gray500: "#95A5A6", // Disabled/Inactive
} as const;

export const colors = {
  // Base
  background: PALETTE.slate800,
  card: PALETTE.slate700,
  text: PALETTE.white,
  textSecondary: PALETTE.slate300,
  textMuted: PALETTE.slate500,

  // Brand
  primary: PALETTE.gold500,
  primaryForeground: PALETTE.slate900,

  // States
  success: PALETTE.emerald500,
  danger: PALETTE.coral500,
  warning: PALETTE.gold600,
  info: PALETTE.blue500,

  // UI Elements
  border: PALETTE.slate600,
  separator: PALETTE.slate600,
  inputBackground: PALETTE.slate900,

  // Overlay
  overlay: "rgba(26, 38, 52, 0.8)", // slate900 with opacity

  // Helpers
  white: PALETTE.white,
} as const;

export type Colors = typeof colors;
