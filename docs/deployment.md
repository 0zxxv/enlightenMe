# Backend deployment (Render)

The Dars API is designed to run on **Render** (free web service) against Neon PostgreSQL.

## One-time setup

1. Push this repo to GitHub.
2. Open [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the GitHub repo and select `render.yaml`.
4. Set **DATABASE_URL** to your Neon connection string (same as local `backend/.env`).
5. Deploy. Note the public URL, e.g. `https://dars-api.onrender.com`.

## Point the mobile app at it

In the project root `.env`:

```env
EXPO_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api/v1
```

Then restart Expo (`npx expo start`). You no longer need `cd backend && npm run dev` for day-to-day app use.

## Manual Node service (without Blueprint)

- **Root directory:** `backend`
- **Build:** `npm ci && npx prisma generate && npm run build`
- **Start:** `npx prisma migrate deploy && npm start`
- **Health check:** `/api/v1/health`

## Notes

- Free Render services sleep after idle time; the first request may take ~30–60s.
- Keep JWT secrets only on the server — never in the mobile app.
- After deploy, optionally seed once: from your machine with production `DATABASE_URL`, run `npm run db:seed` in `backend/` (or use Render shell).
