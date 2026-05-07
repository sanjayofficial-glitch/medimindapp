# Test Push Notification Setup
# Run this after you've set up VAPID secrets in Supabase

param(
    [string]$UserId = "",
    [string]$Title = "MediMind Test",
    [string]$Body = "Testing push notifications!"
)

if (-not $UserId) {
    Write-Host "Usage: .\test-push.ps1 -UserId <your-user-id>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your User ID:"
    Write-Host "  1. Go to Supabase Dashboard"
    Write-Host "  2. Go to Authentication → Users"
    Write-Host "  3. Copy your User UUID"
    exit 1
}

$supabaseUrl = "https://tokndrkhxgmckuffbtrd.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRva25kcmtoeGdtY2t1ZmZidHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODExMjgsImV4cCI6MjA5MzQ1NzEyOH0.vDwV-1pLF2uGQ2o9h2glupQQP79Rxl6FqtkuwDpzT0A"

$body = @{
    user_id = $UserId
    title = $Title
    body = $Body
    url = "/dashboard"
} | ConvertTo-Json

Write-Host "Sending push notification..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/webpush-reminders" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $anonKey"
        } `
        -Body $body

    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
    
    if ($response.sent -gt 0) {
        Write-Host "✅ Push notification sent successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No notifications sent. Check subscriptions." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}