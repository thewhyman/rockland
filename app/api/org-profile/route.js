import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('org_profile')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const profileData = {
      org_name: body.org_name,
      location: body.location,
      patient_population: body.patient_population,
      annual_budget: body.annual_budget ? Number(body.annual_budget) : null,
      services: body.services || [],
      active_grant_types: body.active_grant_types || [],
    };

    const { data: existing } = await supabaseAdmin
      .from('org_profile')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('org_profile')
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('org_profile')
        .insert(profileData)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
