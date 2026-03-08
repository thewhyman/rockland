import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { grant, score, reason } = body;

    if (!grant || !grant.title) {
      return NextResponse.json({ error: 'Grant data with title is required' }, { status: 400 });
    }

    const pipelineRow = {
      grant_id: grant.oppNum || grant.id || null,
      title: grant.title,
      agency: grant.agency || '',
      deadline: grant.deadline || null,
      amount_min: grant.awardFloor ? Number(grant.awardFloor) : null,
      amount_max: grant.awardCeiling ? Number(grant.awardCeiling) : null,
      description: grant.synopsis || '',
      cfda_number: grant.cfdaNumbers || '',
      status: 'reviewing',
      match_score: score != null ? Number(score) : null,
      match_reason: reason || '',
    };

    const { data, error } = await supabaseAdmin
      .from('grant_pipeline')
      .insert(pipelineRow)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
