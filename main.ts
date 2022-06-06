enum DARK_BRIGHT {
    //% block="暗い"
    IS_DARK,
    //% block="明るい"
    IS_BRIGHT,
}
enum HOT_COLD {
    //% block="熱い"
    HOT,
    //% block="冷たい"
    COLD,
}

enum OutputNumberFormat {
    //% block="整数"
    INTEGER = 0,
    //% block="小数"
    FLOAT = 1
}

//% weight=115 icon="\uf0e7" color=#002FFF block="STEAM"
namespace psw_steam {

    /**
     * 自動スイッチをオンにします
     */
    //% blockId=turn_on block="スイッチオン"
    //% weight=90
    //% group="スイッチ(PSW)"
    export function turn_on(): void {
        pins.digitalWritePin(DigitalPin.P12, 1);
    }

    /**
     * 自動スイッチをオフにします
     */
    //% blockId=turn_off block="スイッチオフ"
    //% weight=80
    //% group="スイッチ(PSW)"
    export function turn_off(): void {
        pins.digitalWritePin(DigitalPin.P12, 0);
    }

    /**
     * 人感センサーが反応しているとき真を返します
     */
    //% blockId=is_man_moving block="人が動いた"
    //% weight=75
    //% group="人感センサー(PSW)"
    export function is_man_moving(): boolean {
        if (pins.digitalReadPin(DigitalPin.P13) == 1) {
            return true;
        } else {
            return false;
        }
    }

    let _今まで暗い: boolean = false;
    const _暗い判定閾値: number = 60;
    const _明るい判定閾値: number = 65;
    const _HYSTERESIS: number = _明るい判定閾値 - _暗い判定閾値;

    /**
     * 明るさセンサーが暗い場合（5未満）に真を返します
     */
    //% blockId=is_dark block="暗い"
    //% weight=70
    //% group="明るさセンサー(PSW)"
    export function is_dark(): boolean {
        return _is_dark(_暗い判定閾値, _明るい判定閾値);

    }


    /* 暗い判定本体 */
    function _is_dark(暗い判定閾値: number, 明るい判定閾値: number): boolean {
        if ((暗い判定閾値 > 明るい判定閾値)
            || (暗い判定閾値 < 0)
            || (暗い判定閾値 > 255)
            || (明るい判定閾値 < 0)
            || (明るい判定閾値 > 255)) {
            control.assert(false, "threshold is abnormal");
        }

        let 現在の明るさ = light_level();

        const 暗い: boolean = true;
        const 明るい: boolean = false;

        if (_今まで暗い) { //現在まで暗い環境だったとき。明るいかを判定
            if (現在の明るさ > 明るい判定閾値) {
                _今まで暗い = 明るい;
                return 明るい; //現在は明るい
            }
            else {
                _今まで暗い = 暗い;
                return 暗い; //現在は暗い
            }
        }
        else { // 現在まで明るい環境だったとき。暗いかを判定
            if (現在の明るさ < 暗い判定閾値) {
                _今まで暗い = 暗い;
                return 暗い; //現在は暗い
            }
            else {
                _今まで暗い = 明るい;
                return 明るい; //現在は明るい
            }
        }
        control.assert(false);
    }

    /**
     * return 明るさセンサーがしきい値より暗い（または明るい）場合に真を返します
     * @param light_threshold 判定閾値, eg:5
     * @param dark_bright 暗いか明るいを指定, eg:暗い
     */
    //% blockId=gt_light_level
    //% block="%light_threshold|より%dark_bright|"
    //% light_threshold.min=0 light_threshold.max=255
    //% weight=60
    //% group="明るさセンサー(PSW)"
    export function gt_light_level(light_threshold: number, dark_bright: DARK_BRIGHT): boolean {
        if (_HYSTERESIS < 0) { control.assert(false); }
        if (light_threshold < 0) {
            light_threshold = 0;
        }
        if (light_threshold > 255) {
            light_threshold = 255;
        }

        if (dark_bright === DARK_BRIGHT.IS_DARK) {
            let 暗い判定閾値: number = light_threshold;
            let 明るい判定閾値: number = light_threshold + _HYSTERESIS;
            if (明るい判定閾値 > 255) { 明るい判定閾値 = 255; }
            return _is_dark(暗い判定閾値, 明るい判定閾値);
        }
        else if (dark_bright === DARK_BRIGHT.IS_BRIGHT) {
            let 暗い判定閾値2: number = light_threshold - _HYSTERESIS;
            let 明るい判定閾値2: number = light_threshold;
            if (暗い判定閾値2 < 0) { 暗い判定閾値2 = 0; }
            return !_is_dark(暗い判定閾値2, 明るい判定閾値2);
        }
        control.assert(false); return false;
    }

