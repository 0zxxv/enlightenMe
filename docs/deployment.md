# Deployment

## API

1. Set production env vars (Neon production branch, strong JWT secrets, restricted `CORS_ORIGIN`).
2. `cd backend && npm ci && npx prisma migrate deploy && npm run build && npm start`
3. Host on any Node-capable platform (Railway, Fly, Render, etc.).

## Mobile

EAS profiles in `eas.json`:

- `development` â€” dev client
- `preview` â€” internal distribution
- `production` â€” store builds

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
eas submit --profile production
```

Bundle IDs: `com.Dars.app`

Configure a real EAS `projectId` in `app.config.ts` before store submission.

## Checklist

- [ ] Secrets only in server env
- [ ] Migrations applied
- [ ] Seed not run against production unintentionally
- [ ] App icons / splash / store metadata
- [ ] `expo-doctor` clean
- [ ] Payment provider credentials when leaving stub mode
