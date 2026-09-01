# Single job-kit uninstaller for Windows: interactive menu or target args.
# Agents + browser-use + profile + cache. Aside is not available on Windows 11.
# Windows PowerShell 5.1 and PowerShell 7.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot 'agents\lib.ps1')

$script:RepoRoot = Get-FullPathNormalized (Join-Path $PSScriptRoot '..')
$script:JobKitHome = Get-JobKitHomePath
$script:Yes = 0
$script:SkipClaude = 0
$script:SkipCodex = 0
$script:SkipGrok = 0
$script:SkipHermes = 0
$script:DryRun = 0
$script:OnlyTargets = @()
$script:UninstallTargets = @()

$script:KitOwnershipFiles = @(
  'scripts\agents\install.sh',
  'scripts\agents\lib.sh',
  'scripts\aside\install.sh',
  'scripts\aside\lib.sh',
  'skill\job-profile-init\SKILL.md',
  'skill\job-scout\SKILL.md'
)

function Write-KitDie {
  param([Parameter(ValueFromRemainingArguments = $true)][object[]]$Message)
  $text = ($Message | ForEach-Object { "$_" }) -join ' '
  [Console]::Error.WriteLine("error: $text")
  exit 1
}

function Test-IsConsoleInput {
  try {
    return -not [Console]::IsInputRedirected
  } catch {
    return $true
  }
}

function Show-UninstallUsage {
  @'
Uninstall job-kit (Windows: agents + browser-use + profile + cache).
Aside is not available on Windows 11.

Usage: uninstall.ps1                 # interactive menu (console required)
       uninstall.ps1 <target>...       # non-interactive (one or more targets)
       uninstall.ps1 -h|--help

Targets:
  agents       Coding-agent skills (job-profile-init, job-profile-me, job-list,
               job-match, job-stories, job-pitch, job-inbox, job-humanize,
               job-profile-root, job-resume-refine)
  browser-use  Browser skills (job-scout, job-apply) in coding-agent homes, plus
               the browser-use driver: its skill, its CLI, its state directory.
               Never a browser app
  profile      Delete profile root(s) + matching profile-root pointer
  cache        Remove kit checkout cache (JOB_KIT_HOME), kit-owned only
  all          agents + browser-use + profile + cache

Options:
  -y, --yes     Skip confirmations (profile / all / cache)
  --dry-run     Print the plan, run every guard, remove nothing
  --only LIST   Comma-separated subset, instead of positional targets:
                agents | browser-use | claude | codex | grok | hermes
                profile | cache
                (claude|codex|grok|hermes narrow a channel named alongside them;
                alone they mean the agents channel)
  --skip-claude|--skip-codex|--skip-grok|--skip-hermes
                Applied only when agents or browser-use runs

Every run prints a plan first. A plan holding profile or cache data requires
typing yes; anything re-installable takes [Y/n]. --yes skips both.

Profile path: $XDG_CONFIG_HOME\job-kit when set, otherwise %USERPROFILE%\.config\job-kit.

Environment:
  JOB_KIT_HOME   Kit cache (default $XDG_DATA_HOME\job-kit or ~\.local\share\job-kit)
  CLAUDE_SKILLS  Same override as the installer
'@ | Write-Host
}

function Get-PathDisplay {
  param([Parameter(Mandatory = $true)][string]$Path)
  $userHome = $script:KitHome
  if (Test-PathsEqual $Path $userHome) { return '~' }
  $prefix = (Get-FullPathNormalized $userHome) + '\'
  $full = $Path
  try { $full = Get-FullPathNormalized $Path } catch { $full = $Path }
  if ($full.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
    return '~/' + (($full.Substring($prefix.Length)) -replace '\\', '/')
  }
  return $Path
}

