# EnlightenMe (الهمني)

Bahrain learning marketplace — connect learners with tutors, university educators, and institutes.

**Learn. Teach. Inspire.**

## Stack

- **Mobile:** Expo SDK 57, Expo Router, TypeScript, custom design system
- **Backend:** Node.js, Express, Prisma, PostgreSQL (Neon)
- **Auth:** Email/password + JWT access/refresh tokens

## Monorepo layout

```
app/                 Expo Router screens
src/                 Mobile source (components, features, services, theme, i18n)
backend/             Express API + Prisma
docs/                Architecture and developer docs
```

## Quick start

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and JWT secrets
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API: `http://localhost:3001/api/v1/health`

Demo accounts (password `Password123!`):

- `student@enlightenme.app`
- `zahra.ali@enlightenme.app` (tutor — Blender course)
- `sara.almansoori@enlightenme.app` (tutor)
- `admin@enlightenme.app`

### Mobile

```bash
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` to your machine IP when testing on a physical device.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run typecheck` | TypeScript check (mobile) |
| `npm run lint` | ESLint |
| `npm run doctor` | `expo-doctor` |
| `cd backend && npm run test` | Backend vitest |

## Documentation

- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Dependency policy](docs/dependency-policy.md)
- [Environment](docs/environment.md)
- [API](docs/api.md)
- [Database](docs/database.md)
- [Deployment](docs/deployment.md)

## Brand

- English: **EnlightenMe**
- Arabic: **الهمني** (exact spelling)
