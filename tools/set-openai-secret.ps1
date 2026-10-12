# Run interactively after billing/permissions have been checked.
# Secure input never enters shell history, a source file, an environment file, or the command line.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$secretInput = Read-Host 'OpenAI API key (hidden input)' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretInput)
try {
    $plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer).Trim()
    if (-not $plainSecret.StartsWith('sk-')) { throw 'The key must begin with sk-. Nothing was saved.' }
    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = (Get-Command node).Source
    $startInfo.WorkingDirectory = $repoRoot
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $startInfo.ArgumentList.Add((Join-Path $repoRoot 'node_modules/firebase-tools/lib/bin/firebase.js'))
    foreach ($argument in @('functions:secrets:set', 'OPENAI_API_KEY', '--project', 'hansol-knowledge-941201', '--data-file', '-', '--non-interactive')) { $startInfo.ArgumentList.Add($argument) }
    $secretProcess = [Diagnostics.Process]::Start($startInfo)
    $secretProcess.StandardInput.Write($plainSecret)
    $secretProcess.StandardInput.Close()
    $plainSecret = $null
    $secretProcess.WaitForExit()
    if ($secretProcess.ExitCode -ne 0) { throw 'Secret Manager save failed. Check the error above.' }
    Write-Host 'Secret saved in Firebase Secret Manager. You can return to Codex.'
} finally {
    $plainSecret = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    $secretInput.Dispose()
}
