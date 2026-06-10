const state = {
  projectName: "Untitled UX research system",
  outputs: {
    competitive: "",
    brief: "",
    questions: "",
    personas: "",
    synthesis: "",
    report: "",
  },
  issues: [],
  artifacts: {
    competitive: [],
    competitiveCriteria: [],
    competitiveOpportunities: [],
    competitiveQueue: [],
    assumptions: [],
    instrument: [],
    agentFindings: [],
    synthesis: [],
    briefRisks: [],
    briefPlan: [],
    questionMetrics: [],
    participantRows: [],
    reportDecisions: [],
  },
  sources: [],
  competitiveExportRows: [],
  moduleExportRows: {},
};

const selectors = {
  projectName: document.querySelector("#projectName"),
  saveState: document.querySelector("#saveState"),
  moduleCount: document.querySelector("#moduleCount"),
  toast: document.querySelector("#toast"),
};

const storageKey = "ux-research-os-project";

const getValue = (id) => document.querySelector(`#${id}`).value.trim();
const lines = (value) =>
  value
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);

const words = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });

const setOutput = (key, html, text) => {
  const el = document.querySelector(`#${key}Output`);
  el.classList.remove("empty");
  el.innerHTML = html;
  state.outputs[key] = text;
  updateCounts();
  markDirty();
};

const showToast = (message) => {
  selectors.toast.textContent = message;
  selectors.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => selectors.toast.classList.remove("show"), 2200);
};

const markDirty = () => {
  selectors.saveState.textContent = "Unsaved";
};

const updateCounts = () => {
  const count = Object.values(state.outputs).filter(Boolean).length;
  selectors.moduleCount.textContent = `${count} output${count === 1 ? "" : "s"}`;
};

const outputBlock = (title, items) => `
  <section>
    <h3>${escapeHtml(title)}</h3>
    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>
`;

const table = (headers, rows) => `
  <div class="table-scroll">
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
`;

const toTextTable = (headers, rows) => {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${header}\n${divider}\n${body}`;
};

const rowsToCsv = (rows) =>
  rows
    .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

const requireOutput = (key, label) => {
  if (state.outputs[key]) return true;
  showToast(`Generate ${label} first`);
  return false;
};

const splitSentences = (value) =>
  value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const keywordSummary = (value, limit = 8) => {
  const stop = new Set([
    "that",
    "this",
    "with",
    "from",
    "have",
    "they",
    "their",
    "when",
    "what",
    "there",
    "would",
    "could",
    "should",
    "about",
    "into",
    "because",
    "really",
    "just",
  ]);
  const counts = words(value).reduce((acc, word) => {
    if (!stop.has(word)) acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => `${word} (${count})`);
};

const sentencePick = (value, terms, limit = 3) => {
  const sentences = value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35);
  return sentences
    .filter((sentence) => terms.some((term) => sentence.toLowerCase().includes(term.toLowerCase())))
    .slice(0, limit);
};

const positiveWords = [
  "easy",
  "fast",
  "clear",
  "useful",
  "accurate",
  "helpful",
  "trust",
  "love",
  "strong",
  "simple",
  "productive",
  "save",
  "saves",
  "actionable",
  "automation",
  "automatically",
  "centralizes",
  "collaboration",
  "insight",
  "insights",
  "integrations",
  "platform",
];

const negativeWords = [
  "hard",
  "slow",
  "confusing",
  "unclear",
  "expensive",
  "concern",
  "concerns",
  "broken",
  "manual",
  "difficult",
  "missing",
  "risk",
  "risky",
  "do not",
  "don't",
  "cannot",
];

const titleCase = (value) =>
  value
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const termMatches = (text, term) =>
  term.includes(" ")
    ? text.includes(term)
    : new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text);

const scoreTerms = (text, terms) => {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => count + (termMatches(lower, term) ? 1 : 0), 0);
};

const signalLabel = (value) => {
  if (value >= 4) return "High";
  if (value >= 2) return "Medium";
  if (value >= 1) return "Low";
  return "Needs evidence";
};

const actionFromSignal = (negative, positive) => {
  if (negative > positive) return "Fix or de-risk before scaling";
  if (positive > negative) return "Exploit as differentiator";
  return "Collect more evidence";
};

const splitEvidenceNotes = (value) =>
  value
    .split(/\n+/)
    .map((note) => note.trim())
    .filter(Boolean);

const evidenceFor = (notes, term) =>
  notes.filter((note) => note.toLowerCase().includes(term.toLowerCase()));

const sourceTypeFor = (sourceFocus) => {
  const labels = {
    reviews: "review/forum evidence",
    pricing: "pricing-page evidence",
    docs: "help-center evidence",
    launch: "launch/changelog evidence",
    all: "mixed-source evidence",
  };
  return labels[sourceFocus] || sourceFocus;
};

const participantBlocks = (value) => {
  const explicit = value
    .split(/\n(?=(?:p|participant|user|interview)\s*\d*[:|-])/i)
    .map((block) => block.trim())
    .filter(Boolean);
  if (explicit.length > 1) {
    return explicit.map((block, index) => ({ id: `P${index + 1}`, text: block }));
  }
  const paragraphs = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const blocks = paragraphs.length > 1 ? paragraphs : [value.trim()];
  return blocks.map((block, index) => ({ id: `P${index + 1}`, text: block }));
};

const shortQuote = (value, tag) => {
  const match = sentencePick(value, [tag], 1)[0];
  if (match) return match.length > 180 ? `${match.slice(0, 177)}...` : match;
  const fallback = value.split(/(?<=[.!?])\s+|\n+/).find((sentence) => sentence.trim().length > 20);
  if (!fallback) return "Needs direct quote";
  return fallback.length > 180 ? `${fallback.slice(0, 177)}...` : fallback;
};

const csvSafeId = (value) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 28);

const ownerFromModule = (moduleName, fallback) => `${fallback || "Research"} / ${moduleName}`;

const normalizeSourceUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const sourceSummary = (source) =>
  [source.product, source.title, source.source, source.note, source.url].filter(Boolean).join(" ");

const sourceMatches = (source, term) =>
  sourceSummary(source).toLowerCase().includes(term.toLowerCase());

const extractEvidenceLabel = (value, label) => {
  const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\b(?:Pros|Cons|Risk|Opportunity|Source|URL):|$)`, "i");
  const match = value.match(pattern);
  return match ? match[1].trim().replace(/\s+/g, " ") : "";
};

const compactEvidence = (value, fallback = "Needs evidence") => {
  if (!value) return fallback;
  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted.length > 150 ? `${compacted.slice(0, 147)}...` : compacted;
};

const noteForAnalysis = (value = "") => value.replace(/\s*Search query:[\s\S]*$/i, "").trim();

const parseEvidenceItem = (note) => {
  const parts = note.split("|").map((part) => part.trim());
  const [product = "General", source = "Evidence note", ...rest] = parts;
  const detail = rest.join(" | ") || note;
  return {
    id: `NOTE-${csvSafeId(product)}-${Math.abs(note.length * 17)}`,
    product,
    source,
    status: "Captured",
    date: "",
    url: extractEvidenceLabel(detail, "URL"),
    note: detail,
    pros: extractEvidenceLabel(detail, "Pros"),
    cons: extractEvidenceLabel(detail, "Cons"),
  };
};

const sourceToEvidenceItem = (source) => ({
  id: source.id,
  product: source.product || "General",
  source: source.title || "Source",
  status: source.status || "Needs review",
  date: source.date || "",
  url: source.url || "",
  note: noteForAnalysis(source.note || ""),
  pros: extractEvidenceLabel(noteForAnalysis(source.note || ""), "Pros"),
  cons: extractEvidenceLabel(noteForAnalysis(source.note || ""), "Cons"),
});

