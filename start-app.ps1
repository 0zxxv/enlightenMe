# Start Dars (درس) — Expo (+ local API only if needed)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host 'Starting Dars (درس)...' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is not installed or not on PATH.'
}

$apiUrl = $env:EXPO_PUBLIC_API_URL
if (-not $apiUrl -and (Test-Path '.env')) {
  $line = Get-Content '.env' | Where-Object { $_ -match '^\s*EXPO_PUBLIC_API_URL=' } | Select-Object -First 1
  if ($line) { $apiUrl = ($line -split '=', 2)[1].Trim() }
}

$useLocalApi = -not $apiUrl -or $apiUrl -match 'localhost|127\.0\.0\.1'

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing app dependencies...'
  npm install
}

if ($useLocalApi) {
  if (-not (Test-Path 'backend\node_modules')) {
    Write-Host 'Installing backend dependencies...'
    Push-Location backend
    npm install
    Pop-Location
  }
  Write-Host 'Starting local API on http://localhost:3001 ...'
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$PSScriptRoot\backend'; npm run dev"
  )
  Start-Sleep -Seconds 4
} else {
  Write-Host "Using live API: $apiUrl"
}

Write-Host 'Starting Expo (LAN mode)...'
Write-Host "PC Wi-Fi IP: use this in EXPO_PUBLIC_API_URL (not localhost)."
Write-Host 'On your phone: same Wi-Fi → open Expo Go → scan QR.'
npx expo start --lan
