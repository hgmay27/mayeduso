@echo off
title Iniciar Proyecto Node + TypeScript
chcp 65001 > nul

echo ================================
echo   INICIANDO PROYECTO
echo ================================
echo.

REM 1. Comprobar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Instala Node.js y vuelve a intentarlo
    pause
    exit /b
)

REM 2. Limpiar instalacion previa
echo Limpiando entorno...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

REM 3. Instalar dependencias
echo Instalando dependencias...
call npm install --no-fund --no-audit --loglevel=error

REM 4. Instalar ts-node y typescript global (por si acaso)
echo Verificando TypeScript...
where ts-node >nul 2>nul
if %errorlevel% neq 0 (
    echo Instalando ts-node y typescript globalmente...
    call npm install -g ts-node typescript
)

REM 5. Iniciar servidor
echo.
echo Iniciando servidor...
start "Servidor Node" cmd /k npm start

REM 6. Esperar unos segundos para que arranque
timeout /t 3 >nul

REM 7. Abrir navegador
echo Abriendo navegador...
start "" "http://localhost:3000"

echo.
echo ================================
echo   PROYECTO INICIADO
echo ================================
echo Si hay errores, revisa la ventana del servidor
echo.
pause