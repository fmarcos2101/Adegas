@echo off
if /i not "%~1"=="__run__" (
    cmd /k "%~f0" __run__
    exit /b
)

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - PDV

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao instalado. Execute Instalar-Adega.bat primeiro.
    goto :fim_erro
)

if not exist "node_modules\" (
    echo Sistema nao instalado. Executando instalacao...
    call "%~dp0Instalar-Adega.bat" __run__
    if errorlevel 1 goto :fim_erro
    if not exist "node_modules\" (
        echo [ERRO] Instalacao nao foi concluida.
        goto :fim_erro
    )
)

if not exist ".next\" (
    echo Gerando versao de producao...
    call npm run build
    if errorlevel 1 (
        echo [ERRO] Falha no build. Execute Instalar-Adega.bat
        goto :fim_erro
    )
)

if not exist "prisma\dev.db" (
    echo Criando banco de dados...
    call npx prisma db push --accept-data-loss
    if errorlevel 1 goto :fim_erro
    call npm run db:seed
    if errorlevel 1 goto :fim_erro
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
if errorlevel 1 (
    echo [ERRO] O sistema nao conseguiu iniciar.
    goto :fim_erro
)
goto :fim_ok

:fim_erro
echo(
echo A janela permanecera aberta para voce ler a mensagem.
goto :fim

:fim_ok
echo Sistema encerrado.
goto :fim

:fim
endlocal
