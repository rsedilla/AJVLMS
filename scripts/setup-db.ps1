# One-time local setup: creates the `ajvlms` database user + database
# using the password already generated in .env.
# You'll be asked for YOUR postgres superuser password (the one from installing PostgreSQL).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$line = Get-Content (Join-Path $root ".env") | Where-Object { $_ -match '^DATABASE_URL=' }
if ($line -notmatch 'postgres://([^:]+):([^@]+)@[^/]+/(\w+)') { throw "DATABASE_URL in .env is not in the expected format" }
$dbUser, $dbPass, $dbName = $Matches[1], $Matches[2], $Matches[3]

$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$secure = Read-Host "Enter your postgres superuser password" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
$sql = @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$dbUser') THEN
    CREATE ROLE $dbUser LOGIN PASSWORD '$dbPass';
  ELSE
    ALTER ROLE $dbUser WITH LOGIN PASSWORD '$dbPass';
  END IF;
END `$`$;
"@
& $psql -U postgres -h localhost -v ON_ERROR_STOP=1 -c $sql
$exists = & $psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
if ($exists -ne "1") { & $psql -U postgres -h localhost -v ON_ERROR_STOP=1 -c "CREATE DATABASE $dbName OWNER $dbUser" }
Remove-Item Env:PGPASSWORD
Write-Host "Database '$dbName' ready, owned by '$dbUser'." -ForegroundColor Green
