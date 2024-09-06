import ProbeStatus from './ProbeStatus';
import React, {useState} from 'react';
import { IpcRendererEvent } from 'electron/main';
// import * as s from '../src/index.css'
const {ipcRenderer} = require('electron');
import path from 'path';

enum TestType{
    controlBoard = 1,
    LEDBoard,
    fullBody,
    other
}

type ProbeOperatorState = {
    comPort:string,
    probeId:string,
    acquisitionSettings:{
        pulseCurrent:number,
        pulseWidth:number,
        pulsesSummed:number,
        lifetimeStartingPoint:number,
    },
    outputSettings: {
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
    },
    directoryPath:string|undefined,
    testType: TestType | undefined,
    LEDNumber: number|undefined,
    otherFilename:string|undefined,
    data: {
        beginningStatus:ProbeStatus,
        endingStatus:ProbeStatus,
        darkCurrent:number,
        lifetime:number,
        firstFiveADValues:number[]
    }[],
    timerId:any
}
type PropsState = {
    comPort:string,
    probeId:string,
    acquisitionSettings:{
        pulseCurrent:number,
        pulseWidth:number,
        pulsesSummed:number,
        lifetimeStartingPoint:number,
    },
    outputSettings: {
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
    },
    directoryPath: string|undefined,
    setOutputFolder: (n: string|undefined) => void;
}

class Probe extends React.Component<PropsState, ProbeOperatorState> {
    
    constructor(props:any) {
        super(props);
        this.state= {
            comPort:props.comPort,
            probeId:props.probeId,
            acquisitionSettings:props.acquisitionSettings,
            outputSettings:props.outputSettings,
            directoryPath:props.directoryPath,
            testType:undefined,
            LEDNumber:undefined,
            otherFilename:undefined,
            data:[],
            timerId:undefined
        };
        this.testProbe = this.testProbe.bind(this);
        //this.queryProbe = this.queryProbe.bind(this);
        this.parseOutput = this.parseOutput.bind(this);
        this.stopTest = this.stopTest.bind(this);
        this.onChange = this.onChange.bind(this);
        this.saveData = this.saveData.bind(this);
    }

    componentDidMount() {
        ipcRenderer.on('return-data', (event:IpcRendererEvent, args:{Id:string,data:Buffer}) => {
            if (args.Id === this.state.probeId) {
                this.parseOutput(args.data);
            }
        })
    }
    componentWillUnmount() {
        ipcRenderer.removeAllListeners('return-data');
        clearInterval(this.state.timerId);
    }

    testProbe() {
        let i:number = 0;
        let message:{
            Id:string,
            comPort:string,
            acquisitionSettings:{pulseCurrent:number,pulseWidth:number,pulsesSummed:number,lifetimeStartingPoint:number}
        } = {Id:this.state.probeId,comPort:this.state.comPort,acquisitionSettings:{
            pulseCurrent:this.state.acquisitionSettings.pulseCurrent,
            pulseWidth:this.state.acquisitionSettings.pulseWidth,
            pulsesSummed:(Math.log(this.state.acquisitionSettings.pulsesSummed)/Math.log(2)),
            lifetimeStartingPoint:this.state.acquisitionSettings.lifetimeStartingPoint
        }}
        ipcRenderer.send('read-probe',message); 
        let timerId = setInterval(() => {
            ++i;
            if(i > 3) {
                clearInterval(timerId);
                // the timout here is purely for asthetics. May be a bit lazy
                setTimeout(() => {
                    this.setState({timerId:undefined})
                },700)
            }
            let message:{
                Id:string,
                comPort:string,
                acquisitionSettings:{pulseCurrent:number,pulseWidth:number,pulsesSummed:number,lifetimeStartingPoint:number}
            } = {Id:this.state.probeId,comPort:this.state.comPort,acquisitionSettings:{
                pulseCurrent:this.state.acquisitionSettings.pulseCurrent,
                pulseWidth:this.state.acquisitionSettings.pulseWidth,
                pulsesSummed:(Math.log(this.state.acquisitionSettings.pulsesSummed)/Math.log(2)),
                lifetimeStartingPoint:this.state.acquisitionSettings.lifetimeStartingPoint
            }}
            ipcRenderer.send('read-probe',message);
        },5000) 
        this.setState({timerId})
    }

    stopTest() {
        clearInterval(this.state.timerId);
        this.setState({timerId:undefined})
    }

    // depreciated
    // queryProbe(port:any,parser_:any,stop?:boolean) {
    //     const serialport = port;
    //     const parser = parser_;    
    //     let pulseCurrent = (Math.round(this.state.acquisitionSettings.pulseCurrent/1019*256)).toString(16).toUpperCase();
    //     let pulseWidth = (this.state.acquisitionSettings.pulseWidth/0.1).toString(16).toUpperCase();
    //     while(pulseWidth.length < 3) {
    //         pulseWidth = '0'+pulseWidth;
    //     }
    //     let pulsesSummed = (this.state.acquisitionSettings.pulsesSummed).toString().toUpperCase();
    //     serialport.pipe(parser);
    //     serialport.open();
    //     serialport.on("open", function(){
    //         serialport.write(`J${pulseCurrent}${pulseWidth}${pulsesSummed}`, function (error:Error) {
    //             if(error) {
    //                 serialport.close();
    //                 console.error(error);
    //             }
    //         })
    //         serialport.drain(function (error:Error) {
    //             if(error) {
    //                 serialport.close();
    //                 console.error(error);
    //             }
    //         })
            
