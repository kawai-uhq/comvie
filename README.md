# Comvie

Comfy movie nights. A Netflix-style website for browsing trending movies, shows and anime (TMDB metadata) and watching through embed players. Built with React + Vite, hosted on Vercel.

- Home with billboard, category chips, Top 10, Continue Watching, My List and more rows
- Search with debounce and "Top Searches"
- Detail pages with seasons and episodes, "More like this", share
- Player page with server switcher, prev/next episode, popup protection
- Optional account (email one-time code via Supabase): saves My List and Continue Watching online. Without an account everything stays in the browser.
- Installable on a phone (Add to Home Screen)

## How the pieces fit

```
api/tmdb.js        Vercel function: forwards requests to TMDB using TMDB_TOKEN (visitors never see it)
src/lib/           tmdb client, providers, local storage, Supabase auth + sync
src/state.tsx      My List, Continue Watching, session, background sync
src/pages/         Home, Search, Detail, Watch, MyList, Settings
src/components/    Navbar, Rows/posters, Billboard, AuthModal, Logo
supabase/schema.sql  tables for the optional account sync
```

## Deploy (Vercel)

1. Put this folder in a GitHub repo and import it at vercel.com (framework: Vite, defaults are fine).
2. **Settings -> Environment Variables:**
   - `TMDB_TOKEN` = your TMDB "API Read Access Token" (required, server-side only)
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (optional, only for accounts)
3. Redeploy. Env var changes only apply to new deployments.

## Optional accounts (Supabase)

1. Create a project at supabase.com.
2. **Authentication -> Emails -> SMTP Settings:** turn on custom SMTP (the built-in email only reaches your team and is limited to 2 an hour).
3. **Authentication -> Emails -> Templates:** in both **Confirm sign up** and **Magic link or OTP**, show the code: `<h2>Your Comvie code</h2><p>Enter this code on the site: <b>{{ .Token }}</b></p>`
4. **SQL Editor:** run `supabase/schema.sql`.
5. **Project Settings -> API:** put the Project URL and the anon/publishable key into the two `VITE_` variables. Never use the service_role key.

## Local development

```bash
npm install
npx vercel dev      # serves the site and /api/tmdb (needs TMDB_TOKEN)
npm run typecheck   # optional strict type check
```

TMDB attribution: This product uses the TMDB API but is not endorsed or certified by TMDB.
