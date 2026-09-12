const DEFAULT_API_URL = 'http://localhost:3001/api/v1';

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  appName: 'Dars',
  appNameAr: 'درس',
} as const;
