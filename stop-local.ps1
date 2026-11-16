$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$stateFile = Join-Path $taskRoot '.runtime\processes.json'
if (-not (Test-Path -LiteralPath $stateFile)) { Write-Host 'No managed services.'; exit 0 }
$saved = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
foreach ($entry in $saved) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($entry.pid)"
    if ($processInfo -and $processInfo.CommandLine -and $processInfo.CommandLine.Contains($taskRoot) -and ($processInfo.CommandLine.Contains('uvicorn backend.main:app') -or $processInfo.CommandLine.Contains('http.server 8080'))) {
        # Windows venv python may launch a child interpreter; stop that owned child too.
        Get-CimInstance Win32_Process -Filter "ParentProcessId = $($entry.pid)" | Where-Object {
            $_.CommandLine -and $_.CommandLine.Contains($taskRoot)
        } | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }
        Stop-Process -Id $entry.pid -ErrorAction SilentlyContinue
        Write-Host "Stopped $($entry.role)."
    }
}
Remove-Item -LiteralPath $stateFile
Write-Host 'Stopped. Database retained.'
