import electron from 'electron';
import { IpcRendererEvent } from 'electron/main';
import React, {useState,useEffect,useRef} from 'react';
import Store from '../Objects/StoreRenderer';
const {ipcRenderer} = require('electron');
export default function AcquisitionSettings(props:{store:Store}) {

    const [outputSettings, setOutputSettings] = useState<{
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
    const [acquisitionSettings, setAcquisitionSettings] = useState<{
        pulseCurrent:number,
        pulseWidth:number,
        pulsesSummed:number,
        lifetimeStartingPoint:number,
    }|undefined>(undefined);
    const [outputFolder, setOutputFolder] = useState<string | undefined>(undefined);
    const [editAcquisitionSettings, setEditAcquisitionSettings] = useState<boolean>(false);
    const [editOutputSettings,setEditOutputSettings] = useState<boolean>(false);

    useEffect(() => {
        let outputSettings_: {
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
        };
        let acquisitionSettings_: {
            pulseCurrent:number,
            pulseWidth:number,
            pulsesSummed:number,
            lifetimeStartingPoint:number,
        }
        let outputFolder_: string;
        let i:number = 0, j:number = 0, k:number = 0;

        outputSettings_ = props.store.get('outputSettings');
        
        let intervalId0 = setInterval(() => {
            if (outputSettings_ != undefined) {
                clearInterval(intervalId0);
                setOutputSettings(outputSettings_);
            } else if(i > 9) {
                setOutputSettings({
                    threeVExpected: 3,
                    threeVRange: 0.03,
                    fiveVExpected: 5,
                    fiveVRange: 0.25,
                    envTempExpected: 23,
                    envTempRange: 4,
                    microprocessorTempExpected: 23,
                    microprocessorTempRange: 7,
                    ledTempExpected: 23,
                    ledTempRange: 5,
                    photodiodeCurrentExpected: 125,
                    photodiodeCurrentRange: 11,
                    darkCurrentExpected: 138,
                    darkCurrentRange: 11,
                    lifetimeExpected: 23.5,
                    lifetimeRange: 2,
                    pt0Expected: 1000,
                    pt0Range: 200,
                    pt3Expected: 800,
                    pt3Range: 100
                })
                console.log('User prefrences request time out for output settings. Using default output settings instead.')
                clearInterval(intervalId0);
            }
            outputSettings_ = props.store.get('outputSettings');
            ++i;
        },100)

        acquisitionSettings_ = props.store.get('acquisitionSettings');
        let intervalId1 = setInterval(() => {
            if (acquisitionSettings_ != undefined) {
                clearInterval(intervalId1);
                setAcquisitionSettings(acquisitionSettings_);
            } else if(j > 9) {
                setAcquisitionSettings({
                    pulseCurrent: 550,
                    pulseWidth: 5,
                    pulsesSummed: 256,
                    lifetimeStartingPoint: 3,
                })
                console.log('User prefrences request time out for acquisition settings. Using default acquisition settings instead.')
                clearInterval(intervalId1);
            }
            acquisitionSettings_ = props.store.get('acquisitionSettings');
            ++j;
        },100)

        outputFolder_ = props.store.get('ouputFolder');
        let intervalId2 = setInterval(() => {
            if (outputFolder_ != undefined) {
                clearInterval(intervalId2);
                setOutputFolder(outputFolder_);
            } else if( k > 9) {
                console.log('User preferences request time out for output folder.');
                clearInterval(intervalId2);
            }
            outputFolder_ = props.store.get('outputFolder');
            ++k;
        },100)
    },[])

    useEffect(() => {
        ipcRenderer.on('output-folder-selected', (event:IpcRendererEvent,path:string|undefined) => {
            if (path) {
                props.store.set('outputFolder',path);
                setOutputFolder(path);
            } else {
                console.log('no output folder selected.');
            }
        })
        return function cleanup () {
            ipcRenderer.removeAllListeners('output-folder-selected');
        }
    },[])

    function onChange(value:number,name:string,id:string) {
        if (id === 'acquisitionSettings') {
            setAcquisitionSettings({
                ...acquisitionSettings,
                [name]: value
            })
        } else if (id === 'outputSettings') {
            setOutputSettings({
                ...outputSettings,
                [name]: value
            })
        } else {
            console.error('unrecognized settings ID, no settings were saved changed.');
        }
    }

    function onSubmitOutputSettings(e:React.FormEvent) {
        e.preventDefault();
        props.store.set('outputSettings',outputSettings);
        setEditOutputSettings(!editOutputSettings);
    }

    function onSubmitAcquisitionSettings(e:React.FormEvent) {
        e.preventDefault();
        props.store.set('acquisitionSettings',acquisitionSettings);
        setEditAcquisitionSettings(!editAcquisitionSettings);
    }

    function selectOutputFolder() {
        ipcRenderer.send('select-output-folder');
    }

    return (
        <div>
            <h1>Settings</h1>
            {acquisitionSettings && <form onSubmit={onSubmitAcquisitionSettings}>
            <h3>Acquisition Settings</h3>
                <ul>
                    <li>
                        <input type='number' value={acquisitionSettings.pulseCurrent} id={'acquisitionSettings'} name={'pulseCurrent'} disabled={!editAcquisitionSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pulse current</label>
                    </li>
                    <li>
                        <input type='number' value={acquisitionSettings.pulseWidth} id={'acquisitionSettings'} name={'pulseWidth'} disabled={!editAcquisitionSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pulse width</label>
                    </li>
                    <li>
                        <input type='number' value={acquisitionSettings.pulsesSummed} id={'acquisitionSettings'} name={'pulsesSummed'} disabled={!editAcquisitionSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pulse summed</label>
                    </li>
                    <li>
                        <input type='number' value={acquisitionSettings.lifetimeStartingPoint} id={'acquisitionSettings'} name={'lifetimeStartingPoint'} disabled={!editAcquisitionSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>lifetime starting point</label>
                    </li>
                    <li>
                        {editAcquisitionSettings && <input type='submit' value='Submit'/>}
                        {!editAcquisitionSettings && <input type='button' onClick={(): void => setEditAcquisitionSettings(true)} value='Edit'/>}
                    </li>
                </ul>
            </form>}
            {outputSettings && <form onSubmit={onSubmitOutputSettings}>
                <h3>Ouptut Settings</h3>
                <ul>
                    <li>
                        <input type='number' value={outputSettings.threeVExpected} id={'outputSettings'} name={'threeVExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>3V expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.threeVRange} id={'outputSettings'} name={'threeVRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>3V range</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.fiveVExpected} id={'outputSettings'} name={'fiveVExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>5V expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.fiveVRange} id={'outputSettings'} name={'fiveVRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>5V range</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.envTempExpected} id={'outputSettings'} name={'envTempExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>environmental temp expected value in {'\u2103'}</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.envTempRange} id={'outputSettings'} name={'envTempRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>environmental temp range in {'\u2103'}</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.microprocessorTempExpected} id={'outputSettings'} name={'microprocessorTempExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>microprocessor temp expected value in {'\u2103'}</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.microprocessorTempRange} id={'outputSettings'} name={'microprocessorTempRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>microprocessor temp range in {'\u2103'}</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.ledTempExpected} id={'outputSettings'} name={'ledTempExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>LED temp expected value in {'\u2103'}</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.ledTempRange} id={'outputSettings'} name={'ledTempRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>LED temp range in {'\u2103'}</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.photodiodeCurrentExpected} id={'outputSettings'} name={'photodiodeCurrentExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>photodiode current expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.photodiodeCurrentRange} id={'outputSettings'} name={'photodiodeCurrentRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>photodiode range</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.lifetimeExpected} id={'outputSettings'} name={'lifetimeExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>lifetime expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.lifetimeRange} id={'outputSettings'} name={'lifetimeRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>lifetime range</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.darkCurrentExpected} id={'outputSettings'} name={'darkCurrentExpected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>dark current expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.darkCurrentRange} id={'outputSettings'} name={'darkCurrentRange'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>dark current range</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.pt0Expected} id={'outputSettings'} name={'pt0Expected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pt0 expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.pt0Range} id={'outputSettings'} name={'pt0Range'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pt0 current range</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.pt3Expected} id={'outputSettings'} name={'pt3Expected'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pt0 expected value</label>
                    </li>
                    <li>
                        <input type='number' value={outputSettings.pt3Range} id={'outputSettings'} name={'pt3Range'} disabled={!editOutputSettings} onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => onChange(ev.target.valueAsNumber,ev.target.name,ev.target.id)} ></input>
                        <label>pt0 current range</label>
                    </li>
                    <li>
                        {editOutputSettings && <input type='submit' value='Submit'/>}
                        {!editOutputSettings && <input type='button' onClick={(): void => setEditOutputSettings(true)} value='Edit'/>}
                    </li>
                </ul>
            </form>}
            <form>
                <h3>Output folder settings</h3>
                <ul>
                    <li>
                        {outputFolder && <span>
                            <p>{outputFolder} </p>
                            <button onClick={selectOutputFolder}>Update output folder</button>
                        </span>}
                        {!outputFolder && <span>
                            <button onClick={selectOutputFolder}>Set an ouptut folder</button>
                        </span>}
                    </li>
                </ul>
            </form>
        </div>
    )
}