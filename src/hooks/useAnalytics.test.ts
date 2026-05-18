import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';

describe('useAnalytics', () => {
  const fetchSpy = vi.spyOn(global, 'fetch');
  const API_BASE = 'http://localhost:4001';

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  it('track() POSTs to /api/analytics with correct body', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

    const { result } = renderHook(() => useAnalytics());
    await result.current.track({ eventType: 'pageview' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(`${API_BASE}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'pageview',
        referrer: '',
      }),
    });
  });

  it('track() swallows errors silently (no throw)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAnalytics());
    await expect(result.current.track({ eventType: 'search', query: 'test' })).resolves.toBeUndefined();
  });

  it('does not call fetch when not tracking', () => {
    renderHook(() => useAnalytics());
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