    //     })
    //     parser.on('data', (data:Buffer) => {
    //         this.parseOutput(data);
    //         if (stop) {
    //             serialport.close();
    //         }
    //     });

    //     serialport.on("error", function(err:Error) {
    //         console.error(err);
    //         // serialport.close();
    //     })
    //     serialport.on("close", function(){
    //         console.log("serial port closed");
    //     })
    // }
    private parseOutput(data:Buffer) {
        let systemData:{initialStatus:ProbeStatus,finalStatus:ProbeStatus} = this.parseSystemStatusData(data);
        let lifetimeData:{lifetime:number,backgroundCount:number,lifetimeNumberOfPoints:number,ADValues:number[]} = this.parseSampleSums(data, this.state.acquisitionSettings.lifetimeStartingPoint);
        let data_:{
            beginningStatus:ProbeStatus,
            endingStatus:ProbeStatus,
            darkCurrent:number,
            lifetime:number,
            firstFiveADValues:number[]
        }[] = [...this.state.data];
        let firstFive:number[] = lifetimeData.ADValues.slice(0,5);
        data_.push({beginningStatus:systemData.initialStatus,endingStatus:systemData.finalStatus,lifetime:lifetimeData.lifetime,darkCurrent:lifetimeData.backgroundCount,firstFiveADValues:firstFive});
        this.setState({data:data_});
    }

    // private parseSampleSums(data:Buffer):{lifetime:number,backgroundCount:number,ADValues:number[]} {
    //     let i:number;
    //     let photodiodeBackground:Buffer = data.slice(931,934);
    //     let backgroundADSum = this.baseTwoTwoFour(photodiodeBackground[0],photodiodeBackground[1],photodiodeBackground[2]);
    //       // ask mike why this isnt 16 also convert to handle variable number of pulses;
    //     let backgroundCount = backgroundADSum/2048;
    //     let detailedSampleSums:Buffer = data.slice(31,331);
    //     let sampleSums:number[] = [];
    //     for (i = 0; i < detailedSampleSums.length; i+=3) {
    //       let ADSum = this.baseTwoTwoFour(detailedSampleSums[i],detailedSampleSums[i+1],detailedSampleSums[i+2]);
    //       // convert this to variable number of pulses;
    //       let count = (ADSum/256)-backgroundCount;
    //       sampleSums.push(count);
    //       console.log("Count:", count);
    //     };
    //     let undetailedSampleSums:Buffer = data.slice(331,931);
    //     for (i = 0; i < undetailedSampleSums.length; i+=2) {
    //       let ADSum = this.baseTwoTwoFour(undetailedSampleSums[i],undetailedSampleSums[i+1]);
    //       // convert this to handle variable number of pulses;
    //       let count = (ADSum/32)-backgroundCount;
    //       sampleSums.push(count);
    //       console.log("Count (undetailed):", count);
    //     };
    //     // TODO: check what the propper timestep is here/see if in needs to be variable
    //     //let lifetime:{lifetime:number} = this.calculateLifetime(sampleSums,2.25,this.state.acquisitionSettings.lifetimeStartingPoint, backgroundCount)
    //     let lifetime: { lifetime: number; lifetimeNumberOfPoints: number } = this.calculateLifetime(sampleSums, 2.25, this.state.acquisitionSettings.lifetimeStartingPoint, backgroundCount);
    //     return {lifetime:lifetime.lifetime,backgroundCount,ADValues:sampleSums};
    // }
    private parseSampleSums(
        data: Buffer,
        startingPoint: number
      ): {
        lifetime: number;
        backgroundCount: number;
        //integratedArea: number;
        lifetimeNumberOfPoints: number;
        ADValues: number[];
      } {
        let i: number;
        let photoDiodeBackground: Buffer = data.slice(931, 934);
        let backgroundADSum = this.baseTwoTwoFour(
          photoDiodeBackground[0],
          photoDiodeBackground[1],
          photoDiodeBackground[2]
        );
        // ask mike why this isnt 16 also convert to handle variable number of pulses;
        let backgroundCount = backgroundADSum / 2048;
        //let ADValues: string = "";
        let detailedSampleSums: Buffer = data.slice(31, 331);
        let sampleSums: number[] = [];
        for (i = 0; i < detailedSampleSums.length; i += 3) {
          let ADSum = this.baseTwoTwoFour(
            detailedSampleSums[i],
            detailedSampleSums[i + 1],
            detailedSampleSums[i + 2]
          );
          // convert this to variable number of pulses;
          let count = ADSum / 256 - backgroundCount;
          sampleSums.push(count);
          //ADValues += `${count},`;
        }
        let undetailedSampleSums: Buffer = data.slice(331, 931);
        for (i = 0; i < undetailedSampleSums.length; i += 2) {
          let ADSum = this.baseTwoTwoFour(
            undetailedSampleSums[i],
            undetailedSampleSums[i + 1]
          );
          // convert this to handle variable number of pulses;
          let count = ADSum / 32 - backgroundCount;
          sampleSums.push(count);
          //ADValues += `${count},`;
        }
        // check what the propper timestep is here
        let lifetime: { lifetime: number; lifetimeNumberOfPoints: number } =
          this.calculateLifetime(sampleSums, 2.25, startingPoint, backgroundCount);
        // TODO: calculate integrated area
        //let integratedArea = calculateIntegratedArea(sampleSums, startingPoint);
        let lifetimeNumberOfPoints = lifetime.lifetimeNumberOfPoints;
        return {
          lifetime: lifetime.lifetime,
          backgroundCount,
          //integratedArea,
          lifetimeNumberOfPoints,
          ADValues:sampleSums,
        };
      }

