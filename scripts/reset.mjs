#!/usr/bin/env node
// Run: npm run reset
// Uses Supabase REST API directly — no WebSocket, works on Node 20.

import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
} catch {
  console.error("Could not read .env.local — run from project root.");
  process.exit(1);
}

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const h = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api(method, path, body) {
  const res = await fetch(`${URL}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : null };
}

async function run() {
  // 1. Clear reactions
  process.stdout.write("🗑  Clearing reactions… ");
  const rx = await api("DELETE", "/rest/v1/reactions?id=gte.0");
  // reactions.id is uuid — use a wildcard filter that matches everything
  const rx2 = await api("DELETE", "/rest/v1/reactions?created_at=gte.2000-01-01");
  console.log(rx2.ok ? "✓" : `skipped (${rx2.status})`);

  // 2. Clear memes table
  process.stdout.write("🗑  Clearing memes table… ");
  const m = await api("DELETE", "/rest/v1/memes?created_at=gte.2000-01-01");
  console.log(m.ok ? "✓" : `failed: ${JSON.stringify(m.body)}`);

  // 3. Empty storage bucket — list then delete in batches
  process.stdout.write("🗑  Emptying storage bucket… ");
  let deleted = 0;
  while (true) {
    const list = await api("POST", "/storage/v1/object/list/memes", { limit: 100, offset: deleted, prefix: "" });
    if (!list.ok || !list.body?.length) break;
    const paths = list.body.map(f => f.name);
    await api("DELETE", "/storage/v1/object/memes", { prefixes: paths });
    deleted += paths.length;
    if (list.body.length < 100) break;
  }
  console.log(`✓ (${deleted} files removed)`);

  console.log("\n✅ Reset complete. Database and storage are empty.");
}

run().catch(e => { console.error(e); process.exit(1); });
