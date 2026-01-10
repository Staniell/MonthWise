/**
 * Typography System
 * Font: Outfit (Google Fonts)
 */

export const typography = {
  fontFamily: {
    regular: "Outfit_400Regular",
    medium: "Outfit_500Medium",
    semiBold: "Outfit_600SemiBold",
    bold: "Outfit_700Bold",
  },
  size: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const textVariants = {
  display: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.display,
    lineHeight: typography.size.display * typography.lineHeight.tight,
  },
  heading1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.xxxl,
    lineHeight: typography.size.xxxl * typography.lineHeight.tight,
  },
  heading2: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.xxl,
    lineHeight: typography.size.xxl * typography.lineHeight.tight,
  },
  heading3: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.xl,
    lineHeight: typography.size.xl * typography.lineHeight.normal,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.m,
    lineHeight: typography.size.m * typography.lineHeight.normal,
  },
  bodyMedium: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.m,
    lineHeight: typography.size.m * typography.lineHeight.normal,
  },
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.s,
    lineHeight: typography.size.s * typography.lineHeight.normal,
  },
  small: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.size.xs * typography.lineHeight.normal,
  },
} as const;