const sourceFingerprint = (source) =>
  [source.product, source.url, source.title].filter(Boolean).join("|").toLowerCase();

const fetchCompetitiveResearch = async ({ category, competitors, criteria, sourceFocus }) => {
  try {
    const response = await fetch("/api/competitive-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, competitors, criteria, sourceFocus }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.warning || payload.error || "Research request failed");
    return payload;
  } catch (error) {
    return {
      sources: [],
      warning: error.message || "Live web research unavailable. Generated from local evidence.",
    };
  }
};

const mergeResearchSources = (sources = []) => {
  const existing = new Set(state.sources.map(sourceFingerprint));
  const imported = sources
    .filter((source) => source && (source.title || source.note || source.url))
    .map((source) => ({
      id: source.id || `WEB-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: source.title || "Public web result",
      url: normalizeSourceUrl(source.url),
      product: source.product || "General",
      date: source.date || new Date().toISOString().slice(0, 10),
      status: source.status || "Captured",
      note: source.note || "",
    }))
    .filter((source) => {
      const fingerprint = sourceFingerprint(source);
      if (!fingerprint || existing.has(fingerprint)) return false;
      existing.add(fingerprint);
      return true;
    });

  if (imported.length) {
    state.sources = [...state.sources, ...imported];
    renderSourceList();
  }

  return imported.length;
};

const statusWeight = (status) => {
  if (status === "Validated") return 3;
  if (status === "Captured") return 2;
  if (status === "Needs review") return 1;
  return 0;
};

const confidenceFromEvidence = (items, positive, negative) =>
  signalLabel(items.reduce((sum, item) => sum + statusWeight(item.status), 0) + positive + negative);

const queryUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const researchQueueTable = (rows) => `
  <table>
    <thead><tr><th>Competitor</th><th>Criterion</th><th>Search string</th><th>Status</th><th>Open</th></tr></thead>
    <tbody>
      ${rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row[0])}</td>
              <td>${escapeHtml(row[1])}</td>
              <td>${escapeHtml(row[2])}</td>
              <td>${escapeHtml(row[3])}</td>
              <td><a href="${escapeHtml(queryUrl(row[2]))}" target="_blank" rel="noopener noreferrer">Search</a></td>
            </tr>
          `
        )
        .join("")}
    </tbody>
  </table>
`;

const renderSourceList = () => {
  const list = document.querySelector("#sourceList");
  if (!list) return;

  if (!state.sources.length) {
    list.textContent = "No sources captured yet.";
    return;
  }

  list.innerHTML = state.sources
    .map((source) => {
      const url = normalizeSourceUrl(source.url);
      const sourceLink = url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open source</a>`
        : `<span>No URL</span>`;
      return `
        <article class="source-item">
          <div class="source-item-head">
            <div>
              <strong>${escapeHtml(source.title || "Untitled source")}</strong>
              <span>${escapeHtml(source.product || "General evidence")}</span>
            </div>
            <button class="mini-button" data-remove-source="${escapeHtml(source.id)}" type="button">Remove</button>
          </div>
          <p>${escapeHtml(source.note || "No evidence note captured.")}</p>
          <div class="source-meta">
            <span>${escapeHtml(source.status || "Needs review")}</span>
            <span>${escapeHtml(source.date || "No date")}</span>
            ${sourceLink}
          </div>
        </article>
      `;
    })
    .join("");
};

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}`).classList.add("active");
  });
});

document.querySelectorAll("input, textarea, select").forEach((field) => {
  field.addEventListener("input", markDirty);
});

document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(`#${button.dataset.copy}`);
    try {
      await navigator.clipboard.writeText(target.innerText);
      showToast("Copied");
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = target.innerText;
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
      showToast("Copied");
    }
  });
});

const setFieldValue = (id, value) => {
  const field = document.querySelector(`#${id}`);
  if (!field) return;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};

const demoProject = {
  fields: {
    projectName: "UX Research OS operational pilot",
    category: "UX research repository and synthesis tools",
    competitors: "Dovetail\nEnjoyHQ\nMaze",
    criteria: "Onboarding\nAI synthesis\nParticipant recruitment\nStakeholder reporting\nJira integration",
    competitiveEvidence:
      "Dovetail | G2 | Pros: strong tagging and repository search. Cons: expensive for small teams.\nMaze | Reddit | Cons: panel quality concerns and survey fatigue. Pros: fast unmoderated testing.\nEnjoyHQ | Review | Pros: useful repository. Cons: setup can feel manual.",
    decision: "Should we build an all-in-one UX Research OS?",
    hypothesis:
      "Researchers want one place to plan, run, synthesize, and push research into product systems.",
    targetUsers: "UX researchers, design leads, PMs, startup founders",
    decisionThreshold: "7 of 10 users complete the core flow and rate trust 4 or 5",
    knownRisks: "Overbroad scope\nTrust in AI synthesis\nWorkflow integration complexity",
    questionObjective: "Understand which research workflows should be integrated first.",
    prototypeContext:
      "A dashboard with modules for competitive research, brief generation, personas, synthesis, and issue tracking.",
    participants: "Researchers and PMs who run monthly user research",
    questionThreshold: "Prioritize workflows that score 4+ value and 4+ trust",
    personaSeeds: "Senior UX researcher\nProduct manager\nFounder",
    flowSteps: "Create study\nAdd competitors\nGenerate brief\nPaste transcript\nCreate Jira lines",
    prototypeNotes: "Current prototype has static outputs and no source connector yet.",
    transcripts:
      "Participant 1: I need research to connect to product decisions. The tool is useful if it saves synthesis time. I do not fully trust AI themes unless I can inspect quotes.\n\nParticipant 2: Jira handoff is important because findings often die in slide decks. Onboarding needs to show the research workflow clearly.\n\nParticipant 3: Competitive research is manual and slow. I would trust it more if every claim had a source link and date.",
    synthesisTags: "trust, jira, onboarding, synthesis, decisions, source",
    audience: "Design, product, engineering",
    ownerTeam: "Research platform",
  },
  sources: [
    {
      id: "demo-dovetail-g2",
      title: "Dovetail G2 review pattern",
      url: "https://www.g2.com/products/dovetail/reviews",
      product: "Dovetail",
      date: "2026-05-27",
      status: "Captured",
      note: "Repository search and tagging are recurring strengths; price sensitivity appears in small-team reviews.",
    },
    {
      id: "demo-maze-forum",
      title: "Maze panel quality complaints",
      url: "https://www.reddit.com/search/?q=Maze%20panel%20quality%20research",
      product: "Maze",
      date: "2026-05-27",
      status: "Needs review",
      note: "Panel quality and survey fatigue should be verified before treating speed as a durable advantage.",
    },
    {
      id: "demo-enjoyhq-review",
      title: "EnjoyHQ repository setup feedback",
      url: "https://www.g2.com/products/enjoyhq/reviews",
      product: "EnjoyHQ",
      date: "2026-05-27",
      status: "Captured",
      note: "Repository value is clear, but setup effort can feel manual for teams without research ops support.",
    },
  ],
};

const loadDemoProject = ({ toast = true } = {}) => {
  Object.entries(demoProject.fields).forEach(([id, value]) => setFieldValue(id, value));
  state.projectName = demoProject.fields.projectName;
  state.sources = demoProject.sources.map((source) => ({ ...source }));
  renderSourceList();
  if (toast) showToast("Demo study loaded");
};

document.querySelector("#loadDemo").addEventListener("click", () => {
  loadDemoProject();
});

