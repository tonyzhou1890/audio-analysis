import Vue from 'vue'
import App from './App.vue'
import './styles/index.less'
import './utils/global'
import * as example from './utils/example'

window.example = example

Vue.config.productionTip = false

// 音频上下文
Vue.prototype._audioCtx = new AudioContext()
// 音频数据
const audioData = {
  raw: null,
  channelData: []
}
window._audioData = Vue.prototype._audioData = audioData

new Vue({
  render: h => h(App)
}).$mount('#app')
