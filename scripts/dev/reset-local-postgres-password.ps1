#Requires -RunAsAdministrator
# DEV MACHINES ONLY: resets the local PostgreSQL 16 `postgres` superuser password
# when it has been forgotten. Never run this on the production server.
#
# What it does:
#   1. Backs up pg_hba.conf.
#   2. Temporarily lets local (127.0.0.1 / ::1) connections in WITHOUT a password and restarts PostgreSQL.
#   3. Sets the new password you type (sent to psql over stdin, never on the command line).
#   4. ALWAYS restores the byte-exact backup and restarts PostgreSQL, even if a step fails.
$ErrorActionPreference = "Stop"

$data = "C:\Program Files\PostgreSQL\16\data"
$hba = Join-Path $data "pg_hba.conf"
$service = "postgresql-x64-16"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
foreach ($p in @($hba, $psql)) { if (-not (Test-Path $p)) { throw "Not found: $p" } }

# Ask for the new password first, so nothing is changed if the two entries don't match.
function Read-Plain([string]$Prompt) {
  $s = Read-Host $Prompt -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
$new1 = Read-Plain "Choose a NEW postgres password (8+ characters)"
$new2 = Read-Plain "Type it again"
if ($new1 -ne $new2) { Write-Host "The two passwords don't match. Nothing was changed." -ForegroundColor Red; exit 1 }
if ($new1.Length -lt 8) { Write-Host "Use at least 8 characters. Nothing was changed." -ForegroundColor Red; exit 1 }
# SQL string literal: double any single quotes (standard_conforming_strings is on by default).
$sql = "ALTER USER postgres WITH PASSWORD '" + $new1.Replace("'", "''") + "';"

$backup = "$hba.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $hba $backup
Write-Host "Backed up pg_hba.conf to $backup"

$ok = $false
try {
  $original = [IO.File]::ReadAllText($hba)
  $lines = $original -split "`r?`n" | ForEach-Object {
    if ($_ -match '^\s*host\s+all\s+all\s+(127\.0\.0\.1/32|::1/128)\s+\S+') { $_ -replace '\S+\s*$', 'trust' } else { $_ }
  }
  [IO.File]::WriteAllText($hba, ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding($false)))
  Restart-Service $service
  Start-Sleep -Seconds 2

  # Send the SQL over stdin: Windows PowerShell 5.1 mangles quotes in native-command arguments,
  # and argv is visible to other processes.
  $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $sql | & $psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -q -f - | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Setting the new password failed (psql exit code $LASTEXITCODE)." }
  $ok = $true
}
finally {
  $sql = $null; $new1 = $null; $new2 = $null
  try {
    Copy-Item $backup $hba -Force   # byte-exact original
    Restart-Service $service
    Write-Host "Restored the original pg_hba.conf (password protection is back on)."
  }
  catch {
    Write-Host ""
    Write-Host "!!! TRUST AUTH MAY STILL BE ON: restoring pg_hba.conf failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "!!! Fix now: copy '$backup' over '$hba', then run: Restart-Service $service" -ForegroundColor Red
    exit 2
  }
}

if ($ok) {
  Write-Host ""
  Write-Host "Done. The postgres password is now the one you just typed." -ForegroundColor Green
  Write-Host "Next: close this admin window, then in your normal terminal run:  pnpm db:setup" -ForegroundColor Green
}
