# Single job-kit installer for Windows: interactive menu or target args.
# Agents + browser-use only (Aside is not available on Windows 11).
# Windows PowerShell 5.1 and PowerShell 7. Local checkout only; no clone.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

. (Join-Path $PSScriptRoot 'agents\lib.ps1')

$script:RepoRoot = Get-FullPathNormalized (Join-Path $PSScriptRoot '..')
$script:Force = 0
$script:Yes = 0
$script:SkipClaude = 0
$script:SkipCodex = 0
$script:SkipGrok = 0
$script:SkipHermes = 0
$script:DryRun = 0
$script:OnlyTargets = @()
$script:SoftSkip = 0

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

function Show-InstallUsage {
  @'
Install job-kit skills (coding agents + browser-use). Aside is not available on Windows 11.

Usage: install.ps1                 # interactive menu (console required)
       install.ps1 <target>...       # non-interactive (one or more targets)
       install.ps1 -h|--help

Targets:
  agents       Coding-agent skills (job-profile-init, job-profile-me, job-list,
               job-match, job-stories, job-pitch, job-inbox, job-humanize,
               job-profile-root, job-store, job-resume-refine)
  browser-use  Browser skills (job-scout, job-apply, job-prep) plus the browser-use
               driver skill into coding-agent homes; driven by the local
               browser-use CLI
  all          agents + browser-use

Options:
  -y, --yes     Skip confirmations (console plan gate)
  --dry-run     Print the plan, install nothing
  --force       Replace foreign files/dirs/links at the destination
  --only LIST   Comma-separated subset, instead of positional targets:
                agents | browser-use | claude | codex | grok | hermes
                (claude|codex|grok|hermes narrow a channel named alongside them;
                alone they mean the agents channel)
  --skip-claude|--skip-codex|--skip-grok|--skip-hermes
                Applied when agents or browser-use runs
  -h, --help    Show this help

Every run prints a plan first. On a console, confirm with [Y/n] (or pass --yes).
Redirected stdin applies after the plan without prompting.

Environment:
  CLAUDE_SKILLS  Absolute skills directory - single dest only (escape hatch).
                 When set, skip flags are ignored.
  HOME           Absolute home (default %USERPROFILE%)

Local checkout only; no clone. Channel wrapper:
  scripts/agents/install.ps1 -> install.ps1 agents
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

function Expand-Only {
  param([Parameter(Mandatory = $true)][string]$List)
  $wantAgents = $false
  $wantBrowser = $false
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
      default { Write-KitDie "unknown --only item: $tok (agents|browser-use|claude|codex|grok|hermes)" }
    }
  }
  if ($namedAgent -and -not $channelNamed) {
    $wantAgents = $true
  }
  if ($namedAgent) {
    if (-not $wantClaude) { $script:SkipClaude = 1 }
    if (-not $wantCodex) { $script:SkipCodex = 1 }
    if (-not $wantGrok) { $script:SkipGrok = 1 }
    if (-not $wantHermes) { $script:SkipHermes = 1 }
  }
  $out = New-Object System.Collections.Generic.List[string]
  if ($wantAgents) { $out.Add('agents') | Out-Null }
  if ($wantBrowser) { $out.Add('browser-use') | Out-Null }
  if ($out.Count -eq 0) { Write-KitDie '--only selected nothing' }
  $script:OnlyTargets = $out.ToArray()
}

function Test-Chromium {
  $rels = @(
    'Google\Chrome\Application\chrome.exe',
    'Google\Chrome SxS\Application\chrome.exe',
    'Chromium\Application\chrome.exe',
    'BraveSoftware\Brave-Browser\Application\brave.exe',
    'Microsoft\Edge\Application\msedge.exe',
    'Arc\Application\Arc.exe'
  )
  $roots = New-Object System.Collections.Generic.List[string]
  if ($env:ProgramFiles) { $roots.Add($env:ProgramFiles) | Out-Null }
  $pf86 = ${env:ProgramFiles(x86)}
  if ($pf86) { $roots.Add($pf86) | Out-Null }
  if ($env:LOCALAPPDATA) { $roots.Add($env:LOCALAPPDATA) | Out-Null }
  foreach ($root in $roots) {
    foreach ($rel in $rels) {
      if (Test-Path -LiteralPath (Join-Path $root $rel) -PathType Leaf) { return $true }
    }
  }
  foreach ($cmd in @('chrome', 'chrome.exe', 'msedge', 'msedge.exe', 'chromium', 'brave', 'brave.exe')) {
    if (Test-HasCommand $cmd) { return $true }
  }
  return $false
}