    // private calculateLifetime(
    //     ADMeasurements: number[],
    //     timeStep: number,
    //     startingPoint: number,
    //     backgroundCount: number
    //   ): { lifetime: number; lifetimeNumberOfPoints: number } {
    //     let i: number = startingPoint,
    //       halfIntensity: number = ADMeasurements[startingPoint] / 2;
    //     // Check to see if the first count exceeds 3950 before the background is subtracted and is under 10 after the background is subtracted.
    //     if (ADMeasurements[0] < 10 || ADMeasurements[0] + backgroundCount > 3950) {
    //       console.error("The AD counts for this sensor are invalid");
    //       return { lifetime: -1, lifetimeNumberOfPoints: -1 };
    //     }
    //     while (ADMeasurements[i] > halfIntensity) {
    //       ++i;
    //       if (i === ADMeasurements.length) {
    //         console.error("The intensity never reduces to half");
    //         // This might be lazy? Review later
    //         return { lifetime: -50, lifetimeNumberOfPoints: -50 };
    //       }
    //     }
    //     let logScaleADMeasurements: number[] = ADMeasurements.map((measurement) => {
    //       return Math.log(measurement);
    //     });
    //     let lifetime: number = -1;
    //     if (ADMeasurements[i] === halfIntensity) {
    //       let fit: { m: number; b: number } = this.leastSquaresFit(
    //         logScaleADMeasurements.slice(startingPoint, i),
    //         timeStep
    //       );
    //       let y0: number = Math.log(ADMeasurements[startingPoint]),
    //         x0: number,
    //         y1: number = Math.log(ADMeasurements[startingPoint] / Math.E),
    //         x1: number;
    //       x0 = (y0 - fit.b) / fit.m;
    //       x1 = (y1 - fit.b) / fit.m;
    //       lifetime = x1 - x0;
    //     } else {
    //       let lowerBoundFit: { m: number; b: number } = this.leastSquaresFit(
    //         logScaleADMeasurements.slice(startingPoint, i),
    //         timeStep
    //       );
    //       let upperBoundFit: { m: number; b: number } = this.leastSquaresFit(
    //         logScaleADMeasurements.slice(startingPoint, i + 1),
    //         timeStep
    //       );
    //       let y0: number = Math.log(ADMeasurements[startingPoint]),
    //         y1: number = Math.log(ADMeasurements[startingPoint] / Math.E),
    //         upperx0: number,
    //         lowerx0: number,
    //         upperx1: number,
    //         lowerx1: number;
    //       let lowerBoundLifetime: number, upperBoundLifetime: number, delta: number;
    //       lowerx0 = (y0 - lowerBoundFit.b) / lowerBoundFit.m;
    //       lowerx1 = (y1 - lowerBoundFit.b) / lowerBoundFit.m;
    //       lowerBoundLifetime = lowerx1 - lowerx0;
      
