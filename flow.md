# Memeroach — App Flow

How data and control move through the codebase, screen by screen.

---

## State machine (the single source of truth)

`lib/store.ts` — zustand store lives on `/`. Every screen reads from it.

```
Phase transitions:
  upload → suggesting → picking → editing → exporting → shared
```

| Phase | What triggered it | What renders |
|---|---|---|
| `upload` | initial / reset | `UploadZone` |
| `suggesting` | `store.setImage(dataUrl)` | `LoadingScreen` + API call fires |
| `picking` | `store.setSuggestions(data)` | `PickScreen` |
| `editing` | `store.selectSuggestion(i)` | `MemeEditor` (Konva) |
| `exporting` | share button clicked | export + upload flow |
| `shared` | `store.setShared(id, token)` | share confirmation + link |

Store shape:
```ts
phase          Phase
imageDataUrl   string | null       // user's photo as base64 dataUrl
suggestions    Suggestion[]        // 6 items from Gemini
selectedIndex  number              // which suggestion was picked
layers         TextLayer[]         // editable text state for Konva
creatorToken   string | null       // for identifying creator on /m/[id]
sharedMemeId   string | null       // nanoid after successful share
```

---

## Screen 1 — Upload (`phase: "upload"`)

```
User                     UploadZone.tsx              lib/store.ts
 │                            │                           │
 │  drop / select file        │                           │
 │ ─────────────────────────► │                           │
 │                            │  FileReader.readAsDataURL │
 │                            │  ──────────────────────► │
 │                            │                           │  setImage(dataUrl)
 │                            │                           │  phase → "suggesting"
```

Key file: `components/UploadZone.tsx`
- Accepts drag-drop, click-to-pick, `<input capture="environment">` for mobile camera
- Validates type (JPG/PNG/WEBP/GIF) and size (≤10MB)
- Calls `store.setImage(dataUrl)` → phase flips to `suggesting`

---

## Screen 2 — Suggesting (`phase: "suggesting"`)

```
app/page.tsx (useEffect)    /api/suggest/route.ts       lib/llm.ts
 │                               │                           │
 │  POST { imageBase64, mime }   │                           │
 │ ────────────────────────────► │                           │
 │                               │  getSuggestions(img)      │
 │                               │ ─────────────────────────►│
 │                               │                           │  Gemini 2.0 Flash
 │                               │                           │  via OpenRouter
 │                               │                           │  ← system prompt
 │                               │                           │    (from meme-themes.ts)
 │                               │                           │  ← image (base64)
 │                               │  { suggestions: [...] }   │
 │ ◄──────────────────────────── │ ◄─────────────────────────│
 │  store.setSuggestions(data)   │
 │  phase → "picking"            │
```

While waiting: `LoadingScreen` shows skeleton cards + rotating funny messages.

Key files:
- `app/page.tsx` — fires fetch on phase change, calls `store.setSuggestions` on response
- `app/api/suggest/route.ts` — server-side proxy (keeps OPENROUTER_API_KEY server-only)
- `lib/llm.ts` — builds system prompt from `lib/meme-themes.ts`, calls Gemini via OpenRouter, validates with Zod
- `lib/meme-themes.ts` — 34 cultural themes injected into the system prompt
- `components/LoadingScreen.tsx` — skeleton UI during the wait

---

## Screen 3 — Pick (`phase: "picking"`)

```
PickScreen.tsx              MemePreview.tsx             lib/renderMeme.ts
 │                               │                           │
 │  for each suggestion (×6)     │                           │
 │ ────────────────────────────► │                           │
 │                               │  renderMeme(canvas, cfg)  │
 │                               │ ─────────────────────────►│
 │                               │                           │  load image
 │                               │                           │  draw layout
 │                               │                           │  draw text slots
 │                               │ ◄─────────────────────────│
 │                               │  canvas updated            │
 │
 │  user taps a card
 │  store.selectSuggestion(i)
 │  phase → "editing"
```

Key files:
- `components/PickScreen.tsx` — 2-col (mobile) / 3-col (desktop) grid of preview cards
- `components/MemePreview.tsx` — renders one canvas preview using `renderMeme`
- `lib/renderMeme.ts` — draws image + text slots onto HTMLCanvasElement
- `lib/templates/index.ts` — layout blueprints (slot positions, fonts, image fit)

---

## Screen 4 — Edit (`phase: "editing"`) — TODO

