import { getSurveySnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TICK_MS = 800;
const MAX_MS = 20_000;

/**
 * Empurra mudanças de situação ou de perguntas. A conexão fecha em 20s para
 * não estourar o limite da Vercel; o navegador reconecta sozinho.
 */
export async function GET() {
  const encoder = new TextEncoder();
  let last = "";
  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      function send(payload: unknown) {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      }

      async function tick() {
        if (closed) return;
        const snapshot = await getSurveySnapshot();
        const stamp = `${snapshot.status}:${snapshot.revision}`;
        if (stamp !== last) {
          last = stamp;
          send(snapshot);
        }
      }

      void tick();
      interval = setInterval(() => void tick(), TICK_MS);
      timeout = setTimeout(() => {
        if (interval) clearInterval(interval);
        if (!closed) {
          closed = true;
          controller.close();
        }
      }, MAX_MS);
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
