import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({ data, status: init?.status ?? 200 }),
  },
}));

// Mock supabase admin client
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: () => ({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    }),
  },
}));

const { GET, PATCH, DELETE } = await import('../app/api/pipeline/route.js');

describe('GET /api/pipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns grant pipeline rows ordered by deadline', async () => {
    const grants = [
      { id: '1', title: 'Grant A', status: 'reviewing', deadline: '2026-04-01' },
      { id: '2', title: 'Grant B', status: 'applying', deadline: '2026-05-01' },
    ];
    mockSelect.mockReturnValue({
      order: () => ({ data: grants, error: null }),
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveLength(2);
    expect(response.data.data[0].title).toBe('Grant A');
  });

  it('returns empty array when no grants exist', async () => {
    mockSelect.mockReturnValue({
      order: () => ({ data: null, error: null }),
    });

    const response = await GET();
    expect(response.data.data).toEqual([]);
  });

  it('returns 500 on Supabase error', async () => {
    mockSelect.mockReturnValue({
      order: () => ({ data: null, error: { message: 'DB error' } }),
    });

    const response = await GET();
    expect(response.status).toBe(500);
    expect(response.data.error).toBe('DB error');
  });
});

describe('PATCH /api/pipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects invalid status values', async () => {
    const request = { json: async () => ({ id: '1', status: 'invalid-status' }) };
    const response = await PATCH(request);
    expect(response.status).toBe(400);
    expect(response.data.error).toMatch(/Invalid status/);
  });

  it('returns 400 when id or status is missing', async () => {
    const request = { json: async () => ({ id: '1' }) };
    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('accepts all valid status values', async () => {
    const validStatuses = ['reviewing', 'applying', 'submitted', 'awarded', 'passed'];

    for (const status of validStatuses) {
      vi.clearAllMocks();
      mockUpdate.mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () => ({ data: { id: '1', status }, error: null }),
          }),
        }),
      });

      const request = { json: async () => ({ id: '1', status }) };
      const response = await PATCH(request);
      expect(response.status).toBe(200);
      expect(response.data.data.status).toBe(status);
    }
  });
});

describe('DELETE /api/pipeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when id is missing', async () => {
    const request = { url: 'http://localhost/api/pipeline' };
    const response = await DELETE(request);
    expect(response.status).toBe(400);
    expect(response.data.error).toMatch(/id/);
  });

  it('deletes the row and returns success', async () => {
    mockDelete.mockReturnValue({
      eq: () => ({ error: null }),
    });

    const request = { url: 'http://localhost/api/pipeline?id=abc-123' };
    const response = await DELETE(request);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('returns 500 on Supabase delete error', async () => {
    mockDelete.mockReturnValue({
      eq: () => ({ error: { message: 'Delete failed' } }),
    });

    const request = { url: 'http://localhost/api/pipeline?id=abc-123' };
    const response = await DELETE(request);
    expect(response.status).toBe(500);
  });
});