```
MemeEditor.tsx (Konva)      lib/renderMeme.ts
 │
 │  Konva Stage with:
 │   - user photo as background Image node
 │   - text nodes for each slot (draggable)
 │   - inline edit on double-tap
 │   - font picker (2-3 meme fonts)
 │   - template switcher (re-renders layout, keeps text)
 │
 │  store.setLayers(layers)     ← synced to zustand on change
 │  store.updateLayer(id, diff) ← per-keystroke updates
```

---

## Screen 5 — Export + Share (`phase: "exporting" → "shared"`)

```
MemeEditor.tsx         /api/memes/route.ts        Supabase
 │                          │                         │
 │  stage.toDataURL()       │                         │
 │  (PNG blob)              │                         │
 │                          │                         │
 │  POST { png, meta }      │                         │
 │ ────────────────────────►│                         │
 │                          │  upload to Storage      │
 │                          │ ───────────────────────►│ memes bucket
 │                          │  insert memes row       │
 │                          │ ───────────────────────►│ memes table
 │                          │  { id, creatorToken }   │
 │ ◄────────────────────────│                         │
 │  store.setShared(id, token)
 │  phase → "shared"
 │  → navigate to /m/{id}
```

---

## Share page — `/m/[id]`

```
/m/[id]/page.tsx (Server)   Supabase                  Realtime
 │                               │                         │
 │  load meme by id              │                         │
 │ ─────────────────────────────►│                         │
 │  { image_url, layers }        │                         │
 │ ◄─────────────────────────────│                         │
 │
 │  render meme image
 │  render ReactionBar (😂 💀 🔥)
 │
 │  if localStorage.creatorToken === memes.creator_token:
 │    mount CreatorReactionPanel
 │    subscribe to reactions channel (meme_id)
 │    ◄──────────────────────────────────────────────── live events
```

---

## Renderer invariant

`lib/renderMeme.ts` is the **only place** that draws memes. Used in two contexts:

| Context | Where called | What happens |
|---|---|---|
| Preview thumbnail | `MemePreview.tsx` (pick screen) | Renders at template's native resolution, displayed via CSS |
| Final PNG export | `MemeEditor.tsx` (after editing) | Same call, full resolution, `canvas.toDataURL()` for download |

Never duplicate render logic. LLM returns `{ templateId, texts[] }` only.

---

## Cultural intelligence pipeline

```
lib/meme-themes.ts
  └─ buildCulturalContext()
       └─ lib/llm.ts (system prompt builder)
            └─ /api/suggest (called on each upload)
                 └─ Gemini 2.0 Flash via OpenRouter reads the photo
                      └─ picks themes + templates from the library
                           └─ returns 6 { templateId, texts[], tone }
```

Adding a new theme = add one object to `memeThemes[]` in `lib/meme-themes.ts`. The prompt updates automatically on the next request.

---

## File map

```
app/
  page.tsx                    State machine orchestrator — renders phase-appropriate screen
  layout.tsx                  Fonts, dark class, metadata
  globals.css                 Design tokens → Tailwind 4 @theme
  m/[id]/page.tsx             Public share page (server component)
  api/
    suggest/route.ts          Image → Gemini → 6 suggestions (server)
    memes/route.ts            Save meme → Supabase (server)
    memes/[id]/react/route.ts Insert reaction (server)

components/
  UploadZone.tsx              Phase: upload
  LoadingScreen.tsx           Phase: suggesting
  MemePreview.tsx             Used in PickScreen — one canvas card
  PickScreen.tsx              Phase: picking
  MemeEditor.tsx              Phase: editing (Konva, ssr:false)
  ReactionBar.tsx             Used in /m/[id]
  CreatorReactionPanel.tsx    Used in /m/[id] — Supabase Realtime

lib/
  store.ts                    Zustand state machine (all phases + data)
  meme-themes.ts              34 cultural themes → feeds LLM prompt
  templates/index.ts          7 canvas layout blueprints
  renderMeme.ts               Shared canvas renderer (preview + export)
  llm.ts                      OpenRouter/Gemini client + system prompt builder
  remix.ts                    Stash/consume remix preset across routes
  processImageFile.ts         File validation, MIME check, clipboard helpers
  supabase/client.ts          Browser Supabase client
  supabase/server.ts          Server Supabase client
  supabase/../schema.sql      DB tables, RLS policies, Realtime setup
```
