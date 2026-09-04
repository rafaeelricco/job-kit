# Fetch job-kit into a cached checkout, then run the Windows channel installers.
# Agents + browser-use only (Aside is not available on Windows 11).
# Windows PowerShell 5.1 and PowerShell 7. Safe to download, then:
#   powershell -ExecutionPolicy Bypass -File remote.ps1 all
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$script:JobKitSlug = 'rafaeelricco/job-kit'
if ($env:JOB_KIT_SLUG) { $script:JobKitSlug = $env:JOB_KIT_SLUG }
$script:JobKitRef = 'main'
if ($env:JOB_KIT_REF) { $script:JobKitRef = $env:JOB_KIT_REF }

function Write-KitDie {
  param([Parameter(ValueFromRemainingArguments = $true)][object[]]$Message)
  $text = ($Message | ForEach-Object { "$_" }) -join ' '
  [Console]::Error.WriteLine("error: $text")
  exit 1
}

function Get-FullPathNormalized {
  param([Parameter(Mandatory = $true)][string]$Path)
  $full = [IO.Path]::GetFullPath($Path)
  if ($full.Length -gt 3) { $full = $full.TrimEnd('\') }
  return $full
}

function Test-RootedPath {
  param([string]$Path)
  if (-not $Path) { return $false }
  return [IO.Path]::IsPathRooted($Path)
}

function Test-HasCommand {
  param([Parameter(Mandatory = $true)][string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-KitUserHome {
  $h = $null
  if ($env:HOME -and (Test-RootedPath $env:HOME)) {
    $h = $env:HOME
  } else {
    $h = $env:USERPROFILE
  }
  if (-not $h -or -not (Test-RootedPath $h)) {
    Write-KitDie "HOME must be an absolute path (got: $h)"
  }
  if ($h -match "`r|`n") { Write-KitDie 'HOME must not contain a line break' }
  return (Get-FullPathNormalized $h)
}

function Get-JobKitHomePath {
  if ($env:JOB_KIT_HOME) {
    if ($env:JOB_KIT_HOME -match "`r|`n") { Write-KitDie 'JOB_KIT_HOME must not contain a line break' }
    if (-not (Test-RootedPath $env:JOB_KIT_HOME)) {
      Write-KitDie "JOB_KIT_HOME must be an absolute path (got: $($env:JOB_KIT_HOME))"
    }
    return (Get-FullPathNormalized $env:JOB_KIT_HOME)
  }
  if ($env:XDG_DATA_HOME) {
    if ($env:XDG_DATA_HOME -match "`r|`n") { Write-KitDie 'XDG_DATA_HOME must not contain a line break' }
    if (-not (Test-RootedPath $env:XDG_DATA_HOME)) {
      Write-KitDie "XDG_DATA_HOME must be an absolute path (got: $($env:XDG_DATA_HOME))"
    }
    return (Join-Path (Get-FullPathNormalized $env:XDG_DATA_HOME) 'job-kit')
  }
  return (Join-Path (Get-KitUserHome) '.local\share\job-kit')
}

$script:JobKitHome = Get-JobKitHomePath

$script:KitOwnershipFiles = @(
  'scripts\agents\install.sh',
  'scripts\agents\lib.sh',
  'scripts\aside\install.sh',
  'scripts\aside\lib.sh',
  'scripts\install.sh',
  'scripts\uninstall.sh',
  'skill\job-profile-init\SKILL.md',
  'skill\job-scout\SKILL.md'
)

$script:KitRequiredFiles = $script:KitOwnershipFiles + @(
  'skill\job-apply\SKILL.md',
  'skill\job-prep\SKILL.md',
  'skill\job-resume-refine\SKILL.md',
  'skill\job-profile-me\SKILL.md',
  'skill\job-list\SKILL.md',
  'skill\job-match\SKILL.md',
  'skill\job-match\scripts\score.py',
  'skill\job-match\scripts\models.py',
  'skill\job-match\scripts\scaffold_guidance.py',
  'skill\job-match\scripts\validate_guidance.py',
  'skill\job-resume-refine\scripts\check_parse.py',
  'skill\job-stories\SKILL.md',
  'skill\job-pitch\SKILL.md',
  'skill\job-inbox\SKILL.md',
  'skill\job-humanize\SKILL.md',
  'skill\job-profile-root\SKILL.md',
  'skill\job-store\SKILL.md'
)

$script:WindowsRequiredFiles = @(
  'scripts\install.ps1',
  'scripts\uninstall.ps1',
  'scripts\agents\lib.ps1'
)

function Show-RemoteUsage {
  @'
Install or uninstall job-kit skills without cloning by hand (Windows 11).
Aside is not available on Windows; this installer covers agents + browser-use.

Usage: remote.ps1 [channel] [options...]
       remote.ps1 uninstall [target] [options...]

Install channels:
  all          Coding agents + browser-use, skipping absent (default)
  agents       Coding agents only (fails when no agent home exists)
  browser-use  job-scout + job-apply + job-prep plus the browser-use driver
               skill into coding-agent homes (needs an agent home)
  fetch        Refresh the cached checkout, install nothing

Uninstall:
  uninstall              Agent + browser-use skills (default: all)
  uninstall all          Same
  uninstall agents       Coding agents only
  uninstall browser-use  job-scout + job-apply + job-prep links, the
                         browser-use driver skill, the CLI, and its state
                         (never your browser)

  Interactive (profile data + menu): powershell -File scripts\uninstall.ps1
  from a local or cached checkout. Remote uninstall never deletes
  %USERPROFILE%\.config\job-kit.

  -h, --help  Show this help

Install options after the channel are forwarded to the installer, e.g.
`remote.ps1 agents --skip-codex`. Channel `all` forwards only --force.

Uninstall options:
  --purge             After full uninstall only, remove the cached checkout
                      (refused on a partial target such as `uninstall agents`,
                      and while CLAUDE_SKILLS narrows a channel)
  --skip-claude|codex|grok|hermes  Forwarded only with `uninstall agents` or
                      `uninstall browser-use`

Environment:
  JOB_KIT_HOME  Cached checkout (default $XDG_DATA_HOME\job-kit or ~\.local\share\job-kit)
  JOB_KIT_REF   Branch or tag to fetch (default main)
  JOB_KIT_SLUG  GitHub owner/repo (default rafaeelricco/job-kit)
'@ | Write-Host
}

function Test-ReparsePoint {
  param([Parameter(Mandatory = $true)][string]$Path)
  try {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
  } catch {
    return $false
  }
  return [bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint)
}

function Get-KitPathsMissing {
  param([string]$Dir, [string[]]$Files)
  $skill = Join-Path $Dir 'skill'
  if ((Test-ReparsePoint $skill) -or -not (Test-Path -LiteralPath $skill -PathType Container)) {
    return 'skill/'
  }
  foreach ($rel in $Files) {
    $cur = $Dir
    foreach ($part in ($rel -split '\\')) {
      if (-not $part) { continue }
      $cur = Join-Path $cur $part
      if (Test-ReparsePoint $cur) { return ($rel -replace '\\', '/') }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Dir $rel) -PathType Leaf)) {
      return ($rel -replace '\\', '/')
    }
  }
  return ''
}

function Get-KitOwnedMissing {
  param([string]$Dir)
  return (Get-KitPathsMissing $Dir $script:KitOwnershipFiles)
}

function Get-KitCheckoutMissing {
  param([string]$Dir)
  $missing = Get-KitPathsMissing $Dir $script:KitRequiredFiles
  if ($missing) { return $missing }
  return (Get-KitPathsMissing $Dir $script:WindowsRequiredFiles)
}

function Test-IsGitRepo {
  param([string]$Dir)
  $git = Join-Path $Dir '.git'
  if (-not (Test-Path -LiteralPath $git)) { return $false }
  & git -C $Dir rev-parse --git-dir 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Invoke-FetchTarball {
  param([string]$Dest)
  if ((Test-Path -LiteralPath $Dest) -or (Test-ReparsePoint $Dest)) {
    $missing = Get-KitOwnedMissing $Dest
    if ($missing) {
      Write-KitDie "cache path exists and is not a job-kit checkout (missing $missing): $Dest"
    }
  }
  if (-not (Test-HasCommand 'tar')) {
    Write-KitDie 'need git, or tar.exe, to fetch job-kit'
  }
  $url = "https://codeload.github.com/$($script:JobKitSlug)/tar.gz/$($script:JobKitRef)"
  $parent = Split-Path $Dest -Parent
  if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
  }
  $stage = Join-Path $parent ('.job-kit-fetch.' + $PID)
  $tgz = $stage + '.tgz'
  if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
  if (Test-Path -LiteralPath $tgz) { Remove-Item -LiteralPath $tgz -Force }
  New-Item -ItemType Directory -Path $stage | Out-Null
  try {
    Invoke-WebRequest -Uri $url -OutFile $tgz -UseBasicParsing
    & tar -xzf $tgz -C $stage --strip-components=1
    if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
      throw "tar extract failed"
    }
  } catch {
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $tgz) { Remove-Item -LiteralPath $tgz -Force -ErrorAction SilentlyContinue }
    Write-KitDie "download failed: $url"
  }
  if (Test-Path -LiteralPath $tgz) { Remove-Item -LiteralPath $tgz -Force }
  $missing = Get-KitCheckoutMissing $stage
  if ($missing) {
    Remove-Item -LiteralPath $stage -Recurse -Force
    Write-KitDie "downloaded $($script:JobKitSlug)@$($script:JobKitRef) is not a job-kit checkout (missing $missing); cache left unchanged"
  }
  if (Test-Path -LiteralPath $Dest) { Remove-Item -LiteralPath $Dest -Recurse -Force }
  Move-Item -LiteralPath $stage -Destination $Dest
  Write-Host "fetched: $Dest @ $($script:JobKitRef)"
}

function Invoke-FetchGitClone {
  param([string]$Dest)
  $parent = Split-Path $Dest -Parent
  if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
  }
  & git clone --depth 1 --branch $script:JobKitRef "https://github.com/$($script:JobKitSlug).git" $Dest
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) { Write-KitDie 'git clone failed' }
  $missing = Get-GitRefMissing $Dest 'HEAD'
  if ($missing) {
    Remove-Item -LiteralPath $Dest -Recurse -Force
    Write-KitDie "cloned $($script:JobKitSlug)@$($script:JobKitRef) is not a job-kit checkout (missing $missing)"
  }
  $missing = Get-KitCheckoutMissing $Dest
  if ($missing) {
    Remove-Item -LiteralPath $Dest -Recurse -Force
    Write-KitDie "cloned $($script:JobKitSlug)@$($script:JobKitRef) is not a job-kit checkout (missing $missing)"
  }
  Write-Host "cloned: $Dest @ $($script:JobKitRef)"
}