document.querySelector("#runCompetitive").addEventListener("click", async () => {
  const runButton = document.querySelector("#runCompetitive");
  const originalLabel = runButton.textContent;
  const category = getValue("category") || "the category";
  const competitors = lines(getValue("competitors"));
  const criteriaInput = lines(getValue("criteria"));
  const criteria = criteriaInput.length
    ? criteriaInput
    : [
        "Onboarding",
        "Core workflow",
        "Pricing",
        "Collaboration",
        "Trust",
      ];
  const sourceFocus = getValue("sourceFocus");

  if (!competitors.length) {
    showToast("Add at least one competitor");
    return;
  }

  runButton.disabled = true;
  runButton.textContent = "Researching...";
  const webResearch = await fetchCompetitiveResearch({ category, competitors, criteria, sourceFocus });
  const importedSourceCount = mergeResearchSources(webResearch.sources || []);
  runButton.disabled = false;
  runButton.textContent = originalLabel;

  if (importedSourceCount) {
    showToast(`Added ${importedSourceCount} web evidence source${importedSourceCount === 1 ? "" : "s"}`);
  } else if (webResearch.warning) {
    showToast("Generated from local evidence");
  }

  const noteItems = splitEvidenceNotes(getValue("competitiveEvidence")).map(parseEvidenceItem);
  const sourceItems = state.sources.map(sourceToEvidenceItem);
  const evidenceItems = [...noteItems, ...sourceItems];
  const researchStatus = importedSourceCount
    ? `Live research added ${importedSourceCount} public search snippet${importedSourceCount === 1 ? "" : "s"} from ${webResearch.source || "the server route"}. Review source links before treating findings as confirmed.`
    : webResearch.warning || "Live research returned no new sources. Matrix generated from local evidence and research queue links.";

  const rows = competitors.map((competitor) => {
    const matchedItems = evidenceItems.filter((item) => sourceMatches(item, competitor));
    const combinedEvidence = matchedItems.map((item) => item.note).join(" ");
    const positive = scoreTerms(combinedEvidence, positiveWords);
    const negative = scoreTerms(combinedEvidence, negativeWords);
    const strongestCriterion =
      criteria.find((criterion) => combinedEvidence.toLowerCase().includes(criterion.toLowerCase())) ||
      criteria[(positive + negative + competitor.length) % criteria.length];
    const pros = matchedItems.map((item) => item.pros).filter(Boolean).join(" / ");
    const cons = matchedItems.map((item) => item.cons).filter(Boolean).join(" / ");
    const fallbackPros = matchedItems
      .filter((item) => scoreTerms(item.note, positiveWords) > scoreTerms(item.note, negativeWords))
      .map((item) => item.note)
      .join(" / ");
    const fallbackCons = matchedItems
      .filter((item) => scoreTerms(item.note, negativeWords) > scoreTerms(item.note, positiveWords))
      .map((item) => item.note)
      .join(" / ");
    const confidence = confidenceFromEvidence(matchedItems, positive, negative);
    return [
      competitor,
      strongestCriterion,
      compactEvidence(pros || fallbackPros, `Needs ${sourceTypeFor(sourceFocus)} for pros.`),
      compactEvidence(cons || fallbackCons, `Needs ${sourceTypeFor(sourceFocus)} for cons.`),
      matchedItems.length,
      actionFromSignal(negative, positive),
      confidence,
    ];
  });

  const queueRows = competitors.flatMap((competitor) =>
    criteria.slice(0, 3).map((criterion) => [
      competitor,
      criterion,
      `${competitor} ${category} ${criterion} reviews complaints pricing`,
      evidenceItems.some((item) => sourceMatches(item, competitor) && sourceMatches(item, criterion))
        ? "Covered"
        : evidenceItems.some((item) => sourceMatches(item, competitor))
        ? "Evidence started"
        : "Needs source",
    ])
  );

  const criterionRows = competitors.flatMap((competitor) =>
    criteria.map((criterion) => {
      const matchedItems = evidenceItems.filter(
        (item) => sourceMatches(item, competitor) && sourceMatches(item, criterion)
      );
      const allCompetitorItems = evidenceItems.filter((item) => sourceMatches(item, competitor));
      const evidencePool = matchedItems.length ? matchedItems : allCompetitorItems;
      const combined = evidencePool.map((item) => item.note).join(" ");
      const positive = scoreTerms(combined, positiveWords);
      const negative = scoreTerms(combined, negativeWords);
      const score = Math.max(0, Math.min(5, 2 + positive - negative + matchedItems.length));
      return [
        competitor,
        criterion,
        `${score}/5`,
        confidenceFromEvidence(evidencePool, positive, negative),
        compactEvidence(combined, "No evidence tied to this criterion yet."),
      ];
    })
  );

  const opportunityRows = criteria.map((criterion) => {
    const competitorRows = criterionRows.filter((row) => row[1] === criterion);
    const weakCount = competitorRows.filter((row) => Number(row[2].split("/")[0]) <= 2).length;
    const strongCount = competitorRows.filter((row) => Number(row[2].split("/")[0]) >= 4).length;
    return [
      criterion,
      weakCount > strongCount ? "Differentiation opportunity" : "Parity or proof-point area",
      weakCount,
      strongCount,
      weakCount > strongCount
        ? `Position around ${criterion.toLowerCase()} with stronger proof than competitors.`
        : `Collect direct comparison evidence before making ${criterion.toLowerCase()} a headline claim.`,
    ];
  });

  const sourceRows = evidenceItems.map((source) => [
    source.product || "General",
    source.source || "Untitled source",
    source.status || "Needs review",
    source.date || "No date",
    source.url || "No URL",
    compactEvidence(source.note, "No evidence note"),
  ]);

  state.artifacts.competitive = rows.map((row) => ({
    competitor: row[0],
    criterion: row[1],
    pros: row[2],
    cons: row[3],
    sourceCount: row[4],
    action: row[5],
    confidence: row[6],
  }));
  state.artifacts.competitiveCriteria = criterionRows;
  state.artifacts.competitiveOpportunities = opportunityRows;
  state.artifacts.competitiveQueue = queueRows;
  state.competitiveExportRows = [
    ["Section", "Competitor", "Criterion", "Pros or score", "Cons or evidence", "Source count", "Action", "Confidence"],
    ...rows.map((row) => ["Scorecard", row[0], row[1], row[2], row[3], row[4], row[5], row[6]]),
    ...criterionRows.map((row) => ["Criterion", row[0], row[1], row[2], row[4], "", "", row[3]]),
    ...opportunityRows.map((row) => ["Opportunity", "", row[0], row[1], row[4], "", `Weak: ${row[2]} Strong: ${row[3]}`, ""]),
  ];

  const html = `
    <div class="callout">${escapeHtml(researchStatus)}</div>
    <div class="tag-row">
      ${criteria.map((criterion) => `<span class="tag">${escapeHtml(criterion)}</span>`).join("")}
    </div>
    <h3>Competitor scorecard</h3>
    ${table(["Competitor", "Key criterion", "Pros", "Cons", "Sources", "Next move", "Confidence"], rows)}
    <h3>Criterion scorecard</h3>
    ${table(["Competitor", "Criterion", "Score", "Confidence", "Evidence"], criterionRows)}
    <h3>Opportunities and risks</h3>
    ${table(["Criterion", "Read", "Weak competitors", "Strong competitors", "Action"], opportunityRows)}
    <h3>Research queue</h3>
    ${researchQueueTable(queueRows)}
    <h3>Source ledger</h3>
    ${
      sourceRows.length
        ? table(["Product", "Source", "Status", "Date", "URL", "Evidence note"], sourceRows)
        : `<div class="callout">No structured sources captured yet. Add source URLs, dates, and evidence notes before treating findings as confirmed.</div>`
    }
    <div class="callout">Operational gap: this static build stores source URLs and dates locally. A production version should automate capture, screenshots, deduping, and citation checks before calling a finding confirmed.</div>
  `;

  const text = [
    `Competitive analysis: ${category}`,
    `Research status: ${researchStatus}`,
    "",
    toTextTable(["Competitor", "Key criterion", "Pros", "Cons", "Sources", "Next move", "Confidence"], rows),
    "",
    "Criterion scorecard:",
    toTextTable(["Competitor", "Criterion", "Score", "Confidence", "Evidence"], criterionRows),
    "",
    "Opportunities and risks:",
    toTextTable(["Criterion", "Read", "Weak competitors", "Strong competitors", "Action"], opportunityRows),
    "",
    "Research queue:",
    toTextTable(["Competitor", "Criterion", "Search string", "Status"], queueRows),
    "",
    "Source ledger:",
    sourceRows.length
      ? toTextTable(["Product", "Source", "Status", "Date", "URL", "Evidence note"], sourceRows)
      : "No structured sources captured yet.",
    "",
    `Source focus: ${sourceFocus}`,
  ].join("\n");

  setOutput("competitive", html, text);
});

