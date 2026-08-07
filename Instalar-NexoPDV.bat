@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title NexoPDV - Instalacao

echo(
echo ========================================
echo   NEXOPDV - Instalacao
echo ========================================
echo(

echo %CD% | findstr /i "onedrive" >nul
if errorlevel 1 goto avisopasta_ok
echo [AVISO] Esta pasta esta dentro do OneDrive.
echo O OneDrive pode travar arquivos durante a instalacao e causar erros.
echo Recomendado: copie esta pasta para C:\NexoPDV e instale de la.
echo(
:avisopasta_ok

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
if errorlevel 1 goto erro_install

echo [3/5] Preparando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro_banco

echo [4/5] Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 goto erro_seed

echo [5/5] Gerando versao de producao...
call npm run build
if errorlevel 1 goto erro_build

echo(
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo(
echo Login: admin / admin123  ou  caixa / caixa123
echo(
echo Agora execute: Iniciar-NexoPDV.bat
echo(
goto fim_ok

:erro_node
echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
goto fim_erro

:erro_install
echo(
echo [ERRO] Falha ao instalar dependencias (npm install).
echo Veja a mensagem de erro impressa ACIMA (role a janela para cima).
echo Causas comuns: pasta dentro do OneDrive, caminho com acentos/espacos
echo muito longo, ou falta de conexao com a internet na primeira vez.
pause
goto fim_erro

:erro_banco
echo(
echo [ERRO] Falha ao preparar o banco de dados (prisma db push).
echo Veja a mensagem de erro impressa ACIMA.
pause
goto fim_erro

:erro_seed
echo(
echo [ERRO] Falha ao criar usuarios iniciais (db:seed).
echo Veja a mensagem de erro impressa ACIMA.
pause
goto fim_erro

:erro_build
echo(
echo [ERRO] Falha ao gerar a versao de producao (npm run build).
echo Veja a mensagem de erro impressa ACIMA.
pause
goto fim_erro

:fim_erro
echo(
echo Esta janela vai permanecer aberta.
endlocal
exit /b 1

:fim_ok
echo Instalacao OK.
endlocal
exit /b 0
