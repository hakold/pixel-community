$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host '[quick-start] 启动 MongoDB / Redis ...'
docker compose up -d mongodb redis
