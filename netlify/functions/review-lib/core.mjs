// Review feed API (khabefox.com/review). Private: every route needs one of two
// secret keys. Only the SHA-256 of each key lives here, because this repo is public.
//   viewer key: read the feed, like / dislike, comment
//   poster key: everything the viewer can do, plus add posts and media
// Storage is injected so the same code runs on Netlify Blobs (production) and on a
// plain folder (local tests).
import { createHash, timingSafeEqual, randomBytes } from "node:crypto";

const VIEW_HASH = "e60aa72608568942de1c70f0e3a8cc32f5d10c1dcd9511493d73bffbf8ac2202";
const POST_HASH = "8164d4c65ac61c3e2cd201d112036a3b53806637cfe495e4944a48105c28f2a6";

export const CHUNK = 2 * 1024 * 1024; // media is stored in 2 MiB pieces (function payload limit is 6 MB)
const MAX_SPAN = 2 * CHUNK; // most bytes one ranged media response carries
const MAX_WHOLE = 18 * 1024 * 1024; // biggest file sent without a Range request
const MAX_MEDIA = 400 * 1024 * 1024;
const ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const TEXT_MAX = 4000;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex", ...headers },
  });
const fail = (status, error) => json({ error }, status);

function roleOf(token) {
  if (typeof token !== "string" || token.length < 32 || token.length > 128) return null;
  const hash = createHash("sha256").update(token).digest();
  if (timingSafeEqual(hash, Buffer.from(POST_HASH, "hex"))) return "post";
  if (timingSafeEqual(hash, Buffer.from(VIEW_HASH, "hex"))) return "view";
  return null;
}

function tokenFrom(req) {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = req.headers.get("cookie") || "";
  const hit = /(?:^|;\s*)rk=([A-Za-z0-9]+)/.exec(cookie);
  return hit ? hit[1] : null;
}

const str = (v, max = TEXT_MAX) => (typeof v === "string" ? v.slice(0, max) : "");

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

function cleanMedia(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((m) => {
    if (!m || !ID.test(m.id)) throw new Error("bad media id");
    const type = ["image", "video", "audio"].includes(m.type) ? m.type : null;
    const size = Number(m.size);
    if (!type || !(size > 0) || size > MAX_MEDIA) throw new Error("bad media");
    return {
      id: m.id,
      type,
      mime: str(m.mime, 80) || "application/octet-stream",
      size,
      w: Number(m.w) || 0,
      h: Number(m.h) || 0,
      name: str(m.name, 200),
      label: str(m.label, 200),
    };
  });
}

