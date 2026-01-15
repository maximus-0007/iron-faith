import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

let isOnlineCache: boolean = true;
let listeners: Array<(isOnline: boolean) => void> = [];

export function getIsOnline(): boolean {
  return isOnlineCache;
}

export function setIsOnline(value: boolean): void {
  if (isOnlineCache !== value) {
    isOnlineCache = value;
    listeners.forEach(listener => listener(value));
  }
}

export function addNetworkListener(listener: (isOnline: boolean) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function useNetworkStatus(): { isOnline: boolean; isOffline: boolean } {
  const [isOnline, setIsOnlineState] = useState<boolean>(isOnlineCache);

  useEffect(() => {
    setIsOnlineState(isOnlineCache);

    const unsubscribe = addNetworkListener((online) => {
      setIsOnlineState(online);
    });

    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsubscribe();
      };
    }

    return unsubscribe;
  }, []);

  return { isOnline, isOffline: !isOnline };
}

export async function checkNetworkConnection(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const online = navigator.onLine;
      setIsOnline(online);
      return online;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);
    const online = response.ok;
    setIsOnline(online);
    return online;
  } catch (error) {
    setIsOnline(false);
    return false;
  }
}

export function initializeNetworkMonitoring(): void {
  if (Platform.OS === 'web') {
    setIsOnline(navigator.onLine);

    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  } else {
    checkNetworkConnection();

    setInterval(() => {
      checkNetworkConnection();
    }, 30000);
  }
}
