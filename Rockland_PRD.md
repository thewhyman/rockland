# PRD: Grant Discovery & Pipeline Tracker
**Product:** Rockland — AI Back Office for FQHCs
**Prototype Scope:** Grant Discovery, Qualification & Pipeline Tracking
**Stack:** Next.js · Supabase · Vercel · Grants.gov API · OpenAI API
**Author:** Anand Vallamsetla
**Date:** 2026-03-08

---

## Context for AI Coding Assistant

You are helping build a functional prototype for Rockland, an AI-native financial operating system for Federally Qualified Health Centers (FQHCs). FQHCs are federally funded community health clinics serving low-income populations.

This prototype focuses exclusively on **grant discovery, eligibility qualification, and pipeline tracking**. Do NOT build reporting, compliance, or EMR integration features — those are out of scope for this prototype.

---

## Problem Statement

FQHC grants managers spend 4–6 hours per week manually searching grant databases, reading eligibility criteria, and deciding whether a grant is worth pursuing — before any writing happens. Their current stack is QuickBooks, Excel, and email. There is no dedicated grants management software.

The three biggest friction points:
1. Discovering grants that actually match the organization's clinical profile
2. Quickly assessing eligibility without reading every grant document
3. Tracking what's been applied for and when deadlines hit

---

## User Persona

**Primary user:** CFO or Grants Manager at an FQHC
- Organization size: 50–300 staff, 2–5 clinic sites
- Active grants: 5–15 at any given time (federal, state, private foundation)
- Finance team: 2–4 people managing all grant administration manually
- Pain: manually searching grant databases, copy-pasting into spreadsheets, missing deadlines

---

## What We Are Building

A three-screen web app:

### Screen 1: Org Profile Setup
A one-time form where the FQHC enters their organizational profile. This profile is used by the AI to score grant eligibility.

Fields:
- Organization name
- Primary services offered (multi-select: primary care, dental, mental health, substance use, case management, OB/GYN, pediatrics)
- Location (city, state)
- Patient population description (free text, e.g. "low-income, Medi-Cal, underserved communities")
- Annual operating budget (numeric)
- Current active grant types (multi-select: HRSA, Ryan White, HCAI, state, foundation, federal)

### Screen 2: Grant Discovery
Search real federal grant opportunities from Grants.gov. Display results with AI-generated eligibility scores.

Features:
- Keyword search input (pre-populated with "federally qualified health center")
- Calls Grants.gov API → returns live grant opportunities
- For each result, display: title, agency, deadline, funding amount range, CFDA number
- "Score Eligibility" button → calls OpenAI API → returns match score (1–10) + 2-sentence rationale based on org profile
- "Save to Pipeline" button → writes grant to Supabase pipeline table

### Screen 3: Grant Pipeline
A kanban-style or table view of saved grants with status tracking.

Features:
- List all saved grants from Supabase
- Status column with dropdown: Reviewing → Applying → Submitted → Awarded / Passed
- Display: title, agency, deadline, funding amount, AI match score, match reason
- Color-coded deadlines (red = < 14 days, yellow = < 30 days, green = > 30 days)
- Delete / remove from pipeline

---

## Data Model

Run these SQL statements in Supabase SQL Editor:

```sql
-- Organization profile (one row per org, for prototype use single hardcoded org)
create table org_profile (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  services text[],
  location text,
  patient_population text,
  annual_budget numeric,
  active_grant_types text[],
  created_at timestamptz default now()
);

-- Grant pipeline (saved grants with status tracking)
create table grant_pipeline (
  id uuid primary key default gen_random_uuid(),
  grant_id text,
  title text not null,
  agency text,
  deadline date,
  amount_min numeric,
  amount_max numeric,
  description text,
  cfda_number text,
  status text default 'reviewing',
  match_score integer,
  match_reason text,
  saved_at timestamptz default now()
);
```

---

## API Integrations

### 1. Grants.gov API (real grant data — no auth required)

**Endpoint:**
```
POST https://apply07.grants.gov/grantsws/rest/opportunities/search/
Content-Type: application/json
```

**Request body:**
```json
{
  "keyword": "federally qualified health center",
  "oppStatuses": "forecasted|posted",
  "rows": 10,
  "startRecordNum": 0
}
```

**Response fields to use:**
- `oppTitle` → grant title
- `agencyName` → agency
- `closeDate` → deadline
- `awardFloor` / `awardCeiling` → funding range
- `cfdaNumbers` → CFDA number
- `synopsis` → description for AI scoring

**Next.js API route:** `app/api/search-grants/route.js`

---

### 2. OpenAI API (eligibility scoring)

