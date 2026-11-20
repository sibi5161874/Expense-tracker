import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

const { getUserMock, createMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));

vi.mock('@/lib/groq', () => ({
  AI_CHAT_MODEL: 'llama-3.3-70b-versatile',
  getGroqClient: vi.fn((key: string) => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  })),
}));

describe('POST /api/ai-chat/verify-key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const req = new Request('http://localhost/api/ai-chat/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'gsk_123456789' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when apiKey is missing', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user_1' } } });
    const req = new Request('http://localhost/api/ai-chat/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('API key is required');
  });

  it('returns 400 when key does not start with gsk_', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user_1' } } });
    const req = new Request('http://localhost/api/ai-chat/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'invalid_prefix_123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('gsk_');
  });

  it('returns 200 when Groq ping succeeds', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user_1' } } });
    createMock.mockResolvedValue({ model: 'llama-3.3-70b-versatile' });

    const req = new Request('http://localhost/api/ai-chat/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'gsk_valid_key_123456' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 400 when Groq rejects key as unauthorized', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user_1' } } });
    createMock.mockRejectedValue(new Error('Invalid API Key provided'));

    const req = new Request('http://localhost/api/ai-chat/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'gsk_bad_key_123456' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid API key');
  });
});
