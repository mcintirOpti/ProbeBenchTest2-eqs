import electron from 'electron';
import { IpcRendererEvent } from 'electron/main';
import React, {useState,useEffect,useRef} from 'react';
import {Probe} from '../Objects/Probe';
const {ipcRenderer} = require('electron');
import Store from '../Objects/StoreRenderer'

export default function BenchTester(props:{store:Store}) {

    const [activePorts,setActivePorts] = useState<{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}[]|undefined>(undefined);
    const [portSelectionDisabled,setPortSelectionDisabled] = useState<boolean>(false);
    const [numPortsToRead, setNumPortsToRead] = useState<number>(0);
    const [acquisitionSettings, setAcquisitionSettings] = useState<{
        pulseCurrent:number,
        pulseWidth:number,
        pulsesSummed:number,
        lifetimeStartingPoint:number,
    }|undefined>(undefined);
    const [outputSettings,setOutputSettings] = useState<{
        threeVExpected:number,
        threeVRange:number,
        fiveVExpected:number,
        fiveVRange:number,
        envTempExpected:number,
        envTempRange:number,
        microprocessorTempExpected:number,
        microprocessorTempRange:number,
        ledTempExpected:number,
        ledTempRange:number,
        photodiodeCurrentExpected:number,
        photodiodeCurrentRange:number,
        darkCurrentExpected:number,
        darkCurrentRange:number,
        lifetimeExpected:number,
        lifetimeRange:number,
        pt0Expected:number,
        pt0Range:number,
        pt3Expected:number,
        pt3Range:number
    }|undefined>(undefined);
    const [directoryPath,setDirectoryPath] = useState<string|undefined>(undefined);
    const [oo2Ports, setOo2Ports] = useState<boolean>(false);
    const [nonOo2ports, setNonOo2Ports] = useState<boolean>(false);

    const portsRef = useRef<Probe[]|null[]>([]);
    useEffect(() => {
        setAcquisitionSettings(props.store.get('acquisitionSettings'));
        setOutputSettings(props.store.get('outputSettings'));
        setDirectoryPath(props.store.get('outputFolder'));
        ipcRenderer.on('return-ports', (event:IpcRendererEvent, arg:{data:{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}[],oo2Ports:boolean,nonOo2Ports:boolean}) => {
            setActivePorts(arg.data);
            setOo2Ports(arg.oo2Ports);
            setNonOo2Ports(arg.nonOo2Ports);
        });
        refreshPorts();
        return function cleanup() {
            ipcRenderer.removeAllListeners('return-ports');
        }
    },[])
    useEffect(() => {
        if (portsRef.current) {
            portsRef.current = portsRef.current.slice(0,numPortsToRead);
        }
    },[numPortsToRead])
    function refreshPorts() {
        setActivePorts(undefined);
        setNumPortsToRead(0);
        setPortSelectionDisabled(false);
        setOo2Ports(false);
        setNonOo2Ports(false);
        ipcRenderer.send('request-ports');
    }
    function lockInPorts() {
        setPortSelectionDisabled(true);
    }
    function editPorts() {
        setPortSelectionDisabled(false);
    }
    function onChange(sensor:{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}) {
        let portsToRead:Promise<{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}>[];
        portsToRead = activePorts.map((port:{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}) => {
            return new Promise<{portName:string,isOO2Probe:boolean,toRead:boolean,probeId?:string}>((resolve,reject) => {
                if(port.portName === sensor.portName) {
                    let updatedPort = port;
                    updatedPort.toRead = !updatedPort.toRead;
                    resolve(updatedPort);
                    if(port.toRead === true) {
                        setNumPortsToRead(numPortsToRead + 1);
                    } else {
                        setNumPortsToRead(numPortsToRead - 1);
                    }
                } else {
                    resolve(port);
                }
            })
        })
        Promise.all(portsToRead).then((completed) => {
            setActivePorts(completed);
        })
    }

    function setOuputFolder(path:string) {
        props.store.set('outputFolder',path);

    }
    return(
        <div>
            <button onClick={refreshPorts}>Refresh Ports</button>
            {activePorts && <table>
                <tbody>
                    {oo2Ports && <tr>
                        <td>
                            <h3>Recognized Ports:</h3>
                        </td>
                    </tr>}
                    {activePorts.filter( function (port) {
                        if (port.isOO2Probe) {
                            return true;
                        }
                        return false;
                    }).map((sensor, sensorNumber) => {
                        return (
                            <tr key={sensorNumber} >
                                <td>
                                    <input type="checkbox" value={sensor.portName} disabled={portSelectionDisabled} onChange={(): void => onChange(sensor)}/>
                                    <label>{ sensor.portName} Opti O2 sensor {sensor.probeId}</label>
                                </td>
                            </tr>
                        )
                    })}
                    <tr>
                        <td>
                            {!portSelectionDisabled && oo2Ports && <button onClick={lockInPorts}>Save</button>}
                            {portSelectionDisabled && oo2Ports && <button onClick={editPorts}>Edit</button>}
                        </td>
                    </tr>
                    {nonOo2ports && <tr>
                        <td>
                            <h3>Unrecognized Ports:</h3>
                        </td>
                    </tr>}
                    {activePorts.filter( function (port) {
                        if (!port.isOO2Probe) {
                            return true;
                        }
                        return false;
                    }).map((port, portNumber) => {
                        return (
                            <tr key={portNumber} >
                                <td>
                                    <label>{ port.portName} not recognized as an Opti O2 sensor</label>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>}
            {!oo2Ports && !nonOo2ports && <h1>No active ports</h1>}
            {activePorts && portSelectionDisabled && oo2Ports && acquisitionSettings && outputSettings && activePorts.filter( function (port) {
                if (port.toRead && port.probeId) {
                    return true;
                }
                return false;
            }).
            map((port,portNumber) => {
                if(port.probeId && portsRef.current) {
                    return (
                        <div key={portNumber}>
                             <Probe ref={el => portsRef.current[portNumber] = el} comPort={port.portName} probeId={port.probeId} acquisitionSettings={acquisitionSettings} outputSettings={outputSettings} directoryPath={directoryPath} setOutputFolder={setOuputFolder} ></Probe>
                        </div>
                    )
                }
            })}
        </div>
    )
}