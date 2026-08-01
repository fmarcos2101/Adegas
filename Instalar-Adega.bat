@echo off
chcp 65001 >nul
title Adega Faixa Rosa — Instalação
cd /d "%~dp0"

echo.
echo  ========================================
echo   ADEGA FAIXA ROSA — Instalação
echo  ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Node.js não encontrado.
    echo.
    echo Baixe e instale Node.js 20 LTS em:
    echo   https://nodejs.org
    echo.
    echo Depois execute este arquivo novamente.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node -v
npm -v
echo.

if not exist ".env" (
    echo [1/5] Criando arquivo .env...
    copy /Y ".env.example" ".env" >nul
) else (
    echo [1/5] Arquivo .env já existe — mantido.
)

echo [2/5] Instalando dependências (pode demorar alguns minutos)...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha no npm install.
    pause
    exit /b 1
)

echo [3/5] Preparando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERRO] Falha ao criar banco de dados.
    pause
    exit /b 1
)

echo [4/5] Criando usuários iniciais...
call npm run db:seed
if errorlevel 1 (
    echo [ERRO] Falha no seed.
    pause
    exit /b 1
)

echo [5/5] Gerando versão de produção...
call npm run build
if errorlevel 1 (
    echo [ERRO] Falha no build.
    pause
    exit /b 1
)

echo.
echo  ========================================
echo   Instalação concluída!
echo  ========================================
echo.
echo  Login inicial:
echo    admin / admin123  (Administrador)
echo    caixa / caixa123  (Caixa)
echo.
echo  Troque as senhas antes de usar na loja.
echo.
echo  Agora dê duplo clique em: Iniciar-Adega.bat
echo.
pause
