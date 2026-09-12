# End-to-end testing architecture

Critical marketplace flow to automate when Detox/Maestro is wired:

1. Register (or login with `student@Dars.app`)
2. Search `ITCS347` or `Blender`
3. Open course details
4. Start booking â†’ select session â†’ payment method â†’ confirm
5. Assert booking appears under My Bookings
6. Assert payment remains `Pending` while stub provider is active

Until native E2E runners are added, manually verify this path against a running API (`npm run dev` in `backend/`).
