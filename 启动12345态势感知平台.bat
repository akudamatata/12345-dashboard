@echo off
chcp 65001 >nul
title 12345 态势感知平台 - 综合分析与数据录入系统
cd /d "%~dp0"

echo ================================================================
echo           正在启动 12345 态势感知平台 (本地全功能版)...
echo ================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未在系统环境中检测到 Node.js！
    echo 请确认已安装 Node.js 环境。
    pause
    exit /b 1
)

echo [1/2] 正在唤起默认浏览器访问系统...
start http://localhost:3001

echo [2/2] 正在启动本地 Web 服务 (Port: 3001)...
echo.
echo ----------------------------------------------------------------
echo   ★ 访问网址: http://localhost:3001
echo   ★ 功能包含: 态势感知大屏、多维数据查询、智能表格导入、数据录入
echo   ★ 提示: 关闭此黑框窗口即可停止本地服务
echo ----------------------------------------------------------------
echo.

node server/index.js

if %errorlevel% neq 0 (
    echo.
    echo [提示] 服务已停止或发生异常。
    pause
)