function Get-BrowserUseDriverCmd {
  param([Parameter(Mandatory = $true)][string]$Root)
  $claude = Get-FullPathNormalized (Join-Path $script:KitHome '.claude\skills')
  $agents = Get-FullPathNormalized (Join-Path $script:KitHome '.agents\skills')
  $rootN = Get-FullPathNormalized $Root
  if (Test-PathsEqual $rootN $claude) {
    return 'browser-use skill install --target claude --no-install'
  }
  if (Test-PathsEqual $rootN $agents) {
    return 'browser-use skill install --target agents --no-install'
  }
  $dest = Join-Path $rootN 'browser-use'
  return "browser-use skill install --path `"$dest`" --no-install"
}

function New-PlanRowAgent {
  param([string]$Dest, [string]$Name, [string]$Source, [int]$Force)
  if (-not (Test-Path -LiteralPath $Source -PathType Container) -or -not (Test-Path -LiteralPath (Join-Path $Source 'SKILL.md') -PathType Leaf)) {
    return (New-PlanRow 'N' 'source missing' $Dest)
  }
  if (Test-ExactLink $Dest $Source) {
    return (New-PlanRow 'N' 'up to date' $Dest)
  }
  if ((Test-Path -LiteralPath $Dest) -or (Test-ReparsePoint $Dest)) {
    if ($Force -eq 1) {
      return (New-PlanRow 'I' 'link (force)' $Dest)
    }
    return (New-PlanRow 'N' 'foreign (need --force)' $Dest)
  }
  return (New-PlanRow 'I' 'link' $Dest)
}

function New-PlanRowDriver {
  param([Parameter(Mandatory = $true)][string]$Root)
  $dest = Join-Path $Root 'browser-use'
  if ((Test-Path -LiteralPath $dest) -or (Test-ReparsePoint $dest)) {
    return (New-PlanRow 'N' 'up to date' $dest)
  }
  if (Test-HasCommand 'browser-use') {
    return (New-PlanRow 'I' 'install driver' $dest)
  }
  return (New-PlanRow 'N' 'missing driver' $dest)
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

function Get-PlanRowsAgentHome {
  param([string]$Sel, [string]$Label)
  $rows = New-Object System.Collections.Generic.List[object]
  $names = $script:SkillNames
  if ($Sel -eq 'browser') {
    $names = $script:BrowserSkillNames + $script:BrowserSharedDeps
  }
  $force = $script:Force

  if ($Sel -eq 'browser') {
    $needCli = -not (Test-HasCommand 'browser-use')
    $needBrowser = -not (Test-Chromium)
    if ($needCli -or $needBrowser) {
      $rows.Add((New-PlanRow 'H' "$Label - requirements" 'offered after install')) | Out-Null
      if ($needCli) {
        $rows.Add((New-PlanRow 'N' 'missing CLI' 'uv tool install --python 3.12 browser-use')) | Out-Null
      }
      if ($needBrowser) {
        $rows.Add((New-PlanRow 'N' 'missing browser' 'winget install --id Google.Chrome -e')) | Out-Null
      }
    }
  }

  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }
  if ($override) {
    $rows.Add((New-PlanRow 'H' "$Label (override)" $override)) | Out-Null
    foreach ($name in $names) {
      $source = Get-SkillSource $script:RepoRoot $name
      $dest = Get-SkillDest $override $name
      $rows.Add((New-PlanRowAgent $dest $name $source $force)) | Out-Null
    }
    if ($Sel -eq 'browser') {
      $rows.Add((New-PlanRowDriver $override)) | Out-Null
    }
    return $rows
  }

  foreach ($target in $script:AgentTargets) {
    $root = Get-AgentSkillsRoot $target
    $agentLabel = Get-AgentLabel $target
    if (Test-AgentSkipped $target) {
      $rows.Add((New-PlanRow 'N' "skipped (--skip-$target)" $root)) | Out-Null
      continue
    }
    $parent = Get-AgentParentDir $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
      $rows.Add((New-PlanRow 'H' "$Label - $agentLabel" $root)) | Out-Null
      $rows.Add((New-PlanRow 'N' 'parent missing' $parent)) | Out-Null
      continue
    }
    $rows.Add((New-PlanRow 'H' "$Label - $agentLabel" $root)) | Out-Null
    foreach ($name in $names) {
      $source = Get-SkillSource $script:RepoRoot $name
      $dest = Get-SkillDest $root $name
      $rows.Add((New-PlanRowAgent $dest $name $source $force)) | Out-Null
    }
    if ($Sel -eq 'browser') {
      $rows.Add((New-PlanRowDriver $root)) | Out-Null
    }
  }
  return $rows
}

function Get-BuildPlan {
  param([string[]]$Targets)
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($t in $Targets) {
    switch ($t) {
      'agents' {
        foreach ($r in (Get-PlanRowsAgentHome 'profile' 'agents')) { $rows.Add($r) | Out-Null }
      }
      'browser-use' {
        foreach ($r in (Get-PlanRowsAgentHome 'browser' 'browser-use')) { $rows.Add($r) | Out-Null }
      }
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

function Test-PlanHasBlockers {
  param([object[]]$Rows)
  foreach ($row in $Rows) {
    if ($row.Kind -ne 'N') { continue }
    if ($row.Label -eq 'foreign (need --force)' -or $row.Label -eq 'source missing') {
      return $true
    }
  }
  return $false
}

function Write-Plan {
  param([object[]]$Rows)
  $sectionRoot = ''
  $sectionStarted = $false
  $pendLabel = ''
  $pendNames = ''

  function script:Flush-Pend {
    if (-not $pendLabel) { return }
    Write-Host ("  {0,-16} {1}" -f $pendLabel, $pendNames)
    $script:pendLabel = ''
    $script:pendNames = ''
  }

  # nested functions cannot assign outer locals in PS 5.1 the way bash can;
  # keep pending state on script scope for the renderer only.
  $script:pendLabel = ''
  $script:pendNames = ''

  Write-Host 'job-kit install - plan'
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

    if ($row.Kind -eq 'I' -and $leaf) {
      if (@('link', 'link (force)', 'install driver') -contains $row.Label) {
        Write-Host ("  {0,-16} {1}" -f $row.Label, $leaf)
        continue
      }
    }
    Write-Host ("  {0,-16} {1}" -f $row.Label, (Get-PathDisplay $row.Path))
  }
  if ($script:pendLabel) {
    Write-Host ("  {0,-16} {1}" -f $script:pendLabel, $script:pendNames)
    $script:pendLabel = ''
    $script:pendNames = ''
  }
  Write-Host '--------------------------------------------------------------'
}

function Confirm-Plan {
  param([int]$Installs)
  if ($script:Yes -eq 1) { return $true }
  if (-not (Test-IsConsoleInput)) { return $true }
  Write-Host -NoNewline "Proceed? $Installs installs. [Y/n] "
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

function Install-DriverInto {
  param([Parameter(Mandatory = $true)][string]$Root)
  $dest = Join-Path $Root 'browser-use'
  if ((Test-Path -LiteralPath $dest) -or (Test-ReparsePoint $dest)) {
    Write-Host "up to date: $dest"
    return
  }
  if (-not (Test-HasCommand 'browser-use')) {
    Write-Host "skipped (no CLI): $dest"
    return
  }
  Write-Host "installing driver: $dest"
  $claude = Get-FullPathNormalized (Join-Path $script:KitHome '.claude\skills')
  $agents = Get-FullPathNormalized (Join-Path $script:KitHome '.agents\skills')
  $rootN = Get-FullPathNormalized $Root
  if (Test-PathsEqual $rootN $claude) {
    & browser-use skill install --target claude --no-install
  } elseif (Test-PathsEqual $rootN $agents) {
    & browser-use skill install --target agents --no-install
  } else {
    & browser-use skill install --path (Join-Path $rootN 'browser-use') --no-install
  }
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "browser-use skill install failed for $dest"
  }
}

function Install-AgentHome {
  param([string]$Sel, [string]$Label)
  $names = $script:SkillNames
  if ($Sel -eq 'browser') {
    $names = $script:BrowserSkillNames + $script:BrowserSharedDeps
  }
  $soft = $script:SoftSkip
  $force = $script:Force
  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }
  if ($override) {
    Write-Host "== override ($override) =="
    try {
      Install-SkillsInto $override $script:RepoRoot $force $names
      if ($Sel -eq 'browser') { Install-DriverInto $override }
    } catch {
      Write-KitDie $_.Exception.Message
    }
    Write-Host "Install completed -> $override"
    return
  }

  $linked = 0
  $attempted = 0
  foreach ($target in $script:AgentTargets) {
    if (Test-AgentSkipped $target) {
      Write-Host ("{0}: skipped (--skip-{1})." -f (Get-AgentLabel $target), $target)
      continue
    }
    $parent = Get-AgentParentDir $target
    $destRoot = Get-AgentSkillsRoot $target
    $agentLabel = Get-AgentLabel $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
      Write-Host "${agentLabel}: parent missing ($parent); skipping."
      continue
    }
    $attempted++
    Write-Host "== $agentLabel ($destRoot) =="
    try {
      Install-SkillsInto $destRoot $script:RepoRoot $force $names
      $linked++
      if ($Sel -eq 'browser') { Install-DriverInto $destRoot }
    } catch {
      Write-KitDie $_.Exception.Message
    }
  }
  try {
    Remove-LegacyCodexSkillsDir $script:RepoRoot
  } catch {
    Write-KitDie $_.Exception.Message
  }
  if ($linked -eq 0) {
    if ($soft -eq 1) {
      Write-Host 'Coding agents: no agent home; skipping.'
      return
    }
    Write-KitDie "no agent targets installed (need parent dirs or CLAUDE_SKILLS)`n  expected one of: ~/.claude  ~/.agents  ~/.grok  ~/.hermes"
  }
  Write-Host "Install completed ($linked/$attempted targets)"
}

