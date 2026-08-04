@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title Adega Faixa Rosa - Reparar

echo(
echo ========================================
echo   ADEGA FAIXA ROSA - Reparar sistema
echo ========================================
echo(
echo Use se aparecer "Internal Server Error"
echo(

where node >nul 2>nul
if errorlevel 1 goto erro

if not exist "node_modules\" goto sem_install
goto passo1

:sem_install
echo [ERRO] Rode Instalar-Adega.bat ou npm install primeiro.
goto fim_erro

:passo1
echo [1/4] Atualizando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro

echo [2/4] Criando usuarios...
call npm run db:seed
if errorlevel 1 goto erro

echo [3/4] Atualizando Prisma...
call npx prisma generate
if errorlevel 1 goto erro

echo [4/4] Rebuild...
call npm run build
if errorlevel 1 goto erro

echo(
echo ========================================
echo   Reparo concluido!
echo ========================================
echo(
echo Execute Iniciar-Adega.bat ou: npm start
echo Login: admin / admin123
echo(
goto fim_ok

:erro
echo [ERRO] Reparo falhou. Veja a mensagem acima.
goto fim_erro

:fim_erro
echo(
goto fim

:fim_ok
goto fim

:fim
endlocal
