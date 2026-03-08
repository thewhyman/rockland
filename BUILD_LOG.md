Build Log

[2026-03-07 15:25] Opened assessment. Read transcript and PR FAQ before touching code. Wrote requirements doc and scoped to discovery + pipeline only.
[2026-03-07 15:45] Scaffolded Next.js 14 App Router project. Installed supabase-js v2 and openai SDK. Configured .env.local with all keys.
[2026-03-07 16:00] Created org_profile and grant_pipeline tables in Supabase SQL Editor. Disabled RLS on both. AI attempted programmatic DDL via service role key — failed (PostgREST doesn't support DDL). Ran manually instead.
[2026-03-07 16:15] AI generated all 5 API routes and lib/supabase.js in one pass. Grants.gov API route tested — returning real grant data.
[2026-03-07 16:35] Seed script failed — column name mismatch between AI-generated code and PRD schema (ai_score vs match_score, award_floor vs amount_min). Fixed across all routes, pages, and seed script.
[2026-03-07 16:55] All three screens functional locally. Org profile saves to Supabase. Discovery search returns live Grants.gov results. OpenAI scoring returns score + rationale per grant. Pipeline shows saved grants with status updates.
[2026-03-07 17:10] node_modules corrupted — next binary missing server/require-hook. Resolved with rm -rf node_modules && npm install.
[2026-03-07 17:25] Seeded 4 realistic sample grants. All three screens end-to-end verified locally at localhost:3000.
[2026-03-07 17:25] Deployed to Vercel. Added all env vars. Verified live URL end-to-end.
