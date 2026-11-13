<#
  한솔 지식센터 실행기 (Windows)

  바탕화면 바로가기를 여러 번 눌러도 탭이 계속 늘어나지 않도록,
  이미 열려 있는 한솔 지식 창·탭을 찾아 앞으로 가져온다. 없을 때만 새로 연다.

  찾는 순서
    1) Edge·Chrome·Whale·Brave 창 중 지금 보고 있는 탭이 한솔 지식인 창
    2) 다른 탭 뒤에 숨어 있는 한솔 지식 탭 → 그 탭을 선택하고 창을 앞으로
    3) 아무 데도 없으면 기본 브라우저로 새로 연다

  탭 이름만으로는 다른 사이트와 헷갈릴 수 있어서(제목이 같은 사본 사이트가 있다)
  탭을 고른 뒤 주소창 주소가 실제 지식센터 주소인지 한 번 더 확인한다.
  아니면 원래 보던 탭으로 되돌려 놓는다.

  이 실행기는 같은 PC 의 창만 다룬다. 다른 기기에 열린 창은 건드리지 않는다.
  사이트 자료(즐겨찾기·할 일 등)는 읽지도 바꾸지도 않는다 — 창을 고르기만 한다.

  사용
    powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File open-hansol-knowledge.ps1
    -DryRun  : 창을 건드리지 않고 무엇을 찾았는지만 출력 (점검용)
#>
param(
  [string]$Url = 'https://hansol941201.github.io/hansol-knowledge/',
  [switch]$DryRun,
  # 아래 둘은 시험용(다른 사이트로 동작 확인할 때만). 평소에는 비워 둔다.
  [string]$SiteKey = 'hansol941201.github.io/hansol-knowledge',
  [string]$TitlePattern = '^(한솔 지식|한솔 Knowledge)(\s|$)'
)

$ErrorActionPreference = 'Stop'
# 탭·창 제목: 「한솔 지식」 또는 「한솔 Knowledge」(설치형 앱 이름) 로 시작하고 바로 뒤가 공백·끝.
# 이 파일은 UTF-8(BOM 포함)으로 저장해야 Windows PowerShell 5.1 이 한글을 바르게 읽는다.
$TitleRe = $TitlePattern
$BrowserRe = '^(msedge|chrome|whale|brave)$'

function Open-New {
  if ($DryRun) { 'result: would-open-new'; return }
  Start-Process $Url
  'result: opened-new'
}

try {
  Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
} catch {
  # 창 찾기 기능을 못 쓰는 PC 에서는 예전처럼 그냥 연다.
  Open-New
  return
}

$AE = [System.Windows.Automation.AutomationElement]
$Scope = [System.Windows.Automation.TreeScope]
$SelPattern = [System.Windows.Automation.SelectionItemPattern]::Pattern
$ValPattern = [System.Windows.Automation.ValuePattern]::Pattern

function New-Cond($prop, $val) { New-Object System.Windows.Automation.PropertyCondition($prop, $val) }
# 브라우저 자체의 탭 — Chrome 은 'Tab', Edge 는 'EdgeTab'. 웹 페이지 안의 탭 모양 버튼은 제외된다.
$TabCond = New-Object System.Windows.Automation.OrCondition(
  (New-Cond $AE::ClassNameProperty 'Tab'),
  (New-Cond $AE::ClassNameProperty 'EdgeTab'))
$OmniCond = New-Cond $AE::ClassNameProperty 'OmniboxViewViews'

function Get-Address($win) {
  $box = $win.FindFirst($Scope::Descendants, $OmniCond)
  if (-not $box) { return $null }   # 주소창 없는 창 = 설치형 앱(PWA) 창
  try { return [string]$box.GetCurrentPattern($ValPattern).Current.Value } catch { return $null }
}
function Test-Address($addr) { ($null -eq $addr) -or ($addr -like "*$SiteKey*") }

Add-Type -Namespace HansolKnowledge -Name Win32 -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
'@
$Win32 = [HansolKnowledge.Win32]

function Show-Window($win) {
  if ($DryRun) { return }
  $h = [IntPtr]$win.Current.NativeWindowHandle
  if ($Win32::IsIconic($h)) { [void]$Win32::ShowWindow($h, 9) }   # 9 = SW_RESTORE: 최소화 전 크기(최대화 포함)로 복원
  [void]$Win32::SetForegroundWindow($h)
  if ($Win32::GetForegroundWindow() -ne $h) {
    # Windows 는 다른 프로그램이 창을 앞으로 가져오는 것을 막을 때가 있다.
    # Alt 키를 한 번 눌렀다 떼면 허용되는 경우가 많아 한 번만 더 시도한다.
    $Win32::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)
    $Win32::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
    [void]$Win32::SetForegroundWindow($h)
  }
}

