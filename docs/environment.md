# Environment

## Mobile (root)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Base API URL including `/api/v1` |

Copy `.env.example` → `.env`. Never commit real secrets (mobile should not hold private keys).

## Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon/PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES` | e.g. `7d` |
| `PORT` | Default `3001` |
| `NODE_ENV` | `development` \| `staging` \| `production` |
| `CORS_ORIGIN` | `*` or comma-separated origins |
| `ALLOW_STUB_PAYMENT_CONFIRM` | `true` enables QA-only `POST /payments/:bookingId/confirm-stub` (Paid + Confirmed). Keep off in real production unless intentionally testing. |

**Pricing model:** `Course.priceDecimal` is the **package total** for all sessions (UI: `BHD X · N sessions · Total`).

Environments: **development**, **staging**, **production**. Use separate Neon branches/projects per environment.
