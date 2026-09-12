# Architecture

Dars is a modular monolith: one Expo mobile app and one Express API sharing a PostgreSQL database.

```
Mobile (Expo)  --HTTPS JSON-->  API /api/v1/*  -->  Prisma  -->  Neon PostgreSQL
```

## Layers (mobile)

| Layer | Path | Responsibility |
|-------|------|----------------|
| UI | `app/`, `src/components/` | Screens and reusable design-system components |
| Features | `src/features/` | Hooks and feature orchestration |
| Services | `src/services/` | API client, analytics, payment abstractions |
| Domain types | `src/types/` | Shared TypeScript models |
| Theme / i18n | `src/theme/`, `src/i18n/` | Design tokens and EN/AR strings |

## Layers (backend)

| Layer | Path | Responsibility |
|-------|------|----------------|
| Routes | `backend/src/modules/*/routes` | HTTP contracts |
| Services | `backend/src/modules/*/service` | Business rules (capacity, ownership) |
| Middleware | `backend/src/middleware/` | Auth, validation |
| Data | `backend/prisma/` | Schema + migrations |

## Security boundary

The API is the security boundary. Never trust client-supplied price, availability, role, or payment status. Bookings decrement seats inside a database transaction.

## Payments

`PaymentProvider` abstracts providers. The stub provider returns `Pending` / `requiresProvider` and never fabricates a successful charge.

## Roles

`Student | Parent | Tutor | InstituteAdmin | Admin` â€” extensible via Prisma enum.