    let _mtx_light: boolean = false;
    let is_light_init: boolean = true;

    function _light_level_lux(): number {
        while (_mtx_light) {
            basic.pause(100);
        }
        _mtx_light = true;

        if (is_light_init === true) {
            basic.pause(100)
            pins.i2cWriteNumber(41, 0x8019, NumberFormat.UInt16BE, false) // gain 48x
            //            pins.i2cWriteNumber(41, 0x800D, NumberFormat.UInt16BE, false) // gain 8x
            basic.pause(10)
            is_light_init = false;
        }

        let data1, data2, data3, data4
        pins.i2cWriteNumber(41, 136, NumberFormat.UInt8BE, true)
        data1 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(41, 137, NumberFormat.UInt8BE, true)
        data2 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(41, 138, NumberFormat.UInt8BE, true)
        data3 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(41, 139, NumberFormat.UInt8BE, true)
        data4 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)

        const lux = data4 * 256 + data3;
        _mtx_light = false;
        return lux;
    }

    /**
     * 明るさセンサーの値を0-255で返します。0が最も暗く、255が最も明るいときの値です
     */
    //% blockId=light_level block="明るさ"
    //% weight=55
    //% group="明るさセンサー(PSW)"
    export function light_level(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        //        return _light_level_lux()
        return Math.round(Math.constrain(Math.map(_light_level_lux() - 10, 0, 500, 0, 255), 0, 255))
    }


    /**
     * 温度センサーが、しきい値より熱い（または冷たい）場合に真を返します
     * @param temperatureThreshold 判定閾値, eg: 30
     * @param settingHotCold 熱いか冷たいを指定, eg:熱い
     */
    //% blockId=gt_temperature
    //% block="%temperatureThreshold|℃より%settingHotOrCold|"
    //% weight=50
    //% group="温度センサー(PSW)"
    export function gt_temperature(temperatureThreshold: number, settingHotCold: HOT_COLD): boolean {
        if (settingHotCold === HOT_COLD.HOT) {
            if (get_temperature(OutputNumberFormat.FLOAT) > temperatureThreshold) {
                return true;
            }
            return false;
        }
        if (settingHotCold === HOT_COLD.COLD) {
            if (get_temperature(OutputNumberFormat.FLOAT) < temperatureThreshold) {
                return true;
            }
            return false;
        }
        return false;
    }

    let _mtx_temperature: boolean = false;

    /**
     * 温度[℃]を返します
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId = get_temperature
    //% block="温度[℃]|| %format"
    //% weight=45
    //% group="温度センサー(PSW)"
    export function get_temperature(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        while (_mtx_temperature) {
            basic.pause(100)
        }
        _mtx_temperature = true;
        const temperature = DS18B20.Temperature(8);
        _mtx_temperature = false;
        if (format === OutputNumberFormat.INTEGER) {
            return Math.round(temperature / 100.0);
        }
        return temperature / 100.0;
        //        return Math.round( temperature / 10.0 ) /10.0;
    }

    /**
     * micro:bit本体が揺り動かされた場合に真を返します
     */
    //% blockId=is_move
    //% block="ゆれた"
    //% weight=40
    //% group="micro:bit本体"
    export function is_move(): boolean {
        let current_acc = input.acceleration(Dimension.Strength)
        if (current_acc < 750 || 1650 < current_acc) {
            return true;
        }
        return false;
    }

    /**
     * 指定された秒数の間、一時停止します。
     * @param sec 秒, eg: 1
     */
    //% blockId=pause_sec
    //% block="一時停止(秒)%sec"
    //% weight=30
    //% group="micro:bit本体"
    export function pause_sec(sec: number) {
        basic.pause(1000 * sec);
    }

    /**
     * TFW-TP2の温度[℃]を返します。
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=TP2_getTemperature
    //% block="温度[℃] (TP2) || %format"
    //% group="TP2(拡張アダプタ)"
    //% weight=100
    //% advanced=true
    export function TP2_getTemperature(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        while (_mtx_temperature) {
            basic.pause(100)
        }
        _mtx_temperature = true;
        const temperature = DS18B20.Temperature(0);
        _mtx_temperature = false;
        if (format === OutputNumberFormat.INTEGER) {
            return Math.round(temperature / 100.0);
        }
        return temperature / 100.0;
    }

    /**
     * TFW-DS1で距離[cm]を測定します。
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=uds
    //% block="距離[cm] || %format"
    //% group="DS1(拡張アダプタ)"
    //% weight=100
    //% advanced=true
    export function getDistance(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        // calculate distance -> median filter -> return value
        let arr: number[] = [];
        let l;
        for (l = 0; l < 3; l++) {
            let pulseWidth;
            const MAX_DIST_CM = 300;
            pins.digitalWritePin(DigitalPin.P0, 0);
            control.waitMicros(60000);
            pins.digitalWritePin(DigitalPin.P0, 1);
            control.waitMicros(20);
            pins.digitalWritePin(DigitalPin.P0, 0);
            pulseWidth = pins.pulseIn(DigitalPin.P1, PulseValue.High);

            let distance_cm;
            if (pulseWidth == 0) {
                distance_cm = MAX_DIST_CM;
            }
            else if (pulseWidth >= MAX_DIST_CM / 153 * 29 * 2 * 100) {
                distance_cm = MAX_DIST_CM;
            }
            else {
                distance_cm = pulseWidth * 153 / 29 / 2 / 100;
            }

            if (format === OutputNumberFormat.INTEGER) {
                distance_cm = Math.round(distance_cm);
            }

            arr.push(distance_cm);
        }
        arr.sort((n1, n2) => n1 - n2);
        return arr[1];
    }

    let EN1_init_done: boolean = false;

    /**
     * TFW-EN1で温度[℃]を測定します。
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=get_temperature block="温度[℃] (EN1) || %format"
    //% group="EN1(拡張アダプタ)"
    //% weight=100
    //% advanced=true
    export function getTemperature(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        EN1_init_if_firsttime();
        if (format === OutputNumberFormat.INTEGER) {
            return Math.round(BME280_I2C.Temperature());
        }
        return BME280_I2C.Temperature();
    }

    /**
     * TFW-EN1で湿度[%]を測定します。
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=get_humidity block="湿度[\\%] || %format"
    //% group="EN1(拡張アダプタ)"
    //% weight=90
    //% advanced=true
    export function getHumidity(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        EN1_init_if_firsttime();
        if (format === OutputNumberFormat.INTEGER) {
            return Math.round(BME280_I2C.Humidity());
        }
        return BME280_I2C.Humidity();
    }

    /**
     * TFW-EN1で気圧[hPa]を測定します。
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=get_pressure block="気圧[hPa] || %format"
    //% group="EN1(拡張アダプタ)"
    //% weight=80
    //% advanced=true
    export function getPressure(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        EN1_init_if_firsttime();
        if (format === OutputNumberFormat.INTEGER) {
            return Math.round(BME280_I2C.Pressure());
        }
        return BME280_I2C.Pressure();
    }

    /**
     * TFW-EN1で基準面の気圧との差から高度差[m]を計算します。
     * @param referencePressure 基準面の気圧[hPa], eg: 1013
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=get_altitude block="高度差[m] 基準圧%referencePressure || %format"
    //% group="EN1(拡張アダプタ)"
    //% weight=70
    //% advanced=true
    export function getAltitude(referencePressure: number = 1013, format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        EN1_init_if_firsttime();
        if (format === OutputNumberFormat.INTEGER) {
            return Math.round(calcHeight(referencePressure, BME280_I2C.Pressure(), BME280_I2C.Temperature()));
        }
        return calcHeight(referencePressure, BME280_I2C.Pressure(), BME280_I2C.Temperature());
    }

    function calcHeight(P0: number, P: number, T: number) {
        let calcHeight_n = 0
        let calcHeight_xa = 0
        let calcHeight_fn = 0
        let calcHeight_kn = 0
        let calcHeight_a = 0
        let calcHeight_x = 0
        let calcHeight_Result = 0
        calcHeight_x = P0 / P
        calcHeight_a = 1 / 5.257
        calcHeight_kn = calcHeight_a
        calcHeight_fn = 1
        calcHeight_xa = 1
        for (let calcHeight_index = 0; calcHeight_index <= 4; calcHeight_index++) {
            calcHeight_n = calcHeight_index + 1
            calcHeight_xa = calcHeight_xa + calcHeight_kn * (calcHeight_x - 1) ** calcHeight_n / calcHeight_fn
            calcHeight_kn = calcHeight_kn * (calcHeight_a - calcHeight_n)
            calcHeight_fn = calcHeight_fn * (calcHeight_n + 1)
        }
        calcHeight_Result = (calcHeight_xa - 1) * (T + 273.15) / 0.0065;
        return calcHeight_Result;
    }

    function EN1_init_if_firsttime(): void {
        if (EN1_init_done == false) {
            BME280_I2C.Init(BME280_I2C_ADDRESS.e_0x76);
            EN1_init_done = true;
        }
    }

    /**
     * TFW-SW1で出力をコントロールします。
     * @param duty set the duty-ratio, eg: 100
     */
    //% blockId=sw1_out
    //% block="出力を%duty|\\%にする"
    //% duty.min=0 duty.max=100
    //% group="SW1(拡張アダプタ)"
    //% weight=60
    //% advanced=true
    export function sw1_out(duty: number): void {
        pins.analogWritePin(AnalogPin.P0, (duty / 100 * 1023));
    }

    const ビットパターン_ON = [1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0]
    const ビットパターン_OFF = [1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
    const 繰り返し回数 = 30
    const 輸送波パルス幅 = 600
    const 輸送波周期 = 26

    function 輸送波送信ポート設定() {
        pins.analogWritePin(AnalogPin.P0, 輸送波パルス幅)
        pins.analogSetPeriod(AnalogPin.P0, 輸送波周期)
    }

    /**
     * TFW-IR2で赤外線リモコンコンセントOCR-05WをONします。
     */
    //% blockId=ir_on
    //% block="赤外線オン"
    //% group="IR2(拡張アダプタ)"
    //% weight=105
    //% advanced=true
    export function IR_ON() {
        輸送波送信ポート設定()

        for (let 送信回数 = 0; 送信回数 < 繰り返し回数; 送信回数++) {
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[0])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[1])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[2])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[3])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[4])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[5])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[6])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[7])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[8])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[9])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[10])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[11])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[12])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[13])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[14])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[15])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[16])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[17])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[18])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[19])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[20])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[21])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[22])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[23])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[24])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[25])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[26])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[27])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[28])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[29])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[30])
            control.waitMicros(850)
        }
    }

    /**
     * TFW-IR2で赤外線リモコンコンセントOCR-05WをOFFします。
     */
    //% blockId=ir_off
    //% block="赤外線オフ"
    //% group="IR2(拡張アダプタ)"
    //% weight=100
    //% advanced=true
    export function IR_OFF() {
        輸送波送信ポート設定()

        for (let 送信回数 = 0; 送信回数 < 繰り返し回数; 送信回数++) {
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_ON[0])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[1])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[2])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[3])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[4])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[5])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[6])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[7])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[8])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[9])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[10])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[11])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[12])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[13])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[14])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[15])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[16])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[17])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[18])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[19])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[20])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[21])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[22])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[23])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[24])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[25])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[26])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[27])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[28])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[29])
            control.waitMicros(850)
            pins.digitalWritePin(DigitalPin.P1, ビットパターン_OFF[30])
            control.waitMicros(850)
        }
    }
    
    /**
     * TFW-SL1で検知した音の大きさを返します（0-1023）
     */
    //% blockId=SL1_sound_pressure block="音の大きさ(SL1)"
    //% group="SL1(拡張アダプタ)"
    //% weight=100
    //% advanced=true
    export function SL1_sound_pressure(): number {
        return pins.i2cReadNumber(8, NumberFormat.UInt16BE, false)
    }

}

