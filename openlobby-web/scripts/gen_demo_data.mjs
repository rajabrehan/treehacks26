import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const demoDir = path.join(root, "public", "demo");
const imgDir = path.join(demoDir, "images");
fs.mkdirSync(imgDir, { recursive: true });

function iso(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

// Reuse 30 local images (downloaded separately) by cycling.
function img(i) {
  const n = String(((i - 1) % 30) + 1).padStart(2, "0");
  return `/demo/images/pic-${n}.jpg`;
}

const NEWS = [];
for (let i = 1; i <= 60; i++) {
  const id = `n-${String(i).padStart(3, "0")}`;
  const bucket = i % 5;
  const topic =
    bucket === 0
      ? "AI Regulation"
      : bucket === 1
        ? "Drug Pricing"
        : bucket === 2
          ? "Climate & Energy"
          : bucket === 3
            ? "Crypto & Finance"
            : "Defense & Procurement";

  const title =
    topic === "AI Regulation"
      ? `Draft AI safety bill draws late lobbying surge from top platforms`
      : topic === "Drug Pricing"
        ? `New drug pricing amendment triggers industry ad blitz in swing districts`
        : topic === "Climate & Energy"
          ? `Energy firms intensify Hill push as emissions deadline nears`
          : topic === "Crypto & Finance"
            ? `Crypto oversight framework stalls after coordinated lobbying push`
            : `Procurement reform bill quietly reshaped by contractor coalition`;

  const source =
    topic === "AI Regulation"
      ? "Capitol Ledger"
      : topic === "Drug Pricing"
        ? "Public Interest Desk"
        : topic === "Climate & Energy"
          ? "Energy & State"
          : topic === "Crypto & Finance"
            ? "Market Signal"
            : "Defense Brief";

  const excerpt =
    "A close reading of filings and meeting logs shows coordinated pressure campaigns targeting key committees. This is seeded demo content.";

  const entities =
    topic === "AI Regulation"
      ? ["Meta", "Google", "Microsoft", "Senate Commerce Committee"]
      : topic === "Drug Pricing"
        ? ["Pfizer", "Eli Lilly", "House Energy & Commerce Committee"]
        : topic === "Climate & Energy"
          ? ["ExxonMobil", "Chevron", "EPA"]
          : topic === "Crypto & Finance"
            ? ["Coinbase", "Treasury", "SEC"]
            : ["Lockheed Martin", "Raytheon", "House Armed Services Committee"];

  NEWS.push({
    id,
    title: `${title} (${topic})`,
    url: `https://example.com/demo/${id}`,
    source,
    published_at: iso(i % 18),
    excerpt,
    image_url: img(i),
    entities_mentioned: entities,
    tags: [topic, "Seeded"],
  });
}

const CASES = [
  {
    id: "pharma-drug-pricing",
    title: "The Price Cap Playbook",
    dek: "A seeded case file tracing how drug pricing fights attract money, meetings, and messaging.",
    hero_image_url: img(1),
    tags: ["Drug Pricing", "Pharma", "Seeded"],
    steps: [
      {
        id: "scene-1",
        kicker: "Case File 01",
        headline: "A bill appears. The money warms up.",
        body: "In the first week, committee calendars fill and trade groups publish identical talking points. The pattern is the tell.",
        key_finding: { label: "Lobbying spike (seeded)", value: "+38%", note: "Week-over-week on a single issue label." },
        related_headline_ids: ["n-002", "n-007", "n-012"],
        collage_image_urls: [img(2), img(3), img(4), img(5), img(6)],
        viz: { kind: "stat", label: "Issue heat", value: "+38%", note: "Seeded metric for demo storytelling." },
      },
      {
        id: "scene-2",
        kicker: "Money",
        headline: "PAC checks cluster around the same offices.",
        body: "When contributions arrive in a tight window, it is worth asking: what vote is coming, and who sits on the fence?",
        key_finding: { label: "Contributions (seeded)", value: "$2.1M", note: "To a small set of committees and members." },
        related_headline_ids: ["n-017", "n-022", "n-027"],
        collage_image_urls: [img(7), img(8), img(9), img(10), img(11)],
        viz: { kind: "sankey", label: "Flow", from: "Industry PACs", to: "Key offices", amount: "$2.1M (seeded)" },
      },
      {
        id: "scene-3",
        kicker: "Language",
        headline: "Amendments reshape the bill in plain sight.",
        body: "A few lines can change who pays, who saves, and who is exempt. Watch for subtle carveouts.",
        key_finding: { label: "Amendments tracked", value: "11", note: "Seeded count, demo-only." },
        related_headline_ids: ["n-032", "n-037", "n-042"],
        collage_image_urls: [img(12), img(13), img(14), img(15), img(16)],
        viz: {
          kind: "timeline",
          label: "Text changes",
          points: [
            { at: "Day 1", label: "Base text published" },
            { at: "Day 4", label: "Committee markup" },
            { at: "Day 9", label: "Carveout appears" },
            { at: "Day 13", label: "Floor manager's package" },
          ],
        },
      },
      {
        id: "scene-4",
        kicker: "Narrative",
        headline: "The messaging lands: costs, shortages, jobs.",
        body: "The same frames show up across ads, op-eds, and testimony. This is the campaign, not the argument.",
        key_finding: { label: "Ad themes", value: "3", note: "Cost, access, jobs (seeded)." },
        related_headline_ids: ["n-047", "n-052", "n-057"],
        collage_image_urls: [img(17), img(18), img(19), img(20), img(21)],
        viz: {
          kind: "graph",
          label: "Talking points network",
          nodes: [
            { id: "Trade Group", type: "org" },
            { id: "Committee A", type: "committee" },
            { id: "Committee B", type: "committee" },
            { id: "PR Firm", type: "vendor" },
          ],
          links: [
            { s: "Trade Group", t: "PR Firm", amount: 1 },
            { s: "PR Firm", t: "Committee A", amount: 1 },
            { s: "PR Firm", t: "Committee B", amount: 1 },
          ],
        },
      },
      {
        id: "scene-5",
        kicker: "Vote",
        headline: "The roll call is the receipt.",
        body: "When the vote happens, the question is not who won: it's who was paid to show up, and who went quiet.",
        key_finding: { label: "Swing votes (seeded)", value: "7", note: "Members with mixed signals over 60 days." },
        related_headline_ids: ["n-001", "n-006", "n-011"],
        collage_image_urls: [img(22), img(23), img(24), img(25), img(26)],
        viz: { kind: "stat", label: "Swing votes", value: "7", note: "Seeded." },
      },
      {
        id: "scene-6",
        kicker: "Aftermath",
        headline: "The new normal: reporting, loopholes, and round two.",
        body: "Even after passage, pressure campaigns shift to rulemaking and enforcement. The story doesn't end at the gavel.",
        key_finding: { label: "Next target", value: "Rulemaking", note: "Seeded narrative beat." },
        related_headline_ids: ["n-016", "n-021", "n-026"],
        collage_image_urls: [img(27), img(28), img(29), img(30), img(1)],
        viz: { kind: "timeline", label: "What comes next", points: [{ at: "Week 1", label: "Guidance drafted" }, { at: "Week 6", label: "Lobby day" }, { at: "Week 10", label: "Final rule" }] },
      },
    ],
  },
  {
    id: "tech-ai-regulation",
    title: "The Safety Bill Sprint",
    dek: "A noir look at how policy language evolves when the stakes are reputational and economic.",
    hero_image_url: img(9),
    tags: ["AI Regulation", "Tech", "Seeded"],
    steps: [
      {
        id: "step-1",
        kicker: "Case File 02",
        headline: "A crisis, a hearing, a draft.",
        body: "A public flashpoint triggers hearings. The first draft is broad. The second draft is… specific.",
        key_finding: { label: "Meetings logged (seeded)", value: "42", note: "Across two weeks." },
        related_headline_ids: ["n-005", "n-010", "n-015"],
        collage_image_urls: [img(3), img(8), img(13), img(18), img(23)],
        viz: { kind: "stat", label: "Meetings", value: "42", note: "Seeded." },
      },
      {
        id: "step-2",
        kicker: "Scope",
        headline: "Definitions do the real work.",
        body: "One adjective in a definition can move a compliance boundary from 'everyone' to 'almost nobody'.",
        key_finding: { label: "Key definition edits", value: "6", note: "Seeded count." },
        related_headline_ids: ["n-020", "n-025", "n-030"],
        collage_image_urls: [img(4), img(14), img(24), img(2), img(12)],
        viz: { kind: "timeline", label: "Definition drift", points: [{ at: "Draft 1", label: "Broad coverage" }, { at: "Draft 2", label: "Exceptions added" }, { at: "Draft 3", label: "Thresholds raised" }] },
      },
      {
        id: "step-3",
        kicker: "Money",
        headline: "Trade associations carry the message.",
        body: "A handful of associations appear in every meeting schedule. It is coordination without a signature.",
        key_finding: { label: "Spend (seeded)", value: "$9.8M", note: "Industry-wide on a single issue label." },
        related_headline_ids: ["n-035", "n-040", "n-045"],
        collage_image_urls: [img(5), img(10), img(15), img(20), img(25)],
        viz: { kind: "sankey", label: "Flow", from: "Associations", to: "Committee staff", amount: "$9.8M (seeded)" },
      },
      {
        id: "step-4",
        kicker: "Pressure",
        headline: "The lobbying pitch: safety, competitiveness, jobs.",
        body: "A stable triad: protect users, protect innovation, protect domestic advantage. Same words, everywhere.",
        key_finding: { label: "Pitch themes", value: "3", note: "Seeded." },
        related_headline_ids: ["n-050", "n-055", "n-060"],
        collage_image_urls: [img(6), img(11), img(16), img(21), img(26)],
        viz: { kind: "graph", label: "Message graph", nodes: [{ id: "Safety", type: "theme" }, { id: "Innovation", type: "theme" }, { id: "Jobs", type: "theme" }], links: [{ s: "Safety", t: "Innovation" }, { s: "Innovation", t: "Jobs" }] },
      },
      {
        id: "step-5",
        kicker: "Markup",
        headline: "A quiet carveout becomes a loud fight.",
        body: "Once a carveout is spotted, the coalition fractures: some want it hidden, others want it codified.",
        key_finding: { label: "Carveout size (seeded)", value: "18%", note: "Share of covered systems exempted." },
        related_headline_ids: ["n-009", "n-014", "n-019"],
        collage_image_urls: [img(7), img(17), img(27), img(1), img(22)],
        viz: { kind: "stat", label: "Exempted", value: "18%", note: "Seeded." },
      },
      {
        id: "step-6",
        kicker: "Outcome",
        headline: "The bill passes. The rules begin.",
        body: "The next battle is implementation: standards, audits, and who gets to define 'reasonable'.",
        key_finding: { label: "Next arena", value: "Standards bodies", note: "Seeded narrative beat." },
        related_headline_ids: ["n-024", "n-029", "n-034"],
        collage_image_urls: [img(28), img(29), img(30), img(2), img(3)],
        viz: { kind: "timeline", label: "Implementation", points: [{ at: "Month 1", label: "Draft standards" }, { at: "Month 3", label: "Public comment" }, { at: "Month 6", label: "Audit pilots" }] },
      },
    ],
  },
];

const SEARCH_RESULTS = [
  { id: "pfizer", type: "company", name: "Pfizer Inc.", description: "Major pharmaceutical company. Seeded demo profile for drug pricing case.", stats: { "2024 lobbying (seeded)": "$13.4M", "Top issue": "Drug pricing" } },
  { id: "eli-lilly", type: "company", name: "Eli Lilly", description: "Pharma company featured in seeded case file.", stats: { "2024 lobbying (seeded)": "$11.2M", "Top issue": "Medicare" } },
  { id: "exxon", type: "company", name: "ExxonMobil", description: "Energy firm used in seeded headlines.", stats: { "2024 lobbying (seeded)": "$15.1M", "Top issue": "Emissions" } },
  { id: "coinbase", type: "company", name: "Coinbase", description: "Crypto exchange used in seeded headlines.", stats: { "2024 lobbying (seeded)": "$6.3M", "Top issue": "Oversight" } },
  { id: "meta", type: "company", name: "Meta", description: "Tech platform referenced in seeded AI regulation headlines.", stats: { "Issue": "AI safety", "Engagement": "Meetings (seeded)" } },
  { id: "sen-example", type: "politician", name: "Sen. Example (R-TX)", description: "Seeded politician profile for demo flows.", stats: { "Cycle (seeded)": "2024", "Top donors": "Pharma, Energy" } },
  { id: "rep-example", type: "politician", name: "Rep. Example (D-CA)", description: "Seeded member profile for AI regulation storyline.", stats: { "Committee": "Commerce", "Focus": "Privacy/AI" } },
  { id: "committee-commerce", type: "bill", name: "AI Safety Framework (Draft)", description: "Seeded bill object for scrollytelling steps.", stats: { "Status": "Draft", "Arena": "Markup" } },
  { id: "pac-health", type: "pac", name: "Healthcare PAC (Seeded)", description: "Seeded PAC used for donation examples.", stats: { "Total (seeded)": "$2.1M", "Cycle": "2024" } },
  { id: "lobbyist-a", type: "lobbyist", name: "Lobbyist A (Seeded)", description: "Seeded lobbyist identity for demo graphs.", stats: { "Clients": "3", "Issue": "Drug pricing" } },
];

const ASK_EXAMPLES = [
  {
    question: "Which actors pushed hardest on the AI safety bill?",
    answer:
      "In this demo dataset, major platforms and trade groups cluster around committee staff meetings during the draft period, with repeated messaging themes (safety, competitiveness, jobs).",
    sources: [
      { title: NEWS[4].title, url: NEWS[4].url, quote: "Coordinated pressure campaigns targeting key committees." },
      { title: NEWS[9].title, url: NEWS[9].url, quote: "Definitions do the real work." },
    ],
  },
  {
    question: "How does money concentrate around a drug pricing vote?",
    answer:
      "The seeded case file shows contributions clustering in a narrow window around committee activity, followed by coordinated messaging and amendment churn.",
    sources: [
      { title: NEWS[1].title, url: NEWS[1].url, quote: "Trade groups publish identical talking points." },
      { title: NEWS[16].title, url: NEWS[16].url, quote: "Checks cluster around the same offices." },
    ],
  },
  {
    question: "Show me a quick map of influence for a single issue.",
    answer:
      "In demo mode, the landing page 'Case Files' scrollytelling drives a mini graph preview that changes on scroll. The full build would expand nodes via /api/graph.",
    sources: [{ title: NEWS[31].title, url: NEWS[31].url, quote: "A few lines can change who pays." }],
  },
  {
    question: "Is this real data?",
    answer:
      "Demo mode is seeded for storytelling. The production pipeline would ingest from FEC, Senate LDA, SEC EDGAR, and curated news sources, then index Elasticsearch as a derived store.",
    sources: [{ title: "Demo Mode policy", url: "https://example.com/demo/policy", quote: "Seeded demo content." }],
  },
  {
    question: "What should I click first?",
    answer:
      "Start with a Case File, then click a headline to open the article card, and finally jump to Explore to see the graph view.",
    sources: [{ title: NEWS[0].title, url: NEWS[0].url, quote: "The roll call is the receipt." }],
  },
];

fs.writeFileSync(path.join(demoDir, "news.json"), JSON.stringify(NEWS, null, 2) + "\n");
fs.writeFileSync(path.join(demoDir, "cases.json"), JSON.stringify(CASES, null, 2) + "\n");
fs.writeFileSync(path.join(demoDir, "search_results.json"), JSON.stringify(SEARCH_RESULTS, null, 2) + "\n");
fs.writeFileSync(path.join(demoDir, "ask_examples.json"), JSON.stringify(ASK_EXAMPLES, null, 2) + "\n");

console.log("Wrote demo JSON to public/demo/*.json");

