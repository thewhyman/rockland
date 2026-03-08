const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runSQL(sql) {
  // Use the Supabase SQL REST endpoint (requires service role)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

async function createTablesViaManagementAPI(sql) {
  // Try management API
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const text = await res.text();
  console.log(`Management API response [${res.status}]: ${text.slice(0, 300)}`);
  return res.ok;
}

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS org_profile (
  id          BIGSERIAL PRIMARY KEY,
  org_name    TEXT NOT NULL,
  location    TEXT,
  patient_population TEXT,
  annual_budget NUMERIC,
  services    TEXT[] DEFAULT '{}',
  active_grant_types TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grant_pipeline (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  agency        TEXT,
  deadline      DATE,
  award_floor   NUMERIC,
  award_ceiling NUMERIC,
  cfda_numbers  TEXT,
  synopsis      TEXT,
  opp_num       TEXT,
  ai_score      NUMERIC,
  match_reason  TEXT,
  status        TEXT DEFAULT 'reviewing' CHECK (status IN ('reviewing','applying','submitted','awarded','passed')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE org_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE grant_pipeline DISABLE ROW LEVEL SECURITY;
`;

async function setup() {
  console.log('Setting up database tables...');
  console.log('Project ref:', projectRef);
  console.log('');

  const ok = await createTablesViaManagementAPI(CREATE_SQL);
  if (ok) {
    console.log('Tables created successfully via Management API');
  } else {
    console.log('\nManagement API did not work (no management token). ');
    console.log('Please run the SQL in SETUP.md manually in the Supabase SQL Editor.');
    console.log('SQL to run:');
    console.log(CREATE_SQL);
  }
}

setup().catch((err) => {
  console.error('Setup failed:', err.message);
});
