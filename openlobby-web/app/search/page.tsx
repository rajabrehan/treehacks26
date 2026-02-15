import { TopBar } from "@/components/landing/TopBar";
import { search } from "@/lib/api";
import type { SearchHit } from "@/lib/types";
import Link from "next/link";

type SP = { q?: string; type?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const type = (sp.type ?? "").trim();

  let results: SearchHit[] = [];
  let errorMessage: string | null = null;
  try {
    results = query ? await search(query, 24, type || undefined) : [];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Search failed.";
  }

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Search</p>
            <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
              Results
            </h1>
            <p className="mt-3 max-w-[70ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
              Live results from Elasticsearch (derived). Canonical records are stored in Supabase.
            </p>
          </div>

          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Query</p>
            <p className="mt-1 font-serif text-[18px] text-[color:var(--ink-0)]">{query || "Type a query"}</p>
            {type ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                Filter: {type}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {["", "politician", "company", "pac", "lobbyist", "bill"].map((t) => (
            <Link
              key={t || "all"}
              href={`/search?q=${encodeURIComponent(query || "")}${t ? `&type=${encodeURIComponent(t)}` : ""}`}
              className={[
                "rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition",
                (t || "") === type
                  ? "border-[color:rgba(224,58,62,0.55)] bg-[color:rgba(224,58,62,0.14)] text-[color:var(--ink-0)]"
                  : "border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] text-[color:var(--muted)] hover:border-[color:rgba(224,58,62,0.45)]",
              ].join(" ")}
            >
              {t ? t : "all"}
            </Link>
          ))}
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:rgba(224,58,62,0.35)] bg-[color:rgba(224,58,62,0.08)] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.86)]">Error</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {results.map((r) => (
            <div
              key={r.id}
              className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.86)]">
                    {r.type}
                  </p>
                  <h2 className="mt-2 font-serif text-[24px] leading-[1.05] text-[color:var(--ink-0)]">
                    {r.title}
                  </h2>
                </div>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
                  >
                    Open
                  </a>
                ) : (
                  <Link
                    href={r.type === "entity" ? `/entity/${encodeURIComponent(r.id)}` : "/explore"}
                    className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
                  >
                    {r.type === "entity" ? "Entity" : "Explore"}
                  </Link>
                )}
              </div>

              {r.snippet ? (
                <p className="mt-4 text-[14px] leading-[1.65] text-[color:var(--muted)]">{r.snippet}</p>
              ) : null}
            </div>
          ))}
        </div>

        {!query ? (
          <div className="mt-10 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] p-6">
            <p className="font-serif text-[20px] text-[color:var(--ink-0)]">Try a query from the homepage chips.</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">
              If the index is empty, hit the landing page and trigger a refresh, or call `/api/ingest/news` once.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-10 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] p-6">
            <p className="font-serif text-[20px] text-[color:var(--ink-0)]">No hits yet.</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">
              The backend may not have ingested news yet, or Elasticsearch isn’t configured. Check the API `/healthz`
              and then trigger `/api/news/top?refresh=1`.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
