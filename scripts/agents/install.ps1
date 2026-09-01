# Thin wrapper: coding-agent channel → unified scripts/install.ps1
$ErrorActionPreference = 'Stop'
$install = Join-Path $PSScriptRoot '..\install.ps1'
$forward = @('agents') + @($args)
& $install @forward
exit $LASTEXITCODE
