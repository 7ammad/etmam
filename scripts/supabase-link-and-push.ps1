# Link to the Supabase project from .env.local and push pending migrations.
# Prerequisite: Run `pnpm supabase login` once (opens browser).
# Optional: Set SUPABASE_DB_PASSWORD in .env.local for non-interactive link (Database password from Dashboard -> Settings -> Database).

$ErrorActionPreference = "Stop"
$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Create it from .env.local.template and set NEXT_PUBLIC_SUPABASE_URL."
  exit 1
}

$urlLine = Get-Content $envFile | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=(.+)$' } | Select-Object -First 1
if (-not $urlLine) {
  Write-Error "NEXT_PUBLIC_SUPABASE_URL not found in .env.local."
  exit 1
}
$url = ($urlLine -split "=", 2)[1].Trim().Trim('"').Trim("'")
try {
  $hostPart = [System.Uri]$url | Select-Object -ExpandProperty Host
} catch {
  Write-Error "Invalid NEXT_PUBLIC_SUPABASE_URL in .env.local."
  exit 1
}
$ref = $hostPart -replace '\.supabase\.co$', '' -replace '^([^.]+)\..*', '$1'
if (-not $ref) {
  Write-Error "Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL."
  exit 1
}

# Load .env.local into env for this process (so SUPABASE_DB_PASSWORD is used if set)
Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Za-z_]+\s*=' } | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_0-9]+)\s*=\s*(.*)$') {
    $key = $matches[1]
    $val = $matches[2].Trim().Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($key, $val, "Process")
  }
}

Write-Host "Linking to project ref: $ref"
& pnpm supabase link --project-ref $ref
if ($LASTEXITCODE -ne 0) {
  Write-Host "Link failed. Run 'pnpm supabase login' once, then retry. If prompted for database password, get it from Supabase Dashboard -> Settings -> Database."
  exit $LASTEXITCODE
}

Write-Host "Pushing migrations..."
& pnpm supabase db push
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
Write-Host "Done. Migrations applied to your Supabase project. Use the app locally (pnpm dev) with the same .env.local; auth and DB are on your project."
