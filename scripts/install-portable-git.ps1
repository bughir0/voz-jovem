$ErrorActionPreference = "Stop"
$target = Join-Path $env:LOCALAPPDATA "Programs\PortableGit"

if (Test-Path (Join-Path $target "cmd\git.exe")) {
  Write-Output "JA_INSTALADO: $target"
  exit 0
}

Write-Output "Consultando a versao mais recente do Git para Windows..."
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/git-for-windows/git/releases/latest" -Headers @{ "User-Agent" = "voz-jovem-setup" }
$asset = $release.assets | Where-Object { $_.name -like "PortableGit-*-64-bit.7z.exe" } | Select-Object -First 1

if (-not $asset) { throw "Nao encontrei o pacote portatil na release $($release.tag_name)." }

$installer = Join-Path $env:TEMP $asset.name
Write-Output "Baixando $($asset.name) ($([math]::Round($asset.size / 1MB, 1)) MB)..."
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $installer -UseBasicParsing

New-Item -ItemType Directory -Path $target -Force | Out-Null
Write-Output "Extraindo para $target..."
Start-Process -FilePath $installer -ArgumentList "-o`"$target`"", "-y" -Wait -NoNewWindow

$git = Join-Path $target "cmd\git.exe"
if (-not (Test-Path $git)) { throw "A extracao terminou mas o git.exe nao apareceu em $git." }

& $git --version
Write-Output "INSTALADO: $git"
