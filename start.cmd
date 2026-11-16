@echo off
setlocal
cd /d "%~dp0"
if not exist ".local\tmp" mkdir ".local\tmp"
set "TEMP=%CD%\.local\tmp"
set "TMP=%TEMP%"
set "TMPDIR=%TEMP%"
set "npm_config_cache=%CD%\.local\npm-cache"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js, then run this file again.
  pause
  exit /b 1
)
echo Open http://localhost:4173 in your browser.
echo Keep this window open while previewing. Press Ctrl+C to stop.
node server.mjs
pause
