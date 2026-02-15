export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string; // ISO
  excerpt: string;
  image_url: string; // local path in demo mode
  entities_mentioned: string[];
  tags?: string[];
};

export type CaseStepViz =
  | { kind: "stat"; label: string; value: string; note: string }
  | { kind: "sankey"; label: string; from: string; to: string; amount: string }
  | { kind: "timeline"; label: string; points: { at: string; label: string }[] }
  | { kind: "graph"; label: string; nodes: { id: string; type: string }[]; links: { s: string; t: string; amount?: number }[] };

export type CaseStep = {
  id: string;
  kicker: string;
  headline: string;
  body: string;
  key_finding: { label: string; value: string; note: string };
  related_headline_ids: string[];
  collage_image_urls: string[];
  viz: CaseStepViz;
};

export type CaseFile = {
  id: string;
  title: string;
  dek: string;
  hero_image_url: string;
  tags: string[];
  steps: CaseStep[];
};

export type DemoSearchResult = {
  id: string;
  type: "politician" | "company" | "pac" | "lobbyist" | "bill";
  name: string;
  description: string;
  stats: Record<string, string>;
};

export type DemoAskExample = {
  question: string;
  answer: string;
  sources: { title: string; url: string; quote: string }[];
};

