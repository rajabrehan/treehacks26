import type {
  AskRequest,
  AskResponse,
  CaseFile,
  CasesResponse,
  Entity,
  GraphResponse,
  NewsItem,
  SearchResponse,
} from "@/lib/types";

function baseUrl(): string {
  const v = process.env.NEXT_PUBLIC_API_URL;
  if (!v) return "";
  return v.replace(/\/+$/, "");
}

export async function fetchTopNews(limit = 60): Promise<NewsItem[]> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const r = await fetch(`${b}/api/news/top?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`news/top failed: ${r.status}`);
  return (await r.json()) as NewsItem[];
}

export async function fetchCases(limit = 10): Promise<CasesResponse> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const r = await fetch(`${b}/api/cases?limit=${limit}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`cases failed: ${r.status}`);
  return (await r.json()) as CasesResponse;
}

export async function fetchCase(id: string): Promise<CaseFile> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const r = await fetch(`${b}/api/cases/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`case failed: ${r.status}`);
  return (await r.json()) as CaseFile;
}

export async function search(q: string, limit = 20, entityType?: string): Promise<SearchResponse> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const et = entityType ? `&entity_type=${encodeURIComponent(entityType)}` : "";
  const r = await fetch(`${b}/api/search?q=${encodeURIComponent(q)}&limit=${limit}${et}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`search failed: ${r.status}`);
  return (await r.json()) as SearchResponse;
}

export async function ask(req: AskRequest): Promise<AskResponse> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const r = await fetch(`${b}/api/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error(`ask failed: ${r.status}`);
  return (await r.json()) as AskResponse;
}

export async function fetchEntity(id: string): Promise<Entity> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const r = await fetch(`${b}/api/entities/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`entity failed: ${r.status}`);
  return (await r.json()) as Entity;
}

export async function listEntities(q: string, limit = 20, type?: string): Promise<Entity[]> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const t = type ? `&type=${encodeURIComponent(type)}` : "";
  const r = await fetch(`${b}/api/entities?q=${encodeURIComponent(q)}&limit=${limit}${t}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`entities failed: ${r.status}`);
  return (await r.json()) as Entity[];
}

export async function fetchGraph(seedId: string, depth = 1, limit = 200, types?: string[]): Promise<GraphResponse> {
  const b = baseUrl();
  if (!b) throw new Error("NEXT_PUBLIC_API_URL is not set");
  const tp = (types ?? []).length ? `&types=${encodeURIComponent(types!.join(","))}` : "";
  const r = await fetch(
    `${b}/api/graph?seed_id=${encodeURIComponent(seedId)}&depth=${depth}&limit=${limit}${tp}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error(`graph failed: ${r.status}`);
  return (await r.json()) as GraphResponse;
}
