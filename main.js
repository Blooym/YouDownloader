const { app, BrowserWindow } = require('electron');
require('@electron/remote/main').initialize();

function createWindow() {
    const win = new BrowserWindow({
        title: 'YouDownloader',
        width: 1000,
        height: 700,
        center: true,
        minHeight: 700,
        minWidth: 1000,
        maxHeight: 700,
        maxWidth: 1000,
        maximizable: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        icon: './src/images/logo.ico',
        //frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    win.loadFile('src/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
