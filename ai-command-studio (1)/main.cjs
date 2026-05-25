const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0A0A0B',
    title: 'AI CMD Studio',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the compiled distribution HTML file
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Build an elegant custom application menu bar
  const menuTemplate = [
    {
      label: 'Application',
      submenu: [
        { label: 'Tentang AI CMD Studio', role: 'about' },
        { type: 'separator' },
        { label: 'Keluar', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', role: 'undo' },
        { label: 'Redo', role: 'redo' },
        { type: 'separator' },
        { label: 'Potong', role: 'cut' },
        { label: 'Salin', role: 'copy' },
        { label: 'Tempel', role: 'paste' },
        { label: 'Pilih Semua', role: 'selectall' }
      ]
    },
    {
      label: 'Tampilan',
      submenu: [
        { label: 'Muat Ulang', role: 'reload' },
        { label: 'Paksa Muat Ulang', role: 'forceReload' },
        { label: 'Toggle Developer Tools', role: 'toggleDevTools', accelerator: 'F12' },
        { type: 'separator' },
        { label: 'Reset Zoom', role: 'resetZoom' },
        { label: 'Perbesar', role: 'zoomIn' },
        { label: 'Perkecil', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Layar Penuh', role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // If the page/window fails to load, gracefully print error info
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load. Attempting relative paths verification.');
  });
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
