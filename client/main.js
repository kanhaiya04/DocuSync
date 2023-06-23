const { app, BrowserWindow, ipcMain } = require("electron");
const url = require("url");
const path = require("path");
const { setStoreValue } = require("./setting");
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "Electron",
    width: 1000,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload:path.join(__dirname, "preload.js")
    },
  });
  const tempWindow = new BrowserWindow({
    title: "Electron",
    width: 1000,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload:path.join(__dirname, "preload.js")
    },
  });

  mainWindow.webContents.openDevTools();

  const startUrl = url.format({
    pathname: path.join(__dirname, "./app/build/index.html"),
    protocol: "file",
  });

  mainWindow.loadURL("http://localhost:3000");
  tempWindow.loadURL("http://localhost:3000");
}

app.whenReady().then(createMainWindow);

ipcMain.on("key:set",(e,opt)=>{
  setStoreValue('token',opt.token);
});

