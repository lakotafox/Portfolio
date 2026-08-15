// Password gate for /PUDDL3P4RTS/* only — the rest of lakotafox.com stays
// public. The library's own netlify.app URL has the same gate on its side;
// this one exists because Netlify proxy rewrites bypass the target site's
// edge functions. Password: P4RTS_PASSWORD env var (site settings).
export default async (request: Request, context: any) => {
  const expected = Deno.env.get("P4RTS_PASSWORD") ?? "puddl3";
  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const [, pass] = atob(auth.slice(6)).split(":");
      if (pass === expected) return context.next();
    } catch { /* fall through */ }
  }
  return new Response("PUDDL3 P4RTS — founders only", {
    status: 401,
    headers: { "www-authenticate": 'Basic realm="PUDDL3 P4RTS"' },
  });
};
export const config = { path: "/PUDDL3P4RTS/*" };
