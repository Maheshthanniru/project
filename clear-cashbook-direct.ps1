# Direct Cash Book Clearing Script
# This script will help you clear cash book entries directly

Write-Host "Cash Book Clearing Script" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""

Write-Host "This script will help you clear all cash book entries while preserving:" -ForegroundColor Green
Write-Host "- Company names" -ForegroundColor White
Write-Host "- Main accounts" -ForegroundColor White  
Write-Host "- Sub accounts" -ForegroundColor White
Write-Host "- Staff data" -ForegroundColor White
Write-Host ""

Write-Host "Choose your method:" -ForegroundColor Cyan
Write-Host "1. SQL Script (Recommended - Run in Supabase Dashboard)" -ForegroundColor White
Write-Host "2. Manual Database Access" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "SQL Script Method:" -ForegroundColor Green
    Write-Host "==================" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Open your Supabase project dashboard" -ForegroundColor White
    Write-Host "2. Go to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy and paste the following SQL commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "--- START COPYING FROM HERE ---" -ForegroundColor Yellow
    Write-Host ""
    
    # Read and display the SQL file content
    $sqlContent = Get-Content "clear-cashbook-now.sql" -Raw
    Write-Host $sqlContent -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "--- END COPYING HERE ---" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Click 'Run' to execute the commands" -ForegroundColor White
    Write-Host "5. Check the results to confirm clearing was successful" -ForegroundColor White
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Manual Database Access:" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Green
    Write-Host ""
    Write-Host "If you have direct database access, run these SQL commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "DELETE FROM cash_book;" -ForegroundColor Red
    Write-Host "DELETE FROM deleted_cash_book;" -ForegroundColor Red
    Write-Host "DELETE FROM edit_cash_book;" -ForegroundColor Red
    Write-Host "ALTER SEQUENCE IF EXISTS cash_book_sno_seq RESTART WITH 1;" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "WARNING: This will permanently delete all cash book entries!" -ForegroundColor Red
    Write-Host "Make sure you have a backup if needed." -ForegroundColor Red
    
} else {
    Write-Host "Invalid choice. Please run the script again and choose 1 or 2." -ForegroundColor Red
}

Write-Host ""
Write-Host "After clearing, your NewEntry page should show:" -ForegroundColor Green
Write-Host "- Empty recent transactions list" -ForegroundColor White
Write-Host "- Total entries count reset to 0" -ForegroundColor White
Write-Host "- All dropdowns still populated with companies, accounts, etc." -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
