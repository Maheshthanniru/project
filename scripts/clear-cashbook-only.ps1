# Clear Cash Book Entries Only - PowerShell Script
# This script removes all cash book entries while preserving other data

Write-Host "Clearing Cash Book Entries Only..." -ForegroundColor Yellow
Write-Host "This will preserve companies, accounts, subaccounts, and staff data." -ForegroundColor Green
Write-Host ""

# Change to script directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptPath

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "Using Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if .env file exists
if (-not (Test-Path "../.env")) {
    Write-Host "Error: .env file not found in project root" -ForegroundColor Red
    Write-Host "Please ensure your .env file is in the project root directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting cleanup process..." -ForegroundColor Cyan
Write-Host ""

# Run the Node.js script
try {
    node clear-cashbook-only.cjs
    Write-Host ""
    Write-Host "Cleanup completed!" -ForegroundColor Green
} catch {
    Write-Host "Error running cleanup script: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"






