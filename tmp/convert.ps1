$content = Get-Content "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\assets\en-common.txt"
$items = $content | ForEach-Object { "'$($_)'" }
$joined = $items -join ","
$output = "export const DICTIONARY = [$joined];"
Set-Content -Path "c:\Users\EmmanuelePrudenzano\Downloads\SuperNote\Supernote_InkGames\module\WordFind\dictionary.ts" -Value $output -Encoding UTF8
