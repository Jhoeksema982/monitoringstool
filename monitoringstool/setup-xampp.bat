@echo off
echo ====================================
echo   Monitoring Tool - Supabase Setup
echo ====================================
echo.

echo [1/3] Checking if .env file exists...
if not exist ".env" (
    echo Copying .env.example to .env...
    copy ".env.example" ".env"
    echo.
    echo ⚠️  IMPORTANT: Add your Supabase credentials in the .env file!
    echo    - SUPABASE_URL
    echo    - SUPABASE_SERVICE_ROLE_KEY
    echo.
    pause
) else (
    echo .env file already exists ✓
)

echo.
echo [2/3] Installing npm dependencies...
npm install

echo.
echo [3/3] Testing application...
echo Starting development server...
echo.
npm run dev:server

echo.
echo ✅ Setup complete!
echo.
echo 🌐 API running on: http://localhost:5000
echo 💾 Connected to Supabase at: %SUPABASE_URL%
echo.
pause