function Get-SkillLeaf {
  param([string]$Root, [string]$Path)
  if (-not $Root -or -not $Path) { return '' }
  $rootN = $Root
  $pathN = $Path
  try { $rootN = Get-FullPathNormalized $Root } catch { }
  try { $pathN = Get-FullPathNormalized $Path } catch { }
  $prefix = $rootN.TrimEnd('\') + '\'
  if (-not $pathN.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { return '' }
  $rest = $pathN.Substring($prefix.Length)
  if (-not $rest -or $rest.Contains('\') -or $rest.Contains('/')) { return '' }
  return $rest
}

function New-PlanRow {
  param([string]$Kind, [string]$Label, [string]$Path)
  return [pscustomobject]@{ Kind = $Kind; Label = $Label; Path = $Path }
}

function Test-AgentSkipped {
  param([string]$Target)
  switch ($Target) {
    'claude' { return ($script:SkipClaude -eq 1) }
    'codex'  { return ($script:SkipCodex -eq 1) }
    'grok'   { return ($script:SkipGrok -eq 1) }
    'hermes' { return ($script:SkipHermes -eq 1) }
    default { return $false }
  }
}

function Get-JobKitConfig {
  if ($env:XDG_CONFIG_HOME) {
    if ($env:XDG_CONFIG_HOME -match "`r|`n") {
      Write-KitDie 'XDG_CONFIG_HOME must not contain a line break'
    }
    if (-not (Test-RootedPath $env:XDG_CONFIG_HOME)) {
      Write-KitDie "XDG_CONFIG_HOME must be an absolute path (got: $($env:XDG_CONFIG_HOME)); unset it to use the host default"
    }
    return (Join-Path (Get-FullPathNormalized $env:XDG_CONFIG_HOME) 'job-kit')
  }
  return (Join-Path $script:KitHome '.config\job-kit')
}

function Get-HostDefaultRoot {
  return (Join-Path $script:KitHome '.config\job-kit')
}

function Get-BrowserHarnessState {
  if ($env:XDG_CONFIG_HOME) {
    if ($env:XDG_CONFIG_HOME -match "`r|`n") {
      Write-KitDie 'XDG_CONFIG_HOME must not contain a line break'
    }
    if (-not (Test-RootedPath $env:XDG_CONFIG_HOME)) {
      Write-KitDie "XDG_CONFIG_HOME must be an absolute path (got: $($env:XDG_CONFIG_HOME)); unset it to use the host default"
    }
    return (Join-Path (Get-FullPathNormalized $env:XDG_CONFIG_HOME) 'browser-harness')
  }
  return (Join-Path $script:KitHome '.config\browser-harness')
}

function Get-ProfilePointerFile {
  return (Join-Path $script:KitHome '.config\profile-root')
}

function Read-ProfilePointer {
  param([string]$File)
  if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { return '' }
  $line = ([IO.File]::ReadAllText($File) -replace "`r|`n", '').Trim()
  if (-not $line) { return '' }
  if (-not (Test-RootedPath $line)) {
    Write-KitDie "profile-root pointer $File must be an absolute path (got: $line)"
  }
  return $line
}

function Get-ProfileDeleteCandidates {
  $out = New-Object System.Collections.Generic.List[string]
  $out.Add((Get-JobKitConfig)) | Out-Null
  $out.Add((Get-HostDefaultRoot)) | Out-Null
  $ptr = Read-ProfilePointer (Get-ProfilePointerFile)
  if ($ptr) { $out.Add($ptr) | Out-Null }
  return $out.ToArray()
}

function Get-ResolvePhysical {
  param([string]$Path)
  $head = $Path.TrimEnd('\')
  if ($head.Length -eq 2 -and $head[1] -eq ':') { $head = $head + '\' }
  $tail = ''
  while ($head.Length -gt 3 -and -not (Test-Path -LiteralPath $head -PathType Container)) {
    $leaf = Split-Path $head -Leaf
    $tail = '\' + $leaf + $tail
    $parent = Split-Path $head -Parent
    if (-not $parent -or $parent -ieq $head) { break }
    $head = $parent
  }
  if (Test-Path -LiteralPath $head -PathType Container) {
    try { $head = Resolve-PhysicalPath $head } catch { }
  }
  if ($head.EndsWith('\') -and $head.Length -eq 3) {
    return ($head.TrimEnd('\') + $tail)
  }
  return ($head + $tail)
}

function Test-PathContains {
  param([string]$Ancestor, [string]$Descendant)
  $a = $Ancestor.TrimEnd('\')
  $b = $Descendant.TrimEnd('\')
  if ($a.Length -eq 2 -and $a[1] -eq ':') {
    return $b.StartsWith(($a + '\'), [StringComparison]::OrdinalIgnoreCase)
  }
  $prefix = $a + '\'
  return $b.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)
}

function Test-PathsOverlap {
  param([string]$A, [string]$B)
  $a = Get-ResolvePhysical $A
  $b = Get-ResolvePhysical $B
  if ($a -ieq $b) { return $true }
  if (Test-PathContains $a $b) { return $true }
  if (Test-PathContains $b $a) { return $true }
  return $false
}

function Assert-ProfilePath {
  param([string]$Path)
  if (Test-PathsOverlap $Path $script:RepoRoot) {
    Write-KitDie "refusing to delete profile root overlapping the executing checkout: $Path (checkout: $($script:RepoRoot))"
  }
  $cache = $script:JobKitHome
  if (Test-Path -LiteralPath $script:JobKitHome -PathType Container) {
    try { $cache = Resolve-PhysicalPath $script:JobKitHome } catch { $cache = $script:JobKitHome }
  }
  if ((Test-PathsOverlap $Path $script:JobKitHome) -or (Test-PathsOverlap $Path $cache)) {
    Write-KitDie "refusing to delete profile root overlapping the kit cache: $Path (cache: $cache)"
  }
}

function Get-ProfileProbeMissing {
  param([string]$Dir)
  foreach ($rel in @('data\candidate.yaml', 'data\job_search.yaml')) {
    if (-not (Test-Path -LiteralPath (Join-Path $Dir $rel) -PathType Leaf)) {
      return ($rel -replace '\\', '/')
    }
  }
  return ''
}

function Confirm-TypedYes {
  param([string]$Prompt)
  if ($script:Yes -eq 1) { return $true }
  Write-Host -NoNewline $Prompt
  $answer = [Console]::In.ReadLine()
  if ($null -eq $answer) { $answer = '' }
  if ($answer.Trim() -eq 'yes') { return $true }
  [Console]::Error.WriteLine('aborted (type yes to confirm).')
  return $false
}

function Get-OwnedByRoot {
  param([string]$Path, [string]$Name, [string[]]$Roots)
  $current = $null
  if (Test-ReparsePoint $Path) {
    $current = Get-LinkTarget $Path
  } else {
    return $null
  }
  if (-not $current) { return $null }
  foreach ($root in $Roots) {
    $expected = Get-SkillSource $root $Name
    if (Test-PathsEqual $current $expected) { return $Path }
  }
  return $null
}

function New-UninstallSkillRow {
  param([string]$Dest, [string]$Name, [string]$Tag)
  $hit = Get-OwnedByRoot $Dest $Name @($script:RepoRoot)
  if ($hit) {
    return (New-PlanRow 'I' "remove link ($Tag)" $Dest)
  }
  if ((Test-Path -LiteralPath $Dest) -or (Test-ReparsePoint $Dest)) {
    return (New-PlanRow 'N' 'not kit-owned' $Dest)
  }
  if ($Tag -eq 'current') {
    return (New-PlanRow 'N' 'not installed' $Dest)
  }
  return $null
}

function Get-PlanRowsAgents {
  $rows = New-Object System.Collections.Generic.List[object]
  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }
  if ($override) {
    $rows.Add((New-PlanRow 'H' 'agents (override)' $override)) | Out-Null
    $names = $script:LegacySkillNames + @(Get-AgentsNamesForRoot $override $script:RepoRoot)
    foreach ($name in $names) {
      $row = New-UninstallSkillRow (Get-SkillDest $override $name) $name 'current'
      if ($row) { $rows.Add($row) | Out-Null }
    }
    return $rows
  }
  foreach ($target in $script:AgentTargets) {
    $root = Get-AgentSkillsRoot $target
    $label = Get-AgentLabel $target
    if (Test-AgentSkipped $target) {
      $rows.Add((New-PlanRow 'N' "skipped (--skip-$target)" $root)) | Out-Null
      continue
    }
    $parent = Get-AgentParentDir $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container) -and -not (Test-Path -LiteralPath $root -PathType Container)) {
      $rows.Add((New-PlanRow 'N' 'nothing to uninstall' $root)) | Out-Null
      continue
    }
    $rows.Add((New-PlanRow 'H' "agents - $label" $root)) | Out-Null
    foreach ($name in $script:LegacySkillNames) {
      $row = New-UninstallSkillRow (Get-SkillDest $root $name) $name 'legacy'
      if ($row) { $rows.Add($row) | Out-Null }
    }
    foreach ($name in @(Get-AgentsNamesForRoot $root $script:RepoRoot)) {
      $row = New-UninstallSkillRow (Get-SkillDest $root $name) $name 'current'
      if ($row) { $rows.Add($row) | Out-Null }
    }
  }
  $legacyRoot = Join-Path $script:KitHome '.codex\skills'
  if ((Test-Path -LiteralPath $legacyRoot) -or (Test-ReparsePoint $legacyRoot)) {
    $rows.Add((New-PlanRow 'H' 'agents (legacy Codex root)' $legacyRoot)) | Out-Null
    foreach ($name in ($script:SkillNames + $script:LegacySkillNames)) {
      $row = New-UninstallSkillRow (Get-SkillDest $legacyRoot $name) $name 'legacy'
      if ($row) { $rows.Add($row) | Out-Null }
    }
  }
  return $rows
}

function Add-BrowserSharedDepRows {
  param([object]$Rows, [string]$PlanRoot)
  if ($script:UninstallTargets -contains 'agents') {
    foreach ($pname in $script:BrowserSharedDeps) {
      $row = New-UninstallSkillRow (Get-SkillDest $PlanRoot $pname) $pname 'current'
      if ($row) { $Rows.Add($row) | Out-Null }
    }
    return
  }
  if (Test-AgentsHomeOwned $PlanRoot $script:RepoRoot) { return }
  foreach ($pname in $script:BrowserSharedDeps) {
    $row = New-UninstallSkillRow (Get-SkillDest $PlanRoot $pname) $pname 'current'
    if ($row) { $Rows.Add($row) | Out-Null }
  }
}

function Get-PlanRowsBrowserUse {
  $rows = New-Object System.Collections.Generic.List[object]
  $state = Get-BrowserHarnessState
  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }

  if ($override) {
    $rows.Add((New-PlanRow 'H' 'browser-use (override)' $override)) | Out-Null
    foreach ($name in $script:BrowserSkillNames) {
      $row = New-UninstallSkillRow (Get-SkillDest $override $name) $name 'current'
      if ($row) { $rows.Add($row) | Out-Null }
    }
    foreach ($name in $script:BrowserLegacySkillNames) {
      $row = New-UninstallSkillRow (Get-SkillDest $override $name) $name 'legacy'
      if ($row) { $rows.Add($row) | Out-Null }
    }
    Add-BrowserSharedDepRows $rows $override
  } else {
    foreach ($target in $script:AgentTargets) {
      $root = Get-AgentSkillsRoot $target
      $label = Get-AgentLabel $target
      if (Test-AgentSkipped $target) {
        $rows.Add((New-PlanRow 'N' "skipped (--skip-$target)" $root)) | Out-Null
        continue
      }
      $parent = Get-AgentParentDir $target
      if (-not (Test-Path -LiteralPath $parent -PathType Container) -and -not (Test-Path -LiteralPath $root -PathType Container)) {
        $rows.Add((New-PlanRow 'N' 'nothing to uninstall' $root)) | Out-Null
        continue
      }
      $rows.Add((New-PlanRow 'H' "browser-use - $label" $root)) | Out-Null
      foreach ($name in $script:BrowserSkillNames) {
        $row = New-UninstallSkillRow (Get-SkillDest $root $name) $name 'current'
        if ($row) { $rows.Add($row) | Out-Null }
      }
      foreach ($name in $script:BrowserLegacySkillNames) {
        $row = New-UninstallSkillRow (Get-SkillDest $root $name) $name 'legacy'
        if ($row) { $rows.Add($row) | Out-Null }
      }
      Add-BrowserSharedDepRows $rows $root
    }
  }

  $rows.Add((New-PlanRow 'H' 'browser-use - driver (not kit-owned)' 'browser-use')) | Out-Null
  if ($override) {
    $dest = Join-Path $override 'browser-use'
    if ((Test-Path -LiteralPath $dest) -or (Test-ReparsePoint $dest)) {
      $rows.Add((New-PlanRow 'I' 'remove driver' $dest)) | Out-Null
    }
  }
  foreach ($target in $script:AgentTargets) {
    $root = Get-AgentSkillsRoot $target
    $dest = Join-Path $root 'browser-use'
    if ($override -and (Test-PathsEqual $dest (Join-Path $override 'browser-use'))) { continue }
    $skipped = $false
    if (Test-AgentSkipped $target) { $skipped = $true }
    if (-not (Test-Path -LiteralPath $dest) -and -not (Test-ReparsePoint $dest)) {
      continue
    } elseif ($skipped) {
      $rows.Add((New-PlanRow 'N' "driver skipped (--skip-$target)" $dest)) | Out-Null
    } else {
      $rows.Add((New-PlanRow 'I' 'remove driver' $dest)) | Out-Null
    }
  }
  if (Test-HasCommand 'browser-use') {
    $bin = (Get-Command 'browser-use').Source
    $rows.Add((New-PlanRow 'I' 'remove CLI' $bin)) | Out-Null
  }
  if (Test-Path -LiteralPath $state -PathType Container) {
    $rows.Add((New-PlanRow 'I' 'remove state' $state)) | Out-Null
  }
  $rows.Add((New-PlanRow 'N' 'left installed' 'Google Chrome (this kit never removes a browser)')) | Out-Null
  return $rows
}

function Get-PlanRowsProfile {
  $rows = New-Object System.Collections.Generic.List[object]
  $existing = New-Object System.Collections.Generic.List[string]
  $rows.Add((New-PlanRow 'H' 'profile' (Get-JobKitConfig))) | Out-Null
  foreach ($path in @(Get-ProfileDeleteCandidates)) {
    if (-not $path) { continue }
    if (-not (Test-Path -LiteralPath $path) -and -not (Test-ReparsePoint $path)) { continue }
    if ((Test-ReparsePoint $path) -and (Test-Path -LiteralPath $path -PathType Container)) {
      $rows.Add((New-PlanRow 'X' 'remove alias' $path)) | Out-Null
      $path = Resolve-PhysicalPath $path
    }
    $seen = $false
    foreach ($e in $existing) {
      if (Test-PathsEqual $e $path) { $seen = $true; break }
    }
    if ($seen) { continue }
    $existing.Add($path) | Out-Null
    $rows.Add((New-PlanRow 'X' 'DELETE TREE' $path)) | Out-Null
  }
  if ($existing.Count -eq 0) {
    $rows.Add((New-PlanRow 'N' 'already absent' (Get-JobKitConfig))) | Out-Null
  }
  $pointer = Get-ProfilePointerFile
  if (Test-Path -LiteralPath $pointer -PathType Leaf) {
    $rows.Add((New-PlanRow 'I' 'clear pointer' $pointer)) | Out-Null
  } else {
    $rows.Add((New-PlanRow 'N' 'pointer absent' $pointer)) | Out-Null
  }
  return $rows
}

function Get-PlanRowsCache {
  $rows = New-Object System.Collections.Generic.List[object]
  $raw = $script:JobKitHome
  $rows.Add((New-PlanRow 'H' 'cache' $raw)) | Out-Null
  if (-not (Test-Path -LiteralPath $raw) -and -not (Test-ReparsePoint $raw)) {
    $rows.Add((New-PlanRow 'N' 'already absent' $raw)) | Out-Null
    return $rows
  }
  $dest = $raw
  if (Test-ReparsePoint $raw) {
    $dest = Resolve-PhysicalPath $raw
  } elseif (Test-Path -LiteralPath $raw -PathType Container) {
    $dest = Resolve-PhysicalPath $raw
  }
  $rows.Add((New-PlanRow 'X' 'PURGE CACHE' $dest)) | Out-Null
  if (Test-ReparsePoint $raw) {
    $rows.Add((New-PlanRow 'X' 'remove alias' $raw)) | Out-Null
  }
  return $rows
}

function Get-BuildPlan {
  param([string[]]$Targets)
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($t in $Targets) {
    switch ($t) {
      'agents' { foreach ($r in (Get-PlanRowsAgents)) { $rows.Add($r) | Out-Null } }
      'browser-use' { foreach ($r in (Get-PlanRowsBrowserUse)) { $rows.Add($r) | Out-Null } }
      'profile' { foreach ($r in (Get-PlanRowsProfile)) { $rows.Add($r) | Out-Null } }
      'cache' { foreach ($r in (Get-PlanRowsCache)) { $rows.Add($r) | Out-Null } }
    }
  }
  return $rows
}

function Get-PlanCount {
  param([object[]]$Rows, [string[]]$Kinds)
  $n = 0
  foreach ($row in $Rows) {
    if ($Kinds -contains $row.Kind) { $n++ }
  }
  return $n
}

function Write-UninstallPlan {
  param([object[]]$Rows)
  $sectionRoot = ''
  $sectionStarted = $false
  $script:pendLabel = ''
  $script:pendNames = ''

  Write-Host 'job-kit uninstall - plan'
  Write-Host ''
  foreach ($row in $Rows) {
    if (-not $row.Kind) { continue }
    if ($row.Kind -eq 'H') {
      if ($script:pendLabel) {
        Write-Host ("  {0,-16} {1}" -f $script:pendLabel, $script:pendNames)
        $script:pendLabel = ''
        $script:pendNames = ''
      }
      if ($sectionStarted) { Write-Host '' }
      $sectionStarted = $true
      $sectionRoot = $row.Path
      Write-Host ("{0}  -  {1}" -f $row.Label, (Get-PathDisplay $row.Path))
      continue
    }

    $leaf = ''
    if ($sectionRoot) { $leaf = Get-SkillLeaf $sectionRoot $row.Path }

    if ($row.Kind -eq 'N' -and $leaf) {
      if ($script:pendLabel -eq $row.Label) {
        $script:pendNames = $script:pendNames + ', ' + $leaf
        continue
      }
      if ($script:pendLabel) {
        Write-Host ("  {0,-16} {1}" -f $script:pendLabel, $script:pendNames)
      }
      $script:pendLabel = $row.Label
      $script:pendNames = $leaf
      continue
    }

    if ($script:pendLabel) {
      Write-Host ("  {0,-16} {1}" -f $script:pendLabel, $script:pendNames)
      $script:pendLabel = ''
      $script:pendNames = ''
    }

    if ($row.Kind -eq 'I' -and $leaf -and $row.Label -like 'remove link (*') {
      $rest = $row.Label.Substring('remove '.Length)
      $action = 'remove ' + ($rest -replace ' \(.*$', '')
      $tag = ([regex]::Match($row.Label, '\(([^)]+)\)$')).Groups[1].Value
      Write-Host ("  {0,-16} {1} ({2})" -f $action, $leaf, $tag)
      continue
    }

    if ($row.Kind -eq 'X') {
      Write-Host ("  {0,-16} {1}  - irreversible" -f $row.Label, (Get-PathDisplay $row.Path))
    } else {
      Write-Host ("  {0,-16} {1}" -f $row.Label, (Get-PathDisplay $row.Path))
    }
  }
  if ($script:pendLabel) {
    Write-Host ("  {0,-16} {1}" -f $script:pendLabel, $script:pendNames)
    $script:pendLabel = ''
    $script:pendNames = ''
  }
  Write-Host '--------------------------------------------------------------'
}

function Confirm-UninstallPlan {
  param([int]$Removals, [int]$Irreversible)
  if ($script:Yes -eq 1) { return $true }
  if ($Irreversible -gt 0) {
    return (Confirm-TypedYes 'Proceed? Profile/cache data cannot be recovered. Type yes: ')
  }
  Write-Host -NoNewline "Proceed? $Removals removals, all re-installable. [Y/n] "
  $answer = [Console]::In.ReadLine()
  if ($null -eq $answer) { $answer = '' }
  switch -Regex ($answer.Trim()) {
    '^$|^y$|^Y$|^yes$' { return $true }
    default {
      [Console]::Error.WriteLine('aborted.')
      return $false
    }
  }
}

function Uninstall-Agents {
  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }
  Write-Host '== job-kit agents uninstall =='
  if ($override) {
    Write-Host "== override ($override) =="
    try {
      Uninstall-SkillsFrom $override $script:RepoRoot @(Get-AgentsNamesForRoot $override $script:RepoRoot)
    } catch {
      Write-KitDie $_.Exception.Message
    }
    Write-Host "Uninstall completed for $override"
    return
  }
  foreach ($target in $script:AgentTargets) {
    if (Test-AgentSkipped $target) {
      Write-Host ("{0}: skipped (--skip-{1})." -f (Get-AgentLabel $target), $target)
      continue
    }
    $parent = Get-AgentParentDir $target
    $destRoot = Get-AgentSkillsRoot $target
    $label = Get-AgentLabel $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container) -and -not (Test-Path -LiteralPath $destRoot -PathType Container)) {
      Write-Host "${label}: nothing to uninstall ($destRoot)."
      continue
    }
    Write-Host "== $label ($destRoot) =="
    try {
      Uninstall-SkillsFrom $destRoot $script:RepoRoot @(Get-AgentsNamesForRoot $destRoot $script:RepoRoot)
    } catch {
      Write-KitDie $_.Exception.Message
    }
  }
  try {
    Remove-LegacyCodexSkillsDir $script:RepoRoot
  } catch {
    Write-KitDie $_.Exception.Message
  }
  Write-Host 'Uninstall completed'
}

function Unlink-BrowserSkillsFrom {
  param([string]$Root)
  foreach ($n in ($script:BrowserSkillNames + $script:BrowserLegacySkillNames)) {
    Unlink-Skill (Get-SkillDest $Root $n) $script:RepoRoot $n
  }
  if (Test-AgentsHomeOwned $Root $script:RepoRoot) { return }
  foreach ($n in $script:BrowserSharedDeps) {
    Unlink-Skill (Get-SkillDest $Root $n) $script:RepoRoot $n
  }
}

function Remove-DriverDest {
  param([string]$Dest)
  if (-not (Test-Path -LiteralPath $Dest) -and -not (Test-ReparsePoint $Dest)) {
    Write-Host "skipped (missing): $Dest"
    return
  }
  try {
    if (Test-ReparsePoint $Dest) {
      Remove-KitLinkOrItem $Dest
    } else {
      Remove-Item -LiteralPath $Dest -Recurse -Force
    }
  } catch {
    Write-KitDie "failed to remove driver skill: $Dest"
  }
  Write-Host "removed driver skill: $Dest"
}

function Uninstall-BrowserUse {
  $state = Get-BrowserHarnessState
  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }
  $cliFailed = $false
  Write-Host '== job-kit browser-use uninstall =='
  if ($override) {
    Write-Host "== override ($override) =="
    try {
      Unlink-BrowserSkillsFrom $override
    } catch {
      Write-KitDie $_.Exception.Message
    }
    Write-Host "Uninstall completed for $override"
  } else {
    foreach ($target in $script:AgentTargets) {
      if (Test-AgentSkipped $target) {
        Write-Host ("{0}: skipped (--skip-{1})." -f (Get-AgentLabel $target), $target)
        continue
      }
      $parent = Get-AgentParentDir $target
      $destRoot = Get-AgentSkillsRoot $target
      $label = Get-AgentLabel $target
      if (-not (Test-Path -LiteralPath $parent -PathType Container) -and -not (Test-Path -LiteralPath $destRoot -PathType Container)) {
        Write-Host "${label}: nothing to uninstall ($destRoot)."
        continue
      }
      Write-Host "== $label ($destRoot) =="
      try {
        Unlink-BrowserSkillsFrom $destRoot
      } catch {
        Write-KitDie $_.Exception.Message
      }
    }
  }

  Write-Host '== browser-use - driver (not kit-owned) =='
  if ($override) {
    Remove-DriverDest (Join-Path $override 'browser-use')
  }
  foreach ($target in $script:AgentTargets) {
    if (Test-AgentSkipped $target) {
      Write-Host ("{0}: driver skipped (--skip-{1})." -f (Get-AgentLabel $target), $target)
      continue
    }
    $dest = Join-Path (Get-AgentSkillsRoot $target) 'browser-use'
    if ($override -and (Test-PathsEqual $dest (Join-Path $override 'browser-use'))) { continue }
    Remove-DriverDest $dest
  }
  if (Test-HasCommand 'browser-use') {
    if (Test-HasCommand 'uv') {
      & uv tool uninstall browser-use
      if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine('error: uv tool uninstall browser-use failed; remove it yourself')
        $cliFailed = $true
      }
    } else {
      $bin = (Get-Command 'browser-use').Source
      [Console]::Error.WriteLine("error: browser-use CLI left installed (uv not found): $bin")
      $cliFailed = $true
    }
  }
  if (Test-Path -LiteralPath $state -PathType Container) {
    try {
      Remove-Item -LiteralPath $state -Recurse -Force
    } catch {
      Write-KitDie "failed to remove driver state: $state"
    }
    Write-Host "removed driver state: $state"
  }
  Write-Host 'Google Chrome left installed (uninstall it yourself if you want it gone).'
  if ($cliFailed) { exit 1 }
  Write-Host 'Uninstall completed'
}

function Assert-ProfileInputs {
  $null = Get-JobKitConfig
  $null = Get-HostDefaultRoot
  foreach ($root in @((Get-JobKitConfig), (Get-HostDefaultRoot))) {
    if (-not (Test-ReparsePoint $root)) { continue }
    if (-not (Test-Path -LiteralPath $root -PathType Container)) { continue }
    $target = Resolve-PhysicalPath $root
    $missing = Get-ProfileProbeMissing $target
    if ($missing) {
      Write-KitDie @"
refusing to delete profile root ${root}: it is a symlink to $target
missing or unreadable: $missing (a symlinked root is only an alias; its target must be a profile)
delete $target yourself, or remove the link
"@
    }
  }
  $file = Get-ProfilePointerFile
  $path = Read-ProfilePointer $file
  if ($path) {
    if ((Test-Path -LiteralPath $path) -or (Test-ReparsePoint $path)) {
      if (-not (Test-Path -LiteralPath $path -PathType Container)) {
        Write-KitDie "refusing to delete profile root named by ${file}: not a directory: $path"
      }
      $missing = Get-ProfileProbeMissing $path
      if ($missing) {
        Write-KitDie @"
refusing to delete profile root named by ${file}: $path
missing or unreadable: $missing (the probe activation requires before writing that pointer)
fix or remove the pointer, or delete $path yourself
"@
      }
    }
  }
}

function Clear-PointerIfMatches {
  param([string]$File, [string[]]$Paths)
  if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { return }
  $line = ([IO.File]::ReadAllText($File) -replace "`r|`n", '').Trim()
  if (-not $line) {
    Remove-Item -LiteralPath $File -Force
    Write-Host "removed empty pointer: $File"
    return
  }
  $canon = ''
  if (Test-Path -LiteralPath $line -PathType Container) {
    $canon = Get-FullPathNormalized $line
  }
  foreach ($p in $Paths) {
    if ($line -ieq $p) {
      Remove-Item -LiteralPath $File -Force
      Write-Host "removed pointer: $File"
      return
    }
    if ($canon -and (Test-Path -LiteralPath $p -PathType Container) -and (Test-PathsEqual $canon $p)) {
      Remove-Item -LiteralPath $File -Force
      Write-Host "removed pointer: $File"
      return
    }
    if ($canon -and ($canon -ieq $p)) {
      Remove-Item -LiteralPath $File -Force
      Write-Host "removed pointer: $File"
      return
    }
  }
}

function Remove-Profile {
  Assert-ProfileInputs
  $config = Get-JobKitConfig
  $hostDefault = Get-HostDefaultRoot
  $existing = New-Object System.Collections.Generic.List[string]
  $clearArgs = New-Object System.Collections.Generic.List[string]
  $aliases = New-Object System.Collections.Generic.List[string]

  foreach ($path in @(Get-ProfileDeleteCandidates)) {
    if (-not $path) { continue }
    $clearArgs.Add($path) | Out-Null
    if (-not (Test-Path -LiteralPath $path) -and -not (Test-ReparsePoint $path)) { continue }
    if ((Test-ReparsePoint $path) -and (Test-Path -LiteralPath $path -PathType Container)) {
      $aliases.Add($path) | Out-Null
      $path = Resolve-PhysicalPath $path
    }
    $seen = $false
    foreach ($e in $existing) {
      if (Test-PathsEqual $e $path) { $seen = $true; break }
    }
    if ($seen) { continue }
    Assert-ProfilePath $path
    $existing.Add($path) | Out-Null
  }

  if ($existing.Count -eq 0) {
    Write-Host "profile: already absent ($config"
    if (-not (Test-PathsEqual $config $hostDefault)) {
      Write-Host "  and $hostDefault"
    }
    Write-Host ')'
  } else {
    Write-Host 'profile paths to delete:'
    foreach ($path in $existing) { Write-Host "  $path" }
    if (-not (Confirm-TypedYes 'Permanently delete profile data (type yes): ')) { return }
    foreach ($path in $existing) {
      try {
        if (Test-ReparsePoint $path) {
          Remove-KitLinkOrItem $path
        } else {
          Remove-Item -LiteralPath $path -Recurse -Force
        }
      } catch {
        Write-KitDie "failed to remove profile: $path"
      }
      Write-Host "removed profile: $path"
    }
    foreach ($path in $aliases) {
      if ((Test-ReparsePoint $path) -and -not (Test-Path -LiteralPath $path)) {
        try { Remove-KitLinkOrItem $path } catch { Write-KitDie "failed to remove profile alias: $path" }
        Write-Host "removed profile alias: $path"
      }
    }
  }
  if ($clearArgs.Count -gt 0) {
    Clear-PointerIfMatches (Get-ProfilePointerFile) @($clearArgs.ToArray())
  }
}

function Get-KitOwnedMissing {
  param([string]$Dir)
  $skill = Join-Path $Dir 'skill'
  if ((Test-ReparsePoint $skill) -or -not (Test-Path -LiteralPath $skill -PathType Container)) {
    return 'skill/'
  }
  foreach ($rel in $script:KitOwnershipFiles) {
    $cur = $Dir
    foreach ($part in ($rel -split '\\')) {
      $cur = Join-Path $cur $part
      if (Test-ReparsePoint $cur) { return ($rel -replace '\\', '/') }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Dir $rel) -PathType Leaf)) {
      return ($rel -replace '\\', '/')
    }
  }
  return ''
}

function Get-LinksOwnedBy {
  param([string]$Dest, [string]$Scope = 'all')
  $phys = $Dest
  if (Test-Path -LiteralPath $Dest -PathType Container) {
    try { $phys = Resolve-PhysicalPath $Dest } catch { $phys = $Dest }
  }
  $found = New-Object System.Collections.Generic.List[string]
  $override = ''
  try { $override = Resolve-OverrideSkills } catch { }

  function script:Add-ScanRoot {
    param([string]$R)
    foreach ($n in ($script:AllSkillNames + $script:LegacySkillNames)) {
      $p = Get-SkillDest $R $n
      $hit = Get-OwnedByRoot $p $n @($Dest, $phys)
      if ($hit) { $found.Add($hit) | Out-Null }
    }
  }

  if ($override) { script:Add-ScanRoot $override }

  foreach ($target in $script:AgentTargets) {
    $root = Get-AgentSkillsRoot $target
    $skipScan = $false
    if ($Scope -eq 'survivors' -and -not $override -and -not (Test-AgentSkipped $target)) {
      $skipScan = $true
    }
    if (-not $skipScan) { script:Add-ScanRoot $root }
  }
  $legacy = Join-Path $script:KitHome '.codex\skills'
  if ($Scope -ne 'survivors' -or $override) {
    script:Add-ScanRoot $legacy
  }
  return $found.ToArray()
}

function Invoke-PurgePreflight {
  param([string]$Scope = 'all')
  $raw = $script:JobKitHome
  if (-not (Test-Path -LiteralPath $raw) -and -not (Test-ReparsePoint $raw)) {
    return
  }
  $dest = $raw
  if (Test-Path -LiteralPath $raw -PathType Container) {
    $dest = Resolve-PhysicalPath $raw
  }
  $missing = Get-KitOwnedMissing $dest
  if ($missing) {
    Write-KitDie "refusing to start: the cache purge would fail on a non-kit path (missing $missing): $dest"
  }
  if (-not (Test-PathsEqual $dest (Resolve-PhysicalPath $script:RepoRoot))) {
    $Scope = 'all'
  }
  $outstanding = @(Get-LinksOwnedBy $raw $Scope)
  if ($outstanding.Count -gt 0) {
    $list = $outstanding -join "`n"
    Write-KitDie "refusing to start: installed skills point at $dest and this run will not remove them:`n$list`nuninstall those skills first, or run the uninstaller from $dest"
  }
}

function Remove-Cache {
  $raw = $script:JobKitHome
  if (-not (Test-Path -LiteralPath $raw) -and -not (Test-ReparsePoint $raw)) {
    Write-Host "cache already absent: $raw"
    return
  }
  $dest = $raw
  if (Test-Path -LiteralPath $raw -PathType Container) {
    $dest = Resolve-PhysicalPath $raw
  }
  $missing = Get-KitOwnedMissing $dest
  if ($missing) {
    Write-KitDie "refusing to purge non-kit path (missing $missing): $dest"
  }
  $outstanding = @(Get-LinksOwnedBy $raw)
  if ($outstanding.Count -gt 0) {
    $list = $outstanding -join "`n"
    Write-KitDie "refusing to purge ${dest}: these still point at it, or could not be inspected:`n$list`nuninstall those skills first (`uninstall.ps1 agents browser-use`, or `all`)"
  }
  if (-not (Confirm-TypedYes "Remove kit cache at $dest (type yes): ")) { return }
  try {
    if (Test-ReparsePoint $dest) {
      Remove-KitLinkOrItem $dest
    } else {
      Remove-Item -LiteralPath $dest -Recurse -Force
    }
  } catch {
    Write-KitDie "failed to remove cache: $dest"
  }
  if ((Test-ReparsePoint $raw) -and -not (Test-PathsEqual $raw $dest)) {
    try { Remove-KitLinkOrItem $raw } catch { Write-KitDie "failed to remove cache symlink: $raw" }
  }
  Write-Host "purged cache: $dest"
}

function Invoke-PlanPreflight {
  param([string[]]$Targets)
  foreach ($t in $Targets) {
    if ($t -eq 'agents' -or $t -eq 'browser-use') {
      try { $null = Resolve-OverrideSkills } catch { Write-KitDie "refusing to start: the $t target cannot resolve its skills root" }
      if ($t -eq 'browser-use') { $null = Get-BrowserHarnessState }
    } elseif ($t -eq 'profile') {
      Assert-ProfileInputs
    }
  }
}

function Invoke-PreflightTargets {
  param([string[]]$Targets)
  foreach ($t in $Targets) {
    if ($t -eq 'profile') {
      Assert-ProfileInputs
      foreach ($root in @(Get-ProfileDeleteCandidates)) {
        if (-not $root) { continue }
        Assert-ProfilePath $root
      }
    }
  }
}

function Invoke-RunTarget {
  param([string]$Target)
  switch ($Target) {
    'agents' { Uninstall-Agents }
    'browser-use' { Uninstall-BrowserUse }
    'profile' { Remove-Profile }
    'cache' { Remove-Cache }
    default { Write-KitDie "unknown target: $Target (agents|browser-use|profile|cache|all)" }
  }
}

function Get-PlanOrder {
  param([string[]]$Targets)
  $hasCache = $false
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($t in $Targets) {
    if ($t -eq 'cache') { $hasCache = $true; continue }
    if ($out -contains $t) { continue }
    $out.Add($t) | Out-Null
  }
  if ($hasCache) { $out.Add('cache') | Out-Null }
  return $out.ToArray()
}

function Invoke-RunPlan {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Targets)
  $ordered = @(Get-PlanOrder $Targets)
  if ($ordered.Count -eq 0) { Write-KitDie 'no targets selected' }
  $script:UninstallTargets = $ordered
  $seenAgents = $ordered -contains 'agents'
  $seenBrowser = $ordered -contains 'browser-use'
  $hasCache = $ordered -contains 'cache'

  Invoke-PlanPreflight $ordered
  $rows = @(Get-BuildPlan $ordered)
  Write-UninstallPlan $rows
  $removals = Get-PlanCount $rows @('I', 'X')
  $irreversible = Get-PlanCount $rows @('X')
  Write-Host "$removals removals - $irreversible irreversible"
  Write-Host ''

  Invoke-PreflightTargets $ordered
  if ($hasCache) {
    $scope = 'all'
    if ($seenAgents -and $seenBrowser) { $scope = 'survivors' }
    Invoke-PurgePreflight $scope
  }

  if ($script:DryRun -eq 1) {
    Write-Host '--dry-run: nothing has been touched.'
    return
  }
  if ($removals -eq 0) {
    Write-Host 'nothing to remove.'
    return
  }
  if (-not (Confirm-UninstallPlan $removals $irreversible)) { exit 1 }
  $script:Yes = 1
  Write-Host ''
  Write-Host 'applying'
  foreach ($t in $ordered) {
    Invoke-RunTarget $t
  }
  Write-Host ''
  Write-Host "done - $removals removals - 0 failed"
}

