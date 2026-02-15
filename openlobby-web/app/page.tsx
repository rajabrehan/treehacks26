import { LandingClient } from "@/components/landing/LandingClient";
import { fetchCases, fetchTopNews } from "@/lib/api";
import type { CaseFile, NewsItem } from "@/lib/types";

export default async function Home() {
  let news: NewsItem[] = [];
  let cases: CaseFile[] = [];
  let errorMessage: string | null = null;
  try {
    [news, cases] = await Promise.all([fetchTopNews(60), fetchCases(10)]);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load live data.";
  }
  return <LandingClient news={news} cases={cases} errorMessage={errorMessage} />;
}
