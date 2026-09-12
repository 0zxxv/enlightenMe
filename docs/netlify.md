# Deploy Dars web app to Netlify

The mobile app is Expo. For Netlify we ship the **web** build as a single-page app (SPA).

## Prerequisites

1. Backend live on Render (e.g. `https://dars-api.onrender.com`)
2. GitHub repo connected to Netlify
3. Node 22

## Option A — Netlify UI (recommended)

1. Go to [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose GitHub → `0zxxv/enlightenMe` (or `dars` if renamed)
3. Settings should pick up `netlify.toml`:
   - **Build command:** `npm ci && npx expo export --platform web`
   - **Publish directory:** `dist`
4. **Site configuration → Environment variables** → add:

   | Key | Value |
   |-----|--------|
   | `EXPO_PUBLIC_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api/v1` |
   | `NODE_VERSION` | `22` |

5. Deploy site

After deploy, open the Netlify URL (e.g. `https://something.netlify.app`).

## Option B — Netlify CLI

```powershell
npm i -g netlify-cli
npx expo export --platform web
# set EXPO_PUBLIC_API_URL first so the build embeds the live API
$env:EXPO_PUBLIC_API_URL="https://YOUR-RENDER-SERVICE.onrender.com/api/v1"
npx expo export --platform web
netlify deploy --prod --dir=dist
```

## Important

- `EXPO_PUBLIC_*` vars are baked in at **build time**. Change the API URL → redeploy Netlify.
- Do **not** use `localhost` in Netlify env.
- Phone/native still uses Expo Go; Netlify is for **browser** access.

## Local test of production web build

```powershell
$env:EXPO_PUBLIC_API_URL="https://YOUR-RENDER-SERVICE.onrender.com/api/v1"
npm run export:web
npx serve dist
```
