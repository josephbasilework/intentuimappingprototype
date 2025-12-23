@echo off
echo Setting up Git repository...

REM Check if .git exists
if exist ".git" (
    echo Git repository already initialized.
) else (
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to initialize git. Please ensure git is installed.
        pause
        exit /b 1
    )
)

echo Adding files...
git add .

echo Committing...
git commit -m "Initial commit"

echo Checking for GitHub CLI (gh)...
where gh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo GitHub CLI found. Creating repository...
    REM Create public repo, push current source
    gh repo create intentuimappingprototype --public --source=. --remote=origin --push
    if %ERRORLEVEL% NEQ 0 (
        echo Error creating repository with gh. You may need to run 'gh auth login'.
        pause
        exit /b 1
    )
    echo Repository created and code pushed successfully!
) else (
    echo GitHub CLI not found.
    echo Please create a new repository on GitHub.com manually.
    echo Then run the following commands:
    echo git remote add origin ^<YOUR_REPO_URL^>
    echo git branch -M main
    echo git push -u origin main
)

pause
