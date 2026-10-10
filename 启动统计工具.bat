@echo off
title 12345 工单数据统计分析系统
cd /d "%~dp0"

echo ========================================================
echo          正在启动 12345 工单统计分析系统...
echo ========================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set PYCMD=py
    ) else (
        echo [错误] 未在系统环境中找到 Python 命令！
        echo 请确保已安装 Python 并已将其添加到 PATH 环境变量。
        pause
        exit /b 1
    )
) else (
    set PYCMD=python
)

echo 正在加载数据并启动服务，请稍候...
echo 网页会自动在默认浏览器中打开 (http://127.0.0.1:8088)
echo.
%PYCMD% server.py

if %errorlevel% neq 0 (
    echo.
    echo [提示] 服务已停止或发生异常。
    pause
)
