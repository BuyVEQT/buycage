// Emits a JSON-LD <script> into the server-rendered HTML. Rendered from server
// page components (page.tsx) so crawlers, link-preview bots, and AI answer
// engines get machine-readable fund facts even while the visible page bodies
// are still client-rendered (the ssr:false bodies are PR 2's problem).

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json | Json[] }) {
  return (
    <script
      type="application/ld+json"
      // schema.org payloads are static, builder-produced objects — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
