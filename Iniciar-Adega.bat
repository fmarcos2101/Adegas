@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - PDV

where node >nul 2>nul
if errorlevel 1 goto erro

if not exist "node_modules\" goto instalar
goto banco

:instalar
echo Sistema nao instalado. Executando instalacao...
call "%~dp0Instalar-Adega.bat" __run__
if errorlevel 1 goto erro
if not exist "node_modules\" goto erro
goto iniciar

:banco
set NOVO_BANCO=0
if not exist "prisma\dev.db" set NOVO_BANCO=1

echo Verificando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro

if not "%NOVO_BANCO%"=="1" goto rebuild
echo Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 goto erro

:rebuild
echo Atualizando versao do sistema...
call npm run build
if errorlevel 1 goto erro

:iniciar
echo(
echo ========================================
echo   Adega Faixa Rosa - Sistema iniciando
echo ========================================
echo(
echo Acesse: http://localhost:3000/login
echo Login: admin / admin123
echo(
echo Nao feche esta janela enquanto usar o sistema.
echo(

start "" "http://localhost:3000/login"
call npm start
if errorlevel 1 goto erro
goto fim

:erro
echo [ERRO] Nao foi possivel iniciar. Veja a mensagem acima.
echo(
echo Se aparecer "Internal Server Error", execute Reparar-Adega.bat
echo(
goto fim

:fim
endlocal
