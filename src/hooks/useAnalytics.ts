import { useCallback } from 'react';
import { API_BASE } from '../lib/api';

export function useAnalytics() {
  const track = useCallback(async (event: {
    eventType: 'pageview' | 'search' | 'filter';
    projectId?: string;
    tag?: string;
    query?: string;
  }) => {
    try {
      await fetch(`${API_BASE}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          referrer: document.referrer,
        }),
      });
    } catch {
      // analytics 失败不影响主流程
    }
  }, []);

  return { track };
}