document.querySelector("#buildSearchTabs").addEventListener("click", () => {
  const competitors = lines(getValue("competitors"));
  const category = getValue("category");
  if (!competitors.length) {
    showToast("Add competitors first");
    return;
  }

  competitors.slice(0, 8).forEach((competitor) => {
    const query = encodeURIComponent(
      `${competitor} ${category} user reviews pros cons pricing complaints alternatives`
    );
    window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
  });
  showToast("Research tabs opened");
});

document.querySelector("#clearCompetitive").addEventListener("click", () => {
  [
    "category",
    "competitors",
    "criteria",
    "competitiveEvidence",
    "sourceTitle",
    "sourceUrl",
    "sourceProduct",
    "sourceDate",
    "sourceNote",
  ].forEach((id) => {
    document.querySelector(`#${id}`).value = "";
  });
  document.querySelector("#sourceStatus").value = "Needs review";
  state.sources = [];
  state.artifacts.competitive = [];
  state.artifacts.competitiveCriteria = [];
  state.artifacts.competitiveOpportunities = [];
  state.artifacts.competitiveQueue = [];
  state.competitiveExportRows = [];
  renderSourceList();
  markDirty();
});

document.querySelector("#addSource").addEventListener("click", () => {
  const source = {
    id: `SRC-${Date.now()}`,
    title: getValue("sourceTitle"),
    url: normalizeSourceUrl(getValue("sourceUrl")),
    product: getValue("sourceProduct"),
    date: getValue("sourceDate"),
    status: getValue("sourceStatus") || "Needs review",
    note: getValue("sourceNote"),
  };

  if (!source.title && !source.note && !source.url) {
    showToast("Add a title, URL, or note");
    return;
  }

  state.sources = [...state.sources, source];
  ["sourceTitle", "sourceUrl", "sourceProduct", "sourceDate", "sourceNote"].forEach((id) => {
    document.querySelector(`#${id}`).value = "";
  });
  document.querySelector("#sourceStatus").value = "Needs review";
  renderSourceList();
  markDirty();
  showToast("Source added");
});

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-source]");
  if (!removeButton) return;
  state.sources = state.sources.filter((source) => source.id !== removeButton.dataset.removeSource);
  renderSourceList();
  markDirty();
  showToast("Source removed");
});

document.querySelector("#runBrief").addEventListener("click", () => {
  const decision = getValue("decision") || "the product decision";
  const hypothesis = getValue("hypothesis") || "Users will find the proposed workflow valuable.";
  const users = getValue("targetUsers") || "target users";
  const threshold = getValue("decisionThreshold") || "Define a pass/fail threshold before fielding.";
  const risks = lines(getValue("knownRisks"));
  const method = getValue("studyMethod");

  const risksList = risks.length ? risks : ["Recruiting bias", "Prototype fidelity", "Over-reading stated intent"];
  const assumptions = [
    ["A1", "Problem fit", `The target users have a frequent enough pain for ${decision}.`, "Interview recent behavior", "High"],
    ["A2", "Value comprehension", "Users can explain the proposed value without moderator explanation.", "First-click task and teach-back", "High"],
    ["A3", "Trust", "Users believe outputs are reliable enough to influence decisions.", "Confidence rating plus evidence inspection", "High"],
    ["A4", "Workflow fit", "The work can move into existing planning and tracker systems.", "Handoff task to Jira/Linear", "Medium"],
  ];
  const researchQuestions = assumptions.map((row) => [
    row[0].replace("A", "RQ"),
    row[1],
    row[1] === "Problem fit"
      ? `How often do ${users} encounter the problem behind ${decision}?`
      : row[1] === "Value comprehension"
        ? "Can users explain the value proposition without moderator explanation?"
        : row[1] === "Trust"
          ? "What evidence do users need before trusting generated outputs?"
          : "Where should findings land in the user's existing workflow?",
    row[3],
  ]);
  const riskRows = risksList.map((risk, index) => [
    `R${index + 1}`,
    risk,
    index < 2 ? "High" : "Medium",
    `Add a task that forces evidence for ${risk.toLowerCase()}.`,
  ]);
  const recruitRows = [
    ["Primary segment", users, "Recruit first", "Must have run or consumed research in the last 90 days"],
    ["Screener", "Research involvement", "Required", "Can describe one recent research decision"],
    ["Sample", method === "Survey" ? "50+ responses" : "6-8 sessions", "Target", "Stop when top risks have repeated evidence"],
  ];
  const protocolRows = [
    ["0", "Consent and context", "Confirm role, recent research workflow, recording permission"],
    ["1", "Problem recall", "Ask for recent behavior before showing the concept"],
    ["2", "Concept/prototype task", "Observe expectations, hesitation, completion, confidence"],
    ["3", "Trust and handoff", "Probe evidence needs and Jira/Linear/reporting fit"],
    ["4", "Decision close", `Evaluate against gate: ${threshold}`],
  ];
  const planRows = [
    ["Recruit", users, "6-8 qual sessions or 50+ survey completes if quant"],
    ["Method", method, "Use the instrument module as the source of truth"],
    ["Decision gate", threshold, "Do not rewrite after seeing data"],
    ["Readout", "Insight -> evidence -> implication -> issue", "Report module owns final handoff"],
  ];

  state.artifacts.assumptions = assumptions.map((row) => ({
    id: row[0],
    area: row[1],
    assumption: row[2],
    test: row[3],
    risk: row[4],
  }));
  state.artifacts.briefRisks = riskRows;
  state.artifacts.briefPlan = planRows;
  state.artifacts.researchQuestions = researchQuestions;
  state.artifacts.recruitingPlan = recruitRows;
  state.artifacts.protocol = protocolRows;
  state.moduleExportRows.brief = [
    ["Section", "ID", "Name", "Detail", "Method or rule", "Priority"],
    ["Decision", "", "Decision", decision, threshold, ""],
    ["Decision", "", "Hypothesis", hypothesis, method, ""],
    ...assumptions.map((row) => ["Assumption", row[0], row[1], row[2], row[3], row[4]]),
    ...researchQuestions.map((row) => ["Research question", row[0], row[1], row[2], row[3], ""]),
    ...riskRows.map((row) => ["Risk", row[0], row[1], row[3], "", row[2]]),
    ...recruitRows.map((row) => ["Recruiting", "", row[0], row[1], row[3], row[2]]),
    ...protocolRows.map((row) => ["Protocol", row[0], row[1], row[2], "", ""]),
  ];

  const html = `
    <div class="artifact-card">
      <h3>Decision contract</h3>
      <p><strong>Decision:</strong> ${escapeHtml(decision)}</p>
      <p><strong>Hypothesis:</strong> ${escapeHtml(hypothesis)}</p>
      <p><strong>Pass/fail gate:</strong> ${escapeHtml(threshold)}</p>
    </div>
    ${table(["ID", "Assumption", "What must be true", "Evidence test", "Risk"], assumptions)}
    ${table(["ID", "Area", "Research question", "Evidence method"], researchQuestions)}
    ${table(["Risk ID", "Risk", "Severity", "Mitigation task"], riskRows)}
    ${table(["Recruiting object", "Target", "Status", "Rule"], recruitRows)}
    ${table(["Step", "Session stage", "What to capture"], protocolRows)}
    ${table(["Workstream", "Owner input", "Operational rule"], planRows)}
  `;
  const text = [
    `Research brief: ${decision}`,
    "",
    `Hypothesis: ${hypothesis}`,
    "",
    `Pass/fail gate: ${threshold}`,
    "",
    toTextTable(["ID", "Assumption", "What must be true", "Evidence test", "Risk"], assumptions),
    "",
    toTextTable(["ID", "Area", "Research question", "Evidence method"], researchQuestions),
    "",
    toTextTable(["Risk ID", "Risk", "Severity", "Mitigation task"], riskRows),
    "",
    toTextTable(["Recruiting object", "Target", "Status", "Rule"], recruitRows),
    "",
    toTextTable(["Step", "Session stage", "What to capture"], protocolRows),
    "",
    toTextTable(["Workstream", "Owner input", "Operational rule"], planRows),
  ].join("\n");

  setOutput("brief", html, text);
});