function Get-BrowserUseMissingDrivers {
  $rows = New-Object System.Collections.Generic.List[object]
  try {
    $override = Resolve-OverrideSkills
  } catch {
    Write-KitDie $_.Exception.Message
  }
  if ($override) {
    $dest = Join-Path $override 'browser-use'
    if (-not (Test-Path -LiteralPath $dest) -and -not (Test-ReparsePoint $dest)) {
      $rows.Add((New-PlanRow 'N' (Get-PathDisplay $dest) (Get-BrowserUseDriverCmd $override))) | Out-Null
    }
    return $rows
  }
  foreach ($target in $script:AgentTargets) {
    if (Test-AgentSkipped $target) { continue }
    $root = Get-AgentSkillsRoot $target
    $parent = Get-AgentParentDir $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container) -and -not (Test-Path -LiteralPath $root -PathType Container)) {
      continue
    }
    $dest = Join-Path $root 'browser-use'
    if (-not (Test-Path -LiteralPath $dest) -and -not (Test-ReparsePoint $dest)) {
      $rows.Add((New-PlanRow 'N' (Get-PathDisplay $dest) (Get-BrowserUseDriverCmd $root))) | Out-Null
    }
  }
  return $rows
}

function Invoke-BrowserUseOffer {
  param([string]$Label, [string]$Cmd)
  Write-Host "  missing: $Label"
  Write-Host "    fix: $Cmd"
  if (-not (Test-IsConsoleInput)) { return }
  Write-Host -NoNewline '    run it now? [y/N] '
  $reply = [Console]::In.ReadLine()
  if ($null -eq $reply) { $reply = '' }
  switch -Regex ($reply.Trim()) {
    '^y$|^Y$|^yes$|^YES$' {
      try {
        Invoke-Expression $Cmd
        if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
          [Console]::Error.WriteLine("    failed, run it yourself: $Cmd")
        }
      } catch {
        [Console]::Error.WriteLine("    failed, run it yourself: $Cmd")
      }
    }
  }
}

