import { TopBar } from "@/components/landing/TopBar";
import { fetchCase, fetchCases } from "@/lib/api";
import type { CaseFile } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

type SP = { case?: string };

export default async function CasesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  let all: CaseFile[] = [];
  let active: CaseFile | null = null;
  let errorMessage: string | null = null;

  try {
    all = await fetchCases(10);
    const caseId = sp.case ?? all[0]?.id ?? "";
    active = caseId ? await fetchCase(caseId) : null;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load cases.";
  }

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Cases</p>
            <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
              Case Files
            </h1>
            <p className="mt-3 max-w-[74ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
              Live cases are generated via Perplexity Sonar and stored in Supabase (`case_files`). No seeded content.
            </p>
          </div>
          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Active case</p>
            <p className="mt-1 font-serif text-[18px] text-[color:var(--ink-0)]">{active?.title ?? "—"}</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:rgba(224,58,62,0.35)] bg-[color:rgba(224,58,62,0.08)] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.86)]">Error</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {all.map((c) => (
            <Link
              key={c.id}
              href={`/cases?case=${encodeURIComponent(c.id)}`}
              className={[
                "overflow-hidden rounded-[calc(var(--radius)+10px)] border bg-[color:var(--card)] shadow-[0_22px_70px_var(--shadow)] transition",
                c.id === active?.id
                  ? "border-[color:rgba(224,58,62,0.55)]"
                  : "border-[color:var(--fog)] hover:border-[color:rgba(224,58,62,0.45)]",
              ].join(" ")}
            >
              <div className="relative h-[160px]">
                {c.hero_image_url ? (
                  <>
                    <Image src={c.hero_image_url} alt="" fill className="object-cover opacity-80" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,10,15,0.95))]" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(700px_260px_at_30%_40%,rgba(224,58,62,0.18),transparent_60%),linear-gradient(180deg,rgba(7,10,15,0.2),rgba(7,10,15,0.95))]" />
                )}
              </div>
              <div className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                  {(c.tags ?? [])[0] ?? "Case"}
                </p>
                <p className="mt-2 font-serif text-[20px] leading-[1.05] text-[color:var(--ink-0)]">{c.title}</p>
                <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">{c.dek}</p>
              </div>
            </Link>
          ))}
        </div>

        {active?.steps?.length ? (
          <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)] md:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Steps</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {active.steps.map((s) => (
                <div
                  key={s.id}
                  className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-5"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                    {s.kicker}
                  </p>
                  <p className="mt-2 font-serif text-[20px] leading-[1.1] text-[color:var(--ink-0)]">{s.headline}</p>
                  <p className="mt-3 text-[14px] leading-[1.65] text-[color:var(--muted)]">{s.body}</p>
                  {(s.related_urls ?? []).slice(0, 2).map((u) => (
                    <a
                      key={u}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.82)] hover:underline"
                    >
                      Source link
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
