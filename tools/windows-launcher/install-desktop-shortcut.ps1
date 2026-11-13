<#
  한솔 지식센터 바탕화면 바로가기 설치 (Windows, 이 PC 에만 적용)

  하는 일
    1) 실행기(open-hansol-knowledge.ps1)를 %LOCALAPPDATA%\HansolKnowledge 에 복사
    2) 사이트 아이콘으로 .ico 를 만들어 같은 곳에 둔다
    3) 바탕화면에 「한솔지식」 바로가기(.lnk)를 만든다 — 누르면 이미 열린 창·탭을 앞으로,
       없으면 새로 연다
    4) 예전 인터넷 바로가기(바탕화면 한솔지식.url)는 지우지 않고 백업 폴더로 옮긴다
       (누를 때마다 새 탭을 여는 원인이라 바탕화면에서만 뺀다)

  되돌리기
    powershell -NoProfile -ExecutionPolicy Bypass -File install-desktop-shortcut.ps1 -Uninstall
    → 새 바로가기를 지우고 예전 한솔지식.url 을 바탕화면에 되돌려 놓는다.

  사이트 자료(즐겨찾기·할 일·저장 데이터)는 전혀 건드리지 않는다.
  이 파일은 UTF-8(BOM 포함)으로 저장해야 Windows PowerShell 5.1 이 한글을 바르게 읽는다.
#>
param(
  [switch]$Uninstall,
  [string]$ShortcutName = '한솔지식'
)
$ErrorActionPreference = 'Stop'

$installDir = Join-Path $env:LOCALAPPDATA 'HansolKnowledge'
$backupDir = Join-Path $installDir 'backup'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop "$ShortcutName.lnk"
$oldUrl = Join-Path $desktop "$ShortcutName.url"
$launcher = Join-Path $installDir 'open-hansol-knowledge.ps1'
$iconPath = Join-Path $installDir 'hansol-knowledge.ico'

if ($Uninstall) {
  if (Test-Path $lnkPath) { Remove-Item $lnkPath; "removed: $lnkPath" }
  $saved = Join-Path $backupDir "$ShortcutName.url"
  if ((Test-Path $saved) -and -not (Test-Path $oldUrl)) { Move-Item $saved $oldUrl; "restored: $oldUrl" }
  return
}

New-Item -ItemType Directory -Force $installDir, $backupDir | Out-Null

# 1) 실행기 복사 (BOM 포함 UTF-8 그대로)
Copy-Item (Join-Path $PSScriptRoot 'open-hansol-knowledge.ps1') $launcher -Force
"launcher: $launcher"

# 2) 아이콘 — PNG 를 그대로 담은 .ico (Windows Vista 이후 지원 형식)
$png = Join-Path $PSScriptRoot '..\..\icons\hansol-story-192.png'
if (Test-Path $png) {
  $bytes = [IO.File]::ReadAllBytes((Resolve-Path $png))
  $ms = New-Object IO.MemoryStream
  $bw = New-Object IO.BinaryWriter($ms)
  $bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]1)       # ICONDIR: 예약, 종류(아이콘), 개수
  $bw.Write([Byte]192); $bw.Write([Byte]192); $bw.Write([Byte]0); $bw.Write([Byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32)                              # 색 평면, 비트 수
  $bw.Write([UInt32]$bytes.Length); $bw.Write([UInt32]22)                  # 데이터 크기, 시작 위치(6+16)
  $bw.Write($bytes); $bw.Flush()
  [IO.File]::WriteAllBytes($iconPath, $ms.ToArray())
  "icon: $iconPath"
}

# 3) 예전 인터넷 바로가기는 백업 폴더로 (지우지 않는다)
if (Test-Path $oldUrl) {
  $dest = Join-Path $backupDir "$ShortcutName.url"
  if (Test-Path $dest) { $dest = Join-Path $backupDir ("$ShortcutName-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.url') }
  Move-Item $oldUrl $dest
  "moved old shortcut: $dest"
}

# 4) 새 바로가기
$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($lnkPath)
$lnk.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$lnk.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""
$lnk.WorkingDirectory = $installDir
$lnk.WindowStyle = 7                                   # 최소화로 시작 → 검은 창이 거의 보이지 않는다
$lnk.Description = '한솔 지식센터 — 이미 열린 창이 있으면 그 창을 앞으로 가져옵니다'
if (Test-Path $iconPath) { $lnk.IconLocation = "$iconPath,0" }
$lnk.Save()
"shortcut: $lnkPath"
