$ErrorActionPreference = 'Stop'
$source = Read-Host 'Ayatsumugi source (ayatori/tsumugi) [ayatori]'
if ([string]::IsNullOrWhiteSpace($source)) { $source = 'ayatori' }
$inputPath = Read-Host 'Absolute input path'
& npx.cmd --yes '@noobknotsdev/ayatsumugi-terminal' snapshot --source $source --input $inputPath
