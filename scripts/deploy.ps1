# 构建并部署 Astro 静态站到 Caddy（CT 501）
# 用法：powershell -File scripts\deploy.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '==> build' -ForegroundColor Cyan
& npm run build

Write-Host '==> pack (python zip, 规避 Windows tar 中文路径崩溃)' -ForegroundColor Cyan
$zip = Join-Path $env:TEMP 'astro-dist.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = 'D:\Ju\Projects\.venv\Scripts\python.exe' }
& $py -c "import shutil; shutil.make_archive(r'$env:TEMP\astro-dist', 'zip', 'dist'); print('zip ok')"

Write-Host '==> upload' -ForegroundColor Cyan
& scp -o BatchMode=yes $zip pve:/tmp/astro-dist.zip

Write-Host '==> deploy on CT501 + Caddy' -ForegroundColor Cyan
$remote = @'
set -e
rm -rf /tmp/astro-unpack && mkdir -p /tmp/astro-unpack
python3 -m zipfile -e /tmp/astro-dist.zip /tmp/astro-unpack
pct exec 501 -- bash -lc 'rm -rf /opt/caddy/astro && mkdir -p /opt/caddy/astro'
tar -C /tmp/astro-unpack -cf - . | pct exec 501 -- tar -xf - -C /opt/caddy/astro
pct exec 501 -- bash -lc 'docker exec caddy rm -rf /srv/astro/* && docker cp /opt/caddy/astro/. caddy:/srv/astro/ && echo files-ok'
'@
$remote = $remote -replace "`r`n", "`n"
$remote | & ssh -o BatchMode=yes pve 'bash -s'

Write-Host '==> verify' -ForegroundColor Cyan
foreach ($p in @('https://blog.silveryj-atzj.me/', 'https://blog.silveryj-atzj.me/blog/', 'https://blog.silveryj-atzj.me/tags/', 'https://blog.silveryj-atzj.me/archive/', 'https://blog.silveryj-atzj.me/search/', 'https://blog.silveryj-atzj.me/rss.xml')) {
  $code = & curl.exe -s -m 20 -o NUL -w '%{http_code}' $p
  Write-Host ("{0} -> {1}" -f $p, $code)
}
Write-Host 'done' -ForegroundColor Green
