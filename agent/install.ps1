$ErrorActionPreference = "Stop"
if (!(Test-Path ".venv")) {
  python -m venv .venv
}
& .\.venv\Scripts\pip install -r agent\requirements.txt
Write-Host "Agent dependencies installed. Run: .\.venv\Scripts\python agent\main.py"
