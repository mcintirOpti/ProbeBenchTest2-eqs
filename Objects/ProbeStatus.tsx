import util from "util";

export default class ProbeStatus {
  private envThermParams: number[];
  private microProcessorTempParams: { [key: string]: number };
  private ledThermParams: number[];
  private systemTemp: number;
  private ledThermistorTemp: number;
  private microprocessorTemp: number;
  constructor(
    private fiveVSupply: number,
    systemTempThermisterVoltage: number,
    microprocessorTemperatureVoltage: number,
    private threeVReference: number,
    ledThermistorVoltage: number,
    private photodiodeVoltage: number
  ) {
    this.envThermParams = [
      -0.000000042904608, 0.000003516033271, 0.000202747705539,
      0.00122191675614,
    ];
    this.microProcessorTempParams = {
      t25: 25,
      v25: 0.658,
      slope: -0.00175,
    };
    this.ledThermParams = [
      0.00000010568844, -0.00000088587104, 0.000281454076038, 0.001192174349658,
    ];
    let systemTempThermisterResistance =
      (10000 * systemTempThermisterVoltage) / (1 - systemTempThermisterVoltage);
    this.systemTemp = this.resistanceToTemp(
      this.envThermParams,
      systemTempThermisterResistance
    );
    this.microprocessorTemp =
      (this.microProcessorTempParams.slope * this.microProcessorTempParams.t25 +
        microprocessorTemperatureVoltage -
        this.microProcessorTempParams.v25) /
      this.microProcessorTempParams.slope;
    let ledThermistorResistance =
      (2000 * ledThermistorVoltage) / (1 - ledThermistorVoltage);
    this.ledThermistorTemp = this.resistanceToTemp(
      this.ledThermParams,
      ledThermistorResistance
    );
  }

  private resistanceToTemp(thermParams: number[], resistance: number): number {
    let retVal: number = 0.0,
      i: number;
    let logRes = Math.log(resistance);
    // any reason this is backwards in the original code?
    for (i = 0; i < thermParams.length; ++i) {
      retVal = retVal * logRes + thermParams[i];
    }
    return 1.0 / retVal - 273.15;
  }

  public returnfiveVSupply(): number {
    return this.fiveVSupply;
  }
  public returnSystemTemp(): number {
    return this.systemTemp;
  }
  public returnMicroprocessorTemp(): number {
    return this.microprocessorTemp;
  }
  public returnThreeVReference(): number {
    return this.threeVReference;
  }
  public returnLEDThermistorTemp(): number {
    return this.ledThermistorTemp;
  }
  public returnPhotodiodeVoltage(): number {
    return this.photodiodeVoltage;
  }

  [util.inspect.custom](depth, opts) {
    let outputObj = {
      fiveVSupply: this.fiveVSupply,
      systemTemp: this.systemTemp,
      microprocessorTemp: this.microprocessorTemp,
      ledThermistorTemp: this.ledThermistorTemp,
      photodiodeVoltage: this.photodiodeVoltage,
    };
    return outputObj;
  }
}
