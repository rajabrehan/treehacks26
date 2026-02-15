"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopBar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-[color:var(--fog)] bg-[color:rgba(7,10,15,0.72)] backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="group inline-flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--steel)]">
            OpenLobby
          </span>
          <span className="hidden font-serif text-[14px] text-[color:var(--muted)] group-hover:text-[color:var(--ink-0)] md:inline">
            Corporate Influence Tracker
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink href="/explore" active={pathname?.startsWith("/explore")}>
            Explore
          </NavLink>
          <NavLink href="/ask" active={pathname?.startsWith("/ask")}>
            Ask
          </NavLink>
          <NavLink href="/about" active={pathname?.startsWith("/about")}>
            About data
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search?q=ai%20regulation"
            className="hidden rounded-full border border-[color:var(--fog)] bg-[color:rgba(244,240,232,0.02)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:border-[color:rgba(224,58,62,0.55)] md:inline-flex"
          >
            Quick search
          </Link>
          <button
            type="button"
            className="rounded-full bg-[color:var(--ink-0)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-900)] transition hover:brightness-110"
            // Auth is wired later. For hackathon/demo, keep the affordance.
            onClick={() => alert("Auth is stubbed in demo mode. Wire Supabase to enable real accounts.")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition",
        active
          ? "bg-[color:rgba(224,58,62,0.14)] text-[color:var(--ink-0)]"
          : "text-[color:var(--muted)] hover:bg-[color:rgba(244,240,232,0.06)] hover:text-[color:var(--ink-0)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

