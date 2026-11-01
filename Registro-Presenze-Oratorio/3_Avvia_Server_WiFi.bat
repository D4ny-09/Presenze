@echo off
title Server Wi-Fi Oratorio & Catechismo
cd /d "%~dp0"
echo ========================================================
echo  Server Locale Wi-Fi Oratorio
echo ========================================================
echo.
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ATTENZIONE: Python non e' installato o non e' nel PATH di sistema.
    echo Puoi comunque aprire direttamente i file HTML facendo doppio clic su:
    echo  - 1_Apri_Parrocchia.bat
    echo  - 2_Apri_Catechiste.bat
    echo.
    pause
)
