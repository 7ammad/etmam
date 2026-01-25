# Script to always use port 3000 - kills any existing process and starts fresh
Write-Host "Checking port 3000..." -ForegroundColor Cyan

# Kill any process using port 3000
try {
    $processId = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        Write-Host "Found process $processId on port 3000, terminating..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "Port 3000 cleared" -ForegroundColor Green
    } else {
        Write-Host "Port 3000 is available" -ForegroundColor Green
    }
} catch {
    Write-Host "Port 3000 is available" -ForegroundColor Green
}

# Run the predev script
Write-Host ""
Write-Host "Running predev cleanup..." -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File ./scripts/clean-next-lock.ps1

# Start dev server on port 3000
Write-Host ""
Write-Host "Starting dev server on port 3000..." -ForegroundColor Cyan
& next dev -p 3000
