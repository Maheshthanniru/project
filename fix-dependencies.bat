@echo off
REM 🔧 Fix Dependencies Script for Vercel Deployment (Windows)
REM This script resolves dependency conflicts and ensures clean installation

echo 🔧 Fixing dependency conflicts...

REM Remove existing node_modules and package-lock.json
echo [INFO] Cleaning existing dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM Clear npm cache
echo [INFO] Clearing npm cache...
call npm cache clean --force

REM Install dependencies with legacy peer deps to resolve conflicts
echo [INFO] Installing dependencies with legacy peer deps...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

REM Verify installation
echo [INFO] Verifying installation...
call npm list vite @vitejs/plugin-react
if %errorlevel% neq 0 (
    echo [ERROR] Version verification failed
    exit /b 1
)
echo [SUCCESS] Vite and React plugin versions verified

REM Run type checking
echo [INFO] Running TypeScript type checking...
call npm run type-check
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed
    exit /b 1
)
echo [SUCCESS] TypeScript compilation passed

REM Test build
echo [INFO] Testing build process...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build test failed
    exit /b 1
)
echo [SUCCESS] Build test passed

echo [SUCCESS] Dependency conflicts resolved successfully! 🎉
echo.
echo 📋 Next Steps:
echo 1. Commit the updated package.json and package-lock.json
echo 2. Push to your repository
echo 3. Redeploy on Vercel
echo.
pause


