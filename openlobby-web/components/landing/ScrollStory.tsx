"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseFile, CaseStep, NewsItem } from "@/lib/types";

export function ScrollStory({
  news,
  cases,
  onOpenArticle,
}: {
  news: NewsItem[];
  cases: CaseFile[];
  onOpenArticle: (id: string) => void;
}) {
  const [activeCaseId, setActiveCaseId] = useState(cases[0]?.id ?? "");
  const activeCase = useMemo(
    () => cases.find((c) => c.id === activeCaseId) ?? cases[0],
    [activeCaseId, cases]
  );
  const steps = useMemo(() => activeCase?.steps ?? [], [activeCase]);
  const [activeStepId, setActiveStepId] = useState(cases[0]?.steps?.[0]?.id ?? "");

  const railRef = useRef<HTMLDivElement | null>(null);

  // Optional URL state: helps screen recording and preserves shareable state.
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (activeCaseId) u.searchParams.set("case", activeCaseId);
      if (activeStepId) u.searchParams.set("step", activeStepId);
      window.history.replaceState({}, "", u.toString());
    } catch {
      // Ignore URL state errors in constrained environments.
    }
  }, [activeCaseId, activeStepId]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-step-id]"));
    if (!cards.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        const id = (visible?.target as HTMLElement | undefined)?.dataset.stepId;
        if (id) setActiveStepId(id);
      },
      { root: null, threshold: [0.35, 0.55, 0.75] }
    );

    for (const c of cards) io.observe(c);
    return () => io.disconnect();
  }, [activeCaseId, steps.length]);

  const activeStep = useMemo(() => steps.find((s) => s.id === activeStepId) ?? steps[0], [steps, activeStepId]);
  const related = useMemo(() => {
    // In the live system, steps carry related URLs (and optionally doc IDs) rather than seeded headline IDs.
    const urls = (activeStep?.related_urls ?? []).slice(0, 6);
    const set = new Set(urls);
    return news.filter((n) => set.has(n.url)).slice(0, 6);
  }, [activeStep, news]);

  return (
    <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
      {/* Sticky viz stage */}
      <div className="relative border-b border-[color:var(--fog)] p-5 md:border-b-0 md:border-r md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCaseId(c.id);
                setActiveStepId(c.steps?.[0]?.id ?? "");
              }}
              className={[
                "rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition",
                c.id === activeCaseId
                  ? "border-[color:rgba(224,58,62,0.55)] bg-[color:rgba(224,58,62,0.14)] text-[color:var(--ink-0)]"
                  : "border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] text-[color:var(--muted)] hover:bg-[color:rgba(244,240,232,0.05)]",
              ].join(" ")}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] p-5 md:sticky md:top-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
            {activeStep?.kicker ?? "Case File"}
          </p>
          <h3 className="mt-2 font-serif text-[26px] leading-[1.05] text-[color:var(--ink-0)]">
            {activeStep?.headline ?? ""}
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <KeyFinding step={activeStep} />
            <MiniViz step={activeStep} />
          </div>

          <div className="mt-4 overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)]">
            {activeStep?.collage_image_urls?.[0] || activeCase?.hero_image_url ? (
              <Image
                src={activeStep?.collage_image_urls?.[0] ?? activeCase?.hero_image_url ?? ""}
                alt=""
                width={1200}
                height={800}
                className="h-[220px] w-full object-cover grayscale-[20%] contrast-[1.12] saturate-[0.82]"
              />
            ) : (
              <div className="h-[220px] w-full bg-[radial-gradient(900px_420px_at_40%_30%,rgba(224,58,62,0.18),transparent_60%),radial-gradient(700px_420px_at_72%_70%,rgba(196,127,58,0.18),transparent_55%),linear-gradient(180deg,rgba(7,10,15,0.25),rgba(7,10,15,0.85))]" />
            )}
          </div>

          <div className="mt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
              Related headlines
            </p>
            <div className="mt-2 grid gap-2">
              {related.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenArticle(n.id)}
                  className="rounded-[14px] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-2 text-left transition hover:border-[color:rgba(224,58,62,0.55)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                      {n.source}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.82)]">
                      Open
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-[1.35] text-[color:var(--muted)]">{n.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Narrative rail (scroll snap) */}
      <div
        ref={railRef}
        className="max-h-[72vh] overflow-auto scroll-smooth p-5 md:max-h-[680px] md:p-7"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
          {activeCase?.dek ?? "Case file"}
        </p>

        <div className="mt-4 grid gap-4">
          {steps.map((s) => (
            <article
              key={s.id}
              data-step-id={s.id}
              className={[
                "rounded-[calc(var(--radius)+10px)] border p-5 transition",
                s.id === activeStepId
                  ? "border-[color:rgba(224,58,62,0.55)] bg-[color:rgba(224,58,62,0.10)]"
                  : "border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] hover:bg-[color:rgba(244,240,232,0.04)]",
              ].join(" ")}
              style={{ scrollSnapAlign: "start" }}
              onClick={() => setActiveStepId(s.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                    {s.kicker}
                  </p>
                  <h4 className="mt-2 font-serif text-[22px] leading-[1.05] text-[color:var(--ink-0)]">
                    {s.headline}
                  </h4>
                </div>
                <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Step
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.65] text-[color:var(--muted)]">{s.body}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {s.collage_image_urls.slice(0, 4).map((u) => (
                  <div key={u} className="relative overflow-hidden rounded-[14px] border border-[color:var(--fog)]">
                    <Image src={u} alt="" width={900} height={600} className="h-[92px] w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,10,15,0.55))]" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function KeyFinding({ step }: { step: CaseStep | undefined }) {
  const k = step?.key_finding;
  if (!k) return null;
  return (
    <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">{k.label}</p>
      <p className="mt-2 font-serif text-[28px] leading-[1] text-[color:var(--ink-0)]">{k.value}</p>
      <p className="mt-2 text-[12px] leading-[1.55] text-[color:var(--muted)]">{k.note}</p>
    </div>
  );
}

function MiniViz({ step }: { step: CaseStep | undefined }) {
  const v = step?.viz;
  if (!v) return null;

  return (
    <div className="relative overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">{v.label}</p>

      {v.kind === "stat" && (
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:rgba(244,240,232,0.08)]">
            <div className="h-full w-[72%] rounded-full bg-[color:rgba(224,58,62,0.72)]" />
          </div>
          <p className="mt-2 text-[12px] text-[color:var(--muted)]">{v.note}</p>
        </div>
      )}

      {v.kind === "sankey" && (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-[14px] border border-[color:rgba(224,58,62,0.30)] bg-[color:rgba(224,58,62,0.12)] px-3 py-2 text-[12px] text-[color:var(--ink-0)]">
            {v.from}
          </div>
          <div className="h-6 w-10">
            <svg viewBox="0 0 100 60" className="h-full w-full">
              <path d="M2 30 C 40 6, 60 54, 98 30" stroke="rgba(244,240,232,0.55)" strokeWidth="6" fill="none" />
              <path d="M2 30 C 40 6, 60 54, 98 30" stroke="rgba(224,58,62,0.75)" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div className="rounded-[14px] border border-[color:rgba(196,127,58,0.30)] bg-[color:rgba(196,127,58,0.12)] px-3 py-2 text-[12px] text-[color:var(--ink-0)]">
            {v.to}
          </div>
          <p className="col-span-3 mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(244,240,232,0.72)]">
            {v.amount}
          </p>
        </div>
      )}

      {v.kind === "timeline" && (
        <div className="mt-4">
          <div className="relative h-1 w-full rounded-full bg-[color:rgba(244,240,232,0.10)]" />
          <div className="mt-3 grid gap-2">
            {v.points.slice(0, 4).map((p) => (
              <div key={p.at} className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.82)]">
                  {p.at}
                </span>
                <span className="text-[12px] text-[color:var(--muted)]">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.kind === "graph" && (
        <div className="mt-3">
          <svg viewBox="0 0 260 120" className="h-[88px] w-full">
            <g stroke="rgba(244,240,232,0.28)" strokeWidth="2">
              <line x1="44" y1="80" x2="120" y2="26" />
              <line x1="120" y1="26" x2="214" y2="66" />
              <line x1="44" y1="80" x2="214" y2="66" />
            </g>
            <g>
              <circle cx="44" cy="80" r="10" fill="rgba(224,58,62,0.72)" />
              <circle cx="120" cy="26" r="10" fill="rgba(196,127,58,0.72)" />
              <circle cx="214" cy="66" r="10" fill="rgba(154,164,178,0.72)" />
              <circle cx="164" cy="98" r="8" fill="rgba(244,240,232,0.20)" />
            </g>
          </svg>
          <p className="mt-1 text-[12px] text-[color:var(--muted)]">
            This stage renders lightweight previews; full graph mode comes via `/api/graph`.
          </p>
        </div>
      )}
    </div>
  );
}
