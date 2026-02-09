@echo off
REM Setup script for NV-Reason-CXR API (Windows)

echo Setting up NV-Reason-CXR API backend...

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Create .env from example if it doesn't exist
if not exist ".env" (
    echo Creating .env file from example...
    copy env.example .env
    echo Please edit .env with your configuration
)

echo Setup complete!
echo To run the service:
echo   venv\Scripts\activate
echo   uvicorn main:app --reload --port 8000

pause
