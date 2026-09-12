# Start Dars for phone testing (auto-detects PC IP)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host 'Starting Dars for phone...' -ForegroundColor Cyan

# Prefer hotspot / Wi-Fi IPv4 (skip loopback)
$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254.*' -and
    ($_.InterfaceAlias -match 'Wi-Fi|WLAN|Ethernet|Local Area|Hotspot|iPhone|Android')
  } |
  Sort-Object -Property @{Expression = {
    if ($_.IPAddress -like '172.20.*') { 0 }
    elseif ($_.InterfaceAlias -match 'Wi-Fi|WLAN') { 1 }
    else { 2 }
  }} |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -First 1 -ExpandProperty IPAddress)
}

if (-not $ip) { throw 'Could not detect a LAN IP. Connect Wi-Fi or phone hotspot first.' }

$apiUrl = "http://${ip}:3001/api/v1"
Set-Content -Path '.env' -Value "EXPO_PUBLIC_API_URL=$apiUrl" -Encoding utf8
$env:EXPO_PUBLIC_API_URL = $apiUrl
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip

Write-Host "PC IP: $ip"
Write-Host "API URL: $apiUrl"
Write-Host ''
Write-Host 'PHONE CHECKLIST:' -ForegroundColor Yellow
Write-Host '1) Install Expo Go for SDK 57 from: https://expo.dev/go?sdkVersion=57'
Write-Host '   (App Store Expo Go is often too old for this project.)'
Write-Host '2) Log into the SAME Expo account in Expo Go and run: npx expo login'
Write-Host '3) Same Wi-Fi OR keep phone hotspot on so this PC stays on that network'
Write-Host '4) Scan the QR in Expo Go (not the Camera app if it fails)'
Write-Host ''

if (-not (Test-Path 'node_modules')) { npm install }
if (-not (Test-Path 'backend\node_modules')) {
  Push-Location backend; npm install; Pop-Location
}

# Ensure API is reachable from phone
$apiUp = $false
try {
  $null = Invoke-RestMethod "http://127.0.0.1:3001/api/v1/health" -TimeoutSec 2
  $apiUp = $true
} catch {}

if (-not $apiUp) {
  Write-Host 'Starting local API...'
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$PSScriptRoot\backend'; npm run dev"
  )
  Start-Sleep -Seconds 4
}

Write-Host 'Starting Expo (LAN)...'
npx expo start --lan --clear
