@echo off
REM PredictivePulse AI - Windows setup script
REM Installs dependencies for all three services. Does not start anything.

echo ============================================
echo  PredictivePulse AI - Setup
echo ============================================

echo.
echo [1/3] Setting up ML service (Python)...
cd ml-service
if not exist venv (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create Python virtual environment. Is Python installed and on PATH?
        goto :error
    )
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed. See output above.
    goto :error
)
if not exist .env copy .env.example .env
call venv\Scripts\deactivate.bat
cd ..

echo.
echo [2/3] Setting up Backend (Node.js)...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed in backend/. See output above.
    goto :error
)
if not exist .env (
    copy .env.example .env
    echo IMPORTANT: edit backend\.env and set MONGO_URI and JWT_SECRET before starting.
)
cd ..

echo.
echo [3/3] Setting up Frontend (React)...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed in frontend/. See output above.
    goto :error
)
if not exist .env copy .env.example .env
cd ..

echo.
echo ============================================
echo  Setup complete.
echo  1. Edit backend\.env with your MongoDB connection string.
echo  2. Run:  python ml-service\training\train.py  (from a venv shell) to train the models.
echo  3. Run start.bat to launch all three services.
echo ============================================
goto :eof

:error
echo.
echo Setup stopped due to an error above. Fix it and re-run setup.bat.
exit /b 1
