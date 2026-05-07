$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$env:SERVER_HOST = '0.0.0.0'

Write-Host "[quick-start] 以后端局域网模式启动，SERVER_HOST=$env:SERVER_HOST"
node .\server\src\server.js
