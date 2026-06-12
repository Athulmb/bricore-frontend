$files = Get-ChildItem -Path "D:\Britcore\gme-frontend\src" -Recurse -Include "*.tsx","*.ts","*.css" | Where-Object { $_.FullName -notlike "*node_modules*" }

$replacements = @(
  [PSCustomObject]@{ Old = "#203727"; New = "#0D0D0D" },
  [PSCustomObject]@{ Old = "32, 55, 39"; New = "13, 13, 13" },
  [PSCustomObject]@{ Old = "#2d4d39"; New = "#1A1A1A" },
  [PSCustomObject]@{ Old = "#1a2f21"; New = "#0A0A0A" },
  [PSCustomObject]@{ Old = "#974926"; New = "#E8491F" },
  [PSCustomObject]@{ Old = "#7d3c1f"; New = "#C93D18" },
  [PSCustomObject]@{ Old = "#f08b5e"; New = "#FF6B45" },
  [PSCustomObject]@{ Old = "#b85a2e"; New = "#E8491F" },
  [PSCustomObject]@{ Old = "f5f0ed"; New = "1A1A1A" },
  [PSCustomObject]@{ Old = "#f5f0ed"; New = "#1A1A1A" }
)

$totalChanges = 0
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  $modified = $false
  foreach ($r in $replacements) {
    if ($content.Contains($r.Old)) {
      $content = $content.Replace($r.Old, $r.New)
      $modified = $true
    }
  }
  if ($modified) {
    Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($file.Name)"
    $totalChanges++
  }
}
Write-Host "Done. Updated $totalChanges files."