enum BME280_I2C_ADDRESS {
    e_0x76 = 0x76
};

enum BME280_I2C_SENSOR_MODE {
    e_SLEEP = 0x00,
    e_NORMAL = 0x03
};

enum BME280_I2C_SAMPLING_MODE {
    e_SKIP = 0x00,
    e_1X = 0x01,
    e_2X = 0x02,
    e_4X = 0x03,
    e_8X = 0x04,
    e_16X = 0x05
};

enum BME280_I2C_STANDBY_DURATION {
    e_1_MS = 0x01,
    e_10_MS = 0x06,
    e_20_MS = 0x07,
    e_62_5_MS = 0x01,
    e_125_MS = 0x02,
    e_250_MS = 0x03,
    e_500_MS = 0x04,
    e_1000_MS = 0x05
};

enum BME280_I2C_IIR_FILTER_COEFFICIENT {
    e_OFF = 0x00,
    e_2 = 0x01,
    e_4 = 0x02,
    e_8 = 0x03,
    e_16 = 0x04
};

namespace BME280_I2C {
    let I2CAddr = BME280_I2C_ADDRESS.e_0x76;

    function I2CWriteByte(register: number, data: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = register;
        buf[1] = data;
        pins.i2cWriteBuffer(I2CAddr, buf, false);
    }

