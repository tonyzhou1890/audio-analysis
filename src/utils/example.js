/**
 * 同向取剩余
 * @param {Object} param
 * 作用：正数：1-y，负数：-1-y
 * 效果：在原声音上加了噪音--原声音依然可以听出来
 */
export const sameDirectionLeft = (param) => {
  for (let i = 0; i < param.len; i++) {
    param.data[i] = param.data[i] > 0 ? 1 - param.data[i] : -1 - param.data[i]
  }
}

/**
 * 上下颠倒
 * @param {Object} param
 * 效果：声音细微改变--对于x轴对称的声音，改变很小
 */
export const reverse = (param) => {
  for (let i = 0; i < param.len; i++) {
    param.data[i] = -param.data[i]
  }
}

/**
 * 去除高振幅
 * @param {Object} param
 * @param {Number} min // 比如-0.5
 * @param {Number} max // 比如0.5
 * 作用：限制振幅范围
 * 效果：音质不佳
 */
export const reduceHighAmplitude = (param, min = -0.2, max = 0.2) => {
  for (let i = 0; i < param.len; i++) {
    param.data[i] = param.data[i] > max ? max : param.data[i] < min ? min : param.data[i]
  }
}

/**
 * 正弦波
 * @param {Number} param
 * @param {Number} f 频率，期望0-20000之间
 * @param {Number} a 振幅，最大为1，最小为-1
 * @param {Number} w 相位，0-2PI之间
 * 效果：蜂鸣声
 */
export const sineWave = (param, f = 1000, a = 1, w = 0) => {
  for (let i = 0; i < param.len; i++) {
    param.data[i] = window._g.sineWave(i, f)
  }
}

/**
 * 规律性噪音1
 * @param {Object} param
 * @param {Number} f 频率，期望0-20000之间
 * @param {Number} a 振幅，最大为1，最小为-1
 * @param {Number} w 相位，0-2PI之间
 * 效果：规律性的噪音/蜂鸣
 */
export const regularNoise1 = (param, f = 80, a = 1, w = 0) => {
  for (let i = 0; i < param.len; i++) {
    param.data[i] = window._g.sineWave(i, f, 0.5) + window._g.sineWave(i, 2 * f, 0.25, 3) + window._g.sineWave(i, 4 * f, 0.125) + window._g.sineWave(i, 8 * f, 0.0625) + window._g.sineWave(i, 16 * f, 0.03125)
    const maxAppend = 0.6
    let append = i / 30000 % (maxAppend * 2)
    append = append > maxAppend ? maxAppend * 2 - append : append
    param.data[i] = param.data[i] > 0 ? param.data[i] - append : param.data[i] + append
  }
}
