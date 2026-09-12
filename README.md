# Dars (درس)

Bahrain learning marketplace — connect learners with tutors, university educators, and institutes.

**Learn. Teach. Grow.**

## Stack

- **Mobile:** Expo SDK 57, Expo Router, TypeScript, custom design system
- **Backend:** Node.js, Express, Prisma, PostgreSQL (Neon)
- **Auth:** Email/password + JWT access/refresh tokens

## Quick start (recommended)

From the project root, run either:

```powershell
.\start-app.ps1
```

or:

```cmd
start-app.cmd
```

This starts the API and Expo together.

### Manual start

**Terminal 1 — API**
```powershell
cd backend
npm run dev
```

**Terminal 2 — Expo**
```powershell
npx expo start
```

Then scan the QR with Expo Go, or press `a` / `i` / `w`.

## Demo accounts

Password for all: `Password123!`

| Email | Role |
|-------|------|
| `student@dars.app` | Student |
| `sara.almansoori@dars.app` | Tutor |
| `zahra.ali@dars.app` | Tutor |
| `admin@dars.app` | Admin |

Supported roles in the system: Student, Parent, Tutor, InstituteAdmin, Admin.

## Documentation

- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Dependency policy](docs/dependency-policy.md)
- [Environment](docs/environment.md)
- [API](docs/api.md)
- [Database](docs/database.md)
- [Deployment](docs/deployment.md)

## Brand

- English: **Dars**
- Arabic: **درس**
