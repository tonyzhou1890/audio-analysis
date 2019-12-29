<template>
  <div id="app">
    <!-- 工具栏 -->
    <div class="toolbar-wrapper">
      <Toolbar
        :menu="menu"
        :active="active"
        @menu-trigger="handleMenuTrigger"
      />
    </div>
    <div class="body-wrapper">
      <!-- 信息面板 -->
      <div class="panel-wrapper">
        <Panel
          ref="panel"
          :file="file"
          :filter-function-done="filterFunctionDone"
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
import toWav from 'audiobuffer-to-wav'
import { menu } from './utils/config'
import { noAudio } from './utils/utils'
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
      file: {},
      active: '', // 当前激活的动作
      stopTime: 0 // 音频停止时间
    }
  },
  methods: {
    // 处理菜单按钮事件
    handleMenuTrigger(action) {
      switch (action) {
        case 'openFile':
          this.openFile()
          break
        case 'newFile':
          this.newFile()
          break
        case 'restore':
          this.restore()
          break
        case 'clear':
          this.clear()
          break
        case 'play':
          this.play()
          break
        case 'pause':
          this.pause()
          break
        case 'stop':
          this.stop()
          break
        case 'save':
          this.save()
          break
        default:
          break
      }
      this.active = action
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
          this._audioData.buffer = buffer
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
          this.$refs.main.draw(true)
          // 备份原来的声音数据
          setTimeout(this.setRawChannelData(), 0)
        }, (e) => {
          console.log(e)
        })
      }
    },
    // 备份原来的声音数据
    setRawChannelData() {
      if (this._audioData.channelData && this._audioData.channelData.length) {
        const len = this._audioData.frameIndex.length
        const rawChannelData = []
        for (let channel = 0; channel < this._audioData.buffer.numberOfChannels; channel++) {
          const temp = new Float32Array(len)
          for (let i = 0; i < len; i++) {
            temp[i] = this._audioData.channelData[channel][i]
          }
          rawChannelData[channel] = temp
        }
        this._audioData.rawChannelData = rawChannelData
      }
    },
    // 创建音频-默认10秒
    newFile() {
      this.clear()
      const buffer = this._audioCtx.createBuffer(2, this._audioCtx.sampleRate * 10, this._audioCtx.sampleRate)
      const temp = {
        name: '新文件',
        type: '',
        size: '',
        duration: buffer.duration,
        length: buffer.length,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels
      }
      this._audioData.raw = this.file = temp
      this._audioData.buffer = buffer
      this._audioData.frameIndex = new Uint32Array(buffer.length)
      for (let i = 0; i < buffer.length; i++) {
        this._audioData.frameIndex[i] = i
      }
      this._audioData.channelData = [buffer.getChannelData(0), buffer.getChannelData(1)]
      this.$refs.main.draw(true)
      // 备份原来的声音数据
      setTimeout(this.setRawChannelData(), 0)
    },
    // 复原
    restore() {
      if (!noAudio()) {
        const len = this._audioData.frameIndex.length
        if (this._audioData.channelData && this._audioData.channelData.length) {
          for (let channel = 0; channel < this._audioData.buffer.numberOfChannels; channel++) {
            for (let i = 0; i < len; i++) {
              this._audioData.channelData[channel][i] = this._audioData.rawChannelData[channel][i]
            }
          }
        }
        this.$refs.main.draw(true)
      }
    },
    // 清空
    clear() {
      this.stop()
      Object.keys(this._audioData).map(key => delete this._audioData[key])
      this._audioData.raw = null
      this._audioData.channelData = []
      this.file = {}
      this.$refs.panel.clear()
      this.$refs.main.clear()
      this.setActiveAsync()
    },
    // 播放文件
    play() {
      if (noAudio()) {
        alert('没有音频')
        this.setActiveAsync()
      } else {
        // 一个 source 实例只能调用一次 start 方法，所以先断开连接，重新生成实例
        if (this._audioData.source) {
          this._audioData.source.disconnect()
        }
        this._audioData.source = this._audioCtx.createBufferSource()
        // 连接扬声器
        this._audioData.source.buffer = this._audioData.buffer
        this._audioData.source.connect(this._audioCtx.destination)
        this._audioData.source.start(0, this.stopTime || 0)
        this._audioData.source.onended = () => {
          this.active = ''
        }
      }
    },
    // 暂停
    pause() {
      if (this.active === 'play') {
        this.stopTime = this._audioData.source.context.currentTime
        this._audioData.source.stop()
      } else {
        this.setActiveAsync()
      }
    },
    // 停止
    stop() {
      if (this.active === 'play' || this.active === 'pause') {
        this._audioData.source.stop()
        this._audioData.source.disconnect()
        this.stopTime = 0
      }
    },
    // 保存音频
    save() {
      const active = this.active
      this.setActiveAsync(active)
      if (!noAudio()) {
        const wav = toWav(this._audioData.buffer)
        const blob = new Blob([wav], {
          type: 'audio/mpeg'
        })
        const downloadUrl = window.URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = downloadUrl
        anchor.download = `${this.file.name}`
        anchor.click()
        window.URL.revokeObjectURL(blob)
      }
    },
    // 左侧面板处理完音频
    filterFunctionDone() {
      this.$refs.main.draw(true)
    },
    // 延时设置 active
    setActiveAsync(value) {
      setTimeout(() => {
        this.active = value || ''
      }, 0)
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