document.querySelector("#runQuestions").addEventListener("click", () => {
  const type = document.querySelector("input[name='questionType']:checked").value;
  const objective = getValue("questionObjective") || "the research objective";
  const concept = getValue("prototypeContext") || "the prototype";
  const participants = getValue("participants") || "participants";
  const threshold = getValue("questionThreshold") || "Escalate if key task success or confidence misses target.";
  const length = getValue("questionLength");

  const qualRows = [
    ["Warmup", "Recent behavior", `Tell me about the last time ${objective}.`, "Look for frequency, workaround, owner"],
    ["Expectation", "Comprehension", `Before clicking, what do you expect ${concept} to help you do?`, "Code value clarity"],
    ["Task", "Usability", "Walk through the core flow without guidance.", "Capture path, hesitation, failure point"],
    ["Trust probe", "Trust", "What would you need to inspect before using this output in a decision?", "Code required proof"],
    ["Handoff", "Workflow fit", "Where should this finding go after the session?", "Map to Linear/Jira/reporting"],
    ["Failure mode", "Risk", "If this failed for you, what would the reason be?", "Create issue candidate"],
    ["Close", "Language", "How would you describe this to a teammate?", "Use exact words in positioning"],
  ];

  const quantRows = [
    ["S1", "Screening", `How often do you need to answer: ${objective}?`, "Never / quarterly / monthly / weekly / daily"],
    ["V1", "Value", `How valuable would ${concept} be for your current workflow?`, "1 not valuable - 5 very valuable"],
    ["E1", "Ease", "How easy was the main action to understand?", "1 very hard - 5 very easy"],
    ["T1", "Trust", "How confident are you that the output would be accurate enough to use?", "1 no confidence - 5 high confidence"],
    ["P1", "Priority", "Which workflow should be built first?", "Ranked choice"],
    ["A1", "Adoption", "How likely are you to use this in the next 30 days?", "0-10 likelihood"],
    ["B1", "Barrier", "What would prevent adoption?", "Open text"],
  ];

  const bank = type === "quant" ? quantRows : qualRows;
  const sliceMap = { short: 5, standard: 7, deep: bank.length };
  const assumptionPrompts = (state.artifacts.researchQuestions || []).slice(0, 4).map((row) =>
    type === "quant"
      ? [`${row[0]}M`, row[1], `How strongly do you agree: ${row[2]}`, "1 strongly disagree - 5 strongly agree"]
      : [`Brief ${row[0]}`, row[1], row[2], row[3]]
  );
  const rows = [...assumptionPrompts, ...bank].slice(0, sliceMap[length] + assumptionPrompts.length);
  const taskRows = [
    ["T1", "First impression", "Ask participant what they think this workflow does before prompting", "Value comprehension"],
    ["T2", "Core task", "Have participant complete the main concept/prototype flow", "Task success and hesitation"],
    ["T3", "Evidence inspection", "Ask what proof they need before using the output", "Trust threshold"],
    ["T4", "Handoff", "Ask where the finding should go next", "Jira/Linear/report fit"],
  ];
  const metricRows =
    type === "quant"
      ? [
          ["Value score", "Mean V1 rating", ">= 4.0", "Prioritize workflow"],
          ["Ease score", "Mean E1 rating", ">= 4.0", "Design is understandable"],
          ["Trust score", "Mean T1 rating", ">= 4.0", "Evidence model is credible"],
          ["Adoption", "A1 likelihood", ">= 7/10", "Strong enough for follow-up"],
        ]
      : [
          ["Task success", "Completed without moderator rescue", ">= 70%", "Flow is understandable"],
          ["Time to value", "Can state value within first task", ">= 70%", "Messaging is clear"],
          ["Trust evidence", "Names concrete proof needed", "100%", "Source needs are explicit"],
          ["Handoff fit", "Can name destination for finding", ">= 70%", "Workflow connects to tools"],
        ];
  const operatingRules =
    type === "quant"
      ? [
          "Randomize ranked-choice options if the survey tool supports it.",
          "Keep one open-text follow-up after low trust or low ease scores.",
          threshold,
        ]
      : [
          "Ask the task first, then ask opinion questions.",
          "Tag every observation as behavior, quote, inference, or issue.",
          threshold,
        ];

  state.artifacts.instrument = rows.map((row) => ({
    stage: row[0],
    construct: row[1],
    question: row[2],
    capture: row[3],
  }));
  state.artifacts.questionMetrics = metricRows;
  state.artifacts.questionTasks = taskRows;
  state.moduleExportRows.instrument = [
    ["Section", "ID or stage", "Construct", "Prompt/item", "Capture or response"],
    ...rows.map((row) => ["Instrument", row[0], row[1], row[2], row[3]]),
    ...taskRows.map((row) => ["Task", row[0], row[1], row[2], row[3]]),
    ...metricRows.map((row) => ["Metric", row[0], row[1], row[2], row[3]]),
    ...operatingRules.map((rule, index) => ["Operating rule", `OR${index + 1}`, "", rule, ""]),
  ];

  const html = `
    <div class="tag-row">
      <span class="tag">${type === "quant" ? "Quant" : "Qual"}</span>
      <span class="tag">${escapeHtml(participants)}</span>
    </div>
    ${table(type === "quant" ? ["ID", "Construct", "Survey item", "Response type"] : ["Stage", "Construct", "Moderator prompt", "Capture rule"], rows)}
    ${table(["Task ID", "Task", "Instruction", "Measure"], taskRows)}
    ${table(["Metric", "Definition", "Target", "Decision use"], metricRows)}
    ${outputBlock("Operating rules", operatingRules)}
  `;
  const text = [
    `${type.toUpperCase()} questionnaire`,
    "",
    `Objective: ${objective}`,
    `Participants: ${participants}`,
    `Decision threshold: ${threshold}`,
    "",
    toTextTable(type === "quant" ? ["ID", "Construct", "Survey item", "Response type"] : ["Stage", "Construct", "Moderator prompt", "Capture rule"], rows),
    "",
    toTextTable(["Task ID", "Task", "Instruction", "Measure"], taskRows),
    "",
    toTextTable(["Metric", "Definition", "Target", "Decision use"], metricRows),
    "",
    `Operating rules:\n- ${operatingRules.join("\n- ")}`,
  ].join("\n");

  setOutput("questions", html, text);
});

