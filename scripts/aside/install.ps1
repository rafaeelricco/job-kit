# Aside channel installer for Windows: copies kit skills into the Aside skills root.
# Windows PowerShell 5.1 and PowerShell 7. Local checkout only; no clone.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot '..\agents\lib.ps1')
. (Join-Path $PSScriptRoot 'lib.ps1')
. (Join-Path $PSScriptRoot '..\common.ps1')

$script:RepoRoot = Get-FullPathNormalized (Join-Path $PSScriptRoot '..\..')
$script:DryRun = 0

function Show-AsideUsage {
  @'
Install job-kit Aside skills (full copy into the Aside skills root).

Usage: aside\install.ps1 [--dry-run]
       aside\install.ps1 -h|--help

Options:
  --dry-run   Print the plan, copy nothing
  -h, --help  Show this help

Every run prints a plan first. On a console, confirm with [Y/n]; redirected
stdin applies after the plan. A foreign destination fails and names the path -
remove it and re-run. Kit-owned destinations refresh.

Environment:
  ASIDE_SKILLS   Absolute Aside builtin root (escape hatch)
  ASIDE_ACCOUNT  Aside account profile (default 0)
'@ | Write-Host
}

function New-PlanRowAside {
  param([string]$Dest, [string]$Name, [string]$Source)
  if (-not (Test-Path -LiteralPath $Source -PathType Container) -or -not (Test-Path -LiteralPath (Join-Path $Source 'SKILL.md') -PathType Leaf)) {
    return (New-PlanRow 'N' 'source missing' $Dest)
  }
  if ((Test-Path -LiteralPath $Dest) -or (Test-ReparsePoint $Dest)) {
    if ((Test-AsideKitOwned $Dest $script:RepoRoot $Name) -or (Test-ExactLink $Dest $Source)) {
      return (New-PlanRow 'I' 'copy (refresh)' $Dest)
    }
    return (New-PlanRow 'N' 'foreign' $Dest)
  }
  return (New-PlanRow 'I' 'copy' $Dest)
}

function Get-PlanRowsAside {
  $destRoot = Resolve-AsideSkillsRoot
  $parent = Split-Path $destRoot -Parent
  $rows = New-Object System.Collections.Generic.List[object]
  $rows.Add((New-PlanRow 'H' 'aside' $destRoot)) | Out-Null
  if (-not (Test-Path -LiteralPath $destRoot -PathType Container) -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
    $rows.Add((New-PlanRow 'N' 'parent missing' $parent)) | Out-Null
    return $rows
  }
  foreach ($name in $script:AsideSkillNames) {
    $source = Get-SkillSource $script:RepoRoot $name
    $dest = Get-SkillDest $destRoot $name
    $rows.Add((New-PlanRowAside $dest $name $source)) | Out-Null
  }
  return $rows
}

function Install-Aside {
  $destRoot = Resolve-AsideSkillsRoot
  $parent = Split-Path $destRoot -Parent
  if (-not (Test-Path -LiteralPath $destRoot -PathType Container) -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
    Write-KitDie "Aside skills parent missing: $parent`n  Install Aside Browser and sign in first (expected under ~/.aside)."
  }
  Install-AsideSkillsInto $destRoot $script:RepoRoot 0
  Remove-AsideLegacyUserSkills $script:RepoRoot $destRoot $script:AsideSkillNames
}

function Invoke-AsidePlan {
  if (-not (Test-Path -LiteralPath (Join-Path $script:RepoRoot 'skill') -PathType Container)) {
    Write-KitDie "not a job-kit checkout (missing skill/): $($script:RepoRoot)"
  }

  $rows = @(Get-PlanRowsAside)
  Write-Plan $rows
  $installs = Get-PlanCount $rows @('I')
  Write-Host "$installs installs"
  Write-Host ''

  if (Test-PlanHasBlockers $rows) {
    Write-KitDie 'plan has blocked paths (source missing, or a foreign path at the destination); remove the named path and re-run'
  }

  if ($script:DryRun -eq 1) {
    Write-Host '--dry-run: nothing has been touched.'
    return
  }

  if ($installs -eq 0) {
    $hasParentMissing = $false
    $hasUpToDate = $false
    foreach ($row in $rows) {
      if ($row.Label -eq 'parent missing') { $hasParentMissing = $true }
      if ($row.Label -eq 'up to date') { $hasUpToDate = $true }
    }
    if ($hasParentMissing -and -not $hasUpToDate) {
      Write-KitDie 'nothing to install: required parent directories are missing (see plan)'
    }
    Write-Host 'nothing to install.'
    return
  }

  if (-not (Confirm-Plan $installs)) { exit 1 }
  Write-Host ''
  Write-Host 'applying'
  Install-Aside
  Write-Host ''
  Write-Host "done - $installs installs - 0 failed"
}

function Invoke-AsideMain {
  param([string[]]$Argv = @())
  if ($null -eq $Argv) { $Argv = @() }

  if ($env:HOME -match "`r|`n") { Write-KitDie 'HOME must not contain a line break' }
  if ($env:ASIDE_SKILLS -match "`r|`n") { Write-KitDie 'ASIDE_SKILLS must not contain a line break' }
  if ($env:ASIDE_ACCOUNT -match "`r|`n") { Write-KitDie 'ASIDE_ACCOUNT must not contain a line break' }

  $i = 0
  while ($i -lt $Argv.Count) {
    $a = $Argv[$i]
    switch -Regex ($a) {
      '^-h$|^--help$' { Show-AsideUsage; exit 0 }
      '^--dry-run$' { $script:DryRun = 1 }
      default { Write-KitDie "unknown option: $a (see --help)" }
    }
    $i++
  }

  Invoke-AsidePlan
}

Invoke-AsideMain @($args)