function Get-GitRefMissing {
  param([string]$Dir, [string]$Ref)
  $files = $script:KitRequiredFiles + $script:WindowsRequiredFiles
  $skillType = & git -C $Dir cat-file -t "${Ref}:skill" 2>$null
  if ($skillType -ne 'tree') { return 'skill/' }
  foreach ($rel in $files) {
    $posix = $rel -replace '\\', '/'
    $line = & git -C $Dir ls-tree $Ref -- $posix 2>$null
    if (-not $line) { return $posix }
    $mode = ([string]$line).Split("`t")[0].Split(' ')[0]
    if ($mode -ne '100644' -and $mode -ne '100755') { return $posix }
  }
  return ''
}

function Invoke-FetchGitUpdate {
  param([string]$Dest)
  & git -C $Dest fetch --depth 1 "https://github.com/$($script:JobKitSlug).git" $script:JobKitRef
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    Write-KitDie "git fetch failed for $($script:JobKitSlug)@$($script:JobKitRef)"
  }
  $missing = Get-GitRefMissing $Dest 'FETCH_HEAD'
  if ($missing) {
    Write-KitDie "fetched $($script:JobKitSlug)@$($script:JobKitRef) is not a job-kit checkout (missing $missing); cache left unchanged"
  }
  & git -C $Dest checkout --detach FETCH_HEAD
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    Write-KitDie "git checkout failed in $Dest (local changes?)"
  }
  Write-Host "updated: $Dest @ $($script:JobKitRef)"
}

