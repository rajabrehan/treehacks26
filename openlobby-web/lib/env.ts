export function demoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

export function apiBaseUrl(): string | null {
  const v = process.env.NEXT_PUBLIC_API_URL;
  if (!v) return null;
  return v.replace(/\/+$/, "");
}

