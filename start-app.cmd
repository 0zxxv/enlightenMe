@echo off
setlocal
cd /d "%~dp0"

echo Starting Dars (درس)...
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  exit /b 1
)

if not exist "backend\node_modules\" (
  echo Installing backend dependencies...
  pushd backend
  call npm install
  popd
)

if not exist "node_modules\" (
  echo Installing app dependencies...
  call npm install
)

echo Starting API on http://localhost:3001 ...
start "Dars API" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

timeout /t 4 /nobreak >nul

echo Starting Expo...
echo Scan the QR code with Expo Go, or press a / i / w in this terminal.
echo.
call npx expo start

endlocal
