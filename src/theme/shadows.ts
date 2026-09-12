import { ViewStyle } from 'react-native';

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies ViewStyle,
  sm: {
    shadowColor: '#2C245C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: '#2C245C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
  lg: {
    shadowColor: '#2C245C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
} as const;

export type ShadowToken = keyof typeof shadows;
