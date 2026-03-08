# Rockland – Setup Instructions

## 1. Create Tables in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query, then run:

```sql
-- Org Profile Table
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

-- Grant Pipeline Table
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

-- Optional: Disable Row Level Security for service role access
ALTER TABLE org_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE grant_pipeline DISABLE ROW LEVEL SECURITY;
```

## 2. Seed Sample Data

After the tables are created, run:

```bash
node scripts/seed.js
```

## 3. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:3000
