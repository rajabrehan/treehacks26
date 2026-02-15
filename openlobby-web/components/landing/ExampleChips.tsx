"use client";

type Pick =
  | { kind: "search"; label: string; value: string }
  | { kind: "ask"; label: string; value: string }
  | { kind: "case"; label: string; value: string };

const PICKS: Pick[] = [
  { kind: "search", label: "ExxonMobil lobbying network", value: "ExxonMobil lobbying network" },
  { kind: "search", label: "Pfizer drug pricing influence", value: "Pfizer drug pricing influence" },
  { kind: "search", label: "Meta AI safety meetings", value: "Meta AI safety meetings" },
  { kind: "search", label: "Coinbase crypto oversight push", value: "Coinbase crypto oversight push" },
  { kind: "search", label: "Top donors to a swing member", value: "top donors to a swing member" },
  { kind: "search", label: "Senate Commerce Committee staff", value: "Senate Commerce Committee staff" },
  { kind: "ask", label: "Who pushed hardest on AI safety language?", value: "Who pushed hardest on AI safety language?" },
  { kind: "ask", label: "Which pharma players shaped the price cap vote?", value: "Which pharma players shaped the price cap vote?" },
  { kind: "ask", label: "How do carveouts show up in amendments?", value: "How do carveouts show up in amendments?" },
  { kind: "ask", label: "Summarize the money + messaging pattern", value: "Summarize the money + messaging pattern" },
  { kind: "case", label: "Case file: Price Cap Playbook", value: "pharma-drug-pricing" },
  { kind: "case", label: "Case file: Safety Bill Sprint", value: "tech-ai-regulation" },
];

export function ExampleChips({
  mode,
  onPick,
}: {
  mode: "search" | "ask" | "case";
  onPick: (pick: Pick) => void;
}) {
  const visible = PICKS.slice(0, 12);

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((p) => (
        <button
          key={`${p.kind}:${p.label}`}
          type="button"
          onClick={() => onPick(p)}
          className={[
            "group inline-flex items-center gap-2 rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-2 text-left transition",
            "hover:border-[color:rgba(224,58,62,0.55)] hover:bg-[color:rgba(244,240,232,0.05)]",
          ].join(" ")}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
            {p.kind}
          </span>
          <span className="text-[13px] leading-[1.2] text-[color:var(--muted)] group-hover:text-[color:var(--ink-0)]">
            {p.label}
          </span>
          {p.kind === mode ? (
            <span className="ml-1 hidden rounded-full bg-[color:rgba(224,58,62,0.18)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-0)] md:inline">
              active
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
