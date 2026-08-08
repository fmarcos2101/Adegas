@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title NexoPDV - PDV

echo %CD% | findstr /i "onedrive" >nul
if errorlevel 1 goto avisopasta_ok
echo [AVISO] Esta pasta esta dentro do OneDrive.
echo Se der erro na instalacao, copie a pasta para C:\NexoPDV e tente de la.
echo(
:avisopasta_ok

where node >nul 2>nul
if errorlevel 1 goto erro

if not exist "node_modules\" goto instalar
goto liberaporta

:instalar
echo Sistema nao instalado. Executando instalacao...
call "%~dp0Instalar-NexoPDV.bat" __run__
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
if errorlevel 1 goto erro_prisma

if not "%NOVO_BANCO%"=="1" goto seed_ok
echo Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 goto erro

:seed_ok
echo Atualizando cliente do banco de dados...
call npx prisma generate
if errorlevel 1 goto erro_prisma

echo Atualizando versao do sistema...
call npm run build
if errorlevel 1 goto erro_build

:iniciar
echo(
echo ========================================
echo   NexoPDV - Sistema iniciando
echo ========================================
echo(
echo Acesse: http://localhost:3000/login
echo Loja demo: codigo demo + admin / admin123
echo Plataforma: codigo em branco + owner / owner123
echo(
echo Nao feche esta janela enquanto usar o sistema.
echo(

start "" "http://localhost:3000/login"
call npm start
if errorlevel 1 goto erro
goto fim

:erro_prisma
echo(
echo [ERRO] Prisma falhou (confbox / client).
echo Execute Reparar-NexoPDV.bat para reinstalar do zero.
goto erro

:erro_build
echo(
echo [ERRO] Build falhou (SWC/Turbopack/Win32).
echo Execute Reparar-NexoPDV.bat
echo Ou no Prompt: npm run build
goto erro

:erro
echo(
echo [ERRO] Nao foi possivel iniciar. Veja a mensagem detalhada acima.
echo(
echo Se aparecer "Internal Server Error" no navegador, execute Reparar-NexoPDV.bat
echo Se precisar de ajuda, tire um print desta janela com a mensagem de erro.
echo(
goto fim

:fim
endlocal
