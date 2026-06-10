# UX Research OS

A dependency-free static prototype for an end-to-end UX research workspace.

![UX Research OS competitive module](./ux-research-os-competitive.png)

## What is included

- Competitive analysis workspace with competitor inputs, evaluation criteria, sourced-research search tabs, source ledger, evidence status, and a pros/cons matrix.
- Hypothesis and research brief generator with a decision contract, assumption ledger, risk table, and pass/fail gate.
- Qual and quant questionnaire generator with constructs, capture rules, response types, and decision thresholds.
- Synthetic persona variants with flow run results, severity, step-level findings, and issue candidates.
- Transcript synthesis with participant-coded evidence, theme confidence, severity, quotes, implications, and tracker candidates.
- Reporting and Linear/Jira-ready issue lines with an evidence ledger, Markdown, CSV, JSON, copy, import, export, and local save.

## Run

Open `index.html` in a browser.

No build step is required.

## Deploy

This app is static HTML, CSS, and JavaScript. It can be deployed directly on Vercel from the repo root.

```bash
vercel --prod
```

## Project status

Current focus: make each workflow operational one by one. Competitive analysis is the most complete module: it supports source capture, evidence parsing, scorecards, opportunity/risk rows, research queue links, and CSV export.

## Integration path

The current build is intentionally static so it runs immediately. It is operational as a local research workflow, with local source capture and exportable evidence, but automated source collection, LLM generation, and tracker creation are still manual or connector-ready. To make the OS production-grade, wire these modules to services:

- Internet research: search API plus source capture, citation extraction, review/forum scraping, and deduped evidence storage.
- LLM generation: model-backed brief/question/persona/synthesis generation with project memory.
- Prototype testing: browser automation or product analytics replay for real flow validation.
- Storage: Supabase, Postgres, Firebase, or local-first IndexedDB sync.
- Issue tracking: Linear and Jira API connectors using generated issue rows.
- Reporting: report templates, stakeholder views, and shareable study readouts.
