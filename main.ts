enum DARK_BRIGHT {
    //% block="IS_DARK"
    IS_DARK,
    //% block="IS_BRIGHT"
    IS_BRIGHT,
}
enum HOT_COLD {
    //% block="HOT"
    HOT,
    //% block="COLD"
    COLD,
}

enum OutputNumberFormat {
    //% block="INTEGER"
    INTEGER = 0,
    //% block="FLOAT"
    FLOAT = 1
}

//% weight=115 icon="\uf0e7" color=#d2691e block="How to use electricity"
namespace kkk {

    /**
     * Turn ON the controlled-switch
     */
    //% blockId=turn_on block="Switch Turn ON"
    //% weight=90
    //% group="スイッチ"
    export function turn_on(): void {
        pins.digitalWritePin(DigitalPin.P12, 1);
    }

    /**
     * Turn OFF the controlled-switch
     */
    //% blockId=turn_off block="Switch Turn OFF"
    //% weight=80
    //% group="スイッチ"
    export function turn_off(): void {
        pins.digitalWritePin(DigitalPin.P12, 0);
    }

    /**
     * Return PIR Motion sensor value.
     */
    //% blockId=is_man_moving block="is human moving"
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
     * return true when the dark ( light level <5 )
     */
    //% blockId=is_dark block="is dark"
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
     * return true when darker/brighter than light threthold
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
     * return light sensor value:0-255
     */
    //% blockId=light_level block="light level"
    //% weight=55
    //% group="明るさセンサー"
    export function light_level(format: OutputNumberFormat = OutputNumberFormat.INTEGER): number {
//        return _light_level_lux()
        return Math.round(Math.constrain( Math.map( _light_level_lux()-10, 0, 500, 0, 255), 0, 255))
    }


    /**
     * return true when sensor is hot/cold than threthold
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
     * return temperature degC.
     * @param format number format, eg: OutputNumberFormat.INTEGER
     */
    //% blockId = get_temperature
    //% block="temperature [degC]|| %format"
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
     * return true when the micro:bit is moved.
     */
    //% blockId=is_move
    //% block="is moved"
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
     * wait for designated seconds
     * @param sec 秒, eg: 1
     */
    //% blockId=pause_sec
    //% block="pause%sec"
    //% weight=30
    //% group="micro:bit本体"
    export function pause_sec(sec: number) {
        basic.pause(1000 * sec);
    }
}
