@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   营养学知识库 · 本地预览
echo   ----------------------------------------
echo   浏览器禁止以 file:// 方式读取本地 JSON，
echo   所以需要通过本地服务器打开，脚本会自动处理。
echo.

where node >nul 2>nul
if %errorlevel%==0 (
  node tools\serve.js 8080
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    echo   未找到 node，改用 python 启动。
    echo   服务起来后请手动访问：http://localhost:8080/
    echo.
    python -m http.server 8080
  ) else (
    echo   [错误] 本机没有找到 node，也没有找到 python。
    echo   请任选其一安装后重试，或直接把项目上传到任意静态托管。
    echo.
    pause
  )
)
