import electron from 'electron';
import path from 'path';
import fs from 'fs';

export default class Store {
    private path:string;
    private data:{[key:string]:any};
    constructor(opts:{configName:string,defaults:{[key:string]:any}}) {
        const userDataPath = (electron.app).getPath('userData');//(electron.app || electron.remote.app).getPath('userData');
        this.path = path.join(userDataPath, opts.configName + '.json');
        this.data = this.parseDataFile(this.path, opts.defaults);
    }

    public get(key:string) {
        return this.data[key];
    }

    public set(key:string,val:any) {
        try {
            this.data[key] = val;
            fs.writeFileSync(this.path, JSON.stringify(this.data));
        }
        catch(error) {
            throw (error)
        }
    }

    public parseDataFile(filePath:string, defaults:{[key:string]:any}):{[key:string]:any} {
        try {
            let keys:string[] = Object.keys(defaults);
            let output:{[key:string]:any} = JSON.parse(fs.readFileSync(filePath,{encoding:'utf-8'}));
            let i:number = 0;
            for(i; i < keys.length; ++i) {
                if(output[keys[i]] === undefined) {
                    output[keys[i]] = defaults[keys[i]];
                }
            }
            return output;
        } catch (error) {
            return defaults;
        }

    }
}