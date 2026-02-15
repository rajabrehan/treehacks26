"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase";

export function TopBar() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  const supabaseReady = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  useEffect(() => {
    if (!supabaseReady) return;
    let sb: ReturnType<typeof supabaseBrowser> | null = null;
    try {
      sb = supabaseBrowser();
    } catch {
      return;
    }
    sb.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabaseReady]);

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
          <NavLink href="/cases" active={pathname?.startsWith("/cases")}>
            Cases
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
            onClick={async () => {
              try {
                const sb = supabaseBrowser();
                if (session) {
                  await sb.auth.signOut();
                  return;
                }
                const redirectTo = `${window.location.origin}/auth/callback`;
                const { error } = await sb.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo },
                });
                if (error) throw error;
              } catch (e) {
                const m = e instanceof Error ? e.message : "Auth failed.";
                alert(m);
              }
            }}
          >
            {session ? "Sign out" : "Sign in"}
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
