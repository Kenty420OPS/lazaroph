@echo off
echo ===================================================
echo   LAZAROPH E-Commerce Platform Build Script
echo ===================================================

if not exist bin mkdir bin

echo Compiling Java source files...
powershell -NoProfile -Command "$files = Get-ChildItem -Path src/main/java -Recurse -Filter *.java | ForEach-Object { '\"' + ($_.FullName -replace '\\', '/') + '\"' }; [System.IO.File]::WriteAllLines('sources.txt', $files, [System.Text.UTF8Encoding]::new($false))"

javac -encoding UTF-8 -d bin @sources.txt
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    if exist sources.txt del sources.txt
    exit /b %errorlevel%
)
if exist sources.txt del sources.txt

echo [SUCCESS] Build completed successfully into bin/
