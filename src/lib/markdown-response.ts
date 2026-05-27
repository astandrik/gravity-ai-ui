export function markdownResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
