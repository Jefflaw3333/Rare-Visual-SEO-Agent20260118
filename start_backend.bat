@echo off
echo Starting Backend Server...
cd backend
echo Installing dependencies...
call go mod tidy
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies. Please check your Go installation.
    pause
    exit /b %ERRORLEVEL%
)
echo Running server...
go run ./cmd/server/main.go
pause