**Model:** `gpt-4o-mini` (cheap, fast, sufficient)

**Next.js API route:** `app/api/score-grant/route.js`

**Prompt template:**
```
You are an eligibility analyst for a Federally Qualified Health Center (FQHC).

Organization profile:
- Name: {org_name}
- Services: {services}
- Location: {location}
- Patient population: {patient_population}
- Annual budget: {annual_budget}
- Current grant types: {active_grant_types}

Grant opportunity:
- Title: {grant_title}
- Agency: {agency}
- Description: {description}

Score this grant's eligibility match for this FQHC on a scale of 1–10, where:
- 10 = perfect match, strong likelihood of eligibility
- 5 = partial match, worth investigating
- 1 = poor match, likely ineligible

Respond in JSON format only:
{
  "score": <number 1-10>,
  "reason": "<2 sentences explaining the score>"
}
```

**Environment variable:** `OPENAI_API_KEY` (server-side only, no NEXT_PUBLIC_ prefix)

---

## Environment Variables

```dotenv
# Supabase (client-safe)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (server-side only — never expose to browser)
OPENAI_API_KEY=your_openai_key
```

Add all three to Vercel project settings → Environment Variables before deploying.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | Fast to build, deploys to Vercel in minutes |
| Database | Supabase (Postgres) | Free tier, instant setup, JS client library |
| Hosting | Vercel | Zero-config deployment, env var support |
| External data | Grants.gov REST API | Free, no auth, real federal grant data |
| AI scoring | OpenAI gpt-4o-mini | Fast, cheap, sufficient for eligibility reasoning |
| Styling | Tailwind CSS | Utility-first, ships with Next.js |

---

## What Is Explicitly Out of Scope

Do NOT build any of the following:
- Grant reporting or compliance dashboards
- EMR/Epic integration
- Financial reconciliation or budget tracking
- Multi-user authentication (single hardcoded org profile is fine)
- Real-time data sync
- Email notifications
- PDF export of applications
- Any form that submits to external grant portals

**Why:** The assessment says "focus on discovery, qualification, and pipeline tracking." The customer transcript revealed EMR integration requires deep trust that must be earned over time — starting with grant discovery is the right wedge.

---

## Success Criteria for Prototype

- [ ] Grants.gov API returns real results and displays them
- [ ] OpenAI scores at least one grant against the org profile
- [ ] At least one grant can be saved to and retrieved from Supabase
- [ ] Status can be updated on a saved grant
- [ ] App is deployed at a public Vercel URL that works end-to-end
- [ ] No crashes during a basic demo flow

---

## Key Decisions (for submission doc)

1. **Grants.gov over SAM.gov** — No API key required, faster to integrate, covers core federal grant discovery use case for FQHCs.

2. **LLM-based eligibility scoring over rule-based matching** — Grant eligibility criteria are written in natural language and vary widely. An LLM can reason over arbitrary criteria against the org profile without requiring hand-coded rules for each grant type.

3. **Cut EMR integration entirely** — Customer transcript directly stated: "I would never put two important systems in one place." Trust must be earned before clinical data access is granted. Grant discovery is the right wedge — lower data sensitivity, immediate value.

4. **Single org profile instead of multi-tenant auth** — For a 2–3 hour prototype, auth infrastructure is not the thing being evaluated. A hardcoded org profile demonstrates the product concept without wasting build time on session management.

5. **Cut reporting/compliance features** — Assessment explicitly scoped this out. Building it would signal poor scope judgment.

---

## Instructions for AI Coding Assistant

When building this prototype:

1. Use Next.js App Router (`app/` directory structure)
2. Use Supabase JS client v2 (`@supabase/supabase-js`)
3. Keep components simple — function components only, no class components
4. Use Tailwind for all styling — no custom CSS files
5. API routes go in `app/api/[route-name]/route.js`
6. Supabase client should be initialized in a shared `lib/supabase.js` file
7. OpenAI calls must only happen server-side (in API routes) — never in client components
8. For the org profile, seed one row of synthetic data directly in Supabase if the form isn't built yet — the pipeline and scoring features are higher priority
9. Error states: show a simple error message if API calls fail — don't crash silently
10. Focus on working end-to-end, not polish

---
## Testing & Verification
- Automated unit and integration tests for core logic
- Manual verification of AI output accuracy

## Architectural Principles
- Testability
- Maintainability
- Security
- Production Ready

## Docs to maintain
- `BUILD_LOG.md`: Chronological tracking of build progress.
- `DECISIONS.md`: Log of architectural and design choices.
- `AI_REFLECTION.md`: Documentation of AI-assisted development and feature logic.