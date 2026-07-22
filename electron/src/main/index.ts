import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { autoUpdater } from 'electron-updater';

app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

function getIconPath(): string {
  // In dev: __dirname = dist-electron/main, build/ is at ../../
  // In production: electron-builder handles icon separately
  const buildPath = path.join(__dirname, '../../build/icon.png');
  if (fs.existsSync(buildPath)) return buildPath;
  return path.join(__dirname, 'icon.png');
}

function createWindow() {
  const iconPath = getIconPath();
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: iconPath,
    title: 'Rádio Coringão - Admin',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#fbf9f8',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('show-dialog', async (_event, options: {
  type: 'info' | 'warning' | 'error' | 'question';
  title: string;
  message: string;
  buttons?: string[];
}) => {
  if (!mainWindow) return null;
  const result = await dialog.showMessageBox(mainWindow, {
    type: options.type,
    title: options.title,
    message: options.message,
    buttons: options.buttons ?? ['OK'],
  });
  return result;
});

app.whenReady().then(() => {
  // Define ícone do dock no macOS
  if (process.platform === 'darwin') {
    app.dock?.setIcon(getIconPath());
  }
  createWindow();
  setupAutoUpdater();
});

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Suporte a repo privado via GH_TOKEN (injetado no build via definePlugin)
  if (process.env.GH_TOKEN) {
    autoUpdater.requestHeaders = {
      Authorization: `token ${process.env.GH_TOKEN}`,
    };
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdate] Verificando atualizações...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdate] Atualização disponível:', info?.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', 'update-available');
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdate] Nenhuma atualização disponível. Versão atual:', info?.version);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    console.log('[AutoUpdate] Atualização baixada:', info?.version);
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Atualização disponível',
      message: `Uma nova versão (${info?.version}) foi baixada. Deseja reiniciar agora para aplicar a atualização?`,
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdate] Erro:', err.message);
  });

  // Verifica atualizações 5 segundos depois de abrir
  setTimeout(() => {
    console.log('[AutoUpdate] Iniciando verificação...');
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error('[AutoUpdate] Falha na verificação:', err?.message);
    });
  }, 5000);
}

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
