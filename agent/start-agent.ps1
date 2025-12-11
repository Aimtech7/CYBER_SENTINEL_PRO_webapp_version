$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root '..')
if (-not $env:PORT) { $env:PORT = 8787 }
if (-not $env:HOST) { $env:HOST = "0.0.0.0" }
if (-not (Test-Path ".\.venv\Scripts\uvicorn.exe")) { throw "uvicorn not found in .venv" }
.\.venv\Scripts\uvicorn agent.main:app --host $env:HOST --port $env:PORT
