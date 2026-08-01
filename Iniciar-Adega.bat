@echo off
chcp 65001 >nul
title Adega Faixa Rosa — PDV
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js não instalado. Execute Instalar-Adega.bat primeiro.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Sistema não instalado. Executando instalação...
    call "%~dp0Instalar-Adega.bat"
    exit /b %errorlevel%
)

if not exist ".next\" (
    echo Gerando versão de produção...
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

echo.
echo  ========================================
echo   Adega Faixa Rosa — Sistema iniciando
echo  ========================================
echo.
echo  Acesse: http://localhost:3000
echo  PDV:     http://localhost:3000/pdv
echo.
echo  Mantenha esta janela aberta enquanto usar o sistema.
echo  Para encerrar: feche esta janela ou pressione Ctrl+C
echo.

start "" "http://localhost:3000/pdv"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

call npm start
