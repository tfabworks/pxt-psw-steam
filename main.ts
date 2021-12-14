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
    //% group="スイッチ"
    export function turn_on(): void {
        pins.digitalWritePin(DigitalPin.P12, 1);
    }

    /**
     * 自動スイッチをオフにします
     */
    //% blockId=turn_off block="スイッチオフ"
    //% weight=80
    //% group="スイッチ"
    export function turn_off(): void {
        pins.digitalWritePin(DigitalPin.P12, 0);
    }

    /**
     * 人感センサーが反応しているとき真を返します
     */
    //% blockId=is_man_moving block="人が動いた"
    //% weight=75
    //% group="人感センサー"
    export function is_man_moving(): boolean {
        if (pins.digitalReadPin(DigitalPin.P13) == 1) {
            return true;
        } else {
            return false;
        }
    }

    let _今まで暗い: boolean = false;
    const _暗い判定閾値: number = 4;
    const _明るい判定閾値: number = 7;
    const _HYSTERESIS: number = _明るい判定閾値 - _暗い判定閾値;

    /**
     * 明るさセンサーが暗い場合（5未満）に真を返します
     */
    //% blockId=is_dark block="暗い"
    //% weight=70
    //% group="明るさセンサー"
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
    //% group="明るさセンサー"
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

    let _mtx_light:boolean =false;
    let is_light_init:boolean = true;

    function _light_level_lux(): number {
        while( _mtx_light  ) {
            basic.pause(100);
        }
        _mtx_light = true;

        if ( is_light_init === true ) {
            basic.pause(100)
            pins.i2cWriteNumber( 41, 0x8019, NumberFormat.UInt16BE, false ) // gain 48x
//            pins.i2cWriteNumber(41, 0x800D, NumberFormat.UInt16BE, false) // gain 8x
            basic.pause(10)
            is_light_init = false;
        }

        let data1, data2, data3, data4
        pins.i2cWriteNumber( 41, 136, NumberFormat.UInt8BE, true )
        data1 = pins.i2cReadNumber( 41, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(41, 137, NumberFormat.UInt8BE, true)
        data2 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(41, 138, NumberFormat.UInt8BE, true)
        data3 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(41, 139, NumberFormat.UInt8BE, true)
        data4 = pins.i2cReadNumber(41, NumberFormat.UInt8BE, false)

        const lux = data4*256 + data3;
        _mtx_light = false;
        return lux;
    }

    /**
     * 明るさセンサーの値を0-255で返します。0が最も暗く、255が最も明るいときの値です
     */
    //% blockId=light_level block="明るさ"
    //% weight=55
    //% group="明るさセンサー"
    export function light_level(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
//        return _light_level_lux()
        return Math.round(Math.constrain( Math.map( _light_level_lux()-10, 0, 500, 0, 255), 0, 255))
    }


    /**
     * 温度センサーが、しきい値より熱い（または冷たい）場合に真を返します
     * @param temperatureThreshold 判定閾値, eg: 30
     * @param settingHotCold 熱いか冷たいを指定, eg:熱い
     */
    //% blockId=gt_temperature
    //% block="%temperatureThreshold|℃より%settingHotOrCold|"
    //% weight=50
    //% group="温度センサー"
    export function gt_temperature(temperatureThreshold: number, settingHotCold: HOT_COLD): boolean {
        if (settingHotCold === HOT_COLD.HOT) {
            if ( get_temperature( OutputNumberFormat.FLOAT ) > temperatureThreshold) {
                return true;
            }
            return false;
        }
        if (settingHotCold === HOT_COLD.COLD) {
            if ( get_temperature( OutputNumberFormat.FLOAT ) < temperatureThreshold) {
                return true;
            }
            return false;
        }
        return false;
    }

    let _mtx_temperature:boolean = false;

    /**
     * 温度[℃]を返します
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId = get_temperature
    //% block="温度[℃]|| %format"
    //% weight=45
    //% group="温度センサー"
    export function get_temperature(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
        while(_mtx_temperature) {
            basic.pause(100)
        }
        _mtx_temperature = true;
        const temperature = DS18B20.Temperature();
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
     * TFW-DS1で距離[cm]を測定します。
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId=uds
    //% block="距離[cm] || %format"
    //% group="DS1"
    //% weight=100
	//% advanced=true
    export function getDistance(format:OutputNumberFormat = OutputNumberFormat.INTEGER):number {
        // calculate distance -> median filter -> return value
        let arr: number[] = [];
        let l;
        for(l = 0; l < 3; l++) {
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
            else{
                distance_cm = pulseWidth * 153 / 29 / 2 / 100;
            }

            if ( format === OutputNumberFormat.INTEGER ){
                distance_cm = Math.round( distance_cm );
            }

            arr.push(distance_cm);
        }
        arr.sort((n1, n2) => n1 - n2);
        return arr[1];
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
    //% block="赤外線ON"
    //% group="IR2"
    //% weight=100
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
    //% block="赤外線OFF"
    //% group="IR2"
    //% weight=90
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
     * TFW-SW1で出力をコントロールします。
     * @param duty set the duty-ratio, eg: 100
     */
    //% blockId=sw1_out
    //% block="出力を%duty|\\%にする"
    //% duty.min=0 duty.max=100
    //% group="SW1"
    //% weight=60
	//% advanced=true
    export function sw1_out(duty: number): void {
        pins.analogWritePin(AnalogPin.P0, (duty / 100 * 1023));
    }
}