    //       upperx0 = (y0 - upperBoundFit.b) / upperBoundFit.m;
    //       upperx1 = (y1 - upperBoundFit.b) / upperBoundFit.m;
    //       upperBoundLifetime = upperx1 - upperx0;
    //       // should this use the log values or not?
    //       delta =
    //         (ADMeasurements[i - 1] - ADMeasurements[startingPoint] / 2) /
    //         (ADMeasurements[i - 1] - ADMeasurements[i]);
    //       lifetime = lowerBoundLifetime * (1.0 - delta) + upperBoundLifetime * delta;
    //     }
    //     // i gives the number of points greater than one half of the max intensity starting with the "starting point"
    //     return { lifetime: lifetime, lifetimeNumberOfPoints: i - startingPoint + 1 };
    //   }
    private calculateLifetime(
        ADMeasurements: number[],
        timeStep: number,
        startingPoint: number,
        backgroundCount: number
      ): { lifetime: number; lifetimeNumberOfPoints: number } {
        let i: number = startingPoint,
          halfIntensity: number = ADMeasurements[startingPoint] / 2;
        // Check to see if the first count exceeds 3950 before the background is subtracted and is under 10 after the background is subtracted.
        if (ADMeasurements[0] < 10 || ADMeasurements[0] + backgroundCount > 3950) {
          console.error("The AD counts for this sensor are invalid");
          return { lifetime: -1, lifetimeNumberOfPoints: -1 };
        }
        while (ADMeasurements[i] > halfIntensity) {
          ++i;
          if (i === ADMeasurements.length) {
            console.error("The intensity never reduces to half");
            // This might be lazy? Review later
            return { lifetime: -50, lifetimeNumberOfPoints: -50 };
          }
        }
        let logScaleADMeasurements: number[] = ADMeasurements.map((measurement) => {
          return Math.log(measurement);
        });
        let lifetime: number = -1;
        if (ADMeasurements[i] === halfIntensity) {
          let fit: { m: number; b: number } = this.leastSquaresFit(
            logScaleADMeasurements.slice(startingPoint, i),
            timeStep
          );
          let y0: number = Math.log(ADMeasurements[startingPoint]),
            x0: number,
            y1: number = Math.log(ADMeasurements[startingPoint] / Math.E),
            x1: number;
          x0 = (y0 - fit.b) / fit.m;
          x1 = (y1 - fit.b) / fit.m;
          lifetime = x1 - x0;
        } else {
          let lowerBoundFit: { m: number; b: number } = this.leastSquaresFit(
            logScaleADMeasurements.slice(startingPoint, i),
            timeStep
          );
          let upperBoundFit: { m: number; b: number } = this.leastSquaresFit(
            logScaleADMeasurements.slice(startingPoint, i + 1),
            timeStep
          );
          let y0: number = Math.log(ADMeasurements[startingPoint]),
            y1: number = Math.log(ADMeasurements[startingPoint] / Math.E),
            upperx0: number,
            lowerx0: number,
            upperx1: number,
            lowerx1: number;
          let lowerBoundLifetime: number, upperBoundLifetime: number, delta: number;
          lowerx0 = (y0 - lowerBoundFit.b) / lowerBoundFit.m;
          lowerx1 = (y1 - lowerBoundFit.b) / lowerBoundFit.m;
          lowerBoundLifetime = lowerx1 - lowerx0;
      
          upperx0 = (y0 - upperBoundFit.b) / upperBoundFit.m;
          upperx1 = (y1 - upperBoundFit.b) / upperBoundFit.m;
          upperBoundLifetime = upperx1 - upperx0;
          // should this use the log values or not?
          delta =
            (ADMeasurements[i - 1] - ADMeasurements[startingPoint] / 2) /
            (ADMeasurements[i - 1] - ADMeasurements[i]);
          lifetime = lowerBoundLifetime * (1.0 - delta) + upperBoundLifetime * delta;
        }
        // i gives the number of points greater than one half of the max intensity starting with the "starting point"
        return { lifetime, lifetimeNumberOfPoints: i - startingPoint + 1 };
    }

    // private leastSquaresFit(yValues: number[], timeStep: number): {m: number, b: number} {
    //     let m: number, b: number, N: number = yValues.length, i:number, x:number, y:number;
    //     let xSum:number = 0, ySum:number = 0, xySum:number = 0 , xSquaredSum:number = 0;
    //     for (i = 0; i < N; ++i) {
    //         x = i*timeStep;
    //         y = yValues[i];
    //         xSum += x;
    //         ySum += y;
    //         xySum += x*y;
    //         xSquaredSum += Math.pow(x,2);
    //     }
    //     m = ((N*xySum-xSum*ySum))/(N*xSquaredSum-Math.pow(xSum,2));
    //     b = (ySum-m*xSum)/N;
    //     return {m:m,b:b};
    // }
    private leastSquaresFit(
        yValues: number[],
        timeStep: number
      ): { m: number; b: number } {
        let m: number,
          b: number,
          N: number = yValues.length,
          i: number,
          x: number,
          y: number;
        let xSum: number = 0,
          ySum: number = 0,
          xySum: number = 0,
          xSquaredSum: number = 0;
        for (i = 0; i < N; ++i) {
          x = i * timeStep;
          y = yValues[i];
          xSum += x;
          ySum += y;
          xySum += x * y;
          xSquaredSum += Math.pow(x, 2);
        }
        m = (N * xySum - xSum * ySum) / (N * xSquaredSum - Math.pow(xSum, 2));
        b = (ySum - m * xSum) / N;
        return { m: m, b: b };
    }

    // private parseSystemStatusData(data:Buffer):{beginningStatus:ProbeStatus,endingStatus:ProbeStatus} {
    //     let initialStatusBytes:Buffer = data.slice(7,19);
    //     let finalStatusBytes:Buffer = data.slice(19,31);
    //     let initialStatus:ProbeStatus = this.retrieveStatus(initialStatusBytes);
    //     let finalStatus:ProbeStatus = this.retrieveStatus(finalStatusBytes);
    //     return {beginningStatus:initialStatus,endingStatus:finalStatus};
    // }
    private parseSystemStatusData(data: Buffer): {
        initialStatus: ProbeStatus;
        finalStatus: ProbeStatus;
      } {
        let initialStatusBytes: Buffer = data.slice(7, 19);
        let finalStatusBytes: Buffer = data.slice(19, 31);
        // retrieve initial status
        let initialStatus: ProbeStatus = this.retrieveStatus(initialStatusBytes);
        // retrieve final status
        let finalStatus: ProbeStatus = this.retrieveStatus(finalStatusBytes);
        return { initialStatus, finalStatus };
    }
      