function Invoke-FetchKit {
  param([string]$Dest)
  if (-not (Test-Path -LiteralPath $Dest) -and -not (Test-ReparsePoint $Dest)) {
    if (Test-HasCommand 'git') {
      Invoke-FetchGitClone $Dest
    } else {
      Invoke-FetchTarball $Dest
    }
    return
  }
  $missing = Get-KitOwnedMissing $Dest
  if ($missing) {
    Write-KitDie "cache path exists and is not a job-kit checkout (missing $missing): $Dest"
  }
  $gitEntry = Join-Path $Dest '.git'
  if ((Test-Path -LiteralPath $gitEntry) -or (Test-ReparsePoint $gitEntry)) {
    if (-not (Test-HasCommand 'git')) {
      Write-KitDie "cached checkout is a git repository but git is not installed: $Dest"
    }
    if (-not (Test-IsGitRepo $Dest)) {
      Write-KitDie "cache path has a .git entry but is not a usable git repository: $Dest"
    }
    Invoke-FetchGitUpdate $Dest
    return
  }
  Invoke-FetchTarball $Dest
}

function Assert-Checkout {
  param([string]$Dir)
  $missing = Get-KitCheckoutMissing $Dir
  if ($missing) {
    Write-KitDie "not a job-kit checkout (missing $missing): $Dir"
  }
}

