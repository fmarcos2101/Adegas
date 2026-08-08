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
echo O OneDrive pode corromper arquivos nativos do Node durante a instalacao.
echo Recomendado: copie esta pasta para C:\NexoPDV e instale de la.
echo(
:avisopasta_ok

where node >nul 2>nul
if errorlevel 1 goto erro_node

echo [OK] Node.js encontrado:
node -v
npm -v
echo(

for /f "tokens=1 delims=v." %%V in ('node -v') do set NODE_MAJOR=%%V
if "%NODE_MAJOR%"=="" goto node_ok
if %NODE_MAJOR% LSS 20 goto erro_node_versao
if %NODE_MAJOR% GEQ 24 goto aviso_node24
goto node_ok

:aviso_node24
echo [AVISO] Node.js %NODE_MAJOR% detectado.
echo Para loja/PC Windows, use o Node.js 22 LTS: https://nodejs.org
echo Versoes muito novas podem quebrar Prisma e Next.js.
echo Continuando mesmo assim...
echo(
goto node_ok

:node_ok
if exist ".env" goto env_ok
echo [1/6] Criando arquivo .env...
copy /Y ".env.example" ".env" >nul
goto passo2
:env_ok
echo [1/6] Arquivo .env ja existe - mantido.

:passo2
echo [2/6] Limpando instalacao anterior incompleta...
if exist "node_modules\" rmdir /s /q "node_modules"
if exist ".next\" rmdir /s /q ".next"
if exist "prisma\dev.db-journal" del /f /q "prisma\dev.db-journal" >nul 2>nul

echo [3/6] Instalando dependencias (pode demorar alguns minutos)...
echo     Etapa A: baixar pacotes sem scripts...
call npm install --ignore-scripts
if errorlevel 1 goto erro_install

echo     Etapa B: gerar cliente Prisma...
call npx prisma generate
if errorlevel 1 goto erro_prisma

echo     Etapa C: rebuild de pacotes nativos...
call npm rebuild better-sqlite3
if errorlevel 1 echo [AVISO] rebuild better-sqlite3 falhou - tentando seguir...

echo [4/6] Preparando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 goto erro_banco

echo [5/6] Criando usuarios iniciais...
call npm run db:seed
if errorlevel 1 goto erro_seed

echo [6/6] Gerando versao de producao (webpack)...
call npm run build
if errorlevel 1 goto erro_build

echo(
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo(
echo Login plataforma: owner / owner123  (codigo da loja em branco)
echo Login loja demo:  demo + admin / admin123  ou  caixa / caixa123
echo(
echo Agora execute: Iniciar-NexoPDV.bat
echo(
goto fim_ok

:erro_node
echo [ERRO] Node.js nao encontrado.
echo Instale o Node.js 22 LTS em https://nodejs.org
echo Depois feche e abra este instalador de novo.
goto fim_erro

:erro_node_versao
echo [ERRO] Node.js muito antigo (precisa 20+).
echo Instale o Node.js 22 LTS em https://nodejs.org
goto fim_erro

:erro_install
echo(
echo [ERRO] Falha ao instalar dependencias (npm install).
echo Veja a mensagem de erro impressa ACIMA (role a janela para cima).
echo Causas comuns:
echo  - pasta dentro do OneDrive
echo  - antivirus bloqueando arquivos .node
echo  - internet instavel na primeira instalacao
echo  - Node.js diferente de 20/22 LTS
echo Solucao: delete a pasta node_modules e rode este .bat de novo.
pause
goto fim_erro

:erro_prisma
echo(
echo [ERRO] Falha ao gerar o Prisma Client.
echo Se aparecer "confbox" ou "rolldown-runtime", a pasta node_modules ficou incompleta.
echo Solucao:
echo  1. Delete a pasta node_modules
echo  2. No Prompt: npm cache clean --force
echo  3. Rode este instalador novamente
echo  4. Se continuar, instale Node.js 22 LTS e tente de novo
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
echo Se aparecer erro do Turbopack/SWC/Win32, rode:
echo   npm run build
echo (este projeto ja usa webpack no script build).
echo Se o arquivo next-swc estiver corrompido:
echo   rmdir /s /q node_modules
echo   npm cache clean --force
echo   Instalar-NexoPDV.bat
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
