# Deploy Dars web app to Netlify

The mobile app is Expo. For Netlify we ship the **web** build as a single-page app (SPA).

## Prerequisites

1. Backend live on Render (production URL: `https://dars-api-oqtb.onrender.com`)
2. GitHub repo connected to Netlify
3. Node 22

## Option A — Netlify UI (recommended)

1. Go to [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose GitHub → `0zxxv/enlightenMe` (or `dars` if renamed)
3. Settings should pick up `netlify.toml`:
   - **Build command:** `node scripts/check-web-api-url.mjs && npm ci && npx expo export --platform web`
   - **Publish directory:** `dist`
   - **`EXPO_PUBLIC_API_URL`:** already set in `netlify.toml` to the Render API
4. Deploy site

After deploy, open the Netlify URL (e.g. `https://daars.netlify.app`).

## Option B — Netlify CLI

```powershell
npm i -g netlify-cli
# set EXPO_PUBLIC_API_URL first so the build embeds the live API
$env:EXPO_PUBLIC_API_URL="https://dars-api-oqtb.onrender.com/api/v1"
npx expo export --platform web
netlify deploy --prod --dir=dist
```

## Important

- `EXPO_PUBLIC_*` vars are baked in at **build time**. Change the API URL → redeploy Netlify.
- Do **not** use `localhost` in Netlify env — the build check script will fail the deploy.
- The free Render API may take ~30–60s to wake on the first request after idle.
- Phone/native still uses Expo Go; Netlify is for **browser** access.

## Local test of production web build

```powershell
$env:EXPO_PUBLIC_API_URL="https://dars-api-oqtb.onrender.com/api/v1"
npm run export:web
npx serve dist
```