function Invoke-EnsureKitCache {
  param([string]$Dest)
  if (-not (Test-Path -LiteralPath $Dest) -and -not (Test-ReparsePoint $Dest)) {
    Invoke-FetchKit $Dest
    Assert-Checkout $Dest
    return
  }
  $missing = Get-KitOwnedMissing $Dest
  if ($missing) {
    Write-KitDie "cache path exists and is not a job-kit checkout (missing $missing): $Dest"
  }
  # Caches fetched by the Git Bash installer before this channel pass the
  # ownership probe but carry none of the Windows scripts, so the cached
  # uninstaller would be missing. Refresh once instead of dying before
  # anything is removed.
  $missing = Get-KitPathsMissing $Dest $script:WindowsRequiredFiles
  if ($missing) {
    Write-Host "refreshing kit cache (windows scripts added, missing $missing): $Dest"
    Invoke-FetchKit $Dest
    Assert-Checkout $Dest
  }
}

function Test-AgentsReady {
  if ($env:CLAUDE_SKILLS) { return $true }
  $userHome = Get-KitUserHome
  foreach ($rel in @('.claude', '.agents', '.grok', '.hermes')) {
    if (Test-Path -LiteralPath (Join-Path $userHome $rel) -PathType Container) { return $true }
  }
  return $false
}

