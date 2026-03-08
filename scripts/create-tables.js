const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { Client } = require('pg');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS org_profile (
  id                 BIGSERIAL PRIMARY KEY,
  org_name           TEXT NOT NULL,
  location           TEXT,
  patient_population TEXT,
  annual_budget      NUMERIC,
  services           TEXT[] DEFAULT '{}',
  active_grant_types TEXT[] DEFAULT '{}',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
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

const projectRef = 'mtuztiahwhpreuhhlxqf';
const password = 'acn9pve.bau5car2FCW';

async function tryConnect(config) {
  const client = new Client({ ...config, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    console.log(`Connected via ${config.host}:${config.port} (user: ${config.user})`);
    await client.query(CREATE_SQL);
    console.log('Tables created successfully.');
    await client.end();
    return true;
  } catch (err) {
    try { await client.end(); } catch (_) {}
    console.log(`  ${config.host}:${config.port} — ${err.message.split('\n')[0]}`);
    return false;
  }
}

async function main() {
  // Try to resolve the direct host to an IPv4 address
  const directHost = `db.${projectRef}.supabase.co`;
  let ipv4Address = null;
  try {
    const addresses = await dns.resolve4(directHost);
    if (addresses.length > 0) {
      ipv4Address = addresses[0];
      console.log(`Resolved ${directHost} to IPv4: ${ipv4Address}`);
    }
  } catch (err) {
    console.log(`DNS resolve4 failed: ${err.message}`);
  }

  const regions = [
    'us-east-1', 'us-west-1', 'us-east-2', 'us-west-2',
    'eu-central-1', 'eu-west-1', 'eu-west-2',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1',
    'ca-central-1', 'sa-east-1',
  ];

  const configs = [
    // Direct connection via resolved IPv4
    ...(ipv4Address ? [
      { host: ipv4Address, port: 5432, user: 'postgres', password },
    ] : []),
    // Session pooler — all regions
    ...regions.map(r => ({
      host: `aws-0-${r}.pooler.supabase.com`,
      port: 5432,
      user: `postgres.${projectRef}`,
      password,
    })),
  ];

  for (const config of configs) {
    const ok = await tryConnect(config);
    if (ok) return;
  }

  console.error('\nAll connection attempts failed.');
  process.exit(1);
}

main();
