-- ============================================================
-- Memeroach — Supabase setup
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. Tables ────────────────────────────────────────────────

create table if not exists memes (
  id             text primary key,
  image_path     text not null,
  image_url      text not null,
  template_id    text not null,
  layers         jsonb,
  creator_token  text not null,
  created_at     timestamptz default now()
);

create table if not exists reactions (
  id          bigserial primary key,
  meme_id     text not null references memes(id) on delete cascade,
  emoji       text not null,
  ip_hash     text not null,
  created_at  timestamptz default now()
);

create index if not exists reactions_meme_id_idx on reactions(meme_id);

-- ── 2. Row-level security ─────────────────────────────────────

alter table memes     enable row level security;
alter table reactions enable row level security;

-- memes: anyone can read; only the server (service role) can write
create policy "Public read memes"
  on memes for select
  to anon, authenticated
  using (true);

-- reactions: anyone can read and insert; service role handles rate-limit
create policy "Public read reactions"
  on reactions for select
  to anon, authenticated
  using (true);

create policy "Public insert reactions"
  on reactions for insert
  to anon, authenticated
  with check (true);

-- ── 3. Realtime ───────────────────────────────────────────────
-- Enable Realtime on the reactions table so the creator panel
-- receives live updates without polling.
--
-- In the Supabase dashboard:
--   Database → Replication → Tables → toggle ON for "reactions"
--
-- Or run (skip if you get "already member" error — it means it's already enabled):
-- alter publication supabase_realtime add table reactions;

-- ── 4. Storage bucket ─────────────────────────────────────────
-- Storage buckets can't be created via SQL. Do this in the dashboard:
--
--   Storage → New bucket
--     Name:   memes
--     Public: YES  ← critical — this makes image URLs accessible
--
-- Then add a storage policy:
--   Storage → memes bucket → Policies → New policy
--     Allowed operation: SELECT
--     Policy name: "Public read memes bucket"
--     Target roles: anon, authenticated
--     USING expression: true
--
-- The INSERT policy is handled by the service role key used in
-- /api/memes/route.ts — no extra policy needed for uploads.