document.querySelector("#runPersonas").addEventListener("click", () => {
  const seedInput = lines(getValue("personaSeeds"));
  const stepInput = lines(getValue("flowSteps"));
  const seeds = seedInput.length ? seedInput : ["Time-constrained operator", "Skeptical evaluator"];
  const steps = stepInput.length
    ? stepInput
    : ["Open the product", "Complete the core task", "Decide whether to continue"];
  const prototypeNotes = getValue("prototypeNotes") || "No prototype notes supplied";
  const lens = getValue("testLens");
  const count = Math.max(2, Math.min(Number(getValue("agentCount")) || 4, 6));
  const traits = ["speed-focused", "risk-sensitive", "detail-heavy", "collaboration-driven", "budget-aware", "accessibility-aware"];
  const taskPlan = state.artifacts.questionTasks?.length
    ? state.artifacts.questionTasks.map((row) => row[1])
    : steps;

  const agents = Array.from({ length: count }, (_, index) => {
    const seed = seeds[index % seeds.length];
    const trait = traits[index % traits.length];
    const stuckStep = steps[(index + 1) % steps.length];
    const task = taskPlan[index % taskPlan.length] || stuckStep;
    const evidenceDebt = (state.artifacts.competitive || []).filter((item) => item.confidence !== "High").length;
    const severity = index % 3 === 0 || evidenceDebt > 1 ? "High" : index % 3 === 1 ? "Medium" : "Low";
    return {
      id: `A${index + 1}`,
      name: `${seed} / ${trait}`,
      motivation: `Uses ${lens} as the decision lens.`,
      task,
      step: stuckStep,
      result: severity === "High" ? "Fail" : severity === "Medium" ? "Partial" : "Pass",
      evidence: `At "${stuckStep}", agent needs ${trait.includes("risk") ? "proof and rollback" : trait.includes("speed") ? "fewer choices" : "clearer next-step language"}.`,
      issue: `Clarify expected outcome before "${stuckStep}".`,
      severity,
    };
  });

  const rows = agents.map((agent) => [
    agent.id,
    agent.name,
    agent.task,
    agent.step,
    agent.result,
    agent.evidence,
    agent.severity,
  ]);

  const issueRows = agents
    .filter((agent) => agent.result !== "Pass")
    .map((agent) => [
      `SYN-${agent.id}`,
      agent.issue,
      agent.severity,
      `Synthetic ${agent.name}`,
      `Rerun "${agent.step}" with clearer copy or state feedback.`,
    ]);

  state.artifacts.agentFindings = agents;
  state.issues = [
    ...state.issues.filter((issue) => issue.source !== "Synthetic"),
    ...issueRows.map((row) => ({
      source: "Synthetic",
      title: row[1],
      priority: row[2],
      type: "UX simulation",
      evidence: row[3],
      acceptance: row[4],
    })),
  ];

  const stepRows = steps.map((step, index) => [
    index + 1,
    step,
    agents.filter((agent) => agent.step === step && agent.result !== "Pass").length,
    agents.some((agent) => agent.step === step && agent.result === "Fail") ? "Needs redesign" : "Monitor",
  ]);
  const runSummary = [
    ["Agents run", agents.length, "Synthetic variants generated from personas/segments"],
    ["Pass", agents.filter((agent) => agent.result === "Pass").length, "No immediate action"],
    ["Partial", agents.filter((agent) => agent.result === "Partial").length, "Needs design follow-up"],
    ["Fail", agents.filter((agent) => agent.result === "Fail").length, "Create issue before launch"],
  ];
  state.moduleExportRows.agentFindings = [
    ["Section", "ID", "Name", "Task", "Step", "Result", "Evidence", "Severity"],
    ...agents.map((agent) => [
      "Agent run",
      agent.id,
      agent.name,
      agent.task,
      agent.step,
      agent.result,
      agent.evidence,
      agent.severity,
    ]),
    ...issueRows.map((row) => ["Issue", row[0], row[1], "", "", row[2], row[3], row[4]]),
  ];

  const html = `
    <div class="artifact-card">
      <h3>Prototype context</h3>
      <p>${escapeHtml(prototypeNotes)}</p>
    </div>
    ${table(["Metric", "Value", "Meaning"], runSummary)}
    ${table(["Agent", "Persona variant", "Task", "Stress step", "Run result", "Observed friction", "Severity"], rows)}
    ${table(["Step", "Flow moment", "Open findings", "Operational status"], stepRows)}
    ${table(["Issue ID", "Issue", "Priority", "Evidence", "Acceptance criteria"], issueRows)}
  `;
  const text = [
    `Synthetic agent test: ${lens}`,
    "",
    `Prototype context: ${prototypeNotes}`,
    "",
    toTextTable(["Metric", "Value", "Meaning"], runSummary),
    "",
    toTextTable(["Agent", "Persona variant", "Task", "Stress step", "Run result", "Observed friction", "Severity"], rows),
    "",
    toTextTable(["Step", "Flow moment", "Open findings", "Operational status"], stepRows),
    "",
    toTextTable(["Issue ID", "Issue", "Priority", "Evidence", "Acceptance criteria"], issueRows),
  ].join("\n");

  setOutput("personas", html, text);
});

