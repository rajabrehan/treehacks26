import { DEMO_ASK_EXAMPLES } from "@/lib/demo-data";
import { TopBar } from "@/components/landing/TopBar";
import Link from "next/link";

export default function AskPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const match =
    DEMO_ASK_EXAMPLES.find((e) => e.question.toLowerCase() === q.toLowerCase()) ??
    (q
      ? {
          question: q,
          answer:
            "Demo mode: this answer is seeded. In full mode, the backend would retrieve context via Elasticsearch and generate a cited response via Modal.",
          sources: [],
        }
      : null);

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[980px] px-5 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Ask</p>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
          Natural language, with receipts.
        </h1>
        <p className="mt-3 max-w-[70ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
          In demo mode this page uses seeded examples. In full mode it calls `/api/ask` after retrieval from
          Elasticsearch.
        </p>

        <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Question</p>
          <p className="mt-2 font-serif text-[22px] leading-[1.2] text-[color:var(--ink-0)]">
            {match?.question ?? "Click an example on the homepage."}
          </p>

          <div className="mt-6 border-t border-[color:var(--fog)] pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Answer</p>
            <p className="mt-3 text-[15px] leading-[1.7] text-[color:var(--muted)]">
              {match?.answer ??
                "Open `/` and click a preloaded Ask example chip. This page will then render a seeded response."}
            </p>
          </div>

          {match?.sources?.length ? (
            <div className="mt-6 border-t border-[color:var(--fog)] pt-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                Seeded sources
              </p>
              <div className="mt-3 grid gap-3">
                {match.sources.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-4 transition hover:border-[color:rgba(224,58,62,0.55)]"
                  >
                    <p className="font-serif text-[16px] leading-[1.2] text-[color:var(--ink-0)]">{s.title}</p>
                    <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">{s.quote}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.82)]">
                      Open link
                    </p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-[calc(var(--radius)+6px)] bg-[color:var(--blood)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:brightness-110"
          >
            Back to landing
          </Link>
          <Link
            href="/explore"
            className="rounded-[calc(var(--radius)+6px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
          >
            Open graph
          </Link>
        </div>
      </main>
    </div>
  );
}

