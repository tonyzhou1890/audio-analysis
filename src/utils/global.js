// 此文件中的函数会注册到 window 对象上。部分样例会调用 window 上的方法
/**
 * 正弦波--求x对应的y值
 * @param {Number} x x轴值
 * @param {Number} f 频率，期望0-20000之间
 * @param {Number} a 振幅，最大为1，最小为-1
 * @param {Number} w 相位，0-2PI之间
 */
export const sineWave = (x, f = 1, a = 1, w = 0) => {
  return a * Math.sin(Math.PI / 24000 * f * x + w)
}

window._g = {
  sineWave
}