    function I2CRead(adress: number, len: number): Buffer {
        pins.i2cWriteNumber(I2CAddr, adress, NumberFormat.UInt8BE, true);
        return pins.i2cReadBuffer(I2CAddr, len, false);
    }

    function I2CReadUint8(adress: number): number {
        pins.i2cWriteNumber(I2CAddr, adress, NumberFormat.UInt8BE, true);
        let buf = pins.i2cReadBuffer(I2CAddr, 1, false);
        return (buf.getNumber(NumberFormat.UInt8BE, 0));
    }

    let currentMode: BME280_I2C_SENSOR_MODE = BME280_I2C_SENSOR_MODE.e_SLEEP;
    let lastSensorDataTime: number = 0;

    let dig_T1: number = 0;
    let dig_T2: number = 0;
    let dig_T3: number = 0;
    let dig_P1: number = 0;
    let dig_P2: number = 0;
    let dig_P3: number = 0;
    let dig_P4: number = 0;
    let dig_P5: number = 0;
    let dig_P6: number = 0;
    let dig_P7: number = 0;
    let dig_P8: number = 0;
    let dig_P9: number = 0;

    let dig_H1: number = 0;
    let dig_H2: number = 0;
    let dig_H3: number = 0;
    let dig_H4: number = 0;
    let dig_H5: number = 0;
    let dig_H6: number = 0;

