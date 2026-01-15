import { renderHook } from '@testing-library/react-native';
import { useFrameworkReady } from '../useFrameworkReady';

describe('useFrameworkReady', () => {
  it('executes without errors', () => {
    const { result } = renderHook(() => useFrameworkReady());
    expect(result.current).toBeUndefined();
  });

  it('can be called multiple times', () => {
    const { rerender } = renderHook(() => useFrameworkReady());
    rerender(() => useFrameworkReady());
    rerender(() => useFrameworkReady());
  });
});
