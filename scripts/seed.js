const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Seeding database...\n');

  // Upsert org_profile
  const { data: existingOrg } = await supabase
    .from('org_profile')
    .select('id')
    .limit(1)
    .single();

  const orgData = {
    org_name: 'Community Health Partners of Los Angeles',
    location: 'Los Angeles, CA',
    patient_population:
      'Low-income Medi-Cal beneficiaries, unhoused individuals, and underserved communities in South LA',
    annual_budget: 4500000,
    services: ['primary care', 'dental', 'mental health'],
    active_grant_types: ['HRSA', 'state', 'foundation'],
  };

  if (existingOrg) {
    const { error } = await supabase.from('org_profile').update(orgData).eq('id', existingOrg.id);
    if (error) console.error('Error updating org_profile:', error.message);
    else console.log('Updated org_profile row');
  } else {
    const { error } = await supabase.from('org_profile').insert(orgData);
    if (error) console.error('Error inserting org_profile:', error.message);
    else console.log('Inserted org_profile row');
  }

  // Clear and re-seed grant_pipeline
  const now = new Date();
  const inDays = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pipelineRows = [
    {
      grant_id: 'HRSA-24-019',
      title: 'Health Center Program (Section 330) – New Access Points',
      agency: 'Health Resources & Services Administration (HRSA)',
      deadline: inDays(10),
      amount_min: 650000,
      amount_max: 1500000,
      description:
        'Provides federal funding to support the delivery of comprehensive, culturally competent, quality primary health care services to medically underserved populations.',
      cfda_number: '93.224',
      status: 'applying',
      match_score: 94,
      match_reason:
        'Excellent match. This grant is specifically designed for FQHCs providing primary care to underserved populations, which aligns directly with your services and patient population in South LA. Your Medi-Cal patient base and annual budget fit well within expected parameters.',
    },
    {
      grant_id: 'SAMHSA-24-SUD-107',
      title: 'Substance Use Disorder Treatment and Recovery – Community Health Centers',
      agency: 'Substance Abuse and Mental Health Services Administration (SAMHSA)',
      deadline: inDays(25),
      amount_min: 300000,
      amount_max: 750000,
      description:
        'Funds community health centers to expand substance use disorder prevention, treatment, and recovery services for underserved individuals and families.',
      cfda_number: '93.243',
      status: 'reviewing',
      match_score: 78,
      match_reason:
        'Good match. While your organization currently focuses on primary care, dental, and mental health, expanding to substance use services aligns with your unhoused population and could strengthen your proposal. Consider partnering with an existing SUD provider.',
    },
    {
      grant_id: 'HRSA-24-DSC-042',
      title: 'Oral Health Workforce Activities – Dental Support Centers',
      agency: 'Health Resources & Services Administration (HRSA)',
      deadline: inDays(45),
      amount_min: 200000,
      amount_max: 500000,
      description:
        'Supports dental training programs and workforce development at health centers serving low-income and uninsured populations.',
      cfda_number: '93.236',
      status: 'submitted',
      match_score: 88,
      match_reason:
        'Strong match. Your existing dental services directly position you to expand dental workforce capacity. The grant aligns with your low-income patient population and HRSA funding experience.',
    },
    {
      grant_id: 'CHCF-2024-PC-Innovation',
      title: 'California Health Care Foundation – Primary Care Innovation Grant',
      agency: 'California Health Care Foundation (CHCF)',
      deadline: inDays(60),
      amount_min: 150000,
      amount_max: 400000,
      description:
        'Supports innovative models of primary care delivery in California safety-net clinics, with a focus on team-based care, technology adoption, and improving outcomes for Medi-Cal patients.',
      cfda_number: null,
      status: 'reviewing',
      match_score: 91,
      match_reason:
        'Excellent match. As a Los Angeles-based FQHC serving Medi-Cal beneficiaries, your organization is precisely the target recipient. Your foundation funding experience and primary care focus make this a top-priority application.',
    },
  ];

  // Clear existing rows
  const { error: deleteError } = await supabase
    .from('grant_pipeline')
    .delete()
    .not('id', 'is', null);

  if (deleteError) console.log('Note: Could not clear pipeline:', deleteError.message);

  const { error: insertError } = await supabase.from('grant_pipeline').insert(pipelineRows);
  if (insertError) console.error('Error inserting grant_pipeline rows:', insertError.message);
  else console.log(`Inserted ${pipelineRows.length} grant_pipeline rows`);

  console.log('\nSeeding complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
