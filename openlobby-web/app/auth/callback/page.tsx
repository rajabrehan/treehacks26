import { Suspense } from "react";
import { CallbackClient } from "@/app/auth/callback/CallbackClient";

export default function AuthCallbackPage() {
  return (
    <div className="ol-mesh ol-grain min-h-dvh">
      <Suspense fallback={<div />}>
        <CallbackClient />
      </Suspense>
    </div>
  );
}

