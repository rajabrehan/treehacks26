import { DEMO_SEARCH_RESULTS } from "@/lib/demo-data";
import { TopBar } from "@/components/landing/TopBar";
import Link from "next/link";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { q } = searchParams;
  const query = (q ?? "").trim();
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const results =
    tokens.length === 0
      ? DEMO_SEARCH_RESULTS
      : DEMO_SEARCH_RESULTS.filter((r) => {
          const hay = `${r.name} ${r.description} ${Object.values(r.stats).join(" ")}`.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        });

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
              Demo-mode results are seeded. In full mode, this route calls `/api/search` and hydrates entities from
              Supabase.
            </p>
          </div>

          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Query</p>
            <p className="mt-1 font-serif text-[18px] text-[color:var(--ink-0)]">{query || "All (seeded)"}</p>
          </div>
        </div>

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
                  <h2 className="mt-2 font-serif text-[24px] leading-[1.05] text-[color:var(--ink-0)]">{r.name}</h2>
                </div>
                <Link
                  href="/explore"
                  className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
                >
                  Open
                </Link>
              </div>

              <p className="mt-4 text-[14px] leading-[1.65] text-[color:var(--muted)]">{r.description}</p>

              <div className="mt-5 grid gap-2">
                {Object.entries(r.stats).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] text-[color:var(--muted)]">{k}</span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-[color:var(--ink-0)]">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="mt-10 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] p-6">
            <p className="font-serif text-[20px] text-[color:var(--ink-0)]">No matches in seeded demo.</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">
              Try a homepage chip, or use broader terms like <span className="text-[color:var(--ink-0)]">AI</span>,
              <span className="text-[color:var(--ink-0)]"> pricing</span>, or <span className="text-[color:var(--ink-0)]">lobbying</span>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
