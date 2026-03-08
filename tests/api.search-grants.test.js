import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch before importing the route
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({ data, status: init?.status ?? 200 }),
  },
}));

const { POST } = await import('../app/api/search-grants/route.js');

describe('POST /api/search-grants', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns normalized grant data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        oppHits: [
          {
            id: 'opp-1',
            oppTitle: 'Health Center Program',
            agencyName: 'HRSA',
            closeDate: '2026-04-01',
            awardFloor: 500000,
            awardCeiling: 1500000,
            cfdaNumbers: '93.224',
            synopsis: 'Provides funding for FQHCs.',
            oppNum: 'HRSA-24-001',
            oppStatus: 'posted',
          },
        ],
        totalCount: 1,
      }),
    });

    const request = { json: async () => ({ keyword: 'federally qualified health center' }) };
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveLength(1);
    expect(response.data.data[0].title).toBe('Health Center Program');
    expect(response.data.data[0].agency).toBe('HRSA');
    expect(response.data.data[0].awardFloor).toBe(500000);
    expect(response.data.total).toBe(1);
  });

  it('returns empty array when oppHits is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ totalCount: 0 }),
    });

    const request = { json: async () => ({ keyword: 'test' }) };
    const response = await POST(request);

    expect(response.data.data).toHaveLength(0);
  });

  it('returns 502 when Grants.gov responds with an error status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    const request = { json: async () => ({}) };
    const response = await POST(request);

    expect(response.status).toBe(502);
    expect(response.data.error).toMatch(/Grants.gov API error/);
  });

  it('returns 500 on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const request = { json: async () => ({}) };
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(response.data.error).toBe('Network error');
  });

  it('defaults keyword to "federally qualified health center" when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ oppHits: [], totalCount: 0 }),
    });

    const request = { json: async () => ({}) };
    await POST(request);

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.keyword).toBe('federally qualified health center');
  });
});
