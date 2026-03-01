$txt = Get-Content "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\Nonogram\nonogram.js" -Raw
# The file starts with the UMD wrapper.
# We want to extract the factory function and export its result.
# The factory function starts at the second argument of webpackUniversalModuleDefinition.
# Actually, it's easier to just append an export.

$exported = @"

if (typeof module !== 'undefined' && module.exports) {
    export const Nonogram = module.exports;
} else if (typeof window !== 'undefined' && window.Nonogram) {
    export const Nonogram = window.Nonogram;
} else {
    // Fallback or handle error
}
"@

# But wait, it's better to just modify the header to be ESM compatible.
# Let's just do a simple replacement of the wrapper.

$esmHeader = "export const Nonogram = (function() {"
$esmFooter = "})();"

# This is risky because of the webpack structure.

# Let's try this:
# 1. Read all lines
$lines = Get-Content "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\Nonogram\nonogram.js"

# 2. Join lines from index 10 to 220 (zero-based 10 is line 11)
$factoryContent = $lines[10..220] -join "`r`n"

$finalContent = "const Nonogram = (function() { return $factoryContent })(); export { Nonogram };"
Set-Content -Path "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\Nonogram\nonogram_esm.js" -Value $finalContent -Encoding UTF8
