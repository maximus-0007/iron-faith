import { Platform } from 'react-native';

interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class WebStorage implements Storage {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }
}

class MobileStorage implements Storage {
  private AsyncStorage: any;

  constructor() {
    // Dynamically import AsyncStorage only on mobile
    this.AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }

  async getItem(key: string): Promise<string | null> {
    return await this.AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.AsyncStorage.removeItem(key);
  }
}

const storage: Storage = Platform.OS === 'web' ? new WebStorage() : new MobileStorage();

export default storage;
