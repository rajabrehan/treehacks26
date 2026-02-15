export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at?: string | null; // ISO
  excerpt: string;
  image_url?: string | null; // usually og:image hotlink
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
  related_document_ids: string[];
  related_urls?: string[];
  collage_image_urls: string[];
  viz: CaseStepViz;
};

export type CaseFile = {
  id: string;
  title: string;
  dek: string;
  hero_image_url?: string | null;
  tags: string[];
  steps: CaseStep[];
};

export type EntityType = "politician" | "company" | "pac" | "lobbyist" | "bill" | "document";
export type RelationshipType = "donation" | "lobbying" | "vote" | "employment";

export type Entity = {
  id: string;
  type: EntityType;
  name: string;
  description?: string | null;
  party?: string | null;
  state?: string | null;
  industry?: string | null;
  total_lobbying?: number | null;
  total_donations?: number | null;
  metadata?: Record<string, unknown>;
  last_updated?: string | null;
};

export type Relationship = {
  id: string;
  type: RelationshipType;
  source_id: string;
  target_id: string;
  amount?: number | null;
  date?: string | null;
  cycle?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  last_updated?: string | null;
};

export type GraphResponse = {
  seed_id: string;
  nodes: Entity[];
  edges: Relationship[];
};

export type SearchHit = {
  id: string;
  type: "document" | "entity" | "relationship";
  title: string;
  snippet?: string;
  url?: string | null;
  score?: number | null;
  image_url?: string | null;
  metadata?: Record<string, unknown>;
};

export type AskRequest = { question: string; limit?: number };
export type AskResponse = { answer: string; sources: SearchHit[] };

export type SearchResponse = SearchHit[];
export type CasesResponse = CaseFile[];
