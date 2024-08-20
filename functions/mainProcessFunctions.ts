import { BrowserWindow, ipcMain } from 'electron';
import { IpcMainEvent } from 'electron/main';
import { PortInfo } from 'serialport';
import Store from '../Objects/StoreMain';
import fs from 'fs';
const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');
// attempt to change this to an import if possible
const {dialog} = require('electron');
import path from 'path';

function initiateListeners() {
    requestPorts();
    readProbe();
    saveData();
    makeDirectory();
    selectOutputFolder();
}

function requestPorts() {
    ipcMain.on('request-ports', (event:IpcMainEvent) => {
        SerialPort.list().then((ports:PortInfo[]) => {
            console.log("Something happened")
            let portsToUse:Promise<{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}>[];
            portsToUse = ports.map(async (port:PortInfo) => {
                return new Promise<{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}>((resolve, reject) => {
                    let port_ = `\\\\.\\${port.path}`;
                    const serialport = new SerialPort(port_,{autoOpen: false,baudRate: 114286},(err:Error) => {
                        if (err) {
                            console.error(err);
                            resolve({portName: port.path, isOO2Probe:false, toRead: false});
                        }
                    })
                    const parser0 = new ByteLength({length:949});
                    const parser1 = new ByteLength({length:950});
                    const parser2 = new ByteLength({length:951});
                    serialport.pipe(parser0);
                    serialport.pipe(parser1);
                    serialport.pipe(parser2);
                    serialport.open();
                    serialport.on("open", function(){
                        console.log('serial port open')
                        serialport.write('X3JBC0328', function (error:Error) {
                            if(error) {
                                serialport.close();
                                console.error(error);
                                resolve({portName: port.path, isOO2Probe:false, toRead: false})
                                serialport.close();
                            }
                            setTimeout(function () {
                                if (serialport.isOpen) {
                                    resolve({portName: port.path, isOO2Probe:false, toRead: false})
                                    serialport.close();
                                } 
                            },1000);
                        })
                        serialport.drain(function (error:Error) {
                            if(error) {
                            serialport.close();
                            console.error(error);
                            }
                        })
                    })
                    parser0.on('data', function(data:Buffer) {
                        let firstChar = data.slice(0,1);
                        let secondChar = data.slice(1,2);
                        let thirdChar = data.slice(2,3);
                        if (firstChar.toString('ascii') === 'K') {
                            let id = data.slice(934,942).toString('ascii');
                            resolve({portName: port.path, isOO2Probe:true, toRead: false,probeId:id});
                            serialport.close();
                        } else if (!(firstChar[0] === 0 && secondChar.toString('ascii') === 'K') && !(firstChar[0] === 0 && secondChar[0] === 0 && thirdChar.toString('ascii') === 'K')) {
                            resolve({portName: port.path, isOO2Probe:false, toRead: false});
                            serialport.close();
                        }
                    });
                    parser1.on('data', function(data:Buffer) {
                        let firstChar = data.slice(0,1);
                        let secondChar = data.slice(1,2);
                        if (firstChar[0] === 0 && secondChar.toString('ascii') === 'K') {
                            let id = data.slice(935,943).toString('ascii');
                            resolve({portName:port.path,isOO2Probe:true,toRead:false,probeId:id});
                            serialport.close();
                        }
                    })
                    parser2.on('data', function(data:Buffer) {
                        let firstChar = data.slice(0,1);
                        let secondChar = data.slice(1,2);
                        let thirdChar = data.slice(2,3);
                        if (firstChar[0] === 0 && secondChar[0] === 0 && thirdChar.toString('ascii') === 'K') {
                            let id = data.slice(935,943).toString('ascii');
                            resolve({portName:port.path,isOO2Probe:true,toRead:false,probeId:id});
                            serialport.close();
                        }
                    })
                    serialport.on("close", function(){
                        console.log("serial port closed");
                    })
                })
            })
            Promise.all(portsToUse).then((completed) => {
                let oo2Ports:boolean = false, nonOo2Ports:boolean = false, i:number;
                for (i = 0; i < completed.length; ++i) {
                    if (completed[i].isOO2Probe) {
                        oo2Ports = true;
                    }
                    if (!completed[i].isOO2Probe) {
                        nonOo2Ports = true;
                    }
                }
                let message:{data:{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}[],oo2Ports:boolean,nonOo2Ports:boolean} = {data:completed,oo2Ports,nonOo2Ports};
                event.reply('return-ports',message);
            })
        })
    });
}

