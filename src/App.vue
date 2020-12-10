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
// import audioEncoder from 'audio-encoder'
// import fileSaver from 'file-saver'
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
        console.time('decodeAudioData')
        this._audioCtx.decodeAudioData(e.target.result, (buffer) => {
          console.timeEnd('decodeAudioData')
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

          this.setChannelDataList(buffer)
          this.$refs.main.draw(true)
        }, (e) => {
          console.log(e)
        })
      }
    },
    // 创建音频-默认10秒
    newFile() {
      window.XyDialog.prompt({
        title: '创建音频', // 标题
        ok: (value) => {
          const time = Number(value)
          if (!isNaN(time) && time >= 1 && time <= 300) {
            this.createAudio(time)
          } else {
            window.XyMessage.info('请输入 1~300 之间的有效数字')
          }
        },
        cancel: function() {
          console.log('取消创建音频')
        },
        content: '请输入音频时长(1~300秒)' // 内容描述
      })
    },
    // 创建音频
    createAudio(time = 10) {
      this.clear()
      const buffer = this._audioCtx.createBuffer(2, this._audioCtx.sampleRate * time, this._audioCtx.sampleRate)
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

      this.setChannelDataList(buffer)
      this.$refs.main.draw(true)
    },
    // 设置供修改的声道数据
    setChannelDataList(buffer) {
      console.time('setChannelDataList')
      if (buffer.numberOfChannels === 1) {
        this._audioData.channelDataList = [
          [buffer.getChannelData(0)]
        ]
      } else if (buffer.numberOfChannels === 2) {
        this._audioData.channelDataList = [
          [buffer.getChannelData(0), buffer.getChannelData(1)]
        ]
      } else {
        console.log('声道数只能是1或2')
      }
      this._audioData.lastChannelData = this._audioData.channelDataList.slice(-1)[0] || []
      console.timeEnd('setChannelDataList')
    },
    // 复原
    restore() {
      if (!noAudio()) {
        this.setChannelDataList(this._audioData.buffer)
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
          this.setActiveAsync()
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
        // audioEncoder(this._audioData.buffer, 'WAV', null, (blob) => {
        //   fileSaver.saveAs(blob, this.file.name)
        // })
      }
      this.setActiveAsync()
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
  min-width: 800px;
  height: 100%;
  .toolbar-wrapper {
    width: 100%;
    height: @toolbarHeight;
  }
  .body-wrapper {
    width: 100%;
    height: calc(~'100%' - @toolbarHeight);
    .panel-wrapper {
      width: 300px;
      height: 100%;
      float: left;
    }
    .main-wrapper {
      float: left;
      width: calc(~'100% - 300px');
      height: 100%;
    }
  }
}
</style>
