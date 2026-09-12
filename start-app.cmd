@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo Starting Dars (درس)...
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  exit /b 1
)

set "API_URL="
for /f "usebackq tokens=1,* delims==" %%A in (`.env`) do (
  if /I "%%A"=="EXPO_PUBLIC_API_URL" set "API_URL=%%B"
)

set "USE_LOCAL=1"
echo !API_URL! | findstr /I "localhost 127.0.0.1" >nul
if errorlevel 1 if not "!API_URL!"=="" set "USE_LOCAL=0"

if not exist "node_modules\" (
  echo Installing app dependencies...
  call npm install
)

if "!USE_LOCAL!"=="1" (
  if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    pushd backend
    call npm install
    popd
  )
  echo Starting local API on http://localhost:3001 ...
  start "Dars API" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
  timeout /t 4 /nobreak >nul
) else (
  echo Using live API: !API_URL!
)

echo Starting Expo...
call npx expo start

endlocal
