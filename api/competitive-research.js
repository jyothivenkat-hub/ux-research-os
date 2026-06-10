const SEARCH_ENDPOINT = "https://www.bing.com/search?format=rss&q=";

const positiveTerms = [
  "easy",
  "fast",
  "clear",
  "useful",
  "accurate",
  "helpful",
  "trust",
  "strong",
  "simple",
  "collaborate",
  "automation",
  "integrations",
  "insights",
];

const negativeTerms = [
  "hard",
  "slow",
  "confusing",
  "unclear",
  "expensive",
  "complaint",
  "concern",
  "manual",
  "missing",
  "difficult",
  "limited",
  "risk",
  "fatigue",
];

const focusTerms = {
  reviews: "software reviews pros cons complaints user feedback alternatives G2 Capterra Reddit",
  pricing: "pricing plans packaging costs reviews",
  docs: "docs help center onboarding integrations support",
  launch: "launch changelog release notes announcement",
  all: "reviews pricing docs changelog pros cons complaints",
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const decodeHtml = (value = "") =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&#0183;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTag = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeHtml(match?.[1] || "");
};

const hash = (value) => {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index);
    result |= 0;
  }
  return Math.abs(result).toString(36);
};

const words = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

const scoreResult = (result, product, categoryWords) => {
  const text = `${result.title} ${result.description} ${result.link}`.toLowerCase();
  const productHit = text.includes(product.toLowerCase()) ? 3 : 0;
  const categoryHit = categoryWords.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
  const researchHit = ["research", "software", "customer", "user", "product", "platform", "review", "pricing", "g2", "capterra", "reddit"].reduce(
    (score, word) => score + (text.includes(word) ? 1 : 0),
    0
  );
  return productHit + categoryHit + researchHit;
};

const parseRss = (xml) =>
  [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => ({
    title: getTag(match[1], "title"),
    link: getTag(match[1], "link"),
    description: getTag(match[1], "description"),
    pubDate: getTag(match[1], "pubDate"),
  }));

const signalSummary = (text, terms) => {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term)).slice(0, 4);
};

const sourceFromResult = (result, product, query) => {
  const combined = `${result.title}. ${result.description}`;
  const positives = signalSummary(combined, positiveTerms);
  const negatives = signalSummary(combined, negativeTerms);
  const signals = [];
  if (positives.length) signals.push(`Pros: Mentions ${positives.join(", ")}.`);
  if (negatives.length) signals.push(`Cons: Mentions ${negatives.join(", ")}.`);
  signals.push(`Source snippet: ${result.description || result.title}`);
  signals.push(`Search query: ${query}`);
  return {
    id: `WEB-${hash(`${product}-${result.link}-${result.title}`)}`,
    title: result.title || `${product} search result`,
    url: result.link,
    product,
    date: new Date().toISOString().slice(0, 10),
    status: "Captured",
    note: signals.join(" "),
  };
};

const fetchSearchResults = async ({ product, category, criteria, sourceFocus }) => {
  const query = [
    product,
    category,
    criteria.slice(0, 3).join(" "),
    focusTerms[sourceFocus] || focusTerms.reviews,
  ]
    .filter(Boolean)
    .join(" ");
  const response = await fetch(`${SEARCH_ENDPOINT}${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; UXResearchOS/1.0)",
      Accept: "application/rss+xml,text/xml,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Search returned ${response.status}`);
  }

  const xml = await response.text();
  const categoryWords = words(`${category} ${criteria.join(" ")}`);
  return parseRss(xml)
    .map((result) => ({ ...result, score: scoreResult(result, product, categoryWords) }))
    .filter((result) => result.link && result.description && result.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((result) => sourceFromResult(result, product, query));
};

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST" });
    return;
  }

  try {
    const payload = JSON.parse((await readBody(req)) || "{}");
    const competitors = Array.isArray(payload.competitors) ? payload.competitors.slice(0, 6) : [];
    const criteria = Array.isArray(payload.criteria) ? payload.criteria.slice(0, 6) : [];
    const category = String(payload.category || "").slice(0, 140);
    const sourceFocus = String(payload.sourceFocus || "reviews");

    if (!competitors.length) {
      sendJson(res, 400, { error: "Add at least one competitor" });
      return;
    }

    const settled = await Promise.allSettled(
      competitors.map((product) =>
        fetchSearchResults({
          product: String(product).slice(0, 80),
          category,
          criteria,
          sourceFocus,
        })
      )
    );
    const sources = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

    sendJson(res, 200, {
      source: "Bing public RSS",
      generatedAt: new Date().toISOString(),
      sources,
      warning: sources.length
        ? ""
        : "Live search returned no usable snippets. The matrix used local evidence and generated research queue links.",
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Competitive research failed",
      warning: "Live search is unavailable. The matrix used local evidence and generated research queue links.",
      detail: error.message,
    });
  }
};
