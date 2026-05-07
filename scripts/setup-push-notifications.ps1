# MediMind Push Notification Setup Script
# Run this in your project directory to configure VAPID keys

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "MediMind Push Notification Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
$supabaseCheck = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCheck) {
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host "Setting VAPID secrets in Supabase..." -ForegroundColor Green

# Set VAPID_PUBLIC_KEY
Write-Host "Setting VAPID_PUBLIC_KEY..." -ForegroundColor Yellow
supabase secrets set VAPID_PUBLIC_KEY="BH8DqHf8oIIW425O7Q7688MpGXlO6nC2C6JKqjdbrH3hrgKc6cWkjdeTEkDxIhz42EixNYN7HBCrxDAQU_56DKk"

# Set VAPID_PRIVATE_KEY
Write-Host "Setting VAPID_PRIVATE_KEY..." -ForegroundColor Yellow
supabase secrets set VAPID_PRIVATE_KEY="ym-mP8456a7jZO3W-s_sw1PqXb7W6heDH8O5Dtc0u-s"

# Set VAPID_SUBJECT
Write-Host "Setting VAPID_SUBJECT..." -ForegroundColor Yellow
supabase secrets set VAPID_SUBJECT="mailto:admin@medimind.app"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "VAPID Keys configured:"
Write-Host "  - Public Key: BH8DqHf8oIIW425O7Q7688MpGXlO6nC2C6JKqjdbrH3hrgKc6cWkjdeTEkDxIhz42EixNYN7HBCrxDAQU_56DKk"
Write-Host "  - Private Key: ym-mP8456a7jZO3W-s_sw1PqXb7W6heDH8O5Dtc0u-s"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Start your app: npm run dev"
Write-Host "2. Open http://localhost:5173 in your browser"
Write-Host "3. Log in and click the bell icon to enable push notifications"
Write-Host "4. Test by clicking the bell icon again - you should receive a push notification"