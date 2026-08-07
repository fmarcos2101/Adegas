@echo off
if /i not "%~1"=="__run__" cmd /k "%~f0" __run__ & exit /b

setlocal EnableExtensions
cd /d "%~dp0"
title NexoPDV - Reparar

echo(
echo ========================================
echo   NEXOPDV - Reparar sistema
echo ========================================
echo(
echo Use se aparecer "Internal Server Error" ou a pagina nao carregar
echo(

where node >nul 2>nul
if errorlevel 1 goto erro

if not exist "node_modules\" goto sem_install
goto liberaporta

:sem_install
echo [ERRO] Rode Instalar-NexoPDV.bat ou npm install primeiro.
goto fim_erro

:liberaporta
echo [1/6] Encerrando processos antigos na porta 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>nul

echo [2/6] Atualizando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro

echo [3/6] Criando usuarios (se necessario)...
call npm run db:seed
if errorlevel 1 goto erro

echo [4/6] Atualizando cliente do banco (Prisma)...
call npx prisma generate
if errorlevel 1 goto erro

echo [5/6] Limpando versao antiga (.next)...
if exist ".next\" rmdir /s /q ".next"

echo [6/6] Gerando versao nova do sistema...
call npm run build
if errorlevel 1 goto erro

echo(
echo ========================================
echo   Reparo concluido!
echo ========================================
echo(
echo Execute Iniciar-NexoPDV.bat ou: npm start
echo Login: admin / admin123
echo(
goto fim_ok

:erro
echo(
echo [ERRO] Reparo falhou. Veja a mensagem detalhada acima.
echo Se precisar de ajuda, tire um print desta janela com o erro.
goto fim_erro

:fim_erro
echo(
goto fim

:fim_ok
goto fim

:fim
endlocal
