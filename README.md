# UX Research Operating System

An end-to-end research operating system for running product research with AI agents. Supports competitive analysis, research briefs, questionnaire generation, transcript synthesis, final reports, and Jira or Linear-ready issue handoffs from one connected workflow.

[Live app](https://research-two-nu.vercel.app) · [GitHub repo](https://github.com/jyothivenkat-hub/ux-research-os)

![UX Research OS competitive module](./ux-research-os-competitive.png)

## Overview

UX Research OS is a local-first research workspace for planning studies, collecting evidence, generating research artifacts, synthesizing transcripts, and creating product handoff lines.

The app now opens with a seeded demo project by default so reviewers can immediately see the Competitive Analysis workflow populated with competitors, source evidence, a source ledger, scorecards, opportunities, risks, and CSV export.

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

Open `index.html` in a browser.

No build step is required.

## Deploy

This app is static HTML, CSS, and JavaScript. It can be deployed directly on Vercel from the repo root.

```bash
vercel --prod
```

## Project status

Current focus: make each workflow operational one by one. Competitive analysis is the most complete module: it supports source capture, evidence parsing, scorecards, opportunity/risk rows, research queue links, and CSV export.

The remaining modules are functional prototypes and should be hardened next in this order:

1. Research brief generator
2. Question generator
3. Synthetic persona flow testing
4. Transcript synthesis
5. Reporting and Jira/Linear handoff

## Integration path

The current build is intentionally static so it runs immediately. It is operational as a local research workflow, with local source capture and exportable evidence, but automated source collection, LLM generation, and tracker creation are still manual or connector-ready. To make the OS production-grade, wire these modules to services:

- Internet research: search API plus source capture, citation extraction, review/forum scraping, and deduped evidence storage.
- LLM generation: model-backed brief/question/persona/synthesis generation with project memory.
- Prototype testing: browser automation or product analytics replay for real flow validation.
- Storage: Supabase, Postgres, Firebase, or local-first IndexedDB sync.
- Issue tracking: Linear and Jira API connectors using generated issue rows.
- Reporting: report templates, stakeholder views, and shareable study readouts.
