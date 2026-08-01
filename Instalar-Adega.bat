@echo off
if /i not "%~1"=="__run__" (
    cmd /k "%~f0" __run__
    exit /b
)

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - Instalacao

echo(
echo ========================================
echo   ADEGA FAIXA ROSA - Instalacao
echo ========================================
echo(

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado.
    echo(
    echo Baixe e instale Node.js 20 LTS em:
    echo   https://nodejs.org
    echo(
    echo Depois execute este arquivo novamente.
    goto :fim_erro
)

echo [OK] Node.js encontrado:
node -v
npm -v
echo(

if not exist ".env" (
    echo [1/5] Criando arquivo .env...
    copy /Y ".env.example" ".env" >nul
) else (
    echo [1/5] Arquivo .env ja existe - mantido.
)

echo [2/5] Instalando dependencias (pode demorar alguns minutos)...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha no npm install.
    goto :fim_erro
)

echo [3/5] Preparando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERRO] Falha ao criar banco de dados.
    goto :fim_erro
)

echo [4/5] Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 (
    echo [ERRO] Falha no seed.
    goto :fim_erro
)

echo [5/5] Gerando versao de producao...
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha no build.
    goto :fim_erro
)

echo(
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo(
echo Login inicial:
echo   admin / admin123  (Administrador)
echo   caixa / caixa123  (Caixa)
echo(
echo Troque as senhas antes de usar na loja.
echo(
echo Agora de duplo clique em: Iniciar-Adega.bat
echo(
goto :fim_ok

:fim_erro
echo(
echo A janela permanecera aberta para voce ler a mensagem.
goto :fim

:fim_ok
echo(
echo Instalacao OK. Voce pode fechar esta janela.
goto :fim

:fim
endlocal
