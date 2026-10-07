# One-time local setup: creates the `ajvlms` database user + database
# using the password already generated in .env.
# You'll be asked for YOUR postgres superuser password (the one from installing PostgreSQL).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$line = Get-Content (Join-Path $root ".env") | Where-Object { $_ -match '^DATABASE_URL=' }
if ($line -notmatch 'postgres://([^:]+):([^@]+)@[^/]+/(\w+)') { throw "DATABASE_URL in .env is not in the expected format" }
$dbUser, $dbPass, $dbName = $Matches[1], $Matches[2], $Matches[3]
if ($dbUser -notmatch '^[a-z_][a-z0-9_]*$' -or $dbName -notmatch '^[a-z_][a-z0-9_]*$') { throw "Database user/name in .env must be lowercase letters, digits or _" }

$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psql)) { throw "psql not found at $psql. Is PostgreSQL 16 installed?" }

# SQL is sent over stdin, never as an argument: Windows PowerShell 5.1 mangles quotes in
# native-command arguments, and argv is visible to other processes.
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)

# Windows PowerShell does not stop on a failing native command, so check every psql exit code.
function Invoke-Psql([string]$Sql, [string]$Step) {
  $out = $Sql | & $psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -tA -q -f -
  if ($LASTEXITCODE -ne 0) {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "Setup FAILED while: $Step" -ForegroundColor Red
    Write-Host "If you saw 'password authentication failed for user ""postgres""', the postgres password was wrong. Run 'pnpm db:setup' again." -ForegroundColor Yellow
    exit 1
  }
  return $out
}

$secure = Read-Host "Enter your postgres superuser password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

$quotedPass = "'" + $dbPass.Replace("'", "''") + "'"
$sql = @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$dbUser') THEN
    CREATE ROLE $dbUser LOGIN PASSWORD $quotedPass;
  ELSE
    ALTER ROLE $dbUser WITH LOGIN PASSWORD $quotedPass;
  END IF;
END `$`$;
"@
Invoke-Psql $sql "creating the '$dbUser' database user" | Out-Null
$exists = Invoke-Psql "SELECT 1 FROM pg_database WHERE datname = '$dbName';" "checking for the '$dbName' database"
if ("$exists".Trim() -ne "1") { Invoke-Psql "CREATE DATABASE $dbName OWNER $dbUser;" "creating the '$dbName' database" | Out-Null }

Remove-Item Env:PGPASSWORD
Write-Host "Database '$dbName' ready, owned by '$dbUser'." -ForegroundColor Green
