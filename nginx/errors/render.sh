#!/bin/sh
# Renders an HTML and a JSON page per status in codes.txt, plus the error_page snippets.
set -eu

src=$1
pages=$2
conf=$3
mkdir -p "$pages" "$conf"
: > "$conf/errors-html.conf"
: > "$conf/errors-json.conf"

while IFS='|' read -r code text detail; do
    [ -n "$code" ] || continue
    awk -v code="$code" -v text="$text" -v logo="$src/logo.svg" '
        /\{\{LOGO\}\}/ { while ((getline line < logo) > 0) print line; next }
        { gsub(/\{\{CODE\}\}/, code); gsub(/\{\{TEXT\}\}/, text); print }
    ' "$src/error.html" > "$pages/$code.html"
    printf '{"detail":"%s"}\n' "$detail" > "$pages/$code.json"
    echo "error_page $code /__errors/$code.html;" >> "$conf/errors-html.conf"
    echo "error_page $code /__errors/$code.json;" >> "$conf/errors-json.conf"
done < "$src/codes.txt"