    interface Settings {
        osr_p: number;
        osr_t: number;
        osr_h: number;
        filter: number;
        standby_time: number;
    }

    let currentSettings: Settings = { osr_p: 0, osr_t: 0, osr_h: 0, filter: 0, standby_time: 0 };
    let currentSettingsIsChanged: boolean = false;

    interface MesurementData {
        pressure: number;
        temperature: number;
        humidity: number;
    };
    let currentUncompensatedData: MesurementData = { pressure: 0, temperature: 0, humidity: 0 };
    let currentCompensatedData: MesurementData = { pressure: 0, temperature: 0, humidity: 0 };
    let current_t_fine: number = 0;

    function GetCalibrationData(): void {
        let BME280_TEMP_PRESS_CALIB_DATA_ADDR = 0x88;
        let BME280_TEMP_PRESS_CALIB_DATA_LEN = 26;

        let BME280_HUMIDITY_CALIB_DATA_ADDR: number = 0xE1;
        let BME280_HUMIDITY_CALIB_DATA_LEN: number = 7;

        let buf = I2CRead(BME280_TEMP_PRESS_CALIB_DATA_ADDR, BME280_TEMP_PRESS_CALIB_DATA_LEN);

        dig_T1 = buf.getNumber(NumberFormat.UInt16LE, 0);
        dig_T2 = buf.getNumber(NumberFormat.Int16LE, 2);
        dig_T3 = buf.getNumber(NumberFormat.Int16LE, 4);

        dig_P1 = buf.getNumber(NumberFormat.UInt16LE, 6);
        dig_P2 = buf.getNumber(NumberFormat.Int16LE, 8);
        dig_P3 = buf.getNumber(NumberFormat.Int16LE, 10);
        dig_P4 = buf.getNumber(NumberFormat.Int16LE, 12);
        dig_P5 = buf.getNumber(NumberFormat.Int16LE, 14);
        dig_P6 = buf.getNumber(NumberFormat.Int16LE, 16);
        dig_P7 = buf.getNumber(NumberFormat.Int16LE, 18);
        dig_P8 = buf.getNumber(NumberFormat.Int16LE, 20);
        dig_P9 = buf.getNumber(NumberFormat.Int16LE, 22);

        dig_H1 = buf.getNumber(NumberFormat.UInt8BE, 25);

        buf = I2CRead(BME280_HUMIDITY_CALIB_DATA_ADDR, BME280_HUMIDITY_CALIB_DATA_LEN);

        dig_H2 = buf.getNumber(NumberFormat.Int16LE, 0);
        dig_H3 = buf.getNumber(NumberFormat.UInt8BE, 2);

        let E4 = buf.getNumber(NumberFormat.Int8BE, 3);
        let E5 = buf.getNumber(NumberFormat.UInt8BE, 4);
        let E6 = buf.getNumber(NumberFormat.Int8BE, 5);
        dig_H4 = E4 << 4 | (E5 & 0x0F)
        dig_H5 = E6 << 4 | (E5 >> 4)

        dig_H6 = buf.getNumber(NumberFormat.Int8BE, 6);
    }

