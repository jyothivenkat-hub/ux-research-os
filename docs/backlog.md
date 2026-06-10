# Backlog

Release 1 ships Competitive Analysis only.

## Next module candidates

1. Research brief generator
   - Generate decision contract, hypothesis, assumptions, research questions, risks, recruiting plan, and protocol.
   - Release after competitive analysis has stable source capture and export.

2. Question generator
   - Generate qual/quant instruments from the brief.
   - Depends on a released brief model or a clean standalone input flow.

3. Transcript synthesis
   - Paste transcript notes and generate codebook, participant evidence, themes, implications, and decision rows.
   - Needs stronger quote handling and explicit confidence rules before public release.

4. Reporting and Jira/Linear handoff
   - Generate final report and tracker-ready CSV.
   - Keep as CSV-first until authenticated Jira/Linear server connectors exist.

5. Synthetic personas and flow agents
   - Simulate prototype flows from persona variants.
   - Needs clearer boundaries because this is heuristic simulation, not real user evidence.

## Parking lot

- Authenticated search provider integration.
- Source screenshot capture and deduping.
- LLM-backed generation with project memory.
- IndexedDB or server storage.
- Jira and Linear API connectors.
- Shareable reports and stakeholder readout templates.

## Release rule

Add one module at a time. A module is releasable only when it has:

- a working input flow
- a generated output that is not placeholder text
- export/download support
- a source or evidence model
- docs in `docs/code-map.md`
- a browser-tested happy path