    // private retrieveStatus(statusBytes:Buffer):ProbeStatus {
    //     let fiveVSupply:number = this.baseTwoTwoFour(statusBytes[0],statusBytes[1])*2*3.3/50176.0;
    //     // add temperature conversion for both of these
    //     let systemTempThermistorVoltage:number = this.baseTwoTwoFour(statusBytes[2],statusBytes[3])/50176.0;
    //     let microprocessorTemp:number = this.baseTwoTwoFour(statusBytes[4],statusBytes[5]) * 3.3/50176.0;
    //     let threeVoltReference:number = this.baseTwoTwoFour(statusBytes[6],statusBytes[7])*3.3/50176.0;
    //     let ledTemp:number = this.baseTwoTwoFour(statusBytes[8],statusBytes[9])/50176.0;
    //     // should this be current or voltage?
    //     let photodiodeVoltage:number = this.baseTwoTwoFour(statusBytes[10],statusBytes[11])/12.25;
    //     let outputStatus = new ProbeStatus(fiveVSupply,systemTempThermistorVoltage,microprocessorTemp,threeVoltReference,ledTemp,photodiodeVoltage);
    //     return outputStatus;
    // }
    private retrieveStatus(statusBytes: Buffer): ProbeStatus {
        let fiveVSupply: number =
          (this.baseTwoTwoFour(statusBytes[0], statusBytes[1]) * 2 * 3.3) / 50176.0;
        // add temperature conversion for both of these
        let systemTempThermistorVoltage: number =
          this.baseTwoTwoFour(statusBytes[2], statusBytes[3]) / 50176.0;
        let microprocessorTemp: number =
          (this.baseTwoTwoFour(statusBytes[4], statusBytes[5]) * 3.3) / 50176.0;
        let threeVoltReference: number =
          (this.baseTwoTwoFour(statusBytes[6], statusBytes[7]) * 3.3) / 50176.0;
        let ledTemp: number =
          this.baseTwoTwoFour(statusBytes[8], statusBytes[9]) / 50176.0;
        // should this be current or voltage?
        let photoDiodeVoltage: number =
          this.baseTwoTwoFour(statusBytes[10], statusBytes[11]) / 12.25;
        let outputStatus = new ProbeStatus(
          fiveVSupply,
          systemTempThermistorVoltage,
          microprocessorTemp,
          threeVoltReference,
          ledTemp,
          photoDiodeVoltage
        );
        return outputStatus;
      }
    private baseTwoTwoFour(firstByte:number, secondByte:number, thirdByte?:number):number {
        if (thirdByte) {
            return (
                (firstByte-32)*Math.pow(224,2)+
                (secondByte-32)*224+
                thirdByte-32);
        }
        return (firstByte-32)*224+secondByte-32;
    }

