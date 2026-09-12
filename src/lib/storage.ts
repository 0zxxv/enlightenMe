import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

async function canUseSecureStore() {
  if (Platform.OS === 'web') return false;
  try {
    const SecureStore = await import('expo-secure-store');
    return typeof SecureStore.deleteItemAsync === 'function';
  } catch {
    return false;
  }
}

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable() {
  if (secureStoreAvailable === null) {
    secureStoreAvailable = await canUseSecureStore();
  }
  return secureStoreAvailable;
}

export async function storageGetItem(key: string): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch {
      // fall through to AsyncStorage
    }
  }
  return AsyncStorage.getItem(key);
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // fall through to AsyncStorage
    }
  }
  await AsyncStorage.setItem(key, value);
}

export async function storageDeleteItem(key: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      // fall through to AsyncStorage
    }
  }
  await AsyncStorage.removeItem(key);
}
