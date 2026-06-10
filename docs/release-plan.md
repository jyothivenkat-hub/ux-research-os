# Release Plan

## Current release

Release 1: Competitive Analysis.

Goal: make one workflow credible, useful, and easy to understand before exposing the full OS.

## Release 1 acceptance criteria

- Reviewer lands directly in Competitive Analysis.
- Demo project loads by default.
- `Generate matrix` attempts server-side public research.
- Ambiguous product names are filtered with context-aware rules.
- Source ledger captures source title, URL, product, date, status, and note.
- Matrix includes competitor scorecard, criterion scorecard, opportunities/risks, research queue, and source ledger.
- CSV export works.
- No API keys, tokens, Jira credentials, Linear credentials, or model credentials are exposed in client code.

## Release sequence

1. Competitive Analysis
2. Research Brief
3. Question Generator
4. Transcript Synthesis
5. Reporting / Jira-Linear CSV handoff
6. Synthetic Personas / Flow Agents

## Validation checklist

- Run `node --check script.js`.
- Run `node --check api/competitive-research.js`.
- Run `node --check server.js`.
- Start `node server.js`.
- Test `http://localhost:8000/api/competitive-research` with realistic competitors.
- Browser test the visible Competitive flow.
- Verify Vercel production after deployment.
