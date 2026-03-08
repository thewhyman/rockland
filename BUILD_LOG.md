Build Log

[2026-03-07 5:25 PM PST] Opened assessment. Read transcript and PR FAQ before touching code. Wrote requirements doc and scoped to discovery + pipeline only.
[2026-03-07 5:45 PM PST] Scaffolded Next.js 14 App Router project. Installed supabase-js v2 and openai SDK. Configured .env.local with all keys.
[2026-03-07 6:00 PM PST] Created org_profile and grant_pipeline tables in Supabase SQL Editor. Disabled RLS on both. AI attempted programmatic DDL via service role key — failed (PostgREST doesn't support DDL). Ran manually instead.
[2026-03-07 6:15 PM PST] AI generated all 5 API routes and lib/supabase.js in one pass. Grants.gov API route tested — returning real grant data.
[2026-03-07 6:35 PM PST] Seed script failed — column name mismatch between AI-generated code and PRD schema (ai_score vs match_score, award_floor vs amount_min). Fixed across all routes, pages, and seed script.
[2026-03-07 6:55 PM PST] All three screens functional locally. Org profile saves to Supabase. Discovery search returns live Grants.gov results. OpenAI scoring returns score + rationale per grant. Pipeline shows saved grants with status updates.
[2026-03-07 7:10 PM PST] node_modules corrupted — next binary missing server/require-hook. Resolved with rm -rf node_modules && npm install.
[2026-03-07 7:25 PM PST] Seeded 4 realistic sample grants. All three screens end-to-end verified locally at localhost:3000.
[2026-03-07 7:25 PM PST] Deployed to Vercel. Added all env vars. Verified live URL end-to-end.
[2026-03-07 7:31 PM PST] Added Vitest test suite. 35 unit and integration tests across 4 files: utility functions (formatCurrency, formatDate, deadlineBadgeClass), search-grants API (normalization, error handling, default keyword), save-grant API (field mapping, missing input validation), pipeline API (GET/PATCH/DELETE, status validation). Fixed hardcoded absolute path in vitest.config.js. Fixed React key prop warning in pipeline page (moved key from inner <tr> to outer React.Fragment). All 35 tests passing.
