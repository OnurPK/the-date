#!/bin/bash
# Double-click in Finder to start the roles.ai dev-server and open the app.
# Reads OPENAI_API_KEY from .env automatically. Close this window to stop the server.
cd "$(dirname "$0")" || exit 1

echo "▶ roles.ai — starting dev-server on http://localhost:8000 …"

# open the app once the server has had a moment to boot
( sleep 1.5; open "http://localhost:8000/index.html" ) &

node dev-server.js
