import { app, BrowserWindow, ipcMain} from 'electron';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const POPUP_WINDOW_WEBPACK_ENTRY: any;
import Store from '../Objects/StoreMain';
import {
  initiateListeners,
  storeSet,
  storeParseDataFile,
  cancelPopup,
  quitListeners,
} from '../functions/mainProcessFunctions';
import { IpcMainEvent } from 'electron/main';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow: Electron.BrowserWindow | null;
let popupWindow: Electron.BrowserWindow | null;

const store = new Store({
  configName:'user-preferences',
  defaults: {windowBounds: {width: 800, height: 600}}
})

const createWindow = async() => {
  // Create the browser window.
  let {width, height} = store.get('windowBounds');
  if(store.get('windowPosition')){
    let {x,y} = store.get('windowPosition');
    mainWindow = new BrowserWindow({
      x:x,
      y:y,
      height: height,
      width: width,
      webPreferences: {
        nodeIntegration: true,
        //enableRemoteModule: true
      }
    });
  } else {
    mainWindow = new BrowserWindow({
      height: height,
      width: width,
      webPreferences: {
        nodeIntegration: true,
        //enableRemoteModule: true
      }
    });
  }

  ipcMain.on('create-popup',(event:IpcMainEvent) => {
    popupWindow = new BrowserWindow({
      width: 500,
      height: 300,
      webPreferences: {
        nodeIntegration: true,
        //enableRemoteModule: true
      },
      parent:mainWindow,
      modal:true
    });
    popupWindow.loadURL(POPUP_WINDOW_WEBPACK_ENTRY);
    popupWindow.once('ready-to-show', () => {
      cancelPopup(popupWindow);
      ipcMain.once('popup-resolved',(e:IpcMainEvent,path:string|undefined) => {
        console.log('resolved');
        event.reply('popup-resolved',path);
        popupWindow.close();
      })
    })
  });

  mainWindow.on('resize', () => {
    if (mainWindow) {
      let {x,y,width, height} = mainWindow.getBounds();
      store.set('windowPosition', {x,y});
      store.set('windowBounds', {width,height});
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools (only have this activated when in development).
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    quitListeners();
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// setting this as false is an attempt at a work around to get serialport to work
// app.allowRendererProcessReuse = false;

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
initiateListeners();

storeSet(store);

storeParseDataFile(store);

