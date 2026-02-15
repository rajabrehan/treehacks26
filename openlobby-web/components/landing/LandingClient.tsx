"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CaseFile, NewsItem } from "@/lib/types";
import { ArticleDrawer } from "@/components/landing/ArticleDrawer";
import { ExampleChips } from "@/components/landing/ExampleChips";
import { HeadlineTicker } from "@/components/landing/HeadlineTicker";
import { PhotoMosaic } from "@/components/landing/PhotoMosaic";
import { ProofShelf } from "@/components/landing/ProofShelf";
import { ScrollStory } from "@/components/landing/ScrollStory";
import { TopBar } from "@/components/landing/TopBar";
import { useRouter } from "next/navigation";

type Props = {
  news: NewsItem[];
  cases: CaseFile[];
  errorMessage?: string | null;
};

type Mode = "search" | "ask" | "case";

export function LandingClient({ news, cases, errorMessage }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("search");
  const [q, setQ] = useState("");
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);

  const openArticle = useMemo(
    () => (openArticleId ? news.find((n) => n.id === openArticleId) ?? null : null),
    [openArticleId, news]
  );

  const collageImages = useMemo(() => {
    const picks = news
      .map((n) => n.image_url)
      .filter((u): u is string => typeof u === "string" && u.length > 0)
      .slice(0, 18);
    if (picks.length === 0) return [];
    // Intentional repetition for a "wall of clippings" feel.
    return Array.from({ length: 24 }, (_, i) => picks[i % picks.length]);
  }, [news]);

  function go() {
    const v = q.trim();
    if (!v && mode !== "case") return;
    if (mode === "search") router.push(`/search?q=${encodeURIComponent(v)}`);
    if (mode === "ask") router.push(`/ask?q=${encodeURIComponent(v)}`);
    if (mode === "case") {
      const c = cases[0];
      router.push(`/cases?case=${encodeURIComponent(c?.id ?? "")}`);
    }
  }

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      {errorMessage ? (
        <div className="mx-auto max-w-[1180px] px-5 pt-6">
          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:rgba(224,58,62,0.35)] bg-[color:rgba(224,58,62,0.08)] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.86)]">
              Degraded mode
            </p>
            <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--muted)]">{errorMessage}</p>
            <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">
              Configure `NEXT_PUBLIC_API_URL` (web) and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (api) to enable live content.
            </p>
          </div>
        </div>
      ) : null}

      {/* HERO */}
      <header className="relative mx-auto max-w-[1180px] px-5 pb-18 pt-12 md:pb-22 md:pt-18">
        <div className="relative overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] shadow-[0_28px_90px_var(--shadow)]">
          <div className="relative grid gap-10 p-6 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:p-10">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                  Corporate Influence Tracker
                </p>
                <span className="rounded-full border border-[color:var(--fog)] bg-[color:var(--card-2)] px-3 py-1 font-mono text-[11px] text-[color:var(--muted)]">
                  Live index
                </span>
              </div>

              <h1 className="mt-5 font-serif text-[44px] leading-[0.95] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[64px]">
                Follow the money.
                <br />
                <span className="text-[color:var(--steel)]">Read the receipts.</span>
              </h1>

              <p className="mt-5 max-w-[52ch] text-[15px] leading-[1.6] text-[color:var(--muted)] md:text-[16px]">
                A noir newsroom interface for political influence: headlines, case files, and a graph that turns
                buried disclosures into something you can actually navigate.
              </p>

              <div className="mt-8">
                <div className="inline-flex rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-1">
                  <ModePill active={mode === "search"} onClick={() => setMode("search")}>
                    Search entities
                  </ModePill>
                  <ModePill active={mode === "ask"} onClick={() => setMode("ask")}>
                    Ask a question
                  </ModePill>
                  <ModePill active={mode === "case"} onClick={() => setMode("case")}>
                    Explore a case
                  </ModePill>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative grow">
                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-[color:var(--blood)] shadow-[0_0_0_5px_rgba(224,58,62,0.18)]" />
                    </div>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") go();
                      }}
                      disabled={mode === "case"}
                      placeholder={
                        mode === "search"
                          ? "Search any company, politician, PAC, lobbyist..."
                          : mode === "ask"
                            ? "Ask: who pushed hardest on AI safety language?"
                            : "Pick a case file below"
                      }
                      className="h-14 w-full rounded-[calc(var(--radius)+4px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] pl-10 pr-4 text-[15px] text-[color:var(--ink-0)] outline-none ring-0 transition focus:border-[color:rgba(224,58,62,0.55)]"
                    />
                  </div>
                  <button
                    onClick={go}
                    className="h-14 rounded-[calc(var(--radius)+4px)] bg-[color:var(--blood)] px-6 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-900)] shadow-[0_18px_50px_rgba(224,58,62,0.18)] transition hover:brightness-110 active:brightness-95 md:px-7"
                  >
                    Open
                  </button>
                </div>

                <div className="mt-4">
                  <ExampleChips
                    mode={mode}
                    onPick={(pick) => {
                      if (pick.kind === "case") {
                        router.push(`/cases?case=${encodeURIComponent(pick.value)}`);
                        return;
                      }
                      setMode(pick.kind);
                      setQ(pick.value);
                      router.push(`/${pick.kind}?q=${encodeURIComponent(pick.value)}`);
                    }}
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-[12px] text-[color:var(--muted-2)]">
                  <span className="font-mono uppercase tracking-[0.22em]">Signals</span>
                  <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-1">
                    Live headlines
                  </span>
                  <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-1">
                    2 case files
                  </span>
                  <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-1">
                    Scroll-driven viz stage
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              {collageImages.length ? (
                <PhotoMosaic images={collageImages} />
              ) : (
                <div className="relative h-[360px] overflow-hidden rounded-[calc(var(--radius)+8px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] md:h-full">
                  <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_40%_30%,rgba(224,58,62,0.18),transparent_60%),radial-gradient(700px_420px_at_72%_70%,rgba(196,127,58,0.18),transparent_55%)]" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                      No images yet
                    </p>
                    <p className="mt-2 font-serif text-[20px] leading-[1.1] text-[color:var(--ink-0)]">
                      Configure news ingestion to populate the collage.
                    </p>
                  </div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius)+8px)] ring-1 ring-[color:var(--fog)]" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[color:rgba(224,58,62,0.14)] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-52 w-52 rounded-full bg-[color:rgba(196,127,58,0.16)] blur-3xl" />
            </div>
          </div>

          <div className="relative border-t border-[color:var(--fog)]">
            <HeadlineTicker items={news.slice(0, 24)} onOpen={(id) => setOpenArticleId(id)} />
          </div>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <KpiCard label="Query mode" value="Search / Ask / Case" note="One input, three entry points." />
          <KpiCard label="Derived index" value="Elasticsearch" note="Hybrid kNN + BM25 in full mode." />
          <KpiCard label="Canonical store" value="Supabase" note="Auth + Postgres; ES is rebuildable." />
        </div>
      </header>

      {/* HEADLINE WALL */}
      <section className="mx-auto max-w-[1180px] px-5 pb-18">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
              Headline Wall
            </p>
            <h2 className="mt-2 font-serif text-[30px] leading-[1.05] text-[color:var(--ink-0)] md:text-[38px]">
              Today’s noise, organized into clues.
            </h2>
          </div>
          <p className="hidden max-w-[44ch] text-right text-[13px] leading-[1.6] text-[color:var(--muted)] md:block">
            Live headlines via `/api/news/top` (Perplexity Sonar + caching in Supabase).
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {news.slice(0, 12).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setOpenArticleId(n.id)}
              className="group overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] text-left shadow-[0_22px_70px_var(--shadow)] transition hover:border-[color:rgba(224,58,62,0.55)]"
            >
              <div className="relative h-[150px]">
                {n.image_url ? (
                  <Image
                    src={n.image_url}
                    alt=""
                    fill
                    className="object-cover opacity-80 transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(700px_260px_at_30%_40%,rgba(224,58,62,0.18),transparent_60%),linear-gradient(180deg,rgba(7,10,15,0.2),rgba(7,10,15,0.95))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,10,15,0.96))]" />
                <div className="absolute left-4 top-4 inline-flex rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {n.source}
                </div>
              </div>
              <div className="p-5">
                <p className="font-serif text-[18px] leading-[1.15] text-[color:var(--ink-0)]">{n.title}</p>
                <p className="mt-2 line-clamp-2 text-[13px] leading-[1.65] text-[color:var(--muted)]">
                  {n.excerpt || "Click to open. Ingestion attaches excerpts as available."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(n.tags ?? []).slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-1 text-[12px] text-[color:var(--muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CASE FILES */}
      <section className="mx-auto max-w-[1180px] px-5 pb-18">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
              Case Files
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[44px]">
              Scroll an investigation.
            </h2>
          </div>
          <Link
            href="/cases"
            className="hidden rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)] md:inline-flex"
          >
            Open case files
          </Link>
        </div>

        <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] shadow-[0_28px_90px_var(--shadow)]">
          <ScrollStory news={news} cases={cases} onOpenArticle={(id) => setOpenArticleId(id)} />
        </div>
      </section>

      {/* PROOF */}
      <section className="mx-auto max-w-[1180px] px-5 pb-24">
        <ProofShelf />

        <div className="mt-12 overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)]">
          <div className="grid gap-10 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Next</p>
              <h3 className="mt-2 font-serif text-[30px] leading-[1.05] text-[color:var(--ink-0)]">
                Want the full graph?
              </h3>
              <p className="mt-4 text-[15px] leading-[1.6] text-[color:var(--muted)]">
                The landing page is the hook. The explorer is the proof. Today it’s a staged experience; next it
                expands via `/api/graph` and hydrates from Supabase.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/explore"
                  className="rounded-[calc(var(--radius)+6px)] bg-[color:var(--blood)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:brightness-110"
                >
                  Open the graph
                </Link>
                <Link
                  href="/search?q=drug%20pricing"
                  className="rounded-[calc(var(--radius)+6px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
                >
                  Search a thread
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)]">
              {cases[0]?.hero_image_url ? (
                <Image
                  src={cases[0]?.hero_image_url}
                  alt="Case hero"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover opacity-80"
                  priority={false}
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(224,58,62,0.22),transparent_55%),linear-gradient(180deg,transparent,rgba(7,10,15,0.92))]" />
              )}
              <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_20%,rgba(224,58,62,0.22),transparent_55%),linear-gradient(180deg,transparent,rgba(7,10,15,0.92))]" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(244,240,232,0.72)]">
                  Live sources
                </p>
                <p className="mt-2 font-serif text-[22px] leading-[1.1] text-[color:var(--ink-0)]">
                  Images are pulled from page metadata (og:image). Broken links happen; cache later if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ArticleDrawer article={openArticle} onClose={() => setOpenArticleId(null)} />
    </div>
  );
}

function ModePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-10 rounded-full px-4 font-mono text-[11px] uppercase tracking-[0.22em] transition",
        active
          ? "bg-[color:var(--ink-0)] text-[color:var(--ink-900)]"
          : "text-[color:var(--muted)] hover:bg-[color:rgba(244,240,232,0.06)]",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function KpiCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">{label}</p>
      <p className="mt-2 font-serif text-[22px] leading-[1.05] text-[color:var(--ink-0)]">{value}</p>
      <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--muted)]">{note}</p>
    </div>
  );
}
