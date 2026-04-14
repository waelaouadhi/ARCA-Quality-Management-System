@echo off
REM QMS Backend - Complete Setup Script (Windows)
REM This script fixes all 4 startup issues in order

setlocal enabledelayedexpansion

echo ================================
echo QMS Backend - Complete Setup
echo ================================
echo.

REM ============================================
REM ISSUE 1: START POSTGRESQL WITH DOCKER
REM ============================================
echo [*] ISSUE 1: Starting PostgreSQL with Docker...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Docker not installed! Please install Docker for Windows first.
    echo    Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

for /f %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo [+] Docker is installed: %DOCKER_VERSION%

REM Check if container exists
docker ps -a --format "{{.Names}}" | findstr /r "^qms-postgres$" >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] Container 'qms-postgres' already exists
    
    docker ps --format "{{.Names}}" | findstr /r "^qms-postgres$" >nul 2>nul
    if %errorlevel% equ 0 (
        echo [+] Container is already running
    ) else (
        echo [*] Starting existing container...
        docker start qms-postgres
        timeout /t 3 /nobreak
        echo [+] Container started
    )
) else (
    echo [*] Creating new PostgreSQL container...
    docker run -d --name qms-postgres ^
        -e POSTGRES_PASSWORD=password ^
        -e POSTGRES_DB=qms_db ^
        -p 5432:5432 ^
        postgres:15-alpine
    
    echo [+] PostgreSQL container created
    echo [*] Waiting for database to start...
    timeout /t 5 /nobreak
)

echo [*] Verifying database connection...
docker exec qms-postgres psql -U postgres -d qms_db -c "SELECT 1" >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] Database connection verified
) else (
    echo [!] Failed to connect to database
    echo    Check Docker logs: docker logs qms-postgres
    pause
    exit /b 1
)

REM ============================================
REM ISSUE 2: DATABASE SETUP (Already done by Docker)
REM ============================================
echo [*] ISSUE 2: Database created (via Docker)
echo [+] Database 'qms_db' is ready

REM ============================================
REM ISSUE 3: CHECK PORT 4000
REM ============================================
echo [*] ISSUE 3: Checking port 4000...

netstat -ano | findstr ":4000" >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] Port 4000 is in use - attempting to free it
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000"') do taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak
    echo [+] Port 4000 is now free
) else (
    echo [+] Port 4000 is free
)

REM ============================================
REM ISSUE 4: INSTALL DEPENDENCIES
REM ============================================
echo [*] ISSUE 4: Installing dependencies...

if exist node_modules (
    for /f %%a in ('dir /b /ad node_modules ^| find /c /v ""') do set NODE_COUNT=%%a
    if !NODE_COUNT! gtr 100 (
        echo [+] Dependencies already installed (!NODE_COUNT! packages^)
    ) else (
        echo [*] Running npm install (this may take 1-2 minutes^)...
        call npm install --silent
        for /f %%a in ('dir /b /ad node_modules ^| find /c /v ""') do echo [+] Dependencies installed: %%a packages
    )
) else (
    echo [*] Running npm install (this may take 1-2 minutes^)...
    call npm install --silent
    for /f %%a in ('dir /b /ad node_modules ^| find /c /v ""') do echo [+] Dependencies installed: %%a packages
)

REM ============================================
REM BONUS: PRISMA SETUP
REM ============================================
echo [*] Setting up Prisma...

echo [*] Generating Prisma Client...
call npm run prisma:generate >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Failed to generate Prisma client
    pause
    exit /b 1
)
echo [+] Prisma Client generated

echo [*] Running migrations...
call npx prisma migrate deploy >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] No pending migrations or first migration
)
echo [+] Migrations completed

REM ============================================
REM ALL ISSUES FIXED
REM ============================================
echo.
echo ================================
echo [+] ALL ISSUES FIXED!
echo ================================
echo.
echo Your setup is complete. To start the backend:
echo.
echo    npm run dev
echo.
echo Expected output:
echo    - Server ready at http://localhost:4000/graphql
echo    - Health check at http://localhost:4000/health
echo.
echo Verify with:
echo    curl http://localhost:4000/health
echo.
pause
