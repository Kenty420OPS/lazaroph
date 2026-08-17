@echo off
echo ===================================================
echo   LAZAROPH E-Commerce Platform Launch Script
echo ===================================================

if not exist bin\com\lazaroph\Main.class (
    echo Building project first...
    call build.bat
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed, cannot start server.
        exit /b %errorlevel%
    )
)

echo Starting LAZAROPH Server on http://localhost:8080 ...
java -cp bin com.lazaroph.Main 8080
