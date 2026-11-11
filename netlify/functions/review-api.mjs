// khabefox.com/review — the private review feed's API. Logic lives in review-lib/core.mjs;
// this file only plugs in Netlify Blobs as the storage (site-wide, survives deploys).
import { getStore } from "@netlify/blobs";
import { makeHandler } from "./review-lib/core.mjs";

let handler;

export default async (req) => {
  if (!handler) {
    const blobs = getStore({ name: "review-feed", consistency: "strong" });
    handler = makeHandler({
      getJSON: (key) => blobs.get(key, { type: "json" }),
      getBytes: async (key) => {
        const buf = await blobs.get(key, { type: "arrayBuffer" });
        return buf ? new Uint8Array(buf) : null;
      },
      setJSON: (key, value) => blobs.setJSON(key, value),
      setBytes: (key, bytes) => blobs.set(key, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
      has: async (key) => (await blobs.getMetadata(key)) !== null,
      del: (key) => blobs.delete(key),
      list: async (prefix) => (await blobs.list({ prefix })).blobs.map((b) => b.key),
    });
  }
  return handler(req);
};

export const config = { path: "/review-api/*" };
