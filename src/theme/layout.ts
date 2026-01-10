/**
 * Layout and Spacing Constants
 */

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  gutter: 16, // Standard screen padding
} as const;

export const borderRadius = {
  s: 4,
  m: 8,
  l: 12,
  xl: 16,
  full: 9999, // Pill/Circle
} as const;

export const layout = {
  spacing,
  borderRadius,
  iconSize: {
    s: 16,
    m: 24,
    l: 32,
    xl: 48,
  },
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;
