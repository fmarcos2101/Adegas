@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - PDV

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao instalado. Execute Instalar-Adega.bat primeiro.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Sistema nao instalado. Executando instalacao...
    call "%~dp0Instalar-Adega.bat"
    exit /b %errorlevel%
)

if not exist ".next\" (
    echo Gerando versao de producao...
    call npm run build
    if errorlevel 1 (
        echo [ERRO] Falha no build. Execute Instalar-Adega.bat
        pause
        exit /b 1
    )
)

if not exist "prisma\dev.db" (
    echo Criando banco de dados...
    call npx prisma db push --accept-data-loss
    call npm run db:seed
)

echo(
echo ========================================
echo   Adega Faixa Rosa - Sistema iniciando
echo ========================================
echo(
echo Acesse: http://localhost:3000
echo PDV:    http://localhost:3000/pdv
echo(
echo Mantenha esta janela aberta enquanto usar o sistema.
echo Para encerrar: feche esta janela ou pressione Ctrl+C
echo(

start "" "http://localhost:3000/pdv"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

call npm start
endlocal
