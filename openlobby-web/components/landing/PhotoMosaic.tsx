"use client";

import Image from "next/image";
import { useMemo } from "react";

export function PhotoMosaic({ images }: { images: string[] }) {
  const tiles = useMemo(() => images.slice(0, 24), [images]);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-[calc(var(--radius)+8px)] md:h-full">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,15,0.15),rgba(7,10,15,0.88))]" />
      <div className="absolute inset-0 grid grid-cols-6 gap-2 p-3 opacity-95 md:gap-3 md:p-4">
        {tiles.map((src, idx) => (
          <div
            key={`${src}:${idx}`}
            className={[
              "relative overflow-hidden rounded-[14px] border border-[color:rgba(244,240,232,0.10)]",
              "shadow-[0_18px_55px_rgba(0,0,0,0.42)]",
              idx % 7 === 0 ? "col-span-3 row-span-2" : idx % 5 === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
            ].join(" ")}
            style={{
              transform: `translateY(${(idx % 6) * 1.2}px) rotate(${(idx % 4) - 2}deg)`,
              animation: `ol-drift ${14 + (idx % 8)}s ease-in-out ${idx * 0.12}s infinite alternate`,
            }}
          >
            <Image
              src={src}
              alt=""
              width={900}
              height={600}
              className="h-full w-full object-cover grayscale-[20%] contrast-[1.12] saturate-[0.82]"
              priority={idx < 6}
            />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(224,58,62,0.16),transparent_40%),linear-gradient(300deg,rgba(196,127,58,0.14),transparent_45%)] mix-blend-overlay" />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_420px_at_40%_30%,rgba(224,58,62,0.18),transparent_60%),radial-gradient(700px_420px_at_72%_70%,rgba(196,127,58,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-[color:rgba(244,240,232,0.08)]" />
      <style jsx>{`
        @keyframes ol-drift {
          from {
            transform: translateY(0px) rotate(0deg);
            filter: brightness(0.95);
          }
          to {
            transform: translateY(-10px) rotate(0.6deg);
            filter: brightness(1.03);
          }
        }
      `}</style>
    </div>
  );
}

