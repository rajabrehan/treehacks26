import { DEMO_CASES } from "@/lib/demo-data";
import { TopBar } from "@/components/landing/TopBar";
import Image from "next/image";
import Link from "next/link";

export default function ExplorePage({ searchParams }: { searchParams: { case?: string } }) {
  const caseId = searchParams.case ?? DEMO_CASES[0]?.id ?? "";
  const active = DEMO_CASES.find((c) => c.id === caseId) ?? DEMO_CASES[0];

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Explore</p>
            <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
              Graph Explorer (Demo)
            </h1>
            <p className="mt-3 max-w-[74ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
              This page is intentionally a demo shell. In the full stack, it becomes the “wow factor” view driven by
              `/api/graph` and entity hydration from Supabase, with a 2D/3D force graph.
            </p>
          </div>
          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.55)] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Active case</p>
            <p className="mt-1 font-serif text-[18px] text-[color:var(--ink-0)]">{active?.title ?? "Seeded"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {DEMO_CASES.map((c) => (
            <Link
              key={c.id}
              href={`/explore?case=${encodeURIComponent(c.id)}`}
              className={[
                "overflow-hidden rounded-[calc(var(--radius)+10px)] border bg-[color:var(--card)] shadow-[0_22px_70px_var(--shadow)] transition",
                c.id === active?.id ? "border-[color:rgba(224,58,62,0.55)]" : "border-[color:var(--fog)] hover:border-[color:rgba(224,58,62,0.45)]",
              ].join(" ")}
            >
              <div className="relative h-[160px]">
                <Image src={c.hero_image_url} alt="" fill className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,10,15,0.95))]" />
              </div>
              <div className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                  {c.tags[0] ?? "Seeded"}
                </p>
                <p className="mt-2 font-serif text-[20px] leading-[1.05] text-[color:var(--ink-0)]">{c.title}</p>
                <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">{c.dek}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)] md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
            What this becomes
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-5">
              <p className="font-serif text-[20px] text-[color:var(--ink-0)]">Force graph</p>
              <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">
                Click nodes to expand neighbors. Filter edges by type (donations, lobbying, votes). Edge width scales
                by amount.
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-5">
              <p className="font-serif text-[20px] text-[color:var(--ink-0)]">Case-driven entry</p>
              <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">
                Selecting a case file primes the graph with a curated subgraph, then lets users branch out into the
                wider dataset.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

