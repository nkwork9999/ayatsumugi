#!/bin/sh
set -eu
printf 'Ayatsumugi source (ayatori/tsumugi) [ayatori]: '
read source
source=${source:-ayatori}
printf 'Absolute input path: '
read input
exec npx --yes @noobknotsdev/ayatsumugi-terminal snapshot --source "$source" --input "$input"
