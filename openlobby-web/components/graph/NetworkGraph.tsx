"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Entity, GraphResponse, Relationship } from "@/lib/types";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

type GraphNode = Entity & { __id: string };
type GraphLink = Relationship & { source: string; target: string };

function colorFor(t: string): string {
  if (t === "politician") return "rgba(86,160,255,0.95)";
  if (t === "company") return "rgba(224,58,62,0.95)";
  if (t === "pac") return "rgba(86,220,140,0.95)";
  if (t === "lobbyist") return "rgba(196,127,58,0.95)";
  if (t === "bill") return "rgba(210,210,210,0.95)";
  return "rgba(160,160,160,0.95)";
}

export function NetworkGraph({
  graph,
  onNodeClick,
}: {
  graph: GraphResponse | null;
  onNodeClick?: (id: string) => void;
}) {
  const data = useMemo(() => {
    const nodes: GraphNode[] = (graph?.nodes ?? []).map((n) => ({ ...n, __id: n.id }));
    const links: GraphLink[] = (graph?.edges ?? []).map((e) => ({ ...e, source: e.source_id, target: e.target_id }));
    return { nodes, links };
  }, [graph]);

  if (!graph) {
    return (
      <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Graph</p>
        <p className="mt-2 text-[14px] leading-[1.65] text-[color:var(--muted)]">Pick a seed entity to load the network.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.45)]">
      <div className="h-[72vh] min-h-[520px] w-full">
        <ForceGraph3D
          graphData={data}
          nodeLabel={(n: any) => `${n.name ?? n.id} (${n.type ?? "entity"})`}
          nodeColor={(n: any) => colorFor(String(n.type ?? ""))}
          nodeOpacity={0.9}
          linkColor={() => "rgba(244,240,232,0.22)"}
          linkOpacity={0.35}
          linkWidth={(l: any) => {
            const amt = typeof l.amount === "number" ? l.amount : 0;
            if (!amt) return 1;
            // Hacky but readable: compress large $ into a 1..6 px range.
            const v = Math.log10(Math.max(1, amt));
            return Math.min(6, Math.max(1, v));
          }}
          onNodeClick={(n: any) => {
            const id = String(n?.id ?? "");
            if (id && onNodeClick) onNodeClick(id);
          }}
          backgroundColor="rgba(7,10,15,0.0)"
        />
      </div>
    </div>
  );
}

