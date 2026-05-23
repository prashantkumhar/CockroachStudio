# Memeroach 

A meme maker that doesn't suck. Like a cockroach, a good meme survives everything and spreads everywhere. Upload a photo, get six AI-generated meme ideas tailored to what's actually in the picture, edit one on a tactile canvas, share it with a link, and watch the reactions roll in live.

Built for [Magicthon](https://magicthon.live) — one build day, one prototype, ship it live.

> Status: **planning**. The brief is in [`idea.md`](./idea.md), the build plan is in [`plan.md`](./plan.md). Code has not been scaffolded yet.

---

## The loop

```
Upload → Suggest → Pick → Edit → Share → React
```

1. **Upload** — drag, paste, or snap a photo
2. **Suggest** — a vision LLM reads the image and returns six meme ideas, each a different format, written for what's actually in the picture
3. **Pick** — six live previews built from the user's real photo
4. **Edit** — canvas editor with draggable text, outline, shadow, line wrap
5. **Share** — export PNG or send a no-signup shareable link
6. **React** — anyone with the link can react, creator watches reactions land live

---

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind + shadcn/ui |
| Canvas | react-konva |
| Vision LLM | Gemini 2.0 Flash via OpenRouter (structured JSON output, fast + cheap) |
| State | zustand (single-page state machine) |
| DB + Storage + Realtime | Supabase |
| Deploy | Vercel |

See [`plan.md`](./plan.md) for the architectural decisions and why these choices.

---

## Architecture at a glance

```
Browser (single-page state machine)
  ├─ Upload zone
  ├─ 6 live previews   ← LLM returns templateId + captions
  ├─ Konva editor      ← shared renderer with previews
  └─ Export PNG → /m/[id]

Next.js API
  ├─ /api/suggest             POST image → Gemini 2.0 Flash → 6 structured ideas
  ├─ /api/memes               POST finalized meme → Supabase
  └─ /api/memes/[id]/react    POST reaction → Supabase

Supabase
  ├─ Storage: uploads + exported PNGs
  ├─ memes table: id, image_path, template_id, layers, creator_token
  └─ reactions table: meme_id, emoji, ip_hash + Realtime channel
```

The same renderer powers the six preview thumbnails *and* the final PNG export — no "preview looks different from export" bugs. The LLM returns structure (`templateId` + caption strings), never pixels.

---

## Templates

Seven photo-native layouts that work on any uploaded image — no stock-image dependencies.

1. `top-bottom` — classic Impact, top + bottom caption
2. `bottom-only` — wholesome-meme style, single caption beneath
3. `pov` — "POV: ..." caption framing the photo
4. `when-you` — "when you..." subtitle, photo as the reaction
5. `caption-above` — modern Tumblr/Twitter style: text block above photo
6. `panel-zoom` — 3-panel progressive zoom on the photo, escalating captions
7. `nobody-nobody` — Reddit format: Nobody: / Absolutely nobody: / punchline

---

## Getting started

> Once the project is scaffolded, the standard Next.js commands will apply.

```bash
# install
npm install

# dev
npm run dev

# build
npm run build
```

### Environment variables

Create `.env.local` with:

```
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.0-flash-001   # optional override
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=                          # optional, for OG links
```

See [`.env.example`](./.env.example). Production logs are JSON on the server — search Vercel logs by scope (`api.suggest`, `llm.openrouter`, etc.).

### Supabase setup

Run [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase project's SQL Editor.
It creates both tables, RLS policies, and Realtime setup.
Then create a **public** Storage bucket named `memes` (see comments in that file).

---

## Project structure (planned)

```
app/
  page.tsx                 # entire creator flow as a state machine
  m/[id]/page.tsx          # public meme + reactions
  api/
    suggest/route.ts
    memes/route.ts
    memes/[id]/react/route.ts
components/
  UploadZone.tsx
  MemePreview.tsx
  MemeEditor.tsx
  ReactionBar.tsx
  CreatorReactionPanel.tsx
lib/
  templates/               # the 6 photo-native recipes
  renderMeme.ts            # shared renderer: previews + export
  gemini.ts                # Google Generative AI client + Zod schema
  supabase/                # server + browser clients
  store.ts                 # zustand creator-flow state
```

---

## Scope discipline

The build is split into **essentials** and **extras**. Essentials are exactly the brief's non-negotiables — that's the floor. Extras (clipboard paste, webcam, remix link, animated reactions, OG unfurl, sticker layer, etc.) only start when the core loop is shipped, deployed, and tested on a real phone.

See [`plan.md`](./plan.md) for the full phase breakdown and the ranked extras table.

---

## Docs

- [`idea.md`](./idea.md) — the original Magicthon brief
- [`plan.md`](./plan.md) — stack decisions, architecture, phases, extras
