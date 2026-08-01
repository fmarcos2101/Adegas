@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - Instalacao

echo(
echo ========================================
echo   ADEGA FAIXA ROSA - Instalacao
echo ========================================
echo(

where node >nul 2>nul
if errorlevel 1 goto erro_node

echo [OK] Node.js encontrado:
node -v
npm -v
echo(

if exist ".env" goto env_ok
echo [1/5] Criando arquivo .env...
copy /Y ".env.example" ".env" >nul
goto passo2
:env_ok
echo [1/5] Arquivo .env ja existe - mantido.

:passo2
echo [2/5] Instalando dependencias (pode demorar alguns minutos)...
call npm install
if errorlevel 1 goto erro

echo [3/5] Preparando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro

echo [4/5] Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 goto erro

echo [5/5] Gerando versao de producao...
call npm run build
if errorlevel 1 goto erro

echo(
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo(
echo Login: admin / admin123  ou  caixa / caixa123
echo(
echo Agora execute: Iniciar-Adega.bat
echo(
goto fim_ok

:erro_node
echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
goto fim_erro

:erro
echo [ERRO] Instalacao falhou. Veja a mensagem acima.
goto fim_erro

:fim_erro
echo(
echo Esta janela vai permanecer aberta.
goto fim

:fim_ok
echo Instalacao OK.
goto fim

:fim
endlocal
