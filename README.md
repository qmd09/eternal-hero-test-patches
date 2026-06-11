# Eternal Hero — QA Tracker

Game patch testing tracker with AI-generated test suggestions, comment threads, and Cloudinary media uploads. Backed by Supabase — all testers share the same live data.

## Stack

- React + Vite
- React Router v6
- Supabase (shared Postgres database)
- Cloudinary (image + video uploads)
- Vercel (hosting)

## Setup

```bash
npm install
npm run dev
```

## Supabase table (run once in SQL Editor)

```sql
create table patches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table patches enable row level security;

create policy "public read"   on patches for select using (true);
create policy "public write"  on patches for insert with check (true);
create policy "public update" on patches for update using (true);
create policy "public delete" on patches for delete using (true);
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

All defaults — just press Enter through the prompts.

## URLs

| Route | Who |
|---|---|
| `/` | Testers — list of active patches |
| `/patch/:id` | Testers — join a specific patch |
| `/admin` | Admin — manage all patches |
| `/admin/patch/:id` | Admin — edit patch, AI generate |

## Data persistence

All patch data is stored in Supabase under a single row (`id = eternal-hero-test-patch`).  
Every tester sees the same state. Hit the refresh button to pull latest.

## Media limits

- Images: max 5MB (auto-compressed by Cloudinary)
- Videos: max 50MB
