import { renderHook, act } from '@testing-library/react-native';
import { SettingsProvider, useSettings } from '../settings';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('Settings Hook', () => {
  it('provides default settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.settings).toBeDefined();
    expect(result.current.settings.colorScheme).toBeDefined();
    expect(result.current.settings.responseLength).toBeDefined();
  });

  it('provides theme object', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.theme).toBeDefined();
    expect(result.current.theme.background).toBeDefined();
    expect(result.current.theme.text).toBeDefined();
  });

  it('can toggle color scheme', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    const initialScheme = result.current.settings.colorScheme;

    await act(async () => {
      result.current.toggleColorScheme();
    });

    const newScheme = result.current.settings.colorScheme;
    expect(newScheme).not.toBe(initialScheme);
  });

  it('can update settings', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    await act(async () => {
      await result.current.updateSettings({
        responseLength: 'detailed',
        includeScriptureReferences: true,
      });
    });

    expect(result.current.settings.responseLength).toBe('detailed');
    expect(result.current.settings.includeScriptureReferences).toBe(true);
  });

  it('provides update functions', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(typeof result.current.updateSettings).toBe('function');
    expect(typeof result.current.toggleColorScheme).toBe('function');
    expect(typeof result.current.loadProfileFromDatabase).toBe('function');
  });
});
