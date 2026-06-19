# eternal-hero-test-patches

An internal QA tracking tool for the game **Eternal Hero**. A small team of testers uses it to coordinate patch testing: they track test result status per category and sub-topic, log DPS benchmarks with screenshots, leave threaded comments with media attachments, and get AI-generated test suggestions from patch notes.

This is not a test framework — it is a React SPA used as a collaboration tool by testers.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, JavaScript (no TypeScript) |
| Routing | react-router-dom 6 |
| Database | Supabase (hosted Postgres, accessed via REST client) |
| Media uploads | Cloudinary (unsigned upload preset) |
| AI | Anthropic API (called directly from the browser) |
| Deployment | Vercel |
| Build tool | Vite 5 |

No TypeScript. No CSS framework. No test suite.

## Project structure

```
src/
  supabase.js          # Supabase client init (URL + anon key)
  utils.js             # Core utilities: loadPatches, savePatches, uploadToCloudinary,
                       # generateChangesFromNotes (Anthropic), isPrivileged,
                       # PRIVILEGED list, uid, timeAgo, status helpers, purgeOldDeleted
  readState.js         # Tracks per-user read timestamps in Supabase read_state table
  App.jsx              # Route tree, patch loading, top-level save handler, name gate
  index.css            # CSS custom properties (light/dark), base component styles
  components/
    NameScreen.jsx     # Initial name prompt (stores to localStorage)
    Home.jsx           # Tester view: active patches with status summary
    AdminHome.jsx      # Privileged view: all patches including drafts; create/delete
    Sidebar.jsx        # Category/sub-topic tree, filters, sort, AI generate textarea
    PatchView.jsx      # Main layout: Sidebar + Panel; all mutation handlers
    Panel.jsx          # Comment thread, compose box, media upload, tag filter, search
    DamageReport.jsx   # DPS record tracking with comparison table
    AppVersion.jsx     # Version badge (v1.0.3.MMDD)
    DeleteConfirmModal.jsx
    EditCategoryModal.jsx
    EditSubModal.jsx
    ContextMenu.jsx
    FilterDropdown.jsx
```

## Local development setup

```bash
npm install
npm run dev    # Vite on http://localhost:5173
```

No `.env` file is required locally — the Supabase URL and anon key are hardcoded in `src/supabase.js`. Cloudinary credentials are hardcoded in `src/utils.js`.

To set up a fresh Supabase project:
1. Create a Supabase project
2. Run the SQL from `README.md` to create the `patches` table and `read_state` table
3. Set RLS policies to allow public read/write/update/delete on both tables
4. Update the URL and anon key in `src/supabase.js`

## Environment variables

There are no environment variables configured. All external service credentials are hardcoded in source:

| Variable | Location | Note |
|---|---|---|
| Supabase URL | `src/supabase.js` | Move to `import.meta.env.VITE_SUPABASE_URL` |
| Supabase anon key | `src/supabase.js` | Move to `import.meta.env.VITE_SUPABASE_KEY` |
| Cloudinary cloud name | `src/utils.js` `CLOUD` | Move to env var if rotating |
| Cloudinary upload preset | `src/utils.js` `PRESET` | Unsigned preset — intentionally public |
| Anthropic API key | Not in source — either missing (feature silently fails) or injected via Vite env var at build time |

## Coding conventions

**All state flows through App.jsx.** `patches` is loaded once on mount and passed down as props. All mutations go up via `onSave(updatedPatches)` callbacks. `onSave` calls `savePatches()` which upserts the full blob to Supabase, then updates local state.

**Single JSONB blob.** The entire application state is one Supabase row with `id = 'eternal-hero-test-patch'`. Every save is a full replacement of that row's `data` column. This means:
- No partial updates — always pass the full patches array to `savePatches`
- Last write wins — there is no conflict detection
- New fields can be added to the data structure at any time without schema migrations

**Immutable update pattern.** State is never mutated directly. Updates follow the pattern:
```javascript
const updated = patches.map(p =>
  p.id === patchId
    ? { ...p, changes: p.changes.map(c => c.id === changeId ? { ...c, ...updates } : c) }
    : p
)
onSave(updated)
```

**Privilege system.** `isPrivileged(testerName)` checks the name against `PRIVILEGED = ['ImBlind', 'niloc', 'eternal']` in `utils.js`. Privileged users see deleted items, can restore them, and access `/admin` routes. The check runs in `App.jsx` route guards and in `PatchView`/`Panel` component logic.

**Soft delete.** Items (categories, sub-topics, comments) are not removed immediately. They get `deleted: true` + `deletedAt` timestamp. `purgeOldDeleted` removes items deleted more than 30 days ago. Privileged users can restore soft-deleted items within that window.

