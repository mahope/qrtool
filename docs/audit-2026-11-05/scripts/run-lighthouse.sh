#!/usr/bin/env bash
# Lighthouse 13.6.0: 3 runs per page per form factor. Usage: run-lh.sh <product> <slug>=<url> ...
set -u
source ~/dev/env.sh >/dev/null 2>&1
PROD=$1; shift
TOOLS=~/dev/data/audit-2026-11-05/tools
OUT=~/dev/data/audit-2026-11-05/$PROD/lh
mkdir -p "$OUT"
cd "$TOOLS"
export CHROME_PATH=/usr/bin/google-chrome
for pair in "$@"; do
  slug=${pair%%=*}; url=${pair#*=}
  for ff in mobile desktop; do
    for i in 1 2 3; do
      f="$OUT/${slug}_${ff}_${i}.json"
      [ -s "$f" ] && continue
      extra=""
      [ "$ff" = desktop ] && extra="--preset=desktop"
      ./node_modules/.bin/lighthouse "$url" --chrome-path=/usr/bin/google-chrome \
        --chrome-flags="--headless=new --no-sandbox" --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        --output=json --output-path="$f" $extra >/dev/null 2>"$OUT/${slug}_${ff}_${i}.err" \
        || echo "fail $slug $ff $i" >> "$OUT/failures.log"
    done
  done
  echo "done $slug" >> "$OUT/progress.log"
done
echo ALLDONE >> "$OUT/progress.log"
