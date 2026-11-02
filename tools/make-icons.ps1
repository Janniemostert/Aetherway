# Renders tools/icon.html to the PNG sizes the PWA needs, using headless Chrome.
$root = Split-Path $PSScriptRoot -Parent
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$source = "file:///$($root -replace '\\','/')/tools/icon.html"
New-Item -ItemType Directory -Force "$root\icons" | Out-Null
foreach ($size in 180, 192, 512) {
  $out = "$root\icons\icon-$size.png"
  $args = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    "--window-size=$size,$size", "--screenshot=$out", $source)
  Start-Process -FilePath $chrome -ArgumentList $args -Wait -NoNewWindow
}