function Invoke-BrowserUsePreflight {
  $needCli = -not (Test-HasCommand 'browser-use')
  $needBrowser = -not (Test-Chromium)
  $drivers = @(Get-BrowserUseMissingDrivers)
  if (-not $needCli -and -not $needBrowser -and $drivers.Count -eq 0) { return }

  Write-Host ''
  Write-Host 'browser-use - requirements not met'
  if ($needCli) {
    if (Test-HasCommand 'uv') {
      Invoke-BrowserUseOffer 'browser-use CLI' 'uv tool install --python 3.12 browser-use'
    } else {
      Write-Host '  missing: browser-use CLI'
      Write-Host '    fix: install uv (https://docs.astral.sh/uv/), then:'
      Write-Host '         uv tool install --python 3.12 browser-use'
    }
  }
  if ($needBrowser) {
    if (Test-HasCommand 'winget') {
      Invoke-BrowserUseOffer 'a Chromium-family browser' 'winget install --id Google.Chrome -e'
    } else {
      Write-Host '  missing: a Chromium-family browser'
      Write-Host '    fix: install Google Chrome (https://www.google.com/chrome/)'
    }
  }
  foreach ($driver in $drivers) {
    if (-not $driver.Label) { continue }
    if (Test-HasCommand 'browser-use') {
      Invoke-BrowserUseOffer "browser-use driver skill ($($driver.Label))" $driver.Path
    } else {
      Write-Host "  missing: browser-use driver skill ($($driver.Label))"
      Write-Host "    fix: $($driver.Path)"
    }
  }
  Write-Host "  then, once in the browser: open chrome://inspect/#remote-debugging and"
  Write-Host "  tick 'Allow remote debugging', and sign in to the sites you scout."
  Write-Host ''
}

