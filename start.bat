@echo off
REM PredictivePulse AI - Windows start script
REM Starts all three services, each in its own terminal window, so you can
REM see each service's logs independently and stop them individually.
REM (Starting all three "silently" in one window is unreliable on Windows
REM when one service crashes, so this project intentionally uses 3 windows.)

echo Starting ML Service (FastAPI) on http://localhost:8000 ...
start "PredictivePulse - ML Service" cmd /k "cd ml-service && call venv\Scripts\activate.bat && uvicorn app:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Backend (Node.js) on http://localhost:5000 ...
start "PredictivePulse - Backend" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend (React) on http://localhost:5173 ...
start "PredictivePulse - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All three services are starting in separate windows.
echo   ML Service:  http://localhost:8000/docs
echo   Backend:     http://localhost:5000/api/health
echo   Frontend:    http://localhost:5173
echo.
echo If a window closes immediately, re-run setup.bat first and check backend\.env has a valid MONGO_URI.
