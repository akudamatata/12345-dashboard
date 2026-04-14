const { app, Tray, Menu, nativeImage, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let tray = null;
let serverProcess = null;
const PORT = 3001;

// 确定资源路径（兼容开发模式和打包模式）
function getResourcePath(...segments) {
    if (app.isPackaged) {
        // 如果是 portable 模式，使用 exe 所在的实际目录，否则使用 execPath 目录
        const baseDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
        return path.join(baseDir, ...segments);
    }
    return path.join(__dirname, '..', ...segments);
}

// 等待后端端口就绪
function waitForServer(port, timeout = 20000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            http.get(`http://127.0.0.1:${port}/api/years`, (res) => {
                resolve();
            }).on('error', () => {
                if (Date.now() - start > timeout) {
                    reject(new Error('Server startup timeout'));
                } else {
                    setTimeout(check, 400);
                }
            });
        };
        check();
    });
}

// 用 ELECTRON_RUN_AS_NODE 模式启动后端
// 这样 sqlite3 不需要为 Electron 重新编译
function startServer() {
    const serverScript = app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar', 'server', 'index.js')
        : path.join(__dirname, '..', 'server', 'index.js');

    const dbPath = getResourcePath('database.sqlite');
    console.log('[Electron] Using database at:', dbPath);
    console.log('[Electron] Starting server script:', serverScript);

    serverProcess = spawn(process.execPath, [serverScript], {
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            DB_PATH: dbPath
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout?.on('data', (d) => console.log('[Server]', d.toString().trim()));
    serverProcess.stderr?.on('data', (d) => console.error('[Server Error]', d.toString().trim()));
    serverProcess.on('exit', (code) => console.log(`Server exited with code ${code}`));
}

// 创建系统托盘
function createTray() {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    const buildMenu = () => Menu.buildFromTemplate([
        {
            label: '12345 态势感知平台',
            enabled: false
        },
        { type: 'separator' },
        {
            label: '打开界面',
            click: () => shell.openExternal(`http://localhost:${PORT}`)
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                if (serverProcess) serverProcess.kill('SIGTERM');
                app.quit();
            }
        }
    ]);

    tray.setToolTip('12345 态势感知平台');
    tray.setContextMenu(buildMenu());

    // 单击托盘图标也可以打开界面
    tray.on('click', () => shell.openExternal(`http://localhost:${PORT}`));
}

// 禁止 Electron 默认的多窗口行为
app.on('window-all-closed', () => { /* 保持后台运行 */ });

app.whenReady().then(async () => {
    // 阻止 Dock 显示（Windows 无效但保险）
    app.dock?.hide();

    // 1. 启动后端
    startServer();

    // 2. 创建托盘（立即可见，给用户反馈）
    createTray();

    // 3. 等待后端就绪后打开浏览器
    try {
        await waitForServer(PORT);
        console.log('Server ready, opening browser...');
        shell.openExternal(`http://localhost:${PORT}`);
    } catch (e) {
        console.error('Server failed to start:', e.message);
    }
});

app.on('before-quit', () => {
    if (serverProcess) serverProcess.kill('SIGTERM');
});
