import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({ data, status: init?.status ?? 200 }),
  },
}));

const mockInsert = vi.fn();
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: () => ({ insert: mockInsert }),
  },
}));

const { POST } = await import('../app/api/save-grant/route.js');

const sampleGrant = {
  id: 'opp-1',
  title: 'Health Center Program',
  agency: 'HRSA',
  deadline: '2026-04-01',
  awardFloor: 500000,
  awardCeiling: 1500000,
  cfdaNumbers: '93.224',
  synopsis: 'Provides funding for FQHCs.',
  oppNum: 'HRSA-24-001',
};

describe('POST /api/save-grant', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves a grant and returns the saved row', async () => {
    const saved = { id: 'uuid-1', title: 'Health Center Program', status: 'reviewing' };
    mockInsert.mockReturnValue({
      select: () => ({ single: () => ({ data: saved, error: null }) }),
    });

    const request = {
      json: async () => ({ grant: sampleGrant, score: 88, reason: 'Strong match.' }),
    };
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.data.data.title).toBe('Health Center Program');
  });

  it('maps field names correctly from discovery to pipeline schema', async () => {
    let capturedRow;
    mockInsert.mockImplementation((row) => {
      capturedRow = row;
      return { select: () => ({ single: () => ({ data: row, error: null }) }) };
    });

    const request = {
      json: async () => ({ grant: sampleGrant, score: 75, reason: 'Good match.' }),
    };
    await POST(request);

    expect(capturedRow.amount_min).toBe(500000);
    expect(capturedRow.amount_max).toBe(1500000);
    expect(capturedRow.description).toBe('Provides funding for FQHCs.');
    expect(capturedRow.cfda_number).toBe('93.224');
    expect(capturedRow.grant_id).toBe('HRSA-24-001');
    expect(capturedRow.match_score).toBe(75);
    expect(capturedRow.status).toBe('reviewing');
  });

  it('returns 400 when grant data is missing', async () => {
    const request = { json: async () => ({}) };
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 when grant title is missing', async () => {
    const request = { json: async () => ({ grant: { agency: 'HRSA' } }) };
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('saves without score or reason (not yet scored)', async () => {
    mockInsert.mockReturnValue({
      select: () => ({ single: () => ({ data: { id: 'uuid-2' }, error: null }) }),
    });

    const request = { json: async () => ({ grant: sampleGrant }) };
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('returns 500 on Supabase insert error', async () => {
    mockInsert.mockReturnValue({
      select: () => ({ single: () => ({ data: null, error: { message: 'Insert failed' } }) }),
    });

    const request = {
      json: async () => ({ grant: sampleGrant, score: 80, reason: 'Match.' }),
    };
    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
