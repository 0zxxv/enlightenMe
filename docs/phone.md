# Phone connection guide — Dars

## Why it fails most often

This project uses **Expo SDK 57**.

The Expo Go app from the App Store / Play Store is often **older** (e.g. SDK 54) and will refuse to open the project.

## Fix (do this once)

### 1. Install the matching Expo Go

Open on your phone:

**https://expo.dev/go?sdkVersion=57**

Install the **SDK 57** build for Android or iOS.

### 2. Log in (required on newer Expo Go)

On your PC:

```powershell
npx expo login
```

In Expo Go → profile avatar → log in with the **same** Expo account.

### 3. Start for phone

```powershell
.\start-phone.ps1
```

This script:
- detects your PC IP (Wi‑Fi or phone hotspot)
- writes the correct API URL into `.env`
- starts the backend if needed
- starts Expo in LAN mode

### 4. Open on phone

- Same Wi‑Fi **or** phone hotspot with the PC connected to it
- Open **Expo Go** → scan the QR

If scan fails, in Expo Go enter manually:

`exp://YOUR_PC_IP:8081`

(the IP is printed by `start-phone.ps1`)

## Still stuck?

- Turn off VPN on phone and PC
- Allow Node.js through Windows Firewall when prompted
- Try web first to confirm the app works: `npx expo start --web`
