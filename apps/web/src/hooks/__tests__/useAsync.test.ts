import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAsync, useAsyncCallback } from '../useAsync';

describe('useAsync', () => {
  it('executes immediately when immediate is true (default)', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() => useAsync(asyncFn));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(asyncFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('result');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not execute when immediate is false', async () => {
    const asyncFn = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() =>
      useAsync(asyncFn, { immediate: false }),
    );

    // Give it a tick to ensure nothing fires
    await new Promise((r) => setTimeout(r, 50));

    expect(asyncFn).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.isIdle).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('starts in loading state when immediate is true', () => {
    const asyncFn = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.loading).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('transitions from loading to success', async () => {
    let resolve!: (value: string) => void;
    const asyncFn = vi.fn().mockImplementation(
      () => new Promise<string>((r) => { resolve = r; }),
    );

    const { result } = renderHook(() => useAsync(asyncFn));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve('done');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe('done');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles errors correctly', async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAsync(asyncFn));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('fail');
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('wraps non-Error thrown values in an Error', async () => {
    const asyncFn = vi.fn().mockRejectedValue('string error');

    const { result } = renderHook(() => useAsync(asyncFn));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string error');
  });

  it('supports manual execute() call', async () => {
    const asyncFn = vi.fn().mockResolvedValue('manual');

    const { result } = renderHook(() =>
      useAsync(asyncFn, { immediate: false }),
    );

    expect(asyncFn).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.execute();
    });

    expect(asyncFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('manual');
    expect(result.current.isSuccess).toBe(true);
  });

  it('resets state with reset()', async () => {
    const asyncFn = vi.fn().mockResolvedValue('data');

    const { result } = renderHook(() => useAsync(asyncFn));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isIdle).toBe(true);
  });

  it('does not cause infinite re-renders with a stable asyncFunction', async () => {
    let renderCount = 0;
    const asyncFn = vi.fn().mockResolvedValue('stable');

    const { result } = renderHook(() => {
      renderCount++;
      return useAsync(asyncFn);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Allow any pending effects to flush
    await new Promise((r) => setTimeout(r, 100));

    // Should not re-render excessively (initial + loading + success = ~3-4 renders)
    expect(renderCount).toBeLessThan(10);
    // The async function should only be called once
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });
});

describe('useAsyncCallback', () => {
  it('does not execute on mount', () => {
    const asyncFn = vi.fn().mockResolvedValue('data');

    renderHook(() => useAsyncCallback(asyncFn));

    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('executes with arguments when called', async () => {
    const asyncFn = vi.fn().mockImplementation(
      (a: number, b: number) => Promise.resolve(a + b),
    );

    const { result } = renderHook(() => useAsyncCallback(asyncFn));

    await act(async () => {
      await result.current.execute(2, 3);
    });

    expect(asyncFn).toHaveBeenCalledWith(2, 3);
    expect(result.current.data).toBe(5);
    expect(result.current.isSuccess).toBe(true);
  });

  it('handles errors in callback mode', async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error('cb fail'));

    const { result } = renderHook(() => useAsyncCallback(asyncFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error!.message).toBe('cb fail');
  });
});
