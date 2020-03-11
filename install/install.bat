@echo off
set DIR=%~dp0

if EXIST "%DIR%\..\backend\server\conf" copy "%DIR%\httpd.json" "%DIR%\..\backend\server\conf\"