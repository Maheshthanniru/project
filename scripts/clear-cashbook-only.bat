@echo off
echo Clearing Cash Book Entries Only...
echo This will preserve companies, accounts, subaccounts, and staff data.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

cd /d "%~dp0"
node clear-cashbook-only.cjs

echo.
echo Press any key to exit...
pause >nul




