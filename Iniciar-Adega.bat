@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - PDV

where node >nul 2>nul
if errorlevel 1 goto erro

if not exist "node_modules\" goto instalar
goto liberaporta

:instalar
echo Sistema nao instalado. Executando instalacao...
call "%~dp0Instalar-Adega.bat" __run__
if errorlevel 1 goto erro
if not exist "node_modules\" goto erro
goto iniciar

:liberaporta
echo Verificando se a porta 3000 esta livre...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>nul
goto banco

:banco
set NOVO_BANCO=0
if not exist "prisma\dev.db" set NOVO_BANCO=1

echo Verificando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro

if not "%NOVO_BANCO%"=="1" goto seed_ok
echo Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 goto erro

:seed_ok
echo Atualizando cliente do banco de dados...
call npx prisma generate
if errorlevel 1 goto erro

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
echo(
echo [ERRO] Nao foi possivel iniciar. Veja a mensagem detalhada acima.
echo(
echo Se aparecer "Internal Server Error" no navegador, execute Reparar-Adega.bat
echo Se precisar de ajuda, tire um print desta janela com a mensagem de erro.
echo(
goto fim

:fim
endlocal
