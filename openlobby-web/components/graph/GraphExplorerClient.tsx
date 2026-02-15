"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Entity, GraphResponse, RelationshipType } from "@/lib/types";
import { fetchGraph, listEntities } from "@/lib/api";
import { NetworkGraph } from "@/components/graph/NetworkGraph";

const REL_TYPES: RelationshipType[] = ["donation", "lobbying", "vote", "employment"];

export function GraphExplorerClient({ initialSeed, initialGraph }: { initialSeed: string; initialGraph: GraphResponse | null }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [seed, setSeed] = useState(initialSeed);
  const [depth, setDepth] = useState<number>(Number(sp.get("depth") ?? "1") || 1);
  const [types, setTypes] = useState<RelationshipType[]>(() => {
    const raw = sp.get("types");
    if (!raw) return [...REL_TYPES];
    const ok = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t): t is RelationshipType => REL_TYPES.includes(t as RelationshipType));
    return ok.length ? ok : [...REL_TYPES];
  });

  const [graph, setGraph] = useState<GraphResponse | null>(initialGraph);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Entity[]>([]);

  const typesKey = useMemo(() => types.join(","), [types]);

  function syncUrl(nextSeed: string, nextDepth: number, nextTypes: RelationshipType[]) {
    const u = new URL(window.location.href);
    if (nextSeed) u.searchParams.set("seed", nextSeed);
    u.searchParams.set("depth", String(nextDepth));
    u.searchParams.set("types", nextTypes.join(","));
    router.replace(u.pathname + u.search);
  }

  async function load(nextSeed: string, nextDepth: number, nextTypes: RelationshipType[]) {
    if (!nextSeed) {
      setGraph(null);
      setErr(null);
      return;
    }
    setErr(null);
    try {
      const g = await fetchGraph(nextSeed, nextDepth, 200, nextTypes);
      setGraph(g);
      syncUrl(nextSeed, nextDepth, nextTypes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load graph.");
    }
  }

  useEffect(() => {
    // Keep seed state in sync if user navigates.
    const s = sp.get("seed") ?? "";
    if (s !== seed) setSeed(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const v = q.trim();
      if (v.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const rows = await listEntities(v, 8);
        setSuggestions(rows);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Explore</p>
          <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
            Graph Explorer
          </h1>
          <p className="mt-3 max-w-[74ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">
            Canonical nodes and edges come from Supabase (`entities`, `relationships`). This view calls `/api/graph`.
          </p>
        </div>

        <a
          href={seed ? `/entity/${encodeURIComponent(seed)}` : "/search?q=ai%20regulation"}
          className="rounded-[calc(var(--radius)+6px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)]"
        >
          Open entity
        </a>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[0.95fr_2.05fr]">
        <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Seed</p>

          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Entity id (e.g. politician:..., company:...)"
            className="mt-3 h-12 w-full rounded-[calc(var(--radius)+4px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-4 text-[14px] text-[color:var(--ink-0)] outline-none transition focus:border-[color:rgba(224,58,62,0.55)]"
          />

          <button
            type="button"
            onClick={() => void load(seed.trim(), depth, types)}
            className="mt-3 h-11 w-full rounded-[calc(var(--radius)+6px)] bg-[color:var(--blood)] px-5 font-mono text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:brightness-110"
          >
            Load
          </button>

          <div className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Find entity</p>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search entities (name/description)…"
              className="mt-3 h-11 w-full rounded-[calc(var(--radius)+4px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-4 text-[14px] text-[color:var(--ink-0)] outline-none transition focus:border-[color:rgba(224,58,62,0.55)]"
            />

            {suggestions.length ? (
              <div className="mt-3 grid gap-2">
                {suggestions.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setSeed(e.id);
                      void load(e.id, depth, types);
                    }}
                    className="rounded-[14px] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-2 text-left transition hover:border-[color:rgba(224,58,62,0.55)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.82)]">
                        {e.type}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                        {e.id}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-[16px] leading-[1.2] text-[color:var(--ink-0)]">{e.name}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-6 border-t border-[color:var(--fog)] pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Depth</p>
            <div className="mt-3 flex gap-2">
              {[1, 2].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDepth(d);
                    void load(seed.trim(), d, types);
                  }}
                  className={[
                    "h-10 grow rounded-full border px-4 font-mono text-[11px] uppercase tracking-[0.22em] transition",
                    d === depth
                      ? "border-[color:rgba(224,58,62,0.55)] bg-[color:rgba(224,58,62,0.14)] text-[color:var(--ink-0)]"
                      : "border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] text-[color:var(--muted)] hover:bg-[color:rgba(244,240,232,0.05)]",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[color:var(--fog)] pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
              Relationship types
            </p>
            <div className="mt-3 grid gap-2">
              {REL_TYPES.map((t) => {
                const on = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const next = on ? types.filter((x) => x !== t) : [...types, t];
                      const normalized = next.length ? next : [...REL_TYPES];
                      setTypes(normalized);
                      void load(seed.trim(), depth, normalized);
                    }}
                    className={[
                      "flex items-center justify-between rounded-[14px] border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition",
                      on
                        ? "border-[color:rgba(224,58,62,0.55)] bg-[color:rgba(224,58,62,0.10)] text-[color:var(--ink-0)]"
                        : "border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] text-[color:var(--muted)] hover:bg-[color:rgba(244,240,232,0.05)]",
                    ].join(" ")}
                  >
                    <span>{t}</span>
                    <span className="text-[color:var(--muted-2)]">{on ? "on" : "off"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {err ? (
            <div className="mt-6 rounded-[14px] border border-[color:rgba(224,58,62,0.35)] bg-[color:rgba(224,58,62,0.08)] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(224,58,62,0.86)]">Error</p>
              <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">{err}</p>
            </div>
          ) : null}
        </div>

        <div>
          <NetworkGraph
            graph={graph}
            onNodeClick={(id) => {
              setSeed(id);
              void load(id, depth, types);
            }}
          />

          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-[color:var(--muted-2)]">
            <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-3 py-2">
              Seed: {seed || "—"}
            </span>
            <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-3 py-2">
              Depth: {depth}
            </span>
            <span className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] px-3 py-2">
              Types: {typesKey}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

