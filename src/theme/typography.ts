import { TextStyle } from 'react-native';

export const fontFamilies = {
  display: 'System',
  body: 'System',
} as const;

export const typography = {
  display: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.5,
  } satisfies TextStyle,
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  } satisfies TextStyle,
  subheading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  } satisfies TextStyle,
  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  price: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof typography;