function Expand-Only {
  param([Parameter(Mandatory = $true)][string]$List)
  $wantAgents = $false
  $wantBrowser = $false
  $wantProfile = $false
  $wantCache = $false
  $wantClaude = $false
  $wantCodex = $false
  $wantGrok = $false
  $wantHermes = $false
  $namedAgent = $false
  $channelNamed = $false
  foreach ($tok in ($List -split ',')) {
    $tok = $tok.Trim()
    if (-not $tok) { continue }
    switch ($tok) {
      'agents' { $wantAgents = $true; $channelNamed = $true; $wantClaude = $true; $wantCodex = $true; $wantGrok = $true; $wantHermes = $true }
      'browser-use' { $wantBrowser = $true; $channelNamed = $true }
      'claude' { $namedAgent = $true; $wantClaude = $true }
      'codex'  { $namedAgent = $true; $wantCodex = $true }
      'grok'   { $namedAgent = $true; $wantGrok = $true }
      'hermes' { $namedAgent = $true; $wantHermes = $true }
      'profile' { $wantProfile = $true }
      'cache' { $wantCache = $true }
      default { Write-KitDie "unknown --only item: $tok (agents|browser-use|claude|codex|grok|hermes|profile|cache)" }
    }
  }
  if ($namedAgent -and -not $channelNamed) { $wantAgents = $true }
  if ($namedAgent) {
    if (-not $wantClaude) { $script:SkipClaude = 1 }
    if (-not $wantCodex) { $script:SkipCodex = 1 }
    if (-not $wantGrok) { $script:SkipGrok = 1 }
    if (-not $wantHermes) { $script:SkipHermes = 1 }
  }
  $out = New-Object System.Collections.Generic.List[string]
  if ($wantAgents) { $out.Add('agents') | Out-Null }
  if ($wantBrowser) { $out.Add('browser-use') | Out-Null }
  if ($wantProfile) { $out.Add('profile') | Out-Null }
  if ($wantCache) { $out.Add('cache') | Out-Null }
  if ($out.Count -eq 0) { Write-KitDie '--only selected nothing' }
  $script:OnlyTargets = $out.ToArray()
}