function Invoke-RunTarget {
  param([string]$Target)
  switch ($Target) {
    'agents' { Install-AgentHome 'profile' 'agents' }
    'browser-use' { Install-AgentHome 'browser' 'browser-use' }
    default { Write-KitDie "unknown target: $Target" }
  }
}

function Get-PlanOrder {
  param([string[]]$Targets)
  $hasAgents = $false
  $hasBrowser = $false
  foreach ($t in $Targets) {
    switch ($t) {
      'agents' { $hasAgents = $true }
      'browser-use' { $hasBrowser = $true }
      default { Write-KitDie "unknown target: $t" }
    }
  }
  $out = New-Object System.Collections.Generic.List[string]
  if ($hasAgents) { $out.Add('agents') | Out-Null }
  if ($hasBrowser) { $out.Add('browser-use') | Out-Null }
  return $out.ToArray()
}

function Invoke-RunPlan {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Targets)
  $ordered = @(Get-PlanOrder $Targets)
  if ($ordered.Count -eq 0) { Write-KitDie 'no targets selected' }
  if ($ordered.Count -gt 1) {
    $script:SoftSkip = 1
  } else {
    $script:SoftSkip = 0
  }

  if (-not (Test-Path -LiteralPath (Join-Path $script:RepoRoot 'skill') -PathType Container)) {
    Write-KitDie "not a job-kit checkout (missing skill/): $($script:RepoRoot)"
  }

  $rows = @(Get-BuildPlan $ordered)
  Write-Plan $rows
  $installs = Get-PlanCount $rows @('I')
  Write-Host "$installs installs"
  Write-Host ''

  if (Test-PlanHasBlockers $rows) {
    Write-KitDie 'plan has blocked paths (source missing or foreign without --force); fix or re-run with --force'
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
      if ($script:SoftSkip -eq 1) {
        Write-KitDie 'nothing installed: no coding-agent home'
      }
      Write-KitDie 'nothing to install: required parent directories are missing (see plan)'
    }
    Write-Host 'nothing to install.'
    if ($ordered -contains 'browser-use') { Invoke-BrowserUsePreflight }
    return
  }

  if (-not (Confirm-Plan $installs)) { exit 1 }
  Write-Host ''
  Write-Host 'applying'
  foreach ($t in $ordered) {
    Invoke-RunTarget $t
  }
  if ($ordered -contains 'browser-use') { Invoke-BrowserUsePreflight }
  Write-Host ''
  Write-Host "done - $installs installs - 0 failed"
}

function Invoke-InteractiveMenu {
  Write-Host '1. Coding-agent skills'
  Write-Host '2. browser-use skills (job-scout + job-apply + job-prep in coding agents)'
  Write-Host '3. All of the above'
  Write-Host '4. Quit'
  Write-Host -NoNewline 'Select component to install (number): '
  $choice = [Console]::In.ReadLine()
  if ($null -eq $choice) { $choice = '' }
  switch ($choice.Trim()) {
    '1' { Invoke-RunPlan 'agents' }
    '2' { Invoke-RunPlan 'browser-use' }
    '3' { Invoke-RunPlan 'agents' 'browser-use' }
    '4' { Write-Host 'quit' }
    default {
      [Console]::Error.WriteLine('invalid choice')
      exit 1
    }
  }
}

function Invoke-InstallMain {
  param([string[]]$Argv = @())
  if ($null -eq $Argv) { $Argv = @() }

  if ($env:HOME -match "`r|`n") { Write-KitDie 'HOME must not contain a line break' }
  if ($env:CLAUDE_SKILLS -match "`r|`n") { Write-KitDie 'CLAUDE_SKILLS must not contain a line break' }

  $targets = New-Object System.Collections.Generic.List[string]
  $i = 0
  while ($i -lt $Argv.Count) {
    $a = $Argv[$i]
    switch -Regex ($a) {
      '^-h$|^--help$' { Show-InstallUsage; exit 0 }
      '^-y$|^--yes$' { $script:Yes = 1 }
      '^--dry-run$' { $script:DryRun = 1 }
      '^--force$' { $script:Force = 1 }
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
      '^agents$|^browser-use$|^all$' { $targets.Add($a) | Out-Null }
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
    Write-KitDie 'need a target (agents|browser-use|all) when stdin is not a console'
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
    Invoke-RunPlan 'agents' 'browser-use'
    return
  }
  Invoke-RunPlan @($targets.ToArray())
}

Invoke-InstallMain @($args)
