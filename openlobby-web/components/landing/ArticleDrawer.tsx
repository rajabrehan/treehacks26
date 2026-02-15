"use client";

import Image from "next/image";
import type { NewsItem } from "@/lib/types";

export function ArticleDrawer({
  article,
  onClose,
}: {
  article: NewsItem | null;
  onClose: () => void;
}) {
  const open = !!article;

  return (
    <div
      className={[
        "fixed inset-0 z-[60] transition",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />

      <aside
        className={[
          "absolute right-0 top-0 h-full w-full max-w-[520px] overflow-auto border-l border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.92)] backdrop-blur",
          "shadow-[-30px_0_120px_rgba(0,0,0,0.55)] transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-[18px]",
        ].join(" ")}
      >
        {article && (
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                  {article.source}
                </p>
                <h3 className="mt-2 font-serif text-[26px] leading-[1.05] text-[color:var(--ink-0)]">
                  {article.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] hover:border-[color:rgba(224,58,62,0.55)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)]">
              {article.image_url ? (
                <Image
                  src={article.image_url}
                  alt=""
                  width={900}
                  height={600}
                  className="h-[220px] w-full object-cover grayscale-[20%] contrast-[1.12] saturate-[0.82]"
                />
              ) : (
                <div className="h-[220px] w-full bg-[radial-gradient(900px_420px_at_40%_30%,rgba(224,58,62,0.18),transparent_60%),radial-gradient(700px_420px_at_72%_70%,rgba(196,127,58,0.18),transparent_55%),linear-gradient(180deg,rgba(7,10,15,0.25),rgba(7,10,15,0.85))]" />
              )}
            </div>

            <p className="mt-5 text-[15px] leading-[1.65] text-[color:var(--muted)]">{article.excerpt}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {article.entities_mentioned.slice(0, 8).map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-3 py-1 text-[12px] text-[color:var(--muted)]"
                >
                  {e}
                </span>
              ))}
            </div>

            <div className="mt-7 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">
                Note
              </p>
              <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--muted)]">
                Headlines are linked out to the original source. Store full text for retrieval/LLM use, but do not
                republish entire articles.
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--blood)] hover:underline"
              >
                Open source link
              </a>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
