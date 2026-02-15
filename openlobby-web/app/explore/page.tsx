import { TopBar } from "@/components/landing/TopBar";
import { fetchGraph } from "@/lib/api";
import type { GraphResponse } from "@/lib/types";
import { GraphExplorerClient } from "@/components/graph/GraphExplorerClient";

type SP = { seed?: string; depth?: string; types?: string };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const seed = (sp.seed ?? "").trim();
  const depth = Math.max(1, Math.min(2, Number(sp.depth ?? "1") || 1));
  const types = (sp.types ?? "").trim();
  const typeList = types ? types.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

  let initialGraph: GraphResponse | null = null;
  if (seed) {
    try {
      initialGraph = await fetchGraph(seed, depth, 200, typeList);
    } catch {
      initialGraph = null;
    }
  }

  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <GraphExplorerClient initialSeed={seed} initialGraph={initialGraph} />
    </div>
  );
}

