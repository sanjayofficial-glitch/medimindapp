$env:SUPABASE_ACCESS_TOKEN = ""
$projectRef = "tokndrkhxgmckuffbtrd"

Write-Host "Setting VAPID secrets..." -ForegroundColor Cyan

# Try to set secrets using Supabase CLI
$commands = @(
    @{ key = "VAPID_PUBLIC_KEY"; value = "BH8DqHf8oIIW425O7Q7688MpGXlO6nC2C6JKqjdbrH3hrgKc6cWkjdeTEkDxIhz42EixNYN7HBCrxDAQU_56DKk" },
    @{ key = "VAPID_PRIVATE_KEY"; value = "ym-mP8456a7jZO3W-s_sw1PqXb7W6heDH8O5Dtc0u-s" },
    @{ key = "VAPID_SUBJECT"; value = "mailto:admin@medimind.app" }
)

foreach ($cmd in $commands) {
    Write-Host "Setting $($cmd.key)..." -ForegroundColor Yellow
    $output = npx supabase secrets set "$($cmd.key)=$($cmd.value)" --project-ref $projectRef 2>&1
    Write-Host $output
}

Write-Host "Done!" -ForegroundColor Green