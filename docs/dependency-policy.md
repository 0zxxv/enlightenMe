# Dependency policy

1. Prefer React Native and Expo APIs over third-party packages.
2. Install Expo-compatible packages with `npx expo install <package>`.
3. Never use `--force` or `--legacy-peer-deps`.
4. Do not run blanket `npm update`.
5. Use **npm** only — keep a single `package-lock.json` per package root (mobile root + `backend/`).
6. After dependency changes, run `npx expo-doctor`.
7. Do not install large UI kits (NativeBase, NativeWind, Tamagui, Paper, UI Kitten).
8. Do not add Redux unless a measured need appears; use TanStack Query for server state.
9. On conflicts: stop, inspect Expo/React/RN versions, choose the smallest compatible fix, document the decision.
