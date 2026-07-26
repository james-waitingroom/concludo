# Deploying Concludo (web) to Vercel

The `web/` folder is a Next.js 14 app. It talks to Supabase (Postgres + Storage + Auth).
Nothing else in this repo (`spike/`, `engine/`) deploys — they're local tooling.

## 1. Push to GitHub

```bash
# from the repo root: C:\Users\james\concludo
git branch -M main
git remote add origin https://github.com/<your-username>/concludo.git
git push -u origin main
```

Create the empty repo first at https://github.com/new (no README/gitignore — this repo already has them).

## 2. Import into Vercel

1. https://vercel.com → **Add New… → Project** → import the `concludo` repo.
2. **Root Directory**: set to `web`  ← important, the app is not at repo root.
3. Framework preset: **Next.js** (auto-detected). Leave build/output settings default.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Copy the values from `web/.env.local`. Add all four to **Production** (and Preview):

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | public, RLS-protected |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key | **secret** — server-only, never exposed |

The service-role key has no `NEXT_PUBLIC_` prefix, so Next.js keeps it server-side only.

## 4. Point Supabase at the deployed domain

After the first deploy you'll get a URL like `https://concludo-xxxx.vercel.app`.

Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://<your-vercel-domain>`
- **Redirect URLs** — add:
  - `https://<your-vercel-domain>/auth/callback`
  - `https://<your-vercel-domain>/auth/reset`
  - (keep the localhost ones for local dev)

Google OAuth needs **no change** — its redirect target is the Supabase callback
(`https://<ref>.supabase.co/auth/v1/callback`), which is domain-independent.

## 5. Verify

- Visit the Vercel URL → redirected to `/login`.
- Sign in with your provisioned account → `/contracts` loads.
- `/admin` works for platform admins.
- Add a contract → PDF uploads directly to Supabase Storage (bypasses Vercel's
  ~4.5MB request-body limit), row appears in the list.

## Notes

- Vercel **Hobby** tier is non-commercial; use **Pro** ($20/mo) for a real product deployment.
- Each `git push` to `main` triggers an automatic redeploy.
