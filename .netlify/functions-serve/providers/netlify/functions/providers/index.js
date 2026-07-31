var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/providers/index.js
var index_exports = {};
__export(index_exports, {
  getProvider: () => getProvider
});
module.exports = __toCommonJS(index_exports);

// netlify/functions/providers/plantnet.js
var plantnet_exports = {};
__export(plantnet_exports, {
  identify: () => identify
});
var API_HOST = "https://my-api.plantnet.org";
var VALID_ORGANS = /* @__PURE__ */ new Set(["auto", "leaf", "flower", "fruit", "bark"]);
async function identify({ images, project, lang, noReject, nbResults, apiKey }) {
  const form = new FormData();
  for (const { data: data2, organ } of images) {
    const buf = Buffer.from(data2, "base64");
    const blob = new Blob([buf], { type: "image/jpeg" });
    form.append("images", blob, "photo.jpg");
    form.append("organs", VALID_ORGANS.has(organ) ? organ : "auto");
  }
  const qs = new URLSearchParams({
    "api-key": apiKey,
    lang: lang || "en",
    "nb-results": String(nbResults || 10),
    "no-reject": String(!!noReject),
    "include-related-images": "false"
  });
  const url = `${API_HOST}/v2/identify/${encodeURIComponent(project || "all")}?${qs}`;
  let res;
  try {
    res = await fetch(url, { method: "POST", body: form });
  } catch (e) {
    throw providerError(502, "UPSTREAM", "Could not reach the identification service.");
  }
  const remaining = numOrNull(res.headers.get("x-remaining-requests"));
  if (res.status === 404) {
    throw providerError(404, "NOT_A_PLANT", "That didn't look like a plant.", remaining);
  }
  if (res.status === 401 || res.status === 403) {
    throw providerError(502, "UNAUTHORIZED", "The identification service rejected the API key.");
  }
  if (res.status === 429) {
    throw providerError(429, "RATE_LIMITED", "Today's identification quota is used up.", remaining);
  }
  if (res.status === 413) {
    throw providerError(413, "PAYLOAD_TOO_LARGE", "Those photos were too large.");
  }
  if (!res.ok) {
    throw providerError(502, "UPSTREAM", "The identification service returned an error.");
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw providerError(502, "UPSTREAM", "The identification service returned an unreadable response.");
  }
  return normalize(data);
}
function normalize(d) {
  const results = (d.results || []).map((r) => {
    const sp = r.species || {};
    const scientificName = sp.scientificNameWithoutAuthor || sp.scientificName || "Unknown";
    const commonNames = Array.isArray(sp.commonNames) ? sp.commonNames : [];
    const gbifId = r.gbif && r.gbif.id != null ? String(r.gbif.id) : null;
    return {
      score: typeof r.score === "number" ? r.score : 0,
      scientificName,
      commonName: commonNames[0] || null,
      commonNames,
      genus: sp.genus && sp.genus.scientificNameWithoutAuthor || null,
      family: sp.family && sp.family.scientificNameWithoutAuthor || null,
      gbifId,
      links: buildLinks(scientificName, gbifId)
    };
  });
  return {
    ok: true,
    bestMatch: d.bestMatch || results[0] && results[0].scientificName || null,
    remaining: numOrNull(d.remainingIdentificationRequests),
    results
  };
}
function buildLinks(scientificName, gbifId) {
  const q = encodeURIComponent(scientificName);
  return {
    gbif: gbifId ? `https://www.gbif.org/species/${gbifId}` : `https://www.gbif.org/species/search?q=${q}`,
    wikipedia: `https://en.wikipedia.org/wiki/${scientificName.replace(/ /g, "_")}`,
    inaturalist: `https://www.inaturalist.org/search?q=${q}`
  };
}
function numOrNull(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function providerError(status, code, message, remaining) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  if (remaining != null) e.remaining = remaining;
  return e;
}

// netlify/functions/providers/index.js
var PROVIDERS = {
  plantnet: plantnet_exports
};
function getProvider(name) {
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Unknown provider: ${name}`);
  return p;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getProvider
});
//# sourceMappingURL=index.js.map
