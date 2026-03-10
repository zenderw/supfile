import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const secureStorage = {
  async getItem(name: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
    }
    return SecureStore.getItemAsync(name);
  },

  async setItem(name: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(name, value);
      }
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },

  async removeItem(name: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(name);
      }
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};
