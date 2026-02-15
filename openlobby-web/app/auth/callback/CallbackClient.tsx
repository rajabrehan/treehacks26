"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState<string>("Finalizing sign-in…");

  const code = useMemo(() => sp.get("code"), [sp]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!code) {
          setMsg("Missing OAuth code.");
          return;
        }
        const sb = supabaseBrowser();
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (!cancelled) router.replace("/");
      } catch (e) {
        const m = e instanceof Error ? e.message : "Sign-in failed.";
        if (!cancelled) setMsg(m);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <main className="mx-auto max-w-[980px] px-5 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Auth</p>
      <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
        Signing you in
      </h1>
      <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.65] text-[color:var(--muted)]">{msg}</p>
    </main>
  );
}

