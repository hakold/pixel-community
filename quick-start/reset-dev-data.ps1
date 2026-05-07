$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host '[quick-start] 清空开发数据中...'
node .\server\scripts\resetDevData.js --yes
