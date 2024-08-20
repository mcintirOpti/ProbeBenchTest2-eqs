//import electron from 'electron';
import { IpcRendererEvent } from 'electron/main';
import React, {useEffect,useState} from 'react';
import {hot} from 'react-hot-loader';
const {ipcRenderer} = require('electron');
const PopupWindow = () => {

    function setOutputFolder() {
        ipcRenderer.send('select-output-folder');
        ipcRenderer.once('output-folder-selected',(event:IpcRendererEvent,path:string|undefined) => {
            console.log(path);
            ipcRenderer.send('popup-resolved',path);
        })
    }

    function cancelPopup() {
        ipcRenderer.send('popup-resolved',undefined);
    }

    return(
        <div>
            <p>You have not selected an output location for this data.</p>
            <span>
                <button onClick={setOutputFolder}>Set output folder</button>
                <button onClick={cancelPopup}>cancel</button>
            </span>
        </div>
    )
}

export default hot(module)(PopupWindow);