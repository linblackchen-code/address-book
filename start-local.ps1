param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$pythonExe = Join-Path $taskRoot '.venv\Scripts\python.exe'
$runtimeDir = Join-Path $taskRoot '.runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$stateFile = Join-Path $runtimeDir 'processes.json'
if (Test-Path -LiteralPath $stateFile) {
    $saved = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $owned = @($saved | Where-Object {
        $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.pid)"
        $processInfo -and $processInfo.CommandLine -and $processInfo.CommandLine.Contains($taskRoot)
    })
    if ($owned.Count -eq 2) {
        Write-Host 'Already running: http://127.0.0.1:8080/frontend/'
        if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:8080/frontend/' }
        exit 0
    }
    if ($owned.Count -gt 0) { throw 'Partially running. Run stop-local.cmd first.' }
}
foreach ($port in @(8000,8080)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $port is occupied. Stop the existing service before starting this project."
    }
}
if (-not (Test-Path -LiteralPath $pythonExe)) {
    & python -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create Python environment.' }
}
& $pythonExe -m pip install -r backend/requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
$children = @()
try {
    $backendProcess = Start-Process -FilePath $pythonExe -ArgumentList ('-m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --app-dir "{0}"' -f $taskRoot) -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'backend.out.log') -RedirectStandardError (Join-Path $runtimeDir 'backend.err.log')
    $children += @{pid=$backendProcess.Id; role='backend'}
    $frontendProcess = Start-Process -FilePath $pythonExe -ArgumentList ('-m http.server 8080 --bind 127.0.0.1 --directory "{0}"' -f $taskRoot) -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.out.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend.err.log')
    $children += @{pid=$frontendProcess.Id; role='frontend'}
    $ready = $false
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        try {
            $apiResult = Invoke-RestMethod 'http://127.0.0.1:8000/api/contacts' -TimeoutSec 2
            $pageResult = Invoke-WebRequest 'http://127.0.0.1:8080/frontend/' -UseBasicParsing -TimeoutSec 2
            if ($null -ne $apiResult.contacts -and $pageResult.StatusCode -eq 200) { $ready=$true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { throw 'Startup failed. Inspect .runtime logs.' }
    ConvertTo-Json -InputObject $children | Set-Content -LiteralPath $stateFile -Encoding UTF8
} catch {
    foreach ($child in $children) { Stop-Process -Id $child.pid -ErrorAction SilentlyContinue }
    throw
}
Write-Host 'Page: http://127.0.0.1:8080/frontend/'
Write-Host 'API:  http://127.0.0.1:8000/docs'
Write-Host 'Stop: double-click stop-local.cmd. Data is retained.'
if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:8080/frontend/' }
