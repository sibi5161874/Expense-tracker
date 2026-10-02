import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResilientFetcher } from '@/lib/fetchWithRetry';

function response(status: number) {
  return { ok: status >= 200 && status < 300, status, json: async () => ({}) } as Response;
}

describe('createResilientFetcher', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const make = (maxRetries = 0) =>
    createResilientFetcher({ label: 'Test', maxRetries, retryBaseDelayMs: 1, circuitFailureThreshold: 5 });

  it('does not open the circuit for 404s — an unknown ticker is not a sick source', async () => {
    const fetcher = make();
    fetchMock.mockResolvedValue(response(404));
    for (let i = 0; i < 8; i++) {
      await expect(fetcher('https://example.test/x', `T${i}`)).rejects.toThrow('HTTP 404');
    }

    fetchMock.mockResolvedValue(response(200));
    await expect(fetcher('https://example.test/x', 'VALID')).resolves.toBeDefined();
  });

  it('opens the circuit after 5 consecutive 5xx failures and stops calling the source', async () => {
    const fetcher = make();
    fetchMock.mockResolvedValue(response(503));
    for (let i = 0; i < 5; i++) {
      await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow('HTTP 503');
    }
    const callsBefore = fetchMock.mock.calls.length;

    await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow('temporarily unavailable');
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });

  it('treats 429 as the source being unhealthy', async () => {
    const fetcher = make();
    fetchMock.mockResolvedValue(response(429));
    for (let i = 0; i < 5; i++) {
      await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow('HTTP 429');
    }
    await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow('temporarily unavailable');
  });

  it('retries a transient failure and returns the eventual success', async () => {
    const fetcher = make(2);
    fetchMock.mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200));
    await expect(fetcher('https://example.test/x', 'T')).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 404', async () => {
    const fetcher = make(2);
    fetchMock.mockResolvedValue(response(404));
    await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow('HTTP 404');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resets the failure count on success, so scattered failures never open the circuit', async () => {
    const fetcher = make();
    fetchMock.mockResolvedValue(response(503));
    for (let i = 0; i < 4; i++) await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow();

    fetchMock.mockResolvedValue(response(200));
    await expect(fetcher('https://example.test/x', 'T')).resolves.toBeDefined();

    fetchMock.mockResolvedValue(response(503));
    for (let i = 0; i < 4; i++) await expect(fetcher('https://example.test/x', 'T')).rejects.toThrow('HTTP 503');

    fetchMock.mockResolvedValue(response(200));
    await expect(fetcher('https://example.test/x', 'T')).resolves.toBeDefined();
  });
});
