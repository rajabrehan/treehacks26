import type { CaseFile, DemoAskExample, DemoSearchResult, NewsItem } from "@/lib/types";

// Importing JSON (instead of fetching from /public) keeps demo mode offline
// from a data perspective. The browser will still request image assets.
import newsJson from "../public/demo/news.json";
import casesJson from "../public/demo/cases.json";
import searchResultsJson from "../public/demo/search_results.json";
import askExamplesJson from "../public/demo/ask_examples.json";

export const DEMO_NEWS = newsJson as unknown as NewsItem[];
export const DEMO_CASES = casesJson as unknown as CaseFile[];
export const DEMO_SEARCH_RESULTS = searchResultsJson as unknown as DemoSearchResult[];
export const DEMO_ASK_EXAMPLES = askExamplesJson as unknown as DemoAskExample[];

export function getCaseById(id: string): CaseFile | undefined {
  return DEMO_CASES.find((c) => c.id === id);
}

export function getNewsByIds(ids: string[]): NewsItem[] {
  const set = new Set(ids);
  return DEMO_NEWS.filter((n) => set.has(n.id));
}
