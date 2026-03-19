#!/bin/bash
# Start script that bypasses Node.js version check
cd "$(dirname "$0")"
NODE_OPTIONS='--no-warnings' npm run dev



