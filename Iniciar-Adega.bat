@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - PDV

where node >nul 2>nul
if errorlevel 1 goto erro

if not exist "node_modules\" goto instalar
goto verificar

:instalar
echo Sistema nao instalado. Executando instalacao...
call "%~dp0Instalar-Adega.bat" __run__
if errorlevel 1 goto erro
if not exist "node_modules\" goto erro

:verificar
if exist ".next\" goto banco
echo Gerando versao de producao...
call npm run build
if errorlevel 1 goto erro

:banco
if exist "prisma\dev.db" goto iniciar
echo Criando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro
call npm run db:seed
if errorlevel 1 goto erro

:iniciar
echo(
echo ========================================
echo   Adega Faixa Rosa - Sistema iniciando
echo ========================================
echo(
echo Acesse: http://localhost:3000/pdv
echo Login: admin / admin123
echo(
echo Nao feche esta janela enquanto usar o sistema.
echo(

start "" "http://localhost:3000/pdv"
call npm start
if errorlevel 1 goto erro
goto fim

:erro
echo [ERRO] Nao foi possivel iniciar. Veja a mensagem acima.
echo(
goto fim

:fim
endlocal
