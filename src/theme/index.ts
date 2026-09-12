import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamilies, typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  fontFamilies,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

export { colors, fontFamilies, radius, shadows, spacing, typography };
