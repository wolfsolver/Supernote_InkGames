$content = Get-Content "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\Nonogram\nonogram.js" -Raw
$matches = [regex]::Matches($content, 'eval\("(.+?)"\)')
foreach ($match in $matches) {
    $evalStr = $match.Groups[1].Value
    # JS string unescaping in PowerShell is tricky. Let's use a simpler way.
    # We can use a temporary JS file and run it with node if available.
}
