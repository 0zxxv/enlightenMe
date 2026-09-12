# API

Base path: `/api/v1`

Response shapes:

- Success: `{ "data": ... }`
- Paginated: `{ "data": [...], "meta": { "page", "pageSize", "total" } }`
- Error: `{ "error": { "code", "message", "details?" } }`

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | no | Liveness |
| POST | `/auth/register` | no | Creates user + tokens |
| POST | `/auth/login` | no | |
| POST | `/auth/refresh` | no | Rotate tokens |
| POST | `/auth/logout` | yes | Revoke refresh |
| GET | `/auth/me` | yes | Current user |
| GET | `/courses` | no | Search `q`, filters `type`, `format`, `category`, pagination |
| GET | `/courses/:id` | no | Includes curriculum, sessions, reviews |
| POST | `/courses` | tutor | Create draft/publish flow |
| GET | `/tutors` | no | |
| GET | `/tutors/:id` | no | |
| GET | `/institutes` | no | |
| GET | `/institutes/:id` | no | |
| POST | `/bookings` | yes | Server enforces capacity + price |
| GET | `/bookings/mine` | yes | |
| GET | `/bookings/:id` | yes | |
| POST | `/bookings/:id/cancel` | yes | |
| POST | `/payments/intent` | yes | Stub provider → Pending |
| GET/POST/DELETE | `/favorites` | yes | |
| POST | `/reviews` | yes | Completed booking only |
| GET/POST | `/messages/*` | yes | Booking relationship required |
| `*` | `/admin/*` | admin | Verify/approve/suspend |
| GET | `/tutor/dashboard/*` | tutor | Upcoming, courses, students, earnings |