function Invoke-CachedScript {
  param([string]$RelPath, [string[]]$Forward)
  $file = Join-Path $script:JobKitHome $RelPath
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    Write-KitDie "cached installer missing: $file"
  }
  & $file @Forward
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Invoke-RemoteMain {
  param([string[]]$Argv = @())
  if ($null -eq $Argv) { $Argv = @() }

  $channel = 'all'
  $mode = 'install'
  $target = 'all'
  $purge = $false
  $agentFlags = New-Object System.Collections.Generic.List[string]
  $forward = New-Object System.Collections.Generic.List[string]

  $i = 0
  if ($Argv.Count -gt 0) {
    switch ($Argv[0]) {
      'uninstall' {
        $mode = 'uninstall'
        $i = 1
        if ($i -lt $Argv.Count -and @('all', 'agents', 'browser-use') -contains $Argv[$i]) {
          $target = $Argv[$i]
          $i++
        }
      }
      { @('all', 'agents', 'browser-use', 'fetch') -contains $_ } {
        $channel = $Argv[0]
        $i = 1
      }
      { $_ -eq '-h' -or $_ -eq '--help' } { Show-RemoteUsage; exit 0 }
      default { $i = 0 }
    }
  }

  if ($mode -eq 'uninstall') {
    while ($i -lt $Argv.Count) {
      $arg = $Argv[$i]
      if ($arg -eq '--purge') {
        $purge = $true
        $i++
        continue
      }
      if ($arg -eq '-h' -or $arg -eq '--help') { Show-RemoteUsage; exit 0 }
      if ($target -eq 'all') {
        Write-KitDie "uninstall all accepts only --purge (got: $arg); use 'uninstall agents' for --skip-*"
      } elseif ($target -eq 'agents' -or $target -eq 'browser-use') {
        if (@('--skip-claude', '--skip-codex', '--skip-grok', '--skip-hermes') -contains $arg) {
          $agentFlags.Add($arg) | Out-Null
        } else {
          Write-KitDie "unknown uninstall $target option: $arg (expected --skip-* or --purge)"
        }
      }
      $i++
    }

    if ($purge) {
      if ($target -ne 'all') {
        Write-KitDie "refusing --purge with partial uninstall (use 'uninstall all --purge' or omit --purge)"
      }
      if ($env:CLAUDE_SKILLS) {
        Write-KitDie "refusing --purge while CLAUDE_SKILLS narrows the agents uninstall to $($env:CLAUDE_SKILLS) (unset it, or omit --purge)"
      }
    }

    Invoke-EnsureKitCache $script:JobKitHome

    switch ($target) {
      'agents' {
        $flags = @('--yes', 'agents') + @($agentFlags.ToArray())
        Invoke-CachedScript 'scripts\uninstall.ps1' $flags
      }
      'browser-use' {
        $flags = @('--yes', 'browser-use') + @($agentFlags.ToArray())
        Invoke-CachedScript 'scripts\uninstall.ps1' $flags
      }
      'all' {
        if ($purge) {
          Invoke-CachedScript 'scripts\uninstall.ps1' @('--yes', 'agents', 'browser-use', 'cache')
        } else {
          Invoke-CachedScript 'scripts\uninstall.ps1' @('--yes', 'agents', 'browser-use')
        }
      }
    }

    Write-Host ''
    if ($purge) {
      Write-Host 'job-kit uninstall finished (cache purged)'
    } else {
      Write-Host 'job-kit uninstall finished'
      Write-Host "  cache kept at: $($script:JobKitHome)"
      Write-Host "  reinstall: powershell -ExecutionPolicy Bypass -File remote.ps1 all"
      Write-Host "  purge cache: powershell -ExecutionPolicy Bypass -File `"$($script:JobKitHome)\scripts\remote.ps1`" uninstall --purge"
    }
    return
  }

  while ($i -lt $Argv.Count) {
    $forward.Add($Argv[$i]) | Out-Null
    $i++
  }

  Invoke-FetchKit $script:JobKitHome
  Assert-Checkout $script:JobKitHome

  switch ($channel) {
    'fetch' { }
    'agents' {
      Invoke-CachedScript 'scripts\install.ps1' (@('agents') + @($forward.ToArray()))
    }
    'browser-use' {
      Invoke-CachedScript 'scripts\install.ps1' (@('browser-use') + @($forward.ToArray()))
    }
    'all' {
      foreach ($arg in $forward) {
        if ($arg -ne '--force') {
          Write-KitDie "channel 'all' forwards only --force (got: $arg); use 'agents' or 'browser-use' for target flags"
        }
      }
      $ran = $false
      if (Test-AgentsReady) {
        Invoke-CachedScript 'scripts\install.ps1' (@('agents') + @($forward.ToArray()))
        $ran = $true
        Invoke-CachedScript 'scripts\install.ps1' (@('browser-use') + @($forward.ToArray()))
      } else {
        Write-Host "Coding agents: no agent home (~/.claude, ~/.agents, ~/.grok, ~/.hermes); skipping."
      }
      if (-not $ran) {
        Write-KitDie 'nothing installed: no coding-agent home'
      }
    }
  }

  Write-Host ''
  Write-Host "job-kit cached at: $($script:JobKitHome)"
  Write-Host '  keep it: agent skills junction into it'
  Write-Host "  uninstall (interactive / profile): powershell -ExecutionPolicy Bypass -File `"$($script:JobKitHome)\scripts\uninstall.ps1`""
  Write-Host '  uninstall (skills only): powershell -ExecutionPolicy Bypass -File remote.ps1 uninstall'
}

Invoke-RemoteMain @($args)