function Select-Tab($tab) {
  try { $tab.GetCurrentPattern($SelPattern).Select() } catch { }
}
function Test-Site($win) {
  # 주소창 주소로 지식센터인지 확인한다. 탭을 바꾼 직후·창을 펼친 직후에는
  # 주소창이 늦게 바뀌거나 늦게 보이므로 1초까지 기다린다.
  $addr = $null
  for ($i = 0; $i -lt 10; $i++) {
    $addr = Get-Address $win
    if ($null -ne $addr -and $addr -like "*$SiteKey*") { return $true }
    Start-Sleep -Milliseconds 100
  }
  return ($null -eq $addr)   # 끝까지 주소창이 없으면 설치형 앱(PWA) 창 → 제목으로 찾은 것을 믿는다
}
function Find-InWindow($win, [switch]$TitleOnly) {
  # 이 창에서 지식센터를 찾으면 그 탭을 고르고 창을 앞으로 가져온 뒤 $true.
  $name = $win.Current.Name
  if ($name -match $TitleRe) {
    if ($DryRun) { Write-Host "found: window '$name'"; return $true }
    if (Test-Site $win) { Write-Host "found: window '$name'"; Show-Window $win; return $true }
  }
  if ($TitleOnly) { return $false }

  $tabs = @($win.FindAll($Scope::Descendants, $TabCond))
  $targets = @($tabs | Where-Object { $_.Current.Name -match $TitleRe })
  if (-not $targets.Count) { return $false }
  if ($DryRun) { Write-Host "found: tab '$($targets[0].Current.Name)' in '$name'"; return $true }
  $previous = $tabs | Where-Object {
    try { $_.GetCurrentPattern($SelPattern).Current.IsSelected } catch { $false }
  } | Select-Object -First 1
  foreach ($t in $targets) {
    Select-Tab $t
    if (Test-Site $win) {
      Write-Host "found: tab '$($t.Current.Name)' in '$name'"
      Show-Window $win
      return $true
    }
    Write-Host "skip: '$($t.Current.Name)' is another site with the same title"
  }
  if ($previous) { Select-Tab $previous }   # 다른 사이트였으면 원래 보던 탭으로 되돌린다
  return $false
}

$procNames = @{}
Get-Process | ForEach-Object { $procNames[$_.Id] = $_.ProcessName }
$browserWins = @($AE::RootElement.FindAll($Scope::Children, [System.Windows.Automation.Condition]::TrueCondition) |
  Where-Object { $procNames[$_.Current.ProcessId] -match $BrowserRe })
$isMin = { param($w) $Win32::IsIconic([IntPtr]$w.Current.NativeWindowHandle) }
$shown = @($browserWins | Where-Object { -not (& $isMin $_) })
# 최소화된 창 중에서는 지금 보던 탭이 지식센터인 창을 먼저 본다.
$minimized = @($browserWins | Where-Object { & $isMin $_ } | Sort-Object { -not ($_.Current.Name -match $TitleRe) })

# 1) 화면에 펼쳐진 창 중, 지금 보고 있는 탭이 지식센터인 창 (탭 하나짜리 창·설치형 앱 창 포함)
foreach ($w in $shown) { if (Find-InWindow $w -TitleOnly) { 'result: focused-window'; return } }

# 2) 화면에 펼쳐진 창의 다른 탭 뒤에 숨어 있는 지식센터 탭
foreach ($w in $shown) { if (Find-InWindow $w) { 'result: focused-tab'; return } }

# 3) 최소화된 창
#    Edge·Chrome 은 최소화된 창의 탭 목록·주소창을 바깥에 보여 주지 않는다.
#    그래서 창을 앞으로 가져오지 않은 채(포커스 이동 없이) 잠깐 펼쳐 확인하고,
#    지식센터가 아니면 곧바로 다시 최소화해 둔다.
foreach ($w in $minimized) {
  if ($DryRun) { Write-Host "minimized: '$($w.Current.Name)' (would be checked)"; continue }
  $h = [IntPtr]$w.Current.NativeWindowHandle
  [void]$Win32::ShowWindow($h, 4)          # 4 = SW_SHOWNOACTIVATE
  for ($i = 0; $i -lt 15 -and -not $w.FindFirst($Scope::Descendants, $OmniCond) -and -not $w.FindFirst($Scope::Descendants, $TabCond); $i++) {
    Start-Sleep -Milliseconds 100
  }
  if (Find-InWindow $w) { 'result: focused-minimized'; return }
  [void]$Win32::ShowWindow($h, 7)          # 7 = SW_SHOWMINNOACTIVE: 다시 최소화
}

# 4) 열린 곳이 없으면 새로 연다
Open-New