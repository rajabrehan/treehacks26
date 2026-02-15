import { TopBar } from "@/components/landing/TopBar";
import { fetchEntity, fetchGraph } from "@/lib/api";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import Link from "next/link";

type Params = { id: string };

export default async function EntityPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const id = decodeURIComponent(p.id);

  let entity: Awaited<ReturnType<typeof fetchEntity>> | null = null;
  let graph: Awaited<ReturnType<typeof fetchGraph>> | null = null;
  let errorMessage: string | null = null;

  try {
    entity = await fetchEntity(id);
    graph = await fetchGraph(id, 1, 200);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load entity.";
  }

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Entity</p>
            <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
              {entity?.name ?? id}
            </h1>
            <p className="mt-3 max-w-[74ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
              {entity?.description ?? "Canonical entity record from Supabase."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/search?q=${encodeURIComponent(entity?.name ?? id)}`}
              className="rounded-[calc(var(--radius)+6px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
            >
              Related news
            </Link>
            <Link
              href={`/explore?seed=${encodeURIComponent(id)}`}
              className="rounded-[calc(var(--radius)+6px)] bg-[color:var(--blood)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:brightness-110"
            >
              Open graph
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-[calc(var(--radius)+10px)] border border-[color:rgba(224,58,62,0.35)] bg-[color:rgba(224,58,62,0.08)] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.86)]">Error</p>
            <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Type</p>
            <p className="mt-2 font-serif text-[22px] text-[color:var(--ink-0)]">{entity?.type ?? "—"}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">ID</p>
            <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">{id}</p>
          </div>

          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Total lobbying</p>
            <p className="mt-2 font-serif text-[22px] text-[color:var(--ink-0)]">
              {typeof entity?.total_lobbying === "number" ? `$${entity.total_lobbying.toLocaleString()}` : "—"}
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Total donations</p>
            <p className="mt-2 font-serif text-[22px] text-[color:var(--ink-0)]">
              {typeof entity?.total_donations === "number" ? `$${entity.total_donations.toLocaleString()}` : "—"}
            </p>
          </div>

          <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Attributes</p>
            <p className="mt-3 text-[14px] leading-[1.65] text-[color:var(--muted)]">
              {(entity?.party && `Party: ${entity.party}`) ||
                (entity?.state && `State: ${entity.state}`) ||
                (entity?.industry && `Industry: ${entity.industry}`) ||
                "—"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <NetworkGraph graph={graph} />
        </div>
      </main>
    </div>
  );
}

