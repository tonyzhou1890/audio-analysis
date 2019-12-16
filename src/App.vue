<template>
  <div id="app">
    <!-- 工具栏 -->
    <div class="toolbar-wrapper">
      <Toolbar
        :menu="menu"
        @menu-trigger="handleMenuTrigger"
      />
    </div>
    <div class="body-wrapper">
      <!-- 信息面板 -->
      <div class="panel-wrapper">
        <Panel
          :file="file"
        />
      </div>
      <!-- 波形图区 -->
      <div class="main-wrapper">
        <Main ref="main" />
      </div>
    </div>
    <input
      v-show="false"
      ref="fileInput"
      type="file"
      accept="audio/*"
      @change="handleFileChange"
    >
  </div>
</template>

<script>
import { menu } from './utils/config'
import Toolbar from './components/Toolbar'
import Panel from './components/Panel'
import Main from './components/Main'
export default {
  name: 'App',
  components: {
    Toolbar,
    Panel,
    Main
  },
  data() {
    return {
      menu,
      file: {}
    }
  },
  methods: {
    // 处理菜单按钮事件
    handleMenuTrigger(action) {
      console.log(action)
      switch (action) {
        case 'openFile':
          this.openFile()
          break
        default:
          break
      }
    },
    // 打开文件选择
    openFile() {
      this.$refs.fileInput.click()
    },
    // 处理选择文件
    handleFileChange(e) {
      const temp = e.target.files[0]
      this.$refs.fileInput.value = ''

      const fs = new FileReader()
      fs.readAsArrayBuffer(temp)
      fs.onload = (e) => {
        this._audioCtx.decodeAudioData(e.target.result, (buffer) => {
          this._audioData.raw = temp
          this._audioData.rawBuffer = buffer
          this.file = {
            name: temp.name,
            type: temp.type,
            size: (temp.size / 1024).toFixed(3) + 'kb',
            duration: buffer.duration,
            length: buffer.length,
            sampleRate: buffer.sampleRate,
            numberOfChannels: buffer.numberOfChannels
          }
          this._audioData.frameIndex = new Uint32Array(buffer.length)
          for (let i = 0; i < buffer.length; i++) {
            this._audioData.frameIndex[i] = i
          }
          if (buffer.numberOfChannels === 1) {
            this._audioData.channelData = [buffer.getChannelData(0)]
          } else if (buffer.numberOfChannels === 2) {
            this._audioData.channelData = [buffer.getChannelData(0), buffer.getChannelData(1)]
          } else {
            console.log('声道数只能是1或2')
          }
          this.$refs.main.draw()
        }, (e) => {
          console.log(e)
        })
      }
    }
  }
}
</script>

<style lang='less' scoped>
@toolbarHeight: 30px;
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #eee;
  background-color: #2c3e50;
  width: 100%;
  height: 100%;
  .toolbar-wrapper {
    width: 100%;
    height: @toolbarHeight;
  }
  .body-wrapper {
    width: 100%;
    height: calc(~'100%' - @toolbarHeight);
    display: flex;
    .panel-wrapper {
      width: 300px;
      height: 100%;
    }
    .main-wrapper {
      flex: 1;
      height: 100%;
    }
  }
}
</style>