    // returns true if the value is in the expected range (inclusive) otherwise false
    private checkRange(value:number, expected:number, range:number):boolean {
        let min = expected-range;
        let max = expected+range;
        return ((value >= min) && (value <= max));
    }
    private onChange(id:string) {
        this.setState({testType:parseInt(id)});
    }
    private saveData(e: React.FormEvent) {
        e.preventDefault();
        if (!this.state.directoryPath) {
            ipcRenderer.send('create-popup');
            ipcRenderer.once('popup-resolved',(event:IpcRendererEvent,path:string|undefined) => {
                this.setState({directoryPath:path});
                this.props.setOutputFolder(path);
            })
        } else {
            let globalPrecision:number = 5;
            let i:number;
            let data:string = 'Pulse Current:,';
            data += (this.state.acquisitionSettings.pulseCurrent + ',\r\n');
            data += 'Pulse Width:,';
            data += (this.state.acquisitionSettings.pulseWidth + ',\r\n');
            data += 'Pulses Summed:,';
            data += (this.state.acquisitionSettings.pulsesSummed + ',\r\n');
            data += 'Lifetime start point:,';
            data += (this.state.acquisitionSettings.lifetimeStartingPoint + ',\r\n');
            data += 'Expected:,';
            data += (this.state.outputSettings.threeVExpected + ',');
            data += (this.state.outputSettings.fiveVExpected + ',');
            data += (this.state.outputSettings.envTempExpected + ',');
            data += (this.state.outputSettings.microprocessorTempExpected + ',');
            data += (this.state.outputSettings.ledTempExpected + ',');
            data += (this.state.outputSettings.photodiodeCurrentExpected + ',');
            data += (this.state.outputSettings.threeVExpected + ',');
            data += (this.state.outputSettings.fiveVExpected + ',');
            data += (this.state.outputSettings.envTempExpected + ',');
            data += (this.state.outputSettings.microprocessorTempExpected + ',');
            data += (this.state.outputSettings.ledTempExpected + ',');
            data += (this.state.outputSettings.photodiodeCurrentExpected + ',');
            data += (this.state.outputSettings.darkCurrentExpected + ',');
            data += (this.state.outputSettings.lifetimeExpected + ',');
            data += (this.state.outputSettings.pt0Expected + ',,,');
            data += (this.state.outputSettings.pt3Expected + ',,\r\n');
            data += 'Tolerance:,';
            data += (this.state.outputSettings.threeVRange + ',');
            data += (this.state.outputSettings.fiveVRange + ',');
            data += (this.state.outputSettings.envTempRange + ',');
            data += (this.state.outputSettings.microprocessorTempRange + ',');
            data += (this.state.outputSettings.ledTempRange + ',');
            data += (this.state.outputSettings.photodiodeCurrentRange + ',');
            data += (this.state.outputSettings.threeVRange + ',');
            data += (this.state.outputSettings.fiveVRange + ',');
            data += (this.state.outputSettings.envTempRange + ',');
            data += (this.state.outputSettings.microprocessorTempRange + ',');
            data += (this.state.outputSettings.ledTempRange + ',');
            data += (this.state.outputSettings.photodiodeCurrentRange + ',');
            data += (this.state.outputSettings.darkCurrentRange + ',');
            data += (this.state.outputSettings.lifetimeRange + ',');
            data += (this.state.outputSettings.pt0Range + ',,,');
            data += (this.state.outputSettings.pt3Range + ',,\r\n');
            data += ('Sample #,');
            data += ('3 VDC Supply - Begin,');
            data += ('5 VDC Supply - Begin,');
            data += ('ENV Temp (C) - Begin,');
            data += ('Microproc Temp (C) - Begin,');
            data += ('LED Temp (C) - Begin,');
            data += ('PD Current (na) - Begin,');
            data += ('3 VDC Supply - End,');
            data += ('5 VDC Supply - End,');
            data += ('ENV Temp (C) - End,');
            data += ('Microproc Temp (C) - End,');
            data += ('LED Temp (C) - End,');
            data += ('PD Current (na) - End,');
            data += ('photodiode Background,');
            data += ('Lifetime,');
            data += ('0,');
            data += ('1,');
            data += ('2,');
            data += ('3,');
            data += ('4,');
            data += ('\r\n');
            for(i = 0; i < this.state.data.length; ++i) {
                console.log('here');
                // ask about precision
                data += (i + ',');
                data += `${(this.state.data[i].beginningStatus.returnThreeVReference().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnThreeVReference(), this.state.outputSettings.threeVExpected, this.state.outputSettings.threeVRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].beginningStatus.returnfiveVSupply().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnfiveVSupply(), this.state.outputSettings.fiveVExpected, this.state.outputSettings.fiveVRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].beginningStatus.returnSystemTemp().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnSystemTemp(), this.state.outputSettings.envTempExpected, this.state.outputSettings.envTempRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].beginningStatus.returnMicroprocessorTemp().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnMicroprocessorTemp(), this.state.outputSettings.microprocessorTempExpected, this.state.outputSettings.microprocessorTempRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].beginningStatus.returnLEDThermistorTemp().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnLEDThermistorTemp(), this.state.outputSettings.ledTempExpected, this.state.outputSettings.ledTempRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].beginningStatus.returnPhotodiodeVoltage().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnPhotodiodeVoltage(), this.state.outputSettings.photodiodeCurrentExpected, this.state.outputSettings.photodiodeCurrentRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].endingStatus.returnThreeVReference().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnThreeVReference(), this.state.outputSettings.threeVExpected, this.state.outputSettings.threeVRange))
                    {
                        data += ',';
                    }
                    else
                        data += '***,';
                data += `${(this.state.data[i].endingStatus.returnfiveVSupply().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnfiveVSupply(), this.state.outputSettings.fiveVExpected, this.state.outputSettings.fiveVRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].endingStatus.returnSystemTemp().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnSystemTemp(), this.state.outputSettings.envTempExpected, this.state.outputSettings.envTempRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].endingStatus.returnMicroprocessorTemp().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnMicroprocessorTemp(), this.state.outputSettings.microprocessorTempExpected, this.state.outputSettings.microprocessorTempRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].endingStatus.returnLEDThermistorTemp().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnLEDThermistorTemp(), this.state.outputSettings.ledTempExpected, this.state.outputSettings.ledTempRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].endingStatus.returnPhotodiodeVoltage().toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].beginningStatus.returnPhotodiodeVoltage(), this.state.outputSettings.photodiodeCurrentExpected, this.state.outputSettings.photodiodeCurrentRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].darkCurrent.toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].darkCurrent, this.state.outputSettings.darkCurrentExpected, this.state.outputSettings.darkCurrentRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].lifetime.toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].lifetime, this.state.outputSettings.lifetimeExpected, this.state.outputSettings.lifetimeRange))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].firstFiveADValues[0].toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].firstFiveADValues[0], this.state.outputSettings.pt0Expected, this.state.outputSettings.pt0Range))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].firstFiveADValues[1].toPrecision(globalPrecision))},`;
                data += `${(this.state.data[i].firstFiveADValues[2].toPrecision(globalPrecision))},`;
                data += `${(this.state.data[i].firstFiveADValues[3].toPrecision(globalPrecision))}`;
                if(this.checkRange(this.state.data[i].firstFiveADValues[3], this.state.outputSettings.pt3Expected, this.state.outputSettings.pt3Range))
                {
                    data += ',';
                }
                else
                    data += '***,';
                data += `${(this.state.data[i].firstFiveADValues[4].toPrecision(globalPrecision))},`;
                data += `${('\r\n')}`;
            }
            let dirs:string[] = ['control board tests', 'LED board tests', 'full body tests', 'other tests'];
            let dir:string = path.join(this.state.directoryPath,dirs[this.state.testType-1]);
            let dirMessage:string = dir;
            ipcRenderer.send('make-directory',dirMessage);
            ipcRenderer.once('directory-made',(event:IpcRendererEvent,dir:string|undefined) => {
                if (dir) {
                    let date:Date = new Date();
                    console.log(date.getUTCDate(),date.getMonth()+1);
                    let filename:string;
                    let filePath:string;
                    switch (this.state.testType) {
                        case TestType.controlBoard:
                            console.log('control board');
                            filename = `${this.state.probeId} ${date.getMonth()+1}-${date.getUTCDate()}-${date.getFullYear()} ${date.getHours()}_${date.getMinutes()}.csv`;
                            filePath = path.join(dir,filename);
                            break;
                        case TestType.LEDBoard:
                            console.log('led board');
                            filename = `${this.state.LEDNumber} ${date.getMonth()+1}-${date.getUTCDate()}-${date.getFullYear()} ${date.getHours()}_${date.getMinutes()}.csv`
                            filePath = path.join(dir,filename);
                            break;
                        case TestType.fullBody:
                            console.log('full body');
                            filename = `${this.state.probeId}_${this.state.LEDNumber} ${date.getMonth()+1}-${date.getUTCDate()}-${date.getFullYear()} ${date.getHours()}_${date.getMinutes()}.csv`;
                            filePath = path.join(dir,filename);
                            break;
                        case TestType.other:
                            console.log('other');
                            filename = `${this.state.otherFilename}.csv`;
                            filePath = path.join(dir,filename);
                            break;
                        default:
                            console.log('something went wrong');
                    }
                    let saveMessage:{path:string,data:string} = {path:filePath,data:data};
                    ipcRenderer.send('save-data',saveMessage);
                }
            })
        }
    }

    private onLEDNumberChange(n:number) {
        console.log(n);
        this.setState({LEDNumber:n});
    }

    private onOtherFilenameChange(name:string) {
        console.log(name);
        this.setState({otherFilename:name});
    }
    render() {
        return(
            <div className='probe'>
                <h2>{this.state.comPort}: {this.state.probeId}</h2>
                <form className='radioButtons' onSubmit={this.saveData}>
                    <span><input name='board' type='radio' id='1' onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => this.onChange(ev.target.id)}></input>
                    <label>control board test</label>
                    <input name='board' type='radio' id='2' onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => this.onChange(ev.target.id)}></input>
                    <label>LED board test</label>
                    <input name='board' type='radio' id='3' onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => this.onChange(ev.target.id)}></input>
                    <label>full body test</label>
                    <input name='board' type='radio' id='4' onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                            ): void => this.onChange(ev.target.id)}></input>
                    <label>other</label></span>
                    {(this.state.testType === 2 || this.state.testType === 3) && <span>
                        <label>led number:</label>
                        <input name='ledBoardNumber' type='number' onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                        ): void => this.onLEDNumberChange(ev.target.valueAsNumber)}></input>
                        {this.state.LEDNumber === undefined && <p id={'astrix'}>* Please input a LED number</p>}
                    </span>}
                    {this.state.testType === 4 && <span>
                        <label>filename:</label>
                        <input name='otherFileName' type='string' onChange={(
                            ev: React.ChangeEvent<HTMLInputElement>,
                        ): void => this.onOtherFilenameChange(ev.target.value)}></input>
                        {this.state.otherFilename === undefined && <p id={'astrix'}>* Please input a filename</p>}
                    </span>}
                    <span>
                        {this.state.testType && <button type='submit'>Save Data</button>}
                    </span>
                </form>
                <table className='table'>
                    <tbody>
                        <tr>
                            <th>3 VDC Supply - Begin</th>
                            <th>5 VDC Supply - Begin</th>
                            <th>ENV Temp (C) - Begin</th>
                            <th>Microproc Temp (C) - Begin</th>
                            <th>LED Temp (C) - Begin</th>
                            <th>PD Current (na) - Begin</th>
                            <th>3 VDC Supply - End</th>
                            <th>5 VDC Supply - End</th>
                            <th>ENV Temp (C) - End</th>
                            <th>Microproc Temp (C) - End</th>
                            <th>LED Temp (C) - End</th>
                            <th>PD Current (na) - End</th>
                            <th>photodiode Background</th>
                            <th>Lifetime</th>
                            <th>0</th>
                            <th>1</th>
                            <th>2</th>
                            <th>3</th>
                            <th>4</th>
                        </tr>
                        {this.state.data.map((datum:{beginningStatus:ProbeStatus,endingStatus:ProbeStatus,darkCurrent:number,lifetime:number,firstFiveADValues:number[]},rowNumber:number) => {
                            return (
                                <tr key={rowNumber}>
                                    <td style={{backgroundColor: this.checkRange(datum.beginningStatus.returnThreeVReference(),this.state.outputSettings.threeVExpected,this.state.outputSettings.threeVRange)? '#FFFFFF': '#ed1c38'}}>{datum.beginningStatus.returnThreeVReference().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.beginningStatus.returnfiveVSupply(),this.state.outputSettings.fiveVExpected,this.state.outputSettings.fiveVRange)? '#FFFFFF': '#ed1c38'}}>{datum.beginningStatus.returnfiveVSupply().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.beginningStatus.returnSystemTemp(),this.state.outputSettings.envTempExpected,this.state.outputSettings.envTempRange)? '#FFFFFF': '#ed1c38'}}>{datum.beginningStatus.returnSystemTemp().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.beginningStatus.returnMicroprocessorTemp(),this.state.outputSettings.microprocessorTempExpected,this.state.outputSettings.microprocessorTempRange)? '#FFFFFF': '#ed1c38'}}>{datum.beginningStatus.returnMicroprocessorTemp().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.beginningStatus.returnLEDThermistorTemp(),this.state.outputSettings.ledTempExpected,this.state.outputSettings.ledTempRange)? '#FFFFFF': '#ed1c38'}}>{datum.beginningStatus.returnLEDThermistorTemp().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.beginningStatus.returnPhotodiodeVoltage(),this.state.outputSettings.photodiodeCurrentExpected,this.state.outputSettings.photodiodeCurrentRange)? '#FFFFFF': '#ed1c38'}}>{datum.beginningStatus.returnPhotodiodeVoltage().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.endingStatus.returnThreeVReference(),this.state.outputSettings.threeVExpected,this.state.outputSettings.threeVRange)? '#FFFFFF': '#ed1c38'}}>{datum.endingStatus.returnThreeVReference().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.endingStatus.returnfiveVSupply(),this.state.outputSettings.fiveVExpected,this.state.outputSettings.fiveVRange)? '#FFFFFF': '#ed1c38'}}>{datum.endingStatus.returnfiveVSupply().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.endingStatus.returnSystemTemp(),this.state.outputSettings.envTempExpected,this.state.outputSettings.envTempRange)? '#FFFFFF': '#ed1c38'}}>{datum.endingStatus.returnSystemTemp().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.endingStatus.returnMicroprocessorTemp(),this.state.outputSettings.microprocessorTempExpected,this.state.outputSettings.microprocessorTempRange)? '#FFFFFF': '#ed1c38'}}>{datum.endingStatus.returnMicroprocessorTemp().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.endingStatus.returnLEDThermistorTemp(),this.state.outputSettings.ledTempExpected,this.state.outputSettings.ledTempRange)? '#FFFFFF': '#ed1c38'}}>{datum.endingStatus.returnLEDThermistorTemp().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.endingStatus.returnPhotodiodeVoltage(),this.state.outputSettings.photodiodeCurrentExpected,this.state.outputSettings.photodiodeCurrentRange)? '#FFFFFF': '#ed1c38'}}>{datum.endingStatus.returnPhotodiodeVoltage().toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.darkCurrent,this.state.outputSettings.darkCurrentExpected,this.state.outputSettings.darkCurrentRange)? '#FFFFFF': '#ed1c38'}}>{datum.darkCurrent.toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.lifetime,this.state.outputSettings.lifetimeExpected,this.state.outputSettings.lifetimeRange)? '#FFFFFF': '#ed1c38'}}>{datum.lifetime.toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.firstFiveADValues[0],this.state.outputSettings.pt0Expected,this.state.outputSettings.pt0Range)? '#FFFFFF': '#ed1c38'}}>{datum.firstFiveADValues[0].toPrecision(5)}</td>
                                    <td>{datum.firstFiveADValues[1].toPrecision(5)}</td>
                                    <td>{datum.firstFiveADValues[2].toPrecision(5)}</td>
                                    <td style={{backgroundColor: this.checkRange(datum.firstFiveADValues[3],this.state.outputSettings.pt3Expected,this.state.outputSettings.pt3Range)? '#FFFFFF': '#ed1c38'}}>{datum.firstFiveADValues[3].toPrecision(5)}</td>
                                    <td>{datum.firstFiveADValues[4].toPrecision(5)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {!this.state.timerId && <button onClick={this.testProbe}>   Test</button>}
                {this.state.timerId && <button onClick={this.stopTest}>    Stop Test</button>}
            </div>
        )
    }

}

export {Probe}