$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host '[quick-start] 生成配置中...'
node .\server\scripts\buildGameConfig.js