document.querySelector("#runSynthesis").addEventListener("click", () => {
  const transcript = getValue("transcripts");
  const tags = lines(getValue("synthesisTags"));
  const mode = getValue("analysisMode");

  if (!transcript) {
    showToast("Paste transcripts first");
    return;
  }

  const topKeywords = keywordSummary(transcript, 10);
  const tracked = tags.length ? tags : topKeywords.map((item) => item.replace(/\s\(\d+\)/, ""));
  const participants = participantBlocks(transcript);
  const themeRows = tracked.slice(0, 8).map((tag) => {
    const matchingParticipants = participants.filter((participant) =>
      participant.text.toLowerCase().includes(tag.toLowerCase())
    );
    const evidenceText = matchingParticipants.map((participant) => participant.text).join(" ");
    const positive = scoreTerms(evidenceText, positiveWords);
    const negative = scoreTerms(evidenceText, negativeWords);
    const signal = matchingParticipants.length + positive + negative;
    const severity = negative > positive ? "High" : signal >= 3 ? "Medium" : "Low";
    const implication =
      mode === "jobs"
        ? `Job signal: users are hiring the product to resolve ${tag}.`
        : mode === "opportunity"
          ? `Opportunity: ${tag} can become a roadmap bet if evidence repeats.`
          : mode === "friction"
            ? `Friction: ${tag} is blocking confidence or completion.`
            : `Theme: ${tag} is shaping expectations.`;
    return [
      titleCase(tag),
      matchingParticipants.map((participant) => participant.id).join(", ") || "No participant tagged",
      signalLabel(signal),
      severity,
      shortQuote(evidenceText || transcript, tag),
      implication,
      actionFromSignal(negative, positive),
    ];
  });

  const participantRows = participants.map((participant) => {
    const hitTags = tracked.filter((tag) => participant.text.toLowerCase().includes(tag.toLowerCase()));
    return [
      participant.id,
      hitTags.join(", ") || "No tracked tag",
      scoreTerms(participant.text, negativeWords),
      shortQuote(participant.text, hitTags[0] || tracked[0] || ""),
    ];
  });
  const codebookRows = tracked.slice(0, 8).map((tag, index) => [
    `C${index + 1}`,
    titleCase(tag),
    `Evidence about ${tag} in participant language or behavior.`,
    participants.filter((participant) => participant.text.toLowerCase().includes(tag.toLowerCase())).length,
  ]);
  const decisionRows = themeRows.map((row) => [
    row[0],
    row[2],
    row[3],
    row[6] === "Fix or de-risk before scaling"
      ? "Create issue"
      : row[2] === "Low"
        ? "Follow-up probe"
        : "Use in readout",
  ]);

  state.artifacts.synthesis = themeRows.map((row) => ({
    theme: row[0],
    participants: row[1],
    confidence: row[2],
    severity: row[3],
    quote: row[4],
    implication: row[5],
    action: row[6],
  }));
  state.artifacts.participantRows = participantRows;
  state.artifacts.codebook = codebookRows;
  state.moduleExportRows.synthesis = [
    ["Section", "ID or theme", "Participants/codes", "Confidence/friction", "Quote/definition", "Implication/action"],
    ...codebookRows.map((row) => ["Codebook", row[0], row[1], row[3], row[2], ""]),
    ...themeRows.map((row) => ["Theme", row[0], row[1], row[2], row[4], `${row[5]} ${row[6]}`]),
    ...participantRows.map((row) => ["Participant", row[0], row[1], row[2], row[3], ""]),
    ...decisionRows.map((row) => ["Decision", row[0], row[1], row[2], "", row[3]]),
  ];

  const html = `
    <div class="tag-row">${topKeywords.map((word) => `<span class="tag">${escapeHtml(word)}</span>`).join("")}</div>
    ${table(["Code", "Label", "Definition", "Participant hits"], codebookRows)}
    ${table(["Theme", "Participants", "Confidence", "Severity", "Evidence quote", "Implication", "Action"], themeRows)}
    ${table(["Participant", "Codes", "Friction count", "Representative quote"], participantRows)}
    ${table(["Theme", "Confidence", "Severity", "Operational decision"], decisionRows)}
    ${outputBlock("Operational readout", [
      "Promote High confidence + High severity rows into tracker issues.",
      "Keep Low confidence rows as follow-up probes, not findings.",
      "Use participant IDs and quotes as the evidence trail in the report.",
    ])}
  `;
  const text = [
    `Synthesis mode: ${mode}`,
    "",
    `Top keywords: ${topKeywords.join(", ")}`,
    "",
    toTextTable(["Code", "Label", "Definition", "Participant hits"], codebookRows),
    "",
    toTextTable(["Theme", "Participants", "Confidence", "Severity", "Evidence quote", "Implication", "Action"], themeRows),
    "",
    toTextTable(["Participant", "Codes", "Friction count", "Representative quote"], participantRows),
    "",
    toTextTable(["Theme", "Confidence", "Severity", "Operational decision"], decisionRows),
  ].join("\n");

  state.issues = [
    ...state.issues.filter((issue) => issue.source !== "Synthesis"),
    ...themeRows
      .filter((row) => row[2] !== "Needs evidence")
      .map((row) => ({
        source: "Synthesis",
        title: `${row[6]}: ${row[0]}`,
        priority: row[3],
        type: mode === "friction" ? "UX defect" : "Research insight",
        evidence: `${row[1]}: ${row[4]}`,
        acceptance: `Decision is backed by evidence for ${row[0].toLowerCase()} or queued as a follow-up probe.`,
      })),
  ];

  setOutput("synthesis", html, text);
});

document.querySelector("#runReport").addEventListener("click", () => {
  const audience = getValue("audience") || "product stakeholders";
  const stance = getValue("recommendationStance");
  const tracker = getValue("tracker");
  const owner = getValue("ownerTeam") || "research and product";
  const issues = state.issues.length
    ? state.issues
    : [
        {
          title: "Clarify first-run value proposition",
          priority: "High",
          type: "UX",
          evidence: "Users need faster proof of value before continuing.",
          acceptance: "User can state the expected outcome before taking action.",
        },
        {
          title: "Add confidence cue after core action",
          priority: "Medium",
          type: "UX",
          evidence: "The flow lacks a clear success state.",
          acceptance: "Success state includes next action, saved status, and recovery path.",
        },
      ];
  const sortedIssues = [...issues].sort((a, b) => {
    const weight = { High: 3, Medium: 2, Low: 1 };
    return (weight[b.priority] || 0) - (weight[a.priority] || 0);
  });
  const issueRows = sortedIssues.map((issue) => [
    tracker,
    issue.type,
    issue.priority,
    issue.title,
    ownerFromModule(issue.source || "Product", owner),
    issue.evidence,
    issue.acceptance,
  ]);

  const evidenceRows = [
    ...state.artifacts.competitive.slice(0, 3).map((item) => [
      "Competitive",
      item.competitor,
      item.confidence,
      item.action,
      item.pros && item.cons ? `Pros: ${item.pros} / Cons: ${item.cons}` : item.pros || item.cons,
    ]),
    ...state.sources.slice(0, 4).map((source) => [
      "Source ledger",
      source.product || source.title || "General evidence",
      source.status || "Needs review",
      source.date || "No date",
      [source.title, source.url, source.note].filter(Boolean).join(" | "),
    ]),
    ...state.artifacts.synthesis.slice(0, 4).map((item) => [
      "Synthesis",
      item.theme,
      item.confidence,
      item.action,
      item.quote,
    ]),
    ...state.artifacts.agentFindings.slice(0, 3).map((item) => [
      "Synthetic",
      item.step,
      item.severity,
      item.result,
      item.evidence,
    ]),
    ...(state.artifacts.assumptions || []).slice(0, 4).map((item) => [
      "Brief",
      item.id,
      item.risk,
      item.area,
      `${item.assumption} Test: ${item.test}`,
    ]),
    ...(state.artifacts.instrument || []).slice(0, 4).map((item) => [
      "Instrument",
      item.construct,
      "Planned",
      item.stage,
      `${item.question} Capture: ${item.capture}`,
    ]),
  ];

  const decisionRows = [
    ["Now", sortedIssues.filter((issue) => issue.priority === "High").length, "Resolve before broad launch"],
    ["Next", sortedIssues.filter((issue) => issue.priority === "Medium").length, "Schedule into next product cycle"],
    ["Later", sortedIssues.filter((issue) => issue.priority === "Low").length, "Track as monitoring or follow-up research"],
  ];

  const executive = [
    `Audience: ${audience}.`,
    `Recommendation: ${stance}.`,
    `${sortedIssues.filter((issue) => issue.priority === "High").length} high-priority handoff item(s) need owner review.`,
    "Every tracker line includes evidence and acceptance criteria.",
  ];
  const moduleReadinessRows = [
    ["Competitive", state.outputs.competitive ? "Complete" : "Missing", `${state.artifacts.competitive.length} competitor rows`],
    ["Brief", state.outputs.brief ? "Complete" : "Missing", `${state.artifacts.assumptions.length} assumptions`],
    ["Questions", state.outputs.questions ? "Complete" : "Missing", `${state.artifacts.instrument.length} instrument rows`],
    ["Personas", state.outputs.personas ? "Complete" : "Missing", `${state.artifacts.agentFindings.length} agent findings`],
    ["Synthesis", state.outputs.synthesis ? "Complete" : "Missing", `${state.artifacts.synthesis.length} themes`],
  ];
  state.artifacts.reportDecisions = decisionRows;
  state.moduleExportRows.report = [
    ["Section", "Field 1", "Field 2", "Field 3", "Field 4", "Field 5", "Field 6"],
    ...executive.map((row, index) => ["Executive summary", `S${index + 1}`, row, "", "", "", ""]),
    ...moduleReadinessRows.map((row) => ["Readiness", ...row, "", "", ""]),
    ...decisionRows.map((row) => ["Decision lane", ...row, "", "", ""]),
    ...evidenceRows.map((row) => ["Evidence", ...row, ""]),
    ...issueRows.map((row) => ["Issue", ...row]),
  ];

  const html = `
    ${outputBlock("Executive summary", executive)}
    <h3>Module readiness</h3>
    ${table(["Module", "Status", "Artifact count"], moduleReadinessRows)}
    ${table(["Decision lane", "Item count", "Operating rule"], decisionRows)}
    <h3>Evidence ledger</h3>
    ${evidenceRows.length ? table(["Source", "Object", "Confidence", "Action", "Evidence"], evidenceRows) : outputBlock("Evidence", ["Run competitive, persona, or synthesis modules to populate the evidence ledger."])}
    <h3>Tracker handoff</h3>
    ${table(["Tracker", "Type", "Priority", "Title", "Owner", "Evidence", "Acceptance criteria"], issueRows)}
  `;

  const text = [
    "# UX Research Report",
    "",
    "## Executive summary",
    `- ${executive.join("\n- ")}`,
    "",
    "## Module readiness",
    toTextTable(["Module", "Status", "Artifact count"], moduleReadinessRows),
    "",
    "## Decision",
    `- ${stance}`,
    "",
    toTextTable(["Decision lane", "Item count", "Operating rule"], decisionRows),
    "",
    "## Evidence ledger",
    evidenceRows.length
      ? toTextTable(["Source", "Object", "Confidence", "Action", "Evidence"], evidenceRows)
      : "Run competitive, persona, or synthesis modules to populate the evidence ledger.",
    "",
    "## Tracker lines",
    toTextTable(["Tracker", "Type", "Priority", "Title", "Owner", "Evidence", "Acceptance criteria"], issueRows),
  ].join("\n");

  state.reportIssueRows = issueRows;
  setOutput("report", html, text);
});