    function SoftReset(): void {
        let BME280_RESET_ADDR = 0xE0;
        let soft_rst_cmd = 0xB6;
        I2CWriteByte(BME280_RESET_ADDR, soft_rst_cmd);
        currentMode = BME280_I2C_SENSOR_MODE.e_SLEEP;
        basic.pause(3);
    }

    function ReadSettings(): Settings {
        let BME280_CTRL_HUM_ADDR = 0xF2;
        let ret: Settings = { osr_p: 0, osr_t: 0, osr_h: 0, filter: 0, standby_time: 0 };

        let buf = I2CRead(BME280_CTRL_HUM_ADDR, 4);

        let F2 = buf.getNumber(NumberFormat.UInt8BE, 0);
        let F4 = buf.getNumber(NumberFormat.UInt8BE, 2);
        let F5 = buf.getNumber(NumberFormat.UInt8BE, 3);

        ret.osr_h = F2 & 0x07;
        ret.osr_p = (F4 & 0x1C) >> 2;
        ret.osr_t = (F4 & 0xE0) >> 5;
        ret.filter = (F5 & 0x1C) >> 2;
        ret.standby_time = (F5 & 0xE0) >> 5;
        return ret;
    }

    function WriteSettings(settings: Settings): void {
        let BME280_CTRL_HUM_ADDR = 0xF2;
        let BME280_CTRL_MEAS_ADDR = 0xF4;
        let BME280_CONFIG_ADDR = 0xF5;

        let buf = I2CRead(BME280_CTRL_HUM_ADDR, 4);

        let F2 = buf.getNumber(NumberFormat.UInt8BE, 0);
        let F4 = buf.getNumber(NumberFormat.UInt8BE, 2);
        let F5 = buf.getNumber(NumberFormat.UInt8BE, 3);

        F2 = (F2 & 0xF8) | (settings.osr_h & 0x07);
        F4 = (F4 & 0xE3) | ((settings.osr_p << 2) & 0x1C);
        F4 = (F4 & 0x1F) | ((settings.osr_t << 5) & 0xE0);
        F5 = (F5 & 0xE3) | ((settings.filter << 2) & 0x1C);
        F5 = (F5 & 0x1F) | ((settings.standby_time << 5) & 0xE0);

        I2CWriteByte(BME280_CTRL_HUM_ADDR, F2);
        I2CWriteByte(BME280_CTRL_MEAS_ADDR, F4);
        I2CWriteByte(BME280_CONFIG_ADDR, F5);
    }

    function compensate_temperature(): void {
        let var1: number;
        let var2: number;
        let temperature: number;
        let temperature_min: number = -4000;
        let temperature_max: number = 8500;

        var1 = (currentUncompensatedData.temperature / 8) - (dig_T1 * 2);
        var1 = (var1 * dig_T2) / 2048;
        var2 = (currentUncompensatedData.temperature / 16) - dig_T1;
        var2 = (((var2 * var2) / 4096) * dig_T3) / 16384;

        current_t_fine = var1 + var2;
        temperature = ((current_t_fine) * 5 + 128) / 256.0;

        if (temperature < temperature_min) {
            temperature = temperature_min;
        }
        else if (temperature > temperature_max) {
            temperature = temperature_max;
        }
        currentCompensatedData.temperature = temperature;
    }

