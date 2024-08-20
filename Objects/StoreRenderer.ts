//import electron from 'electron';
import path from 'path';
// import fs from 'fs';
const {ipcRenderer} = require('electron');
const electron = require('electron');
import { IpcRendererEvent } from 'electron/main';

export default class Store {
    private path:string;
    private data:{[key:string]:any};
    constructor(opts:{configName:string,defaults:{[key:string]:any}}) {
        const userDataPath = (electron.app).getPath('userData');//(electron.app || electron.remote.app).getPath('userData');
        this.path = path.join(userDataPath, opts.configName + '.json');
        this.data = {};
        this.parseDataFile(this.path, opts.defaults);
    }

    public get(key:string) {
        return this.data[key];
    }

    public set(key:string,val:any) {
        this.data[key] = val;
        let message:{key:string,val:any} = {key,val};
        ipcRenderer.send('store-set',message)
    }

    private parseDataFile(filePath:string, defaults:{[key:string]:any}){
        ipcRenderer.send('store-parse-data-file',{path:filePath,defaults:defaults});
        ipcRenderer.once('store-data-file-parsed', (event:IpcRendererEvent,data:{[key:string]:any}) => {
            console.log('defaults',defaults);
            console.log('data',data);
            this.data = data;
        })
    }
}