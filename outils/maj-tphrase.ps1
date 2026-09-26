# Met à jour TPhrase à partir du dernier fichier TPhrase-*.zip du dossier Téléchargements.
# Les fichiers de l'extension sont remplacés ; les phrases (gardées par Chrome) ne sont pas touchées.
$ErrorActionPreference = 'Stop'
$dest = Split-Path -Parent $PSScriptRoot
try {
  if (-not (Test-Path (Join-Path $dest 'manifest.json'))) {
    throw "Ce fichier doit rester dans le dossier outils de TPhrase (à côté de manifest.json)."
  }
  $dl = $null
  try { $dl = (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path } catch { }
  if (-not $dl) { $dl = Join-Path $env:USERPROFILE 'Downloads' }
  $zip = Get-ChildItem $dl -Filter 'TPhrase*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $zip) { throw "Aucun fichier TPhrase…zip dans $dl. Téléchargez d'abord la nouvelle version." }

  $tmp = Join-Path $env:TEMP ('tphrase-' + [guid]::NewGuid())
  Expand-Archive -LiteralPath $zip.FullName -DestinationPath $tmp
  # Le zip peut contenir les fichiers à la racine ou dans un sous-dossier.
  $src = Get-ChildItem $tmp -Recurse -Filter 'manifest.json' | Select-Object -First 1
  if (-not $src) { throw "$($zip.Name) ne contient pas TPhrase (pas de manifest.json)." }
  $src = $src.DirectoryName
  $new = (Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json)
  if ($new.name -ne 'TPhrase') { throw "$($zip.Name) n'est pas TPhrase." }
  if (-not $new.key) { throw "$($zip.Name) est la version Web Store (sans clé) : elle créerait une autre extension, vide. Prenez le zip de test." }

  # Le .bat en cours d'exécution n'est pas remplacé (cmd le relit pendant qu'il tourne).
  robocopy $src $dest /E /XF 'Mettre a jour TPhrase.bat' /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "La copie des fichiers a échoué (code $LASTEXITCODE)." }
  Remove-Item $tmp -Recurse -Force

  Write-Host ""
  Write-Host "TPhrase $($new.version) est installé (depuis $($zip.Name))." -ForegroundColor Green
  Write-Host "Dernière étape : dans chrome://extensions, cliquez la flèche de rechargement sur TPhrase."
} catch {
  Write-Host ""
  Write-Host "Mise à jour impossible : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Read-Host "Appuyez sur Entrée pour fermer"