**Status values.** The status system uses: `pass`, `fail`, `skip`, `blocked`, `in-progress`, `not-tested`. These are string values — there is no enum. `statusLabel()`, `statusBadgeCls()`, and `dotCls()` in `utils.js` handle display.

**CSS custom properties for theming.** All colours reference variables defined in `index.css`:
- `--bg`, `--bg2`, `--bg3` — background levels
- `--text`, `--text2` — primary and secondary text
- `--border`, `--border-primary` — border colours
- `--accent` — purple accent
Dark mode is applied via `@media (prefers-color-scheme: dark)` overriding the same variables.

**IDs.** New items use `uid()` from `utils.js`, which returns `Math.random().toString(36).slice(2, 10)`. Not cryptographically secure but collision-resistant enough for a small team.

## Key architectural decisions

**Single-blob storage for simplicity.** The entire patch dataset in one DynamoDB row means no SQL joins, no migration scripts, no schema versioning. New fields added to the JS objects just persist naturally. The trade-off is last-write-wins — two testers saving simultaneously will silently lose one set of changes. The team coordinates saves via Discord.

**No authentication.** Identity is a self-reported name stored in `localStorage`. There is no Firebase, no password, no session token. The trust model assumes a small team that knows each other. The privilege system adds a lightweight UI gate but is not a security boundary.

**Cloudinary unsigned uploads.** The upload preset `eternal-hero-test-patch` is an unsigned Cloudinary preset, meaning the browser can upload directly without a server-side signature. File type and size restrictions should be configured in the Cloudinary dashboard. The app enforces a 5MB image / 50MB video limit client-side (`IMG_LIMIT`, `VID_LIMIT` in `utils.js`).

**AI test generation.** `generateChangesFromNotes(notes)` in `utils.js` POSTs directly to the Anthropic API from the browser. The API key must be present at build time as a Vite env var or the request returns 401 and the error is swallowed silently. The feature generates structured change objects from free-form patch notes.

## Common tasks

**Add a new status value:**
1. Add the string to `statusLabel()`, `statusBadgeCls()`, `dotCls()`, and `pillCls()` in `utils.js`
2. Add it to the status dropdown in `Panel.jsx`
3. Update `FilterDropdown.jsx` if it should appear as a filter option

**Add a new tester to the privileged list:**
Edit `PRIVILEGED` in `src/utils.js`:
```javascript
const PRIVILEGED = ['ImBlind', 'niloc', 'eternal', 'newperson']
```

**Create a new patch (as admin):**
Navigate to `/admin` while logged in as a privileged tester. Click "New Patch". Drafts are not visible to non-admin testers until their status is changed from `draft`.

**Deploy to Vercel:**
```bash
npm run build    # generates dist/
```
Push to the connected GitHub branch. Vercel auto-deploys on push. `vercel.json` configures SPA fallback routing (all paths → `/`).

**Use the sync script for quick deploys:**
```bash
MSG="your commit message" bash sync.sh
```
This runs `git add . && git commit -m "$MSG" && git push`. Use with caution — `git add .` stages all untracked files.

**Regenerate the AI test plan for a patch:**
In the admin patch view, open the Sidebar and type patch notes into the AI textarea. Click Generate. The AI response is parsed into structured change objects and appended to the patch. The patch status automatically changes from `draft` to `active`.

## Things to avoid / known gotchas

- **Last-write-wins is real.** If two testers are both actively editing and one saves, the other's in-progress changes will be overwritten when they save. Coordinate before saving during active testing sessions.
- **Refreshing loses nothing** — data is loaded from Supabase on mount. But any unsaved local changes (typed but not yet submitted) are lost on refresh.
- **The comment search field filters comments in real time** — it searches `cm.text`. Make sure new comment objects always include a `text` field (not `content` or `body`).
- **Admin route guard is name-based.** Anyone who sets their name to `niloc` in the name screen gets admin access. This is intentional for the trust model but means the privilege list in `utils.js` is effectively a password list.
- **`read_state` table is not in the README SQL.** If setting up a fresh Supabase instance, create it manually:
  ```sql
  create table read_state (
    tester text,
    topic_id text,
    last_read timestamptz,
    primary key (tester, topic_id)
  );
  alter table read_state enable row level security;
  create policy "public" on read_state for all using (true) with check (true);
  ```
- **`AppVersion` shows today's date as the build number**, not the actual deployment date. The displayed version changes every day. This is cosmetic only.
- **`sync.sh` stages all files** with `git add .`. Do not create a local `.env` file if you move credentials there — it will be committed.
- **There is no TypeScript.** No compile-time type checking. Be careful with the nested patch data structure — misspelled property names fail silently at runtime.
