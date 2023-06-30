const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const url = require("url");
const path = require("path");
const { setStoreValue } = require("./setting");
const { mainMenu } = require("./menu");
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: "DocuSync",
    width: 1000,
    height: 600,
    icon: "./icon.png",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  Menu.setApplicationMenu(mainMenu);

  const startUrl = url.format({
    pathname: path.join(__dirname, "./app/build/index.html"),
    protocol: "file",
  });

  mainWindow.loadURL(startUrl);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("key:set", (e, opt) => {
  setStoreValue("token", opt.token);
});

ipcMain.on("error", (e, opt) => {
  dialog.showErrorBox(opt.error, opt.msg);
});
