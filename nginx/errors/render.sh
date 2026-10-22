#!/bin/sh
# Renders an HTML and a JSON page per status in codes.txt, plus the error_page snippets
# and the maintenance page template.
set -eu

src=$1
pages=$2
conf=$3
mkdir -p "$pages" "$conf"
: > "$conf/errors-html.conf"
: > "$conf/errors-json.conf"

render() {
    awk -v code="$1" -v text="$2" -v refresh="$3" -v logo="$src/logo.svg" '
        /\{\{LOGO\}\}/ { while ((getline line < logo) > 0) print line; next }
        /\{\{REFRESH\}\}/ { if (refresh != "") print "<meta http-equiv=\"refresh\" content=\"" refresh "\">"; next }
        { gsub(/\{\{CODE\}\}/, code); gsub(/\{\{TEXT\}\}/, text); print }
    ' "$src/error.html"
}

while IFS='|' read -r code text detail; do
    [ -n "$code" ] || continue
    # Outages are usually a deploy, so the page retries on its own.
    case $code in 502|503|504) refresh=10 ;; *) refresh= ;; esac
    render "$code" "$text" "$refresh" > "$pages/$code.html"
    printf '{"detail":"%s"}\n' "$detail" > "$pages/$code.json"
    echo "error_page $code /__errors/$code.html;" >> "$conf/errors-html.conf"
    echo "error_page $code /__errors/$code.json;" >> "$conf/errors-json.conf"
done < "$src/codes.txt"

render "Wartung" "ShareFrame wird gerade gewartet und ist bald wieder da" 60 > "$pages/maintenance.html"
