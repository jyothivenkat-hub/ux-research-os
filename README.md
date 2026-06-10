# UX Research Operating System

An end-to-end research operating system for running product research with AI agents. Supports competitive analysis, research briefs, questionnaire generation, transcript synthesis, final reports, and Jira or Linear-ready issue handoffs from one connected workflow.

[Live app](https://research-two-nu.vercel.app) · [GitHub repo](https://github.com/jyothivenkat-hub/ux-research-os)

![UX Research OS competitive module](./ux-research-os-competitive.png)

## Overview

UX Research OS is a local-first research workspace for planning studies, collecting evidence, generating research artifacts, synthesizing transcripts, and creating product handoff lines. Each module produces structured artifacts that can be copied, saved, exported, or pulled into the final report.

The public demo ships with no API keys, no client-side secrets, and no third-party tracker credentials. Competitive Analysis uses a no-key server route to collect public search snippets, then opens with a seeded demo project so reviewers can immediately see competitors, source evidence, a source ledger, scorecards, opportunities, risks, and CSV export.

## What is included

- Competitive analysis workspace with competitor inputs, evaluation criteria, sourced-research search tabs, source ledger, evidence status, and a pros/cons matrix.
- Hypothesis and research brief generator with a decision contract, assumption ledger, risk table, and pass/fail gate.
- Qual and quant questionnaire generator with constructs, capture rules, response types, and decision thresholds.
- Synthetic persona variants with flow run results, severity, step-level findings, and issue candidates.
- Transcript synthesis with participant-coded evidence, theme confidence, severity, quotes, implications, and tracker candidates.
- Reporting and Linear/Jira-ready issue lines with an evidence ledger, Markdown, CSV, JSON, copy, import, export, and local save.

## Default demo

On first load, the app seeds a demo called `UX Research OS operational pilot` and automatically generates the Competitive Analysis output. If a saved/imported project exists in browser local storage, that saved project is loaded instead.

Use `Load demo` at any time to reset the visible fields to the demo project.

## Competitive workflow

The Competitive module is the most complete workflow right now. It supports:

- competitor and criteria entry
- pasted evidence notes in the format `Product | Source | Pros: ... Cons: ...`
- structured source capture with title, URL, product, date, status, and evidence note
- competitor scorecard with pros, cons, source count, next move, and confidence
- criterion scorecard
- opportunity and risk table
- clickable research queue
- CSV export

## Run

For the full local demo, run the local Node server:

```bash
node server.js
```

Then open `http://localhost:8000`.

Opening `index.html` directly still works for the static workflows, but live competitive research needs the local server route at `/api/competitive-research`.

## Deploy

This app is static HTML, CSS, and JavaScript. It can be deployed directly on Vercel from the repo root.

```bash
vercel --prod
```

## Project status

Current status: local workflows are operational end to end. The app opens with a seeded demo, saves locally, exports project JSON, generates downloadable artifacts for the main research flows, and uses a no-key server-side search route for Competitive Analysis. Public sharing is safe because no service credentials or private tracker endpoints are included in the client code.

Module coverage:

1. Competitive analysis: no-key server-side web search, source capture, evidence parsing, scorecards, opportunity/risk rows, research queue links, and CSV export.
2. Research brief: decision contract, assumption ledger, research questions, recruiting plan, session protocol, and downloadable brief artifacts.
3. Question generator: qual/quant instrument, task plan, metrics, operating rules, and CSV export.
4. Synthetic persona flow testing: agent run log, step findings, severity, and issue candidates.
5. Transcript synthesis: codebook, participant evidence matrix, themes, decision rows, and CSV export.
6. Reporting: module readiness, evidence ledger, final report, and Jira/Linear-ready issue CSV.

## Integration path

The current build is intentionally lightweight so it runs immediately. It is operational as a local research workflow, with live competitive-search snippets, local source capture, and exportable evidence, but LLM generation and tracker creation are not bundled in the public demo. To make the OS production-grade, wire these modules to authenticated server-side services:

- Internet research: server-side search provider plus source capture, citation extraction, review/forum scraping, and deduped evidence storage.
- AI generation: server-side model-backed brief/question/persona/synthesis generation with project memory.
- Prototype testing: browser automation or product analytics replay for real flow validation.
- Storage: Supabase, Postgres, Firebase, or local-first IndexedDB sync.
- Issue tracking: server-side Linear and Jira connectors using generated issue rows.
- Reporting: report templates, stakeholder views, and shareable study readouts.