    function compensate_pressure(): void {
        let var1: number;
        let var2: number;
        let var3: number;
        let var4: number;
        let var5: number;
        let pressure: number;
        let pressure_min: number = 30000;
        let pressure_max: number = 110000;

        var1 = (current_t_fine / 2) - 64000;
        var2 = (((var1 / 4) * (var1 / 4)) / 2048) * dig_P6;
        var2 = var2 + ((var1 * dig_P5) * 2);
        var2 = (var2 / 4) + (dig_P4 * 65536);
        var3 = (dig_P3 * (((var1 / 4) * (var1 / 4)) / 8192)) / 8;
        var4 = (dig_P2 * var1) / 2;
        var1 = (var3 + var4) / 262144;
        var1 = ((32768 + var1) * dig_P1) / 32768;

        // avoid zero div.
        if (var1 != 0) {
            var5 = 1048576 - currentUncompensatedData.pressure;
            pressure = (var5 - (var2 / 4096));

            if (pressure > 85343) {
                pressure = ((pressure * 3125) / var1) * 2;
            }
            else {
                pressure = ((pressure * 3125) << 1) / var1;
            }

            var1 = (dig_P9 * (((pressure / 8) * (pressure / 8)) / 8192)) / 4096;
            var2 = ((pressure / 4) * dig_P8) / 8192;
            pressure = pressure + (var1 + var2 + dig_P7) / 16.0;

            if (pressure < pressure_min) {
                pressure = pressure_min;
            }
            else if (pressure > pressure_max) {
                pressure = pressure_max;
            }
        } else {
            pressure = pressure_min;
        }

        currentCompensatedData.pressure = pressure;
    }

    function compensate_humidity(): void {
        let var1: number;
        let var2: number;
        let var3: number;
        let var4: number;
        let var5: number;
        let var6: number;
        let humidity: number;

        var1 = current_t_fine - 76800;
        var2 = currentUncompensatedData.humidity * 16384;
        var3 = dig_H4 * 1048576;
        var4 = dig_H5 * var1;
        var5 = (((var2 - var3) - var4) + 16384) / 32768;
        var2 = (var1 * dig_H6) / 1024;
        var3 = (var1 * dig_H3) / 2048;
        var4 = ((var2 * (var3 + 32768)) / 1024) + 2097152;
        var2 = ((var4 * dig_H2) + 8192) / 16384;
        var3 = var5 * var2;
        var4 = ((var3 / 32768) * (var3 / 32768)) / 128;
        var5 = var3 - ((var4 * dig_H1) / 16);
        var5 = Math.max(var5, 0);
        var5 = Math.min(var5, 419430400);
        humidity = var5 / 4096.0;

        currentCompensatedData.humidity = humidity;
    }

    function UpdateCompensatedData(): void {
        compensate_temperature();
        compensate_pressure();
        compensate_humidity();
    }

    function IsUpdateNeeded(): boolean {
        if (currentMode != BME280_I2C_SENSOR_MODE.e_NORMAL) {
            return false;
        }

        let currentTime = input.runningTime();
        if (lastSensorDataTime == 0 ||
            lastSensorDataTime > currentTime) {
            return true;
        }

        let ETA: number = 10;
        switch (currentSettings.standby_time) {
            case BME280_I2C_STANDBY_DURATION.e_1_MS:
                ETA += 1;
                break;
            case BME280_I2C_STANDBY_DURATION.e_10_MS:
                ETA += 10;
                break;
            case BME280_I2C_STANDBY_DURATION.e_20_MS:
                ETA += 20
                break;
            case BME280_I2C_STANDBY_DURATION.e_62_5_MS:
                ETA += 62;
                break;
            case BME280_I2C_STANDBY_DURATION.e_125_MS:
                ETA += 125;
                break;
            case BME280_I2C_STANDBY_DURATION.e_250_MS:
                ETA += 250;
                break;
            case BME280_I2C_STANDBY_DURATION.e_500_MS:
                ETA += 250;
                break;
            case BME280_I2C_STANDBY_DURATION.e_1000_MS:
                ETA += 1000;
                break;
            default:
                break;
        }

        if (lastSensorDataTime + ETA < currentTime) {
            return true;
        }

        return false;
    }

    function ReadSensorData(): void {
        let BME280_DATA_ADDR = 0xF7;
        let BME280_P_T_H_DATA_LEN = 8;

        let buf = I2CRead(BME280_DATA_ADDR, BME280_P_T_H_DATA_LEN);

        let data_xlsb: number;
        let data_lsb: number;
        let data_msb: number;

        data_msb = buf.getNumber(NumberFormat.UInt8BE, 0) << 12;
        data_lsb = buf.getNumber(NumberFormat.UInt8BE, 1) << 4;
        data_xlsb = buf.getNumber(NumberFormat.UInt8BE, 2) >> 4;
        currentUncompensatedData.pressure = data_msb | data_lsb | data_xlsb;

        data_msb = buf.getNumber(NumberFormat.UInt8BE, 3) << 12;
        data_lsb = buf.getNumber(NumberFormat.UInt8BE, 4) << 4;
        data_xlsb = buf.getNumber(NumberFormat.UInt8BE, 5) >> 4;
        currentUncompensatedData.temperature = data_msb | data_lsb | data_xlsb;

        data_lsb = buf.getNumber(NumberFormat.UInt8BE, 6) << 8;
        data_msb = buf.getNumber(NumberFormat.UInt8BE, 7);
        currentUncompensatedData.humidity = data_msb | data_lsb;

        UpdateCompensatedData();

        lastSensorDataTime = input.runningTime();
    }

