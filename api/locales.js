const { supaAdmin } = require("../lib/supabaseAdmin");
const path = require("path");
const { readFile } = require("fs").promises;
const crypto = require("crypto");

const CACHE_TTL_MS = 60 * 1000;
const localeCache = new Map();

function isLang(x) { return x === "id" || x === "en"; }

async function loadBase(locale) {
  const p = path.join(process.cwd(), "public", "locales", `base.${locale}.json`);
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw);
}

function deepMerge(target, source) {
  const output = target && typeof target === "object" && !Array.isArray(target) ? { ...target } : {};
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function toDict(locale, rows, fallbackToID = true) {
  const dict = {};
  const ensureSectionField = (slug, field, value) => {
    if (value === undefined || value === null) return;
    if (!dict.section) dict.section = {};
    if (!dict.section[slug]) dict.section[slug] = {};
    dict.section[slug][field] = value;
  };

  for (const r of rows) {
    const idT = r.translations.find(t => t.locale === "id");
    const enT = r.translations.find(t => t.locale === "en");
    const pick = locale === "id" ? idT : enT;

    let title = pick?.title ?? null;
    if (!title && fallbackToID && idT?.title) title = idT.title;
    if (title) ensureSectionField(r.slug, "title", title);

    let body = pick?.body ?? null; // HTML allowed
    if (!body && fallbackToID && idT?.body) body = idT.body;
    if (body) ensureSectionField(r.slug, "body", body);
  }
  return dict;
}

module.exports = async (req, res) => {
  try {
    const langQ = String(req.query.lang || req.query.LANG || "").toLowerCase();
    const lang = isLang(langQ) ? langQ : "id";
    const now = Date.now();

    const cached = localeCache.get(lang);
    if (cached && cached.expires > now) {
      if (req.headers["if-none-match"] === cached.etag) return res.status(304).end();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
      res.setHeader("ETag", cached.etag);
      return res.status(200).send(cached.json);
    }

    const { data, error } = await supaAdmin
      .from("sections")
      .select("slug, translations:section_translations(locale,title,body,updated_at)")
      .order("slug");

    if (error) return res.status(500).json({ error: error.message });

    const base = await loadBase(lang);
    const dyn = toDict(lang, data || [], true);
    const combined = deepMerge(base, dyn);
    const json = JSON.stringify(combined, null, 2);

    const etag = crypto.createHash("sha1").update(json).digest("hex");
    if (req.headers["if-none-match"] === etag) return res.status(304).end();

    localeCache.set(lang, { json, etag, expires: now + CACHE_TTL_MS });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("ETag", etag);
    res.status(200).send(json);
  } catch (e) {
    res.status(500).json({ error: e?.message || "server error" });
  }
};
