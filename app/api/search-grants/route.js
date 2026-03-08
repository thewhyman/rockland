import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const keyword = body.keyword || 'federally qualified health center';

    const searchPayload = {
      keyword,
      oppStatuses: 'forecasted|posted',
      rows: 10,
      startRecordNum: 0,
    };

    const response = await fetch(
      'https://apply07.grants.gov/grantsws/rest/opportunities/search/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Grants.gov API error: ${response.status} - ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Normalize results from grants.gov response
    const opportunities = data.oppHits || [];
    const normalized = opportunities.map((opp) => ({
      id: opp.id || opp.oppNum || String(Math.random()),
      title: opp.oppTitle || opp.title || 'Untitled',
      agency: opp.agencyName || opp.agency || 'Unknown Agency',
      deadline: opp.closeDate || opp.deadline || null,
      awardFloor: opp.awardFloor || null,
      awardCeiling: opp.awardCeiling || null,
      cfdaNumbers: opp.cfdaNumbers || opp.cfda || '',
      synopsis: opp.synopsis || opp.description || '',
      oppNum: opp.oppNum || opp.id || '',
      status: opp.oppStatus || 'posted',
    }));

    return NextResponse.json({ data: normalized, total: data.totalCount || normalized.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
