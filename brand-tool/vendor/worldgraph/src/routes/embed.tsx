import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// three.js must not run during SSR, so the embed view is lazy-loaded behind ClientOnly like the globe.
const EmbedView = lazy(() => import("@/embed/EmbedView"));

export const Route = createFileRoute("/embed")({
  head: () => ({ meta: [{ title: "World Graph embed — Aurelius" }] }),
  component: () => (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <EmbedView />
      </Suspense>
    </ClientOnly>
  ),
});