const download = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

document.querySelector("#downloadMarkdown").addEventListener("click", () => {
  const content = state.outputs.report || document.querySelector("#reportOutput").innerText;
  download("ux-research-report.md", content, "text/markdown");
});

document.querySelector("#downloadCsv").addEventListener("click", () => {
  const rows =
    state.reportIssueRows ||
    state.issues.map((issue) => [
      getValue("tracker") || "Tracker",
      issue.type,
      issue.priority,
      issue.title,
      getValue("ownerTeam") || "Owner",
      issue.evidence,
      issue.acceptance,
    ]);
  const csvRows = [["Tracker", "Type", "Priority", "Title", "Owner", "Evidence", "Acceptance criteria"], ...rows];
  const csv = csvRows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  download("ux-research-issues.csv", csv, "text/csv");
});

document.querySelector("#downloadCompetitive").addEventListener("click", () => {
  const rows = state.competitiveExportRows || [];
  if (!rows.length) {
    showToast("Generate the competitive matrix first");
    return;
  }
  download("competitive-analysis.csv", rowsToCsv(rows), "text/csv");
});

document.querySelector("#downloadBrief").addEventListener("click", () => {
  if (!requireOutput("brief", "the brief")) return;
  download("research-brief.md", state.outputs.brief, "text/markdown");
  if (state.moduleExportRows.brief?.length) {
    window.setTimeout(() => download("research-brief-artifacts.csv", rowsToCsv(state.moduleExportRows.brief), "text/csv"), 80);
  }
});

document.querySelector("#downloadInstrument").addEventListener("click", () => {
  if (!requireOutput("questions", "the instrument")) return;
  const rows = state.moduleExportRows.instrument || [];
  download("research-instrument.csv", rowsToCsv(rows), "text/csv");
});

document.querySelector("#downloadAgentFindings").addEventListener("click", () => {
  if (!requireOutput("personas", "agent findings")) return;
  const rows = state.moduleExportRows.agentFindings || [];
  download("synthetic-agent-findings.csv", rowsToCsv(rows), "text/csv");
});

document.querySelector("#downloadSynthesis").addEventListener("click", () => {
  if (!requireOutput("synthesis", "synthesis")) return;
  const rows = state.moduleExportRows.synthesis || [];
  download("research-synthesis.csv", rowsToCsv(rows), "text/csv");
});

document.querySelector("#saveProject").addEventListener("click", () => {
  state.projectName = selectors.projectName.value.trim() || state.projectName;
  const payload = {
    ...state,
    questionType: document.querySelector("input[name='questionType']:checked").value,
    fields: Object.fromEntries(
      Array.from(document.querySelectorAll("input, textarea, select"))
        .filter((field) => field.id && field.type !== "file")
        .map((field) => [field.id, field.value])
    ),
  };
  localStorage.setItem(storageKey, JSON.stringify(payload, null, 2));
  selectors.saveState.textContent = "Saved";
  showToast("Project saved locally");
});

document.querySelector("#exportProject").addEventListener("click", () => {
  document.querySelector("#saveProject").click();
  download(`${selectors.projectName.value.trim() || "ux-research-os"}.json`, localStorage.getItem(storageKey), "application/json");
});

document.querySelector("#importProject").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const payload = JSON.parse(await file.text());
  hydrate(payload);
  localStorage.setItem(storageKey, JSON.stringify(payload, null, 2));
  selectors.saveState.textContent = "Saved";
  showToast("Project imported");
});

const hydrate = (payload) => {
  Object.assign(state, payload);
  state.artifacts = {
    competitive: [],
    competitiveCriteria: [],
    competitiveOpportunities: [],
    competitiveQueue: [],
    assumptions: [],
    instrument: [],
    agentFindings: [],
    synthesis: [],
    ...(payload.artifacts || {}),
  };
  state.sources = Array.isArray(payload.sources) ? payload.sources : [];
  state.competitiveExportRows = Array.isArray(payload.competitiveExportRows)
    ? payload.competitiveExportRows
    : [];
  state.moduleExportRows = payload.moduleExportRows || {};
  selectors.projectName.value = payload.projectName || payload.fields?.projectName || state.projectName;
  Object.entries(payload.fields || {}).forEach(([id, value]) => {
    const field = document.querySelector(`#${id}`);
    if (field) field.value = value;
  });
  if (payload.questionType) {
    const questionType = document.querySelector(`input[name='questionType'][value='${payload.questionType}']`);
    if (questionType) questionType.checked = true;
  }
  Object.entries(payload.outputs || {}).forEach(([key, text]) => {
    if (!text) return;
    const el = document.querySelector(`#${key}Output`);
    if (!el) return;
    el.classList.remove("empty");
    el.textContent = text;
  });
  renderSourceList();
  updateCounts();
};

const saved = localStorage.getItem(storageKey);
let loadedSavedProject = false;
if (saved) {
  try {
    hydrate(JSON.parse(saved));
    selectors.saveState.textContent = "Saved";
    loadedSavedProject = true;
  } catch {
    localStorage.removeItem(storageKey);
  }
}

if (!loadedSavedProject) {
  loadDemoProject({ toast: false });
  document.querySelector("#runCompetitive").click();
  selectors.saveState.textContent = "Demo";
}

selectors.projectName.addEventListener("input", () => {
  state.projectName = selectors.projectName.value.trim();
  markDirty();
});

updateCounts();
renderSourceList();
