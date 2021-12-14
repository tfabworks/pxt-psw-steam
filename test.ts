basic.forever(function () {
    if (kkk.is_man_moving()) {
        kkk.turn_on()
    } else {
        kkk.turn_off()
    }
})
basic.forever(function () {
    basic.showNumber(kkk.light_level())
})
