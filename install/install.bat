@echo off
DIR=%~dp0

if EXIST "%DIR%\..\backend\server\conf" cp "%DIR%\httpd.json" "%DIR%\..\backend\server\conf\"