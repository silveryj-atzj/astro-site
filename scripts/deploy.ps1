# 构建并部署 Astro 静态站到 Caddy（CT 501）
# 用法：在 D:\Ju\Projects\astro-site 下执行  powershell -File scripts\deploy.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '==> build' -ForegroundColor Cyan
npm run build

$out = Join-Path $env:TEMP 'astro-dist.tgz'
if (Test-Path $out) { Remove-Item $out -Force }
Write-Host '==> pack' -ForegroundColor Cyan
& tar -czf $out -C dist .

Write-Host '==> upload' -ForegroundColor Cyan
& scp -o BatchMode=yes $out pve:/tmp/astro-dist.tgz

Write-Host '==> deploy on CT501 + Caddy' -ForegroundColor Cyan
$remote = @'
set -e
pct push 501 /tmp/astro-dist.tgz /tmp/astro-dist.tgz
pct exec 501 -- bash -lc 'mkdir -p /opt/caddy/astro && rm -rf /opt/caddy/astro/* && tar -xzf /tmp/astro-dist.tgz -C /opt/caddy/astro && docker exec caddy rm -rf /srv/astro/* && docker cp /opt/caddy/astro/. caddy:/srv/astro/ && echo files-ok'
'@
$remote | & ssh -o BatchMode=yes pve 'bash -s'

Write-Host '==> verify' -ForegroundColor Cyan
foreach ($p in @('https://blog.silveryj-atzj.me/', 'https://blog.silveryj-atzj.me/blog/', 'https://blog.silveryj-atzj.me/rss.xml')) {
  $code = & curl.exe -s -m 20 -o NUL -w '%{http_code}' $p
  Write-Host ("{0} -> {1}" -f $p, $code)
}
Write-Host 'done' -ForegroundColor Green
