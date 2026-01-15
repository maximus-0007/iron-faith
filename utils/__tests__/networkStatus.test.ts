import {
  getIsOnline,
  setIsOnline,
  addNetworkListener,
  checkNetworkConnection,
} from '../networkStatus';

describe('networkStatus', () => {
  beforeEach(() => {
    setIsOnline(true);
  });

  describe('getIsOnline', () => {
    it('returns current online status', () => {
      setIsOnline(true);
      expect(getIsOnline()).toBe(true);

      setIsOnline(false);
      expect(getIsOnline()).toBe(false);
    });
  });

  describe('setIsOnline', () => {
    it('updates online status', () => {
      setIsOnline(false);
      expect(getIsOnline()).toBe(false);

      setIsOnline(true);
      expect(getIsOnline()).toBe(true);
    });

    it('notifies listeners on change', () => {
      const listener = jest.fn();
      addNetworkListener(listener);

      setIsOnline(false);

      expect(listener).toHaveBeenCalledWith(false);
    });

    it('does not notify listeners when value unchanged', () => {
      setIsOnline(true);
      const listener = jest.fn();
      addNetworkListener(listener);

      setIsOnline(true);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('addNetworkListener', () => {
    it('adds listener that receives updates', () => {
      const listener = jest.fn();
      addNetworkListener(listener);

      setIsOnline(false);
      setIsOnline(true);

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, false);
      expect(listener).toHaveBeenNthCalledWith(2, true);
    });

    it('returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = addNetworkListener(listener);

      setIsOnline(false);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      setIsOnline(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      addNetworkListener(listener1);
      addNetworkListener(listener2);

      setIsOnline(false);

      expect(listener1).toHaveBeenCalledWith(false);
      expect(listener2).toHaveBeenCalledWith(false);
    });
  });

  describe('checkNetworkConnection', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      global.fetch = originalFetch;
    });

    it('returns true on successful fetch', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      const result = await checkNetworkConnection();

      expect(result).toBe(true);
      expect(getIsOnline()).toBe(true);
    });

    it('returns false on fetch error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkNetworkConnection();

      expect(result).toBe(false);
      expect(getIsOnline()).toBe(false);
    });

    it('returns false on non-ok response', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });

      const result = await checkNetworkConnection();

      expect(result).toBe(false);
    });
  });
});