function Invoke-InteractiveMenu {
  Write-Host '1. Coding-agent skills'
  Write-Host '2. browser-use skills + driver'
  Write-Host '3. Profile data (~/.config/job-kit)'
  Write-Host '4. Kit cache (JOB_KIT_HOME)'
  Write-Host '5. All of the above'
  Write-Host '6. Quit'
  Write-Host -NoNewline 'Select component to uninstall (number): '
  $choice = [Console]::In.ReadLine()
  if ($null -eq $choice) { $choice = '' }
  switch ($choice.Trim()) {
    '1' { Invoke-RunPlan 'agents' }
    '2' { Invoke-RunPlan 'browser-use' }
    '3' { Invoke-RunPlan 'profile' }
    '4' { Invoke-RunPlan 'cache' }
    '5' { Invoke-RunPlan 'agents' 'browser-use' 'profile' 'cache' }
    '6' { Write-Host 'quit' }
    default {
      [Console]::Error.WriteLine('invalid choice')
      exit 1
    }
  }
}

function Invoke-UninstallMain {
  param([string[]]$Argv = @())
  if ($null -eq $Argv) { $Argv = @() }

  if ($env:HOME -match "`r|`n") { Write-KitDie 'HOME must not contain a line break' }
  if ($env:CLAUDE_SKILLS -match "`r|`n") { Write-KitDie 'CLAUDE_SKILLS must not contain a line break' }

  $targets = New-Object System.Collections.Generic.List[string]
  $i = 0
  while ($i -lt $Argv.Count) {
    $a = $Argv[$i]
    switch -Regex ($a) {
      '^-h$|^--help$' { Show-UninstallUsage; exit 0 }
      '^-y$|^--yes$' { $script:Yes = 1 }
      '^--dry-run$' { $script:DryRun = 1 }
      '^--only$' {
        $i++
        if ($i -ge $Argv.Count) { Write-KitDie '--only needs a comma-separated list (see --help)' }
        Expand-Only $Argv[$i]
      }
      '^--only=' { Expand-Only ($a.Substring(7)) }
      '^--skip-claude$' { $script:SkipClaude = 1 }
      '^--skip-codex$' { $script:SkipCodex = 1 }
      '^--skip-grok$' { $script:SkipGrok = 1 }
      '^--skip-hermes$' { $script:SkipHermes = 1 }
      '^agents$|^browser-use$|^profile$|^cache$|^all$' { $targets.Add($a) | Out-Null }
      default { Write-KitDie "unknown option or target: $a (see --help)" }
    }
    $i++
  }

  if ($targets.Count -eq 0) {
    if ($script:OnlyTargets.Count -gt 0) {
      Invoke-RunPlan @($script:OnlyTargets)
      return
    }
    if (Test-IsConsoleInput) {
      Invoke-InteractiveMenu
      return
    }
    Write-KitDie 'need a target (agents|browser-use|profile|cache|all) when stdin is not a console'
  }
  if ($script:OnlyTargets.Count -gt 0) {
    Write-KitDie '--only cannot be combined with positional targets (see --help)'
  }

  $hasAll = $false
  foreach ($t in $targets) {
    if ($t -eq 'all') { $hasAll = $true }
  }
  if ($hasAll) {
    if ($targets.Count -ne 1) { Write-KitDie "'all' cannot be combined with other targets" }
    Invoke-RunPlan 'agents' 'browser-use' 'profile' 'cache'
    return
  }
  Invoke-RunPlan @($targets.ToArray())
}

Invoke-UninstallMain @($args)
