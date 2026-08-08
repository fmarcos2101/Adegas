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
echo Use se aparecer "Internal Server Error", Prisma/confbox ou build SWC
echo(

where node >nul 2>nul
if errorlevel 1 goto erro_node

echo [1/7] Encerrando processos antigos na porta 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>nul

echo [2/7] Removendo node_modules e .next corrompidos...
if exist "node_modules\" rmdir /s /q "node_modules"
if exist ".next\" rmdir /s /q ".next"

echo [3/7] Limpando cache npm (ajuda em binarios Win32 invalidos)...
call npm cache clean --force

echo [4/7] Reinstalando dependencias...
call npm install --ignore-scripts
if errorlevel 1 goto erro

echo [5/7] Gerando Prisma Client e atualizando banco...
call npx prisma generate
if errorlevel 1 goto erro
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro
call npm run db:seed
if errorlevel 1 goto erro
call npm rebuild better-sqlite3

echo [6/7] Rebuild nativo do Next SWC (Windows)...
call npm install @next/swc-win32-x64-msvc --no-save --ignore-scripts >nul 2>nul
call npm rebuild

echo [7/7] Gerando versao de producao (webpack)...
call npm run build
if errorlevel 1 goto erro

echo(
echo ========================================
echo   Reparo concluido!
echo ========================================
echo(
echo Execute Iniciar-NexoPDV.bat ou: npm start
echo Login loja demo: demo + admin / admin123
echo(
goto fim_ok

:erro_node
echo [ERRO] Node.js nao encontrado. Instale o Node.js 22 LTS em https://nodejs.org
goto fim_erro

:erro
echo(
echo [ERRO] Reparo falhou. Veja a mensagem detalhada acima.
echo Dica: use Node.js 22 LTS e instale fora do OneDrive (ex.: C:\NexoPDV).
echo Se precisar de ajuda, tire um print desta janela com o erro.
goto fim_erro

:fim_erro
echo(
goto fim

:fim_ok
goto fim

:fim
endlocal
