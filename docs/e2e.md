# End-to-end testing architecture

Critical marketplace flow to automate when Detox/Maestro is wired:

1. Register (or login with `student@enlightenme.app`)
2. Search `ITCS347` or `Blender`
3. Open course details
4. Start booking → select session → payment method → confirm
5. Assert booking appears under My Bookings
6. Assert payment remains `Pending` while stub provider is active

Until native E2E runners are added, manually verify this path against a running API (`npm run dev` in `backend/`).
