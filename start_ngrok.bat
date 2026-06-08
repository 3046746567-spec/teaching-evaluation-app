@echo off
chcp 65001 >nul
title 🏥 护理实习生评价系统 - ngrok 启动器
color 0B

echo ╔══════════════════════════════════════╗
echo ║    🏥 护理实习生评价系统             ║
echo ║    ngrok 公网隧道启动器              ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查 ngrok.exe 是否存在
set NGROK_PATH=
if exist "%USERPROFILE%\Desktop\ngrok.exe" set NGROK_PATH=%USERPROFILE%\Desktop\ngrok.exe
if exist "%USERPROFILE%\Desktop\ngrok\ngrok.exe" set NGROK_PATH=%USERPROFILE%\Desktop\ngrok\ngrok.exe
if exist "%~dp0ngrok.exe" set NGROK_PATH=%~dp0ngrok.exe
if exist "%~dp0ngrok\ngrok.exe" set NGROK_PATH=%~dp0ngrok\ngrok.exe

if "%NGROK_PATH%"=="" (
    echo ❌ 未找到 ngrok.exe
    echo.
    echo 请按以下步骤操作：
    echo 1. 打开桌面上的 ngrok.zip
    echo 2. 把里面的 ngrok.exe 解压到桌面
    echo 3. 重新运行本脚本
    echo.
    pause
    exit /b
)

echo ✅ 找到 ngrok: %NGROK_PATH%
echo.
echo 🚀 正在启动 ngrok 隧道...
echo.
echo 🌐 生成公网地址后，扫二维码即可访问
echo 🔑 护士长密码: panwenting2022
echo.
echo ⏳ 首次运行需要登录 ngrok 账号...
echo.

:: 检查是否已配置 authtoken
"%NGROK_PATH%" config check >nul 2>&1
if %errorlevel% neq 0 (
    echo 📝 首次使用需要配置 Authtoken
    echo.
    echo 请访问 https://dashboard.ngrok.com/signup 免费注册
    echo 然后在 https://dashboard.ngrok.com/get-started/your-authtoken
    echo 复制你的 Authtoken
    echo.
    set /p TOKEN="请输入你的 Authtoken: "
    "%NGROK_PATH%" config add-authtoken %TOKEN%
    echo.
    echo ✅ Authtoken 已配置！
    echo.
)

:: 启动 ngrok
echo 🔗 正在连接 ngrok 服务器...
"%NGROK_PATH%" http 3000

pause
