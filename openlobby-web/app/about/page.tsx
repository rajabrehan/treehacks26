import { TopBar } from "@/components/landing/TopBar";

export default function AboutPage() {
  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-[980px] px-5 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">About data</p>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.0] tracking-[-0.02em] text-[color:var(--ink-0)] md:text-[52px]">
          What OpenLobby uses.
        </h1>
        <p className="mt-4 text-[15px] leading-[1.75] text-[color:var(--muted)]">
          OpenLobby is designed for live ingestion and derived search. The data pipeline ingests from:
        </p>

        <div className="mt-8 grid gap-4">
          <Section title="FEC (campaign finance)">
            Contributions, committee summaries, independent expenditures. Used to map money flow into candidates,
            committees, and PACs.
          </Section>
          <Section title="Senate LDA (lobbying disclosures)">
            LD-1 registrations and LD-2 activity filings. Used to tie issues, clients, and registrants to specific time
            windows.
          </Section>
          <Section title="SEC EDGAR (corporate filings)">
            Proxy statements and filings that provide executive compensation and governance signals.
          </Section>
          <Section title="News (curated / scraped)">
            Headlines are used as narrative glue: what happened, when, and which entities are mentioned.
          </Section>
        </div>

        <div className="mt-10 rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-2)]">Important</p>
          <p className="mt-3 text-[14px] leading-[1.75] text-[color:var(--muted)]">
            Always link out to sources and avoid republishing full articles. For reliability, consider proxying and
            caching images and text in Supabase Storage/DB after you confirm rights and terms.
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[calc(var(--radius)+10px)] border border-[color:var(--fog)] bg-[color:var(--card)] p-6 shadow-[0_22px_70px_var(--shadow)]">
      <h2 className="font-serif text-[22px] leading-[1.2] text-[color:var(--ink-0)]">{title}</h2>
      <p className="mt-3 text-[14px] leading-[1.75] text-[color:var(--muted)]">{children}</p>
    </div>
  );
}
