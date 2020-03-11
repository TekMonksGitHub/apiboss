#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [ -d "$DIR/../backend/server/conf/" ]; then
    cp "$DIR/httpd.json" "$DIR/../backend/server/conf/"
fi