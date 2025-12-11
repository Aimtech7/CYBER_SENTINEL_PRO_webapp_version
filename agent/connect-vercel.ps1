$ErrorActionPreference = "Stop"
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) { throw "cloudflared not installed" }
$log = Join-Path $env:TEMP "cloudflared.log"
if (Test-Path $log) { Remove-Item $log -Force }
$p = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:8787","--logfile","$log" -PassThru
for ($i=0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $content = Get-Content $log -Raw
    if ($content -match "https://[^"]+") {
      $url = $Matches[0]
      $body = @{ url = $url; token = $env:AGENT_TOKEN } | ConvertTo-Json -Compress
      try { Invoke-RestMethod -Method POST -Uri "https://sentineltools.vercel.app/api/settings/agent" -ContentType "application/json" -Body $body } catch {}
      Write-Output $url
      break
    }
  }
}
Wait-Process -Id $p.Id