function readProbe() {
    ipcMain.on('read-probe', (event:IpcMainEvent,args:{Id:string,comPort:string,acquisitionSettings:{pulseCurrent:number,pulseWidth:number,pulsesSummed:number,lifetimeStartingPoint:number}}) => {
        const serialport = new SerialPort(args.comPort,{autoOpen: false,baudRate: 114286},(err:Error) => {
            if (err) console.error(err);  
        })
        const parser0 = new ByteLength({length: 949});
        const parser1 = new ByteLength({length:950});
        const parser2 = new ByteLength({length:951});   
        let pulseCurrent = (Math.round(args.acquisitionSettings.pulseCurrent/1019*256)).toString(16).toUpperCase();
        let pulseWidth = (args.acquisitionSettings.pulseWidth/0.1).toString(16).toUpperCase();
        while(pulseWidth.length < 3) {
            pulseWidth = '0'+pulseWidth;
        }
        let pulsesSummed = (args.acquisitionSettings.pulsesSummed).toString().toUpperCase();
        serialport.pipe(parser0);
        serialport.pipe(parser1);
        serialport.pipe(parser2);
        serialport.open();
        serialport.on("open", function(){
            console.log('serial port open')
            serialport.write(`X3J${pulseCurrent}${pulseWidth}${pulsesSummed}`, function (error:Error) {
                if(error) {
                    serialport.close();
                    console.error(error);
                }
            })
            serialport.drain(function (error:Error) {
                if(error) {
                    serialport.close();
                    console.error(error);
                }
            })
            
        })
        parser0.on('data', (data:Buffer) => {
            const firstChar = data.slice(0,1);
            if (firstChar.toString() === 'K') {
                let message:{Id:string,data:Buffer} = {Id:args.Id,data:data};
                event.reply('return-data',message);
                serialport.close();
            }
        });
        parser1.on('data', (data:Buffer) => {
            const secondChar = data.slice(1,2);
            if (secondChar.toString() === 'K') {
                let message:{Id:string,data:Buffer} = {Id:args.Id,data:data.slice(1,950)};
                event.reply('return-data',message);
                serialport.close();
            }
        })
        parser2.on('data', (data:Buffer) => {
            const thirdChar = data.slice(2,3);
            if (thirdChar.toString() === 'K') {
                let message:{Id:string,data:Buffer} = {Id:args.Id,data:data.slice(2,951)};
                event.reply('return-data',message);
                serialport.close();
            }
        })
        
        serialport.on("error", function(err:Error) {
            console.error(err);
            // serialport.close();
        })
        serialport.on("close", function(){
            console.log("serial port closed");
        })
    })
}

function storeSet(store:Store) {
    ipcMain.on('store-set',(event:IpcMainEvent,args:{key:string,val:any}) => {
        store.set(args.key,args.val);
    })
}

function storeParseDataFile(store:Store) {
    ipcMain.on('store-parse-data-file', (event:IpcMainEvent,args:{path:string, defaults:{[key:string]:any}}) => {
        event.reply('store-data-file-parsed',store.parseDataFile(args.path,args.defaults));
    })
}

function selectOutputFolder() {
    ipcMain.on('select-output-folder',(event:IpcMainEvent) => {
        dialog.showOpenDialog({properties:['openDirectory'],message:'Select which folder to store output data from probeBenchTest.'}).then((filenames:{canceled:boolean,filePaths:string[],bookmarks?:string[]}) => {
            if (filenames.canceled) {
                event.reply('output-folder-selected',undefined);
            } else {
                let directoryPath:string = path.join(filenames.filePaths[0],'probeBenchTest results');
                fs.access(directoryPath,fs.constants.F_OK,(err) => {
                    if (err) {
                        console.log(err);
                        fs.mkdir(directoryPath,{recursive:false},(err:Error|null) => {
                            if (err) {
                                console.error(err);
                            } else {
                                // store.set('outputFolder',directoryPath);
                                event.reply('output-folder-selected',directoryPath);
                            }
                        })
                    } else {
                        console.log('the folder already exists');
                        // store.set('outputFolder',directoryPath);
                        event.reply('output-folder-selected',directoryPath);
                    }
                })
            }
        })
    })
} 

// defaults to utf8. Also defaults to create file if it doesnt exist or truncate it it does.
function saveData() {
    ipcMain.on('save-data',(event:IpcMainEvent,args:{path:string,data:string}) => {
        fs.writeFile(args.path,args.data,(err:Error) => {
            if (err) throw err;
            console.log('the file has been saved!');
        })
    })
}

function makeDirectory() {
    ipcMain.on('make-directory',(event:IpcMainEvent,path:string) => {
        fs.mkdir(path,(err) => {
            if (err) console.error(err);
            event.reply('directory-made',path);
        })
    })
}

function cancelPopup(window:BrowserWindow) {
    ipcMain.once('cancel-popup',(event:IpcMainEvent) => {
        window.close();
    })
}

function quitListeners() {
    console.log('listeners quit');
    ipcMain.removeAllListeners('request-ports');
    ipcMain.removeAllListeners('read-probe');
    ipcMain.removeAllListeners('store-set');
    ipcMain.removeAllListeners('store-parse-data-file');
    ipcMain.removeAllListeners('select-output-folder');
    ipcMain.removeAllListeners('save-data');
    ipcMain.removeAllListeners('make-directory');
}

export {
    initiateListeners,
    storeSet,
    storeParseDataFile,
    cancelPopup,
    quitListeners,
}