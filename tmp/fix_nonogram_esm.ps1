$content = Get-Content "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\Nonogram\nonogram.js" -Raw
$lines = $content -split "\r?\n"
# Factory body starts at line 11 (index 10) and ends at line 220 (index 219)
# BUT we want the factory return value.
# Line 11 is "return /******/ (function(modules) {"
# Line 219 is "/******/ });" (end of modules object)
# Line 220 is "});" (end of factory function)

$factoryPart = $lines[10..218] -join "`n"
$esmContent = "export const Nonogram = (function() { $factoryPart })();"
Set-Content -Path "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\Nonogram\nonogram_esm.js" -Value $esmContent -Encoding UTF8
