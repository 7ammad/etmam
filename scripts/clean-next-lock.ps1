# Clean Next.js lock file to prevent "Unable to acquire lock" errors
# This script removes stale lock files that can occur after crashes or force quits

$lockFile = ".next\dev\lock"
$devDir = ".next\dev"

# Remove lock file if it exists
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "Removed stale lock file"
}

# If lock file still exists or .next\dev has issues, remove entire directory
if ((Test-Path $lockFile) -or -not (Test-Path $devDir)) {
    if (Test-Path $devDir) {
        Remove-Item $devDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Removed .next\dev directory"
    }
}

# Ensure .next\dev directory exists (Next.js will recreate it)
if (-not (Test-Path $devDir)) {
    New-Item -Path $devDir -ItemType Directory -Force | Out-Null
    Write-Host "Created .next\dev directory"
}

Write-Host "Lock cleanup complete"
