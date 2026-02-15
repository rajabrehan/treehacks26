"use client";

import type { NewsItem } from "@/lib/types";

export function HeadlineTicker({
  items,
  onOpen,
}: {
  items: NewsItem[];
  onOpen: (id: string) => void;
}) {
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[linear-gradient(90deg,rgba(7,10,15,0.95),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[linear-gradient(270deg,rgba(7,10,15,0.95),transparent)]" />

      <div className="flex items-center gap-3 px-5 py-4">
        <span className="rounded-full bg-[color:rgba(224,58,62,0.18)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-0)]">
          Live Wire
        </span>
        <div className="relative grow overflow-hidden">
          <div
            className="flex min-w-max items-center gap-3 pr-10"
            style={{
              animation: "ol-ticker 46s linear infinite",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
            }}
          >
            {loop.map((n, idx) => (
              <button
                key={`${n.id}:${idx}`}
                type="button"
                onClick={() => onOpen(n.id)}
                className="inline-flex items-center gap-3 rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-4 py-2 text-left transition hover:border-[color:rgba(224,58,62,0.55)] hover:bg-[color:rgba(244,240,232,0.05)]"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                  {n.source}
                </span>
                <span className="max-w-[42ch] truncate text-[13px] text-[color:var(--muted)] hover:text-[color:var(--ink-0)]">
                  {n.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ol-ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

