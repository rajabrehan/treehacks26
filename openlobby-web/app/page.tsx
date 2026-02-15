import { DEMO_CASES, DEMO_NEWS } from "@/lib/demo-data";
import { LandingClient } from "@/components/landing/LandingClient";

export default function Home() {
  return <LandingClient news={DEMO_NEWS} cases={DEMO_CASES} />;
}

