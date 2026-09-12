# Development

## Prerequisites

- Node.js 22.13+
- npm (only package manager)
- Neon or other PostgreSQL for the API

## Mobile

1. Install dependencies at repo root: `npm install`
2. Copy `.env.example` → `.env`
3. Start API first (`cd backend && npm run dev`)
4. Start Expo: `npm start`
5. Prefer development builds (`eas build --profile development`) for native modules; Expo Go is fine for early UI work.

## Backend

1. `cd backend && npm install`
2. Configure `.env` with `DATABASE_URL` and JWT secrets
3. `npx prisma migrate dev` (or `migrate deploy` on shared DBs)
4. `npm run db:seed`
5. `npm run dev`

## Quality checks

```bash
npm run typecheck
npm run lint
npm run doctor
cd backend && npm run lint && npm test
```

## RTL

Switch language in Profile → Language. Arabic uses **درس**. Full RTL may require an app reload after `I18nManager.forceRTL`.

## One-command start

```powershell
.\start-app.ps1
```

or `start-app.cmd` — starts API + Expo.
