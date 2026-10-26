#!/bin/sh
# يجمع ملفات src في index.html واحد
cd "$(dirname "$0")"
{ cat src/head.html; cat src/core.js src/ui.js src/forms.js src/reports.js src/settings.js src/boot.js; printf '\n</script></body></html>\n'; } > index.html
BID=$(date -u +%Y%m%d-%H%M)
sed -i "s/__BUILD__/$BID/g" index.html