    function PutDeviceToSleep(): void {
        SoftReset();
        WriteSettings(currentSettings);
        currentSettingsIsChanged = true;
    }

    function SetSamplingMode(
        t: BME280_I2C_SAMPLING_MODE = BME280_I2C_SAMPLING_MODE.e_2X,
        p: BME280_I2C_SAMPLING_MODE = BME280_I2C_SAMPLING_MODE.e_16X,
        h: BME280_I2C_SAMPLING_MODE = BME280_I2C_SAMPLING_MODE.e_1X): void {

        currentSettings.osr_t = t;
        currentSettings.osr_p = p;
        currentSettings.osr_h = h;
        currentSettingsIsChanged = true;
    }

    function SetStandbyDuration(sb: BME280_I2C_STANDBY_DURATION = BME280_I2C_STANDBY_DURATION.e_500_MS): void {
        currentSettings.standby_time = sb;
        currentSettingsIsChanged = true;
    }

    function SetIIRFilterCoefficient(coef: BME280_I2C_IIR_FILTER_COEFFICIENT = BME280_I2C_IIR_FILTER_COEFFICIENT.e_16): void {
        currentSettings.filter = coef;
        currentSettingsIsChanged = true;
    }

    function UpdateSettings(): void {
        if (currentSettingsIsChanged) {
            WriteSettings(currentSettings);
            currentSettingsIsChanged = false;
            lastSensorDataTime = 0;
        }
    }

    function SetSensorMode(mode: BME280_I2C_SENSOR_MODE = BME280_I2C_SENSOR_MODE.e_NORMAL): void {
        let BME280_PWR_CTRL_ADDR = 0xF4;

        // update osr, IIR filter, standby duration settings if those are changed.
        UpdateSettings();

        let currentReg = I2CReadUint8(BME280_PWR_CTRL_ADDR);

        if ((currentReg & 0x03) != BME280_I2C_SENSOR_MODE.e_SLEEP) {
            PutDeviceToSleep();
        }
        if (mode != BME280_I2C_SENSOR_MODE.e_SLEEP) {
            currentReg = currentReg & 0xFC | mode;
            I2CWriteByte(BME280_PWR_CTRL_ADDR, currentReg);
            currentMode = mode;
            lastSensorDataTime = 0;
        }
    }

    export function Init(
        i2cAddr: BME280_I2C_ADDRESS = BME280_I2C_ADDRESS.e_0x76): void {
        let BME280_CHIP_ID = 0x60;
        let BME280_CHIP_ID_ADDR = 0xD0;

        I2CAddr = i2cAddr;

        currentMode = BME280_I2C_SENSOR_MODE.e_SLEEP;

        let try_count = 5;

        while (try_count > 0) {
            let chip_id = I2CReadUint8(BME280_CHIP_ID_ADDR);

            if (chip_id != BME280_CHIP_ID) {
                basic.pause(10);
                --try_count;
                continue;
            }

            // reset the sensor once
            SoftReset();

            // read calibration regs.
            GetCalibrationData();

            // read current setting params.
            currentSettings = ReadSettings();
            currentSettingsIsChanged = false;

            SetSamplingMode();
            SetStandbyDuration(BME280_I2C_STANDBY_DURATION.e_1_MS);
            SetIIRFilterCoefficient();
            UpdateSettings();
            SetSensorMode();

            break;
        };
        basic.pause(100);
    };

    export function Temperature(): number {
        if (IsUpdateNeeded()) {
            ReadSensorData();
        }
        return (currentCompensatedData.temperature) / 100.0;
    }

    export function Pressure(): number {
        if (IsUpdateNeeded()) {
            ReadSensorData();
        }
        return (currentCompensatedData.pressure) / 100.0;
    }

    export function Humidity(): number {
        if (IsUpdateNeeded()) {
            ReadSensorData();
        }
        return (currentCompensatedData.humidity) / 1024.0;
    }
}
