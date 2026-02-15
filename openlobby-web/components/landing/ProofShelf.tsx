"use client";

const SOURCES = [
  {
    name: "FEC",
    desc: "Campaign contributions, committees, and spending reports.",
    badge: "Finance",
  },
  {
    name: "Senate LDA",
    desc: "Lobbying registrations and activity filings (LD-1/LD-2).",
    badge: "Lobbying",
  },
  {
    name: "SEC EDGAR",
    desc: "Corporate filings, proxies, and executive compensation signals.",
    badge: "Filings",
  },
  {
    name: "ProPublica",
    desc: "Votes, bills, member metadata (keyed access).",
    badge: "Legislation",
  },
  {
    name: "News",
    desc: "Seeded headlines in demo mode. Live ingestion later via RSS scraping.",
    badge: "Narrative",
  },
];

export function ProofShelf() {
  return (
    <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_28px_90px_var(--shadow)] md:p-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Proof Shelf</p>
          <h3 className="mt-2 font-serif text-[28px] leading-[1.05] text-[color:var(--ink-0)] md:text-[34px]">
            Sources, constraints, receipts.
          </h3>
        </div>
        <p className="hidden max-w-[42ch] text-right text-[13px] leading-[1.6] text-[color:var(--muted)] md:block">
          Canonical data lives in Supabase. Elasticsearch is derived and rebuildable. Demo mode is seeded.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {SOURCES.map((s) => (
          <div
            key={s.name}
            className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-4 transition hover:border-[color:rgba(224,58,62,0.55)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-serif text-[18px] leading-[1.1] text-[color:var(--ink-0)]">{s.name}</p>
              <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                {s.badge}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-[1.6] text-[color:var(--muted)]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

