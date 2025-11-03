const { supaAdmin } = require("../../../lib/supabaseAdmin");
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

async function parseJsonBody(req) {
  if (req.body) {
    if (typeof req.body === "string") {
      const trimmed = req.body.trim();
      if (!trimmed) return {};
      return JSON.parse(trimmed);
    }
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    if (chunk) chunks.push(chunk);
  }

  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || token !== ADMIN_API_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    let payload;
    try {
      payload = await parseJsonBody(req);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const { slug, id, en } = payload || {};
    if (!slug || typeof slug !== "string") return res.status(400).json({ error: "Invalid slug" });

    const { data: up, error: upErr } = await supaAdmin
      .from("sections")
      .upsert({ slug })
      .select("id")
      .single();
    if (upErr) return res.status(500).json({ error: upErr.message });

    const section_id = up.id;
    const rows = [];
    if (id) rows.push({ section_id, locale: "id", title: id.title ?? null, body: id.body ?? null, updated_at: new Date().toISOString() });
    if (en) rows.push({ section_id, locale: "en", title: en.title ?? null, body: en.body ?? null, updated_at: new Date().toISOString() });

    if (rows.length) {
      const { error: tErr } = await supaAdmin
        .from("section_translations")
        .upsert(rows, { onConflict: "section_id,locale" });
      if (tErr) return res.status(500).json({ error: tErr.message });
    }

    return res.json({ ok: true, section_id });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "server error" });
  }
};
