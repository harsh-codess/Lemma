# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lemma is a commercialization evaluation platform for Technology Transfer Offices (TTOs) and researchers. Users upload research papers (PDFs), and a pipeline of AI agents analyzes them for commercial potential — paper analysis, TRL/IRL readiness scoring, market sizing, feasibility, and investor deck generation.

## Commands

```bash
npm run dev          # Next.js dev server at http://localhost:3000
npm run build        # Production build (also type-checks)
npm run lint         # ESLint (next lint)

npx vitest run                          # Run all tests
npx vitest run lib/agents/validators.test.ts   # Run a single test file

npx prisma generate                     # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>    # Create & apply a migration
npx prisma studio                       # Browse the database

npx tsx scripts/test-agents.ts [pdf-url]  # Run Agent 1 + 2 standalone against a real PDF
                                          # (needs only GEMINI_API_KEY; no DB/Inngest/Next.js)
```

Environment lives in `.env.local` (Clerk, Neon `DATABASE_URL`, Cloudflare R2, `GEMINI_API_KEY`, `TAVILY_API_KEY`, Inngest, Pusher, Upstash). `prisma.config.ts` loads `.env.local` for Prisma CLI commands.

## Architecture

**Stack:** Next.js 14 App Router + TypeScript, Prisma 7 on Neon Postgres (via `@prisma/adapter-pg`), Clerk auth, Cloudflare R2 storage (S3 SDK), Google Gemini for agents, Inngest for background jobs, Pusher for real-time, Upstash Redis for rate limiting, Tailwind + Radix UI.

### Analysis pipeline (the core of the app)

```
Upload PDF → POST /api/upload (server-side upload to R2)
→ POST /api/projects/[id]/analyze (rate-limited: 5/user/hour, sets status PROCESSING immediately)
→ Inngest event "paper/uploaded" → analyzePaper function in lib/inngest.ts
→ Sequential step.run() per agent: agent-1-paper → critique-paper → agent-2-trl-irl → agent-3-retrieve → agent-3-market → agent-4-feasibility → critique-feasibility → save-agent-4 → agent-5-pitch → critique-pitch → save-agent-5 (DECK → COMPLETE, REVIEW → CURRENT for human review)
→ Each agent's output saved to its own Prisma model (PaperData, TrlIrlData, ...)
→ Pusher events on channel `project-${projectId}` + browser polls GET /api/projects/[id]/status
```

Key properties of the pipeline:
- Each agent is its own Inngest `step.run()`, so a failed step retries (3x) without re-running earlier agents.
- The `onFailure` handler marks the project `FAILED` and notifies via Pusher.
- `/api/projects/[id]/status` is intentionally lightweight (status, error, current stage, readiness score, stage list) — don't add heavy queries to it; full project data comes from `/api/projects/[id]`.
- Pusher is optional at runtime — notification code gracefully no-ops if env vars are missing.

### Agents (`lib/agents/`)

