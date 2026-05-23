// Run with: node scripts/test-connections.mjs
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim()];
    })
);

const OPENROUTER_KEY = env.OPENROUTER_API_KEY;
const SUPABASE_URL   = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON  = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SVC   = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\n🔍 Testing connections...\n");

// ── 1. OpenRouter ──────────────────────────────────────────────────────────
process.stdout.write("1. OpenRouter (google/gemini-2.0-flash-001)... ");
try {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Memeroach",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      max_tokens: 20,
      messages: [{ role: "user", content: "Reply with just: pong" }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.log(`❌ HTTP ${res.status} — ${err?.error?.message ?? "unknown error"}`);
  } else {
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    console.log(`✅ Connected — model replied: "${reply}"`);
  }
} catch (e) {
  console.log(`❌ Network error — ${e.message}`);
}

// ── 2. Supabase URL reachable ──────────────────────────────────────────────
process.stdout.write("2. Supabase URL reachable... ");
try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
    },
  });
  // Supabase returns 200 or 404 (no tables yet) — both mean the server is up
  if (res.status === 200 || res.status === 404 || res.status === 400) {
    console.log(`✅ Reachable (HTTP ${res.status})`);
  } else {
    console.log(`❌ HTTP ${res.status}`);
  }
} catch (e) {
  console.log(`❌ Network error — ${e.message}`);
}

// ── 3. Supabase — memes table exists ──────────────────────────────────────
process.stdout.write("3. Supabase memes table... ");
try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memes?limit=1`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
    },
  });
  if (res.ok) {
    console.log("✅ Table exists and is readable");
  } else {
    const body = await res.json().catch(() => ({}));
    const msg = body?.message ?? body?.hint ?? `HTTP ${res.status}`;
    if (msg.includes("does not exist") || res.status === 404) {
      console.log("⚠️  Table not found — run the SQL setup in Supabase dashboard");
    } else {
      console.log(`❌ ${msg}`);
    }
  }
} catch (e) {
  console.log(`❌ ${e.message}`);
}

// ── 4. Supabase — reactions table exists ──────────────────────────────────
process.stdout.write("4. Supabase reactions table... ");
try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reactions?limit=1`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
    },
  });
  if (res.ok) {
    console.log("✅ Table exists and is readable");
  } else {
    const body = await res.json().catch(() => ({}));
    const msg = body?.message ?? body?.hint ?? `HTTP ${res.status}`;
    if (msg.includes("does not exist") || res.status === 404) {
      console.log("⚠️  Table not found — run the SQL setup in Supabase dashboard");
    } else {
      console.log(`❌ ${msg}`);
    }
  }
} catch (e) {
  console.log(`❌ ${e.message}`);
}

// ── 5. Supabase Storage — memes bucket ────────────────────────────────────
process.stdout.write("5. Supabase Storage bucket 'memes'... ");
try {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/memes`, {
    headers: {
      "apikey": SUPABASE_SVC,
      "Authorization": `Bearer ${SUPABASE_SVC}`,
    },
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`✅ Bucket exists (public: ${data.public})`);
  } else {
    const body = await res.json().catch(() => ({}));
    console.log(`⚠️  Bucket not found — create it in Supabase → Storage → New bucket → name: memes → public ON`);
  }
} catch (e) {
  console.log(`❌ ${e.message}`);
}

console.log("\nDone.\n");
