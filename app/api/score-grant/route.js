import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { grant } = body;

    if (!grant) {
      return NextResponse.json({ error: 'Grant data is required' }, { status: 400 });
    }

    // Fetch org profile
    const { data: orgProfile, error: orgError } = await supabaseAdmin
      .from('org_profile')
      .select('*')
      .limit(1)
      .single();

    if (orgError || !orgProfile) {
      return NextResponse.json(
        { error: 'No org profile found. Please set up your organization profile first.' },
        { status: 400 }
      );
    }

    const prompt = `You are a grant eligibility analyst for Federally Qualified Health Centers (FQHCs).

Evaluate the following grant opportunity for this FQHC organization and provide an eligibility score from 0-100, where:
- 90-100: Excellent match, highly likely eligible
- 70-89: Good match, likely eligible
- 50-69: Moderate match, possible eligibility
- 30-49: Weak match, unlikely eligible
- 0-29: Poor match, not recommended

Organization Profile:
- Name: ${orgProfile.org_name}
- Location: ${orgProfile.location}
- Services: ${(orgProfile.services || []).join(', ')}
- Patient Population: ${orgProfile.patient_population}
- Annual Budget: $${orgProfile.annual_budget ? orgProfile.annual_budget.toLocaleString() : 'Not specified'}
- Active Grant Types: ${(orgProfile.active_grant_types || []).join(', ')}

Grant Opportunity:
- Title: ${grant.title}
- Agency: ${grant.agency}
- CFDA Numbers: ${grant.cfdaNumbers || 'N/A'}
- Deadline: ${grant.deadline || 'N/A'}
- Award Floor: ${grant.awardFloor ? '$' + Number(grant.awardFloor).toLocaleString() : 'N/A'}
- Award Ceiling: ${grant.awardCeiling ? '$' + Number(grant.awardCeiling).toLocaleString() : 'N/A'}
- Synopsis: ${grant.synopsis || 'No synopsis available'}

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "reason": "<2-3 sentence explanation of the score, mentioning specific alignment or gaps between the org and grant>"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const resultText = completion.choices[0].message.content;
    const result = JSON.parse(resultText);

    if (typeof result.score !== 'number' || !result.reason) {
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    return NextResponse.json({ score: result.score, reason: result.reason });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