export function makeHandler(store) {
  async function feed(url) {
    const all = url.searchParams.get("all") === "1";
    const keys = await store.list("post/");
    let posts = (await mapLimit(keys, 16, (k) => store.getJSON(k))).filter(Boolean);
    if (!all) posts = posts.filter((p) => p.status !== "done");
    const reacts = await mapLimit(posts, 16, (p) => store.getJSON(`react/${p.id}`));
    posts.forEach((p, i) => (p.react = reacts[i] || { vote: null, choice: null, comments: [] }));
    posts.sort((a, b) => a.ts - b.ts);
    return json({ posts, now: Date.now() });
  }

  async function react(body, role) {
    if (!ID.test(body.postId || "")) return fail(400, "bad post id");
    const post = await store.getJSON(`post/${body.postId}`);
    if (!post) return fail(404, "no such post");
    const key = `react/${post.id}`;
    const r = (await store.getJSON(key)) || { vote: null, choice: null, comments: [] };
    if ("vote" in body) r.vote = body.vote === "up" || body.vote === "down" ? body.vote : null;
    if ("choice" in body) r.choice = (post.choices || []).includes(body.choice) ? body.choice : null;
    if (body.comment && str(body.comment.text).trim()) {
      if (r.comments.length >= 200) return fail(400, "too many comments");
      r.comments.push({
        id: randomBytes(6).toString("hex"),
        ts: Date.now(),
        by: role === "post" && body.comment.by === "claude" ? "claude" : "lakota",
        text: str(body.comment.text).trim(),
        slide: Number.isInteger(body.comment.slide) ? body.comment.slide : null,
      });
    }
    if (body.deleteComment) r.comments = r.comments.filter((c) => c.id !== body.deleteComment);
    r.updatedAt = Date.now();
    await store.setJSON(key, r);
    return json({ react: r });
  }

  async function addPost(body) {
    const id = body.id || `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
    if (!ID.test(id)) return fail(400, "bad post id");
    let media;
    try {
      media = cleanMedia(body.media);
    } catch (e) {
      return fail(400, e.message);
    }
    for (const m of media) {
      const last = Math.ceil(m.size / CHUNK) - 1;
      if (!(await store.has(`media/${m.id}/${last}`))) return fail(400, `media ${m.id} is not fully uploaded`);
      await store.setJSON(`media/${m.id}/meta`, { mime: m.mime, size: m.size });
    }
    const old = await store.getJSON(`post/${id}`);
    const post = {
      id,
      // A backdated ts lets old, still unanswered items sit below newer ones.
      ts: old ? old.ts : Number(body.ts) > 0 ? Math.min(Number(body.ts), Date.now()) : Date.now(),
      project: str(body.project, 60) || "OTHER",
      session: str(body.session, 80),
      group: str(body.group, 80),
      title: str(body.title, 200),
      caption: str(body.caption),
      media,
      choices: Array.isArray(body.choices) ? body.choices.slice(0, 8).map((c) => str(c, 40)).filter(Boolean) : [],
      pixel: !!body.pixel,
      status: "open",
    };
    await store.setJSON(`post/${id}`, post);
    return json({ post });
  }

  async function setStatus(body) {
    if (!ID.test(body.postId || "")) return fail(400, "bad post id");
    const post = await store.getJSON(`post/${body.postId}`);
    if (!post) return fail(404, "no such post");
    post.status = body.status === "open" ? "open" : "done";
    await store.setJSON(`post/${post.id}`, post);
    return json({ post });
  }

  async function removePost(body) {
    if (!ID.test(body.postId || "")) return fail(400, "bad post id");
    const post = await store.getJSON(`post/${body.postId}`);
    if (!post) return fail(404, "no such post");
    for (const m of post.media || []) {
      for (const k of await store.list(`media/${m.id}/`)) await store.del(k);
    }
    await store.del(`react/${post.id}`);
    await store.del(`post/${post.id}`);
    return json({ ok: true });
  }

  async function putChunk(req, mediaId, n) {
    if (!ID.test(mediaId) || !/^\d{1,4}$/.test(n)) return fail(400, "bad media path");
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length || bytes.length > CHUNK) return fail(400, "bad chunk size");
    await store.setBytes(`media/${mediaId}/${Number(n)}`, bytes);
    return json({ ok: true, bytes: bytes.length });
  }

  async function readRange(mediaId, start, end) {
    const out = new Uint8Array(end - start + 1);
    for (let c = Math.floor(start / CHUNK); c <= Math.floor(end / CHUNK); c++) {
      const piece = await store.getBytes(`media/${mediaId}/${c}`);
      if (!piece) throw new Error("missing chunk");
      const from = Math.max(start, c * CHUNK);
      const to = Math.min(end, c * CHUNK + piece.length - 1);
      out.set(piece.subarray(from - c * CHUNK, to - c * CHUNK + 1), from - start);
    }
    return out;
  }

  async function getMedia(req, mediaId) {
    if (!ID.test(mediaId)) return fail(400, "bad media id");
    const meta = await store.getJSON(`media/${mediaId}/meta`);
    if (!meta) return fail(404, "no such media");
    const size = meta.size;
    const base = {
      "content-type": meta.mime,
      "accept-ranges": "bytes",
      "cache-control": "private, max-age=31536000, immutable",
      "x-robots-tag": "noindex",
      "x-content-type-options": "nosniff",
    };
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
    if (range && (range[1] || range[2])) {
      let start, end;
      if (range[1] === "") {
        start = Math.max(0, size - Number(range[2]));
        end = size - 1;
      } else {
        start = Number(range[1]);
        end = range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
      }
      if (start >= size || start > end) {
        return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
      }
      end = Math.min(end, start + MAX_SPAN - 1);
      const bytes = await readRange(mediaId, start, end);
      return new Response(bytes, {
        status: 206,
        headers: { ...base, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(bytes.length) },
      });
    }
    if (size > MAX_WHOLE) return fail(416, "ask for a byte range");
    const count = Math.ceil(size / CHUNK);
    let c = 0;
    const body = new ReadableStream({
      async pull(ctrl) {
        if (c >= count) return ctrl.close();
        const piece = await store.getBytes(`media/${mediaId}/${c++}`);
        if (!piece) return ctrl.error(new Error("missing chunk"));
        ctrl.enqueue(piece);
      },
    });
    return new Response(body, { status: 200, headers: { ...base, "content-length": String(size) } });
  }

  return async function handle(req) {
    const url = new URL(req.url);
    const at = url.pathname.indexOf("/review-api/");
    const parts = at < 0 ? [] : url.pathname.slice(at + 12).split("/").filter(Boolean);
    const route = parts[0] || "";
    const method = req.method;

    try {
      if (route === "auth" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const role = roleOf(body.k);
        if (!role) return fail(401, "locked");
        return json({ ok: true, role }, 200, {
          "set-cookie": `rk=${body.k}; Path=/review-api; Max-Age=34560000; Secure; HttpOnly; SameSite=Strict`,
        });
      }

      const role = roleOf(tokenFrom(req));
      if (!role) return fail(401, "locked");
      const poster = role === "post";

      if (route === "feed" && method === "GET") return await feed(url);
      if (route === "media" && method === "GET" && parts.length === 2) return await getMedia(req, parts[1]);
      if (route === "media" && method === "PUT" && parts.length === 3) {
        return poster ? await putChunk(req, parts[1], parts[2]) : fail(403, "poster only");
      }
      if (method === "POST") {
        const body = await req.json().catch(() => null);
        if (!body || typeof body !== "object") return fail(400, "bad body");
        if (route === "react") return await react(body, role);
        if (!poster) return fail(403, "poster only");
        if (route === "post") return await addPost(body);
        if (route === "done") return await setStatus(body);
        if (route === "delete") return await removePost(body);
      }
      return fail(404, "no such route");
    } catch (e) {
      console.error("review-api", route, e);
      return fail(500, "server error");
    }
  };
}
