/**
 * 当前是否没有音频
 */
export function noAudio() {
  return !window._audioData.raw
}
