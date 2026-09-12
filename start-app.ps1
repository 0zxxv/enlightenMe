# Start Dars (درس) — backend API + Expo
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host 'Starting Dars (درس)...' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is not installed or not on PATH.'
}

if (-not (Test-Path 'backend\node_modules')) {
  Write-Host 'Installing backend dependencies...'
  Push-Location backend
  npm install
  Pop-Location
}

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing app dependencies...'
  npm install
}

Write-Host 'Starting API on http://localhost:3001 ...'
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$PSScriptRoot\backend'; npm run dev"
)

Start-Sleep -Seconds 4

Write-Host 'Starting Expo...'
Write-Host 'Scan the QR with Expo Go, or press a / i / w.'
npx expo start
