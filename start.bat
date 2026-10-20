@echo off
cd /d "e:\12345 Dashboard"

echo ====================================================
echo Starting 12345 Dashboard Server...
echo URL: http://localhost:3001
echo ====================================================

start http://localhost:3001
node server/index.js

pause
