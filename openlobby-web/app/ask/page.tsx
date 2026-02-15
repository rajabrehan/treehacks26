import { TopBar } from "@/components/landing/TopBar";
import { ask } from "@/lib/api";
import Link from "next/link";

type SP = { q?: string };

export default async function AskPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  let resp: Awaited<ReturnType<typeof ask>> | null = null;
  let errorMessage: string | null = null;
  try {
    resp = q ? await ask({ question: q, limit: 8 }) : null;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Ask failed.";
  }

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[980px] px-5 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Ask</p>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
          Natural language, with receipts.
        </h1>
        <p className="mt-3 max-w-[70ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
          Live: retrieves context from Elasticsearch and answers via Modal (open-source model).
        </p>

        <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Question</p>
          <p className="mt-2 font-serif text-[22px] leading-[1.2] text-[color:var(--ink-0)]">
            {q || "Click an Ask chip on the homepage."}
          </p>

          <div className="mt-6 border-t border-[color:var(--fog)] pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Answer</p>
            <p className="mt-3 text-[15px] leading-[1.7] text-[color:var(--muted)]">
              {errorMessage
                ? `Degraded mode: ${errorMessage}`
                : resp?.answer ||
                "No question provided. Use `/ask?q=...` or click a preloaded example chip on the landing page."}
            </p>
          </div>

          {resp?.sources?.length ? (
            <div className="mt-6 border-t border-[color:var(--fog)] pt-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Sources</p>
              <div className="mt-3 grid gap-3">
                {resp.sources.map((s) => (
                  <a
                    key={s.id}
                    href={s.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-4 transition hover:border-[color:rgba(224,58,62,0.55)]"
                  >
                    <p className="font-serif text-[16px] leading-[1.2] text-[color:var(--ink-0)]">{s.title}</p>
                    {s.snippet ? (
                      <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">{s.snippet}</p>
                    ) : null}
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