- `gemini-client.ts` — Gemini API wrapper with retry; agents send the PDF as base64. Accepts a `responseSchema` option (Gemini native structured output) so responses are always parseable JSON.
- `gemini-schema.ts` — converts a Zod schema into Gemini's `responseSchema` (OpenAPI subset). Unsupported constraints (min/max lengths, patterns, unions) are stripped and enforced only by the Zod safeParse.
- `paper-agent.ts` (Agent 1) — extracts abstract, novelty, domain, claims with confidence; rejects non-research documents (financial reports, textbooks, etc.). Takes an optional `revisionContext` for the one-shot critique regeneration.
- `critique-agent.ts` (Skeptical Review) — audits Agent 1's output against the PDF; CRITICAL grounding issues trigger exactly one Agent 1 regeneration with the critique as context. Best-effort in the pipeline: an unusable critique falls back to the original analysis rather than failing the run.
- `trl-irl-agent.ts` (Agent 2) — consumes Agent 1 output (never the PDF); scores TRL/IRL, suggests pathway (SPIN_OFF/LICENSING/PARTNERSHIP), flags risks.
- `search-client.ts` — swappable web-search wrapper (currently Tavily; key from `process.env.TAVILY_API_KEY`, read lazily). Swap providers via `getSearchClient()`.
- `market-scout-agent.ts` (Agent 3, two stages) — Stage 1 `runMarketRetrieval`: Tavily queries derived from domain/key claims (competitors, funding, patents, market size); raw sources persisted to the `RetrievedSource` table. Stage 2 `runMarketSynthesis`: Gemini sees ONLY the retrieved sources; every figure/competitor/signal requires a `sourceUrl` that `buildMarketScoutValidator` checks against the retrieved URL set — ungrounded URLs are rejected and the Zod errors are fed back into the retry prompt (max 3 attempts). Figures with no grounded source come back `null`. Market Scout is enrichment: failures skip the market stage but never fail the pipeline.
- `feasibility-agent.ts` (Agent 4) — REASONS (no retrieval, no source URLs); consumes Agent 1 (post-critique) + Agent 2, with Agent 3's brief as optional context (works when market was skipped). Accuracy mechanism is traceability-to-inputs + explicit uncertainty: `estimatedTimeline`/`capitalEstimate` are ranges with required `confidence` + `reasoning`, and `feasibilityScoutSchema` rejects any range where `max <= min` (false-precision guard). Has its own critique (`runFeasibilityCritique` in `critique-agent.ts`) auditing traceability + over-confidence; CRITICAL findings trigger one regeneration. Skip-don't-fail like Market Scout. Saved to `FeasibilityData` (legacy string columns hold display-formatted derivations of the new Json range columns).
- `pitch-builder-agent.ts` (Agent 5) — SYNTHESIZER of structured investor-deck CONTENT (slides, NOT a rendered file — PPT/PDF generation is a separate future step). Restates/reframes facts from agents 1–4 but introduces NO new fact: `buildRefMenu` enumerates every citable upstream fact as a `ref` (e.g. `market.tam`, `paper.keyClaims[2]`), shown to the model as its only citable menu. Each slide bullet's factual claims carry `factRefs` (`{ref, sourceUrl}`); narrative prose is free. Two guardrails: (1) structural — `buildPitchValidator` rejects invented refs and any market figure missing/mismatching its carried Market Scout `sourceUrl` (source carry-through), with an internal retry loop feeding Zod errors back; (2) semantic — `runPitchCritique` (in `critique-agent.ts`) reads the deck against all four upstream outputs and flags any factual claim whose VALUE doesn't match upstream (it ignores prose), CRITICAL → one regeneration. Skips the MARKET slide gracefully when market was skipped; only runs when feasibility produced output. Saved to `DeckData.slides` (Json source of truth) + legacy `DeckSlide` rows.
- All agent outputs are validated against Zod schemas in `validators.ts` before being persisted — keep schemas in sync with `types.ts` and the Prisma models when changing agent output shape. Each agent's Zod schema is also converted to its Gemini `responseSchema` at module load.

### Data model (`prisma/schema.prisma`)

- `User` (Clerk ID + role + onboarding state) → `Institution` (multi-tenancy) → `Project` → `ProjectStage` (six stages: PAPER, TRL_IRL, MARKET, FEASIBILITY, DECK, REVIEW).
- One model per agent output: `PaperData`, `TrlIrlData`, `MarketData`, `FeasibilityData`, `DeckData`, `ReviewData`, plus supporting models (`Evidence`, `Competitor`, `MarketSignal`, `DeckSlide`, `ReviewNote`, `CopilotPrompt`).

### Authorization

Role-based visibility is enforced in the API route handlers (not middleware):
- RESEARCHER sees own projects; TTO_ANALYST/TTO_LEAD see their institution's projects; COMMITTEE_MEMBER sees IN_REVIEW/READY_FOR_EXPORT only; ADMIN sees all.
- `middleware.ts` (Clerk) gates `/app/*`; the onboarding flow (`app/onboarding/`, `/api/onboarding`) must complete before workspace access.

### Frontend layout

- `app/page.tsx` + `app/sections/`, `components/sections/`, `components/premium-page-shell/` — public marketing site.
- `app/app/` — protected workspace (portfolio, project detail, review, exports, settings). The main project view is `components/workspace/project-workspace.tsx`; data fetching/shaping lives in `lib/workspace-data.ts`.
- `components/ui/` — shadcn-style Radix primitives (see `components.json`).
- SVGs are imported as React components via SVGR (`next.config.mjs`).

## Notes

- Spec-kit (GitHub speckit) artifacts live in `.specify/`, `.github/agents/`, and `.github/prompts/` — planning/workflow scaffolding, not application code.
