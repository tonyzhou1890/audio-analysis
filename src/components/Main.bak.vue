<template>
  <div ref="chartContainer" class="main">
    <canvas ref="chart" class="chart" @mousewheel="handleOnWheel" />
  </div>
</template>

<script>
export default {
  name: 'Main',
  props: {
    file: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      width: null,
      height: null,
      pointsPerPx: 10, // 每个像素点最多多少个数据
      padding: 10, // canvas padding
      yAxisWidth: 30, // y轴宽度--包括文字
      xAxisHeight: 20, // x轴高度--包括文字
      scrollHeight: 30, // 滚动条区域高度
      axisColor: '#eee', // 轴线颜色
      color: '#ddd', // 波形颜色
      axisFontSize: 16, // 轴线字体大小
      lessThanPixel: false, // 点的数量是否小于像素数量
      startIndex: 0, // 开始绘制的点的索引
      endIndex: 0 // 结束绘制的点的索引
    }
  },
  mounted() {
    this.setSize()
    window.addEventListener('resize', () => {
      this.setSize()
    })
  },
  methods: {
    // setSize
    setSize() {
      const rect = this.$refs.chart.getBoundingClientRect()
      this.width = rect.width
      this.height = rect.height
    },
    // 绘制canvas
    // 参数：init，是否重置，比如打开文件时需要重置
    draw(init) {
      // 声道数
      const channels = this._audioData.buffer.numberOfChannels
      const chart = this.$refs.chart
      chart.width = this.width
      chart.height = this.height
      const ctx = chart.getContext('2d')
      window.ctx = ctx
      if (init) {
        this.startIndex = 0
        this.endIndex = 0
      }
      this.drawAxis({ ctx, channels })
      this.drawPoints({ ctx, channels })
    },
    // 绘制坐标系
    drawAxis(params) {
      const { ctx, channels } = params

      const { yBlockHeight, yAxisLeft } = this.generateCommonData()

      ctx.strokeStyle = this.axisColor || this.color
      ctx.fillStyle = this.axisColor || this.color
      ctx.lineWidth = 2
      ctx.font = `${this.axisFontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.beginPath()
      // x 轴
      ctx.moveTo(yAxisLeft, this.height - this.padding - this.xAxisHeight - this.scrollHeight)
      ctx.lineTo(this.width - this.padding, this.height - this.padding - this.xAxisHeight - this.scrollHeight)

      // splitAxis
      ctx.moveTo(yAxisLeft + 1, this.height - this.padding - this.xAxisHeight - this.scrollHeight + 2)
      ctx.lineTo(yAxisLeft + 1, this.height - this.padding - this.xAxisHeight - this.scrollHeight + 10)
      ctx.moveTo(this.width - this.padding - 1, this.height - this.padding - this.xAxisHeight - this.scrollHeight + 2)
      ctx.lineTo(this.width - this.padding - 1, this.height - this.padding - this.xAxisHeight - this.scrollHeight + 10)
      ctx.stroke()
      ctx.textAlign = 'left'
      ctx.fillText(this.startIndex, yAxisLeft, this.height - this.padding - this.scrollHeight)
      ctx.textAlign = 'right'
      ctx.fillText(this.startIndex === this.endIndex ? this._audioData.frameIndex.length - 1 : this.endIndex, this.width - this.padding, this.height - this.padding - this.scrollHeight)

      // y 轴
      ctx.beginPath()
      ctx.textAlign = 'right'
      if (channels === 2) {
        ctx.moveTo(yAxisLeft - 2, this.padding + 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight * 2 - 10)
        ctx.moveTo(yAxisLeft - 2, this.padding + yBlockHeight * 2 + 10)
        ctx.lineTo(yAxisLeft - 2, this.height - this.padding - this.xAxisHeight - this.scrollHeight - 10)

        // splitAxis
        ctx.moveTo(yAxisLeft - 10, this.padding + 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + 10)
        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight)
        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight * 2 - 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight * 2 - 10)
        ctx.fillText('1', yAxisLeft - 15, this.padding + 10)
        ctx.fillText('0', yAxisLeft - 15, this.padding + yBlockHeight)
        ctx.fillText('-1', yAxisLeft - 15, this.padding + yBlockHeight * 2 - 10)

        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight * 2 + 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight * 2 + 10)
        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight * 3)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight * 3)
        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight * 4 - 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight * 4 - 10)
        ctx.fillText('1', yAxisLeft - 15, this.padding + yBlockHeight * 2 + 10)
        ctx.fillText('0', yAxisLeft - 15, this.padding + yBlockHeight * 3)
        ctx.fillText('-1', yAxisLeft - 15, this.padding + yBlockHeight * 4 - 10)
      } else {
        ctx.moveTo(yAxisLeft - 2, this.padding + 10)
        ctx.lineTo(yAxisLeft - 2, this.height - this.padding - this.xAxisHeight - this.scrollHeight - 10)
        // splitAxis
        ctx.moveTo(yAxisLeft - 10, this.padding + 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + 10)
        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight)
        ctx.moveTo(yAxisLeft - 10, this.padding + yBlockHeight * 2 - 10)
        ctx.lineTo(yAxisLeft - 2, this.padding + yBlockHeight * 2 - 10)
        ctx.fillText('1', yAxisLeft - 15, this.padding + 10)
        ctx.fillText('0', yAxisLeft - 15, this.padding + yBlockHeight)
        ctx.fillText('-1', yAxisLeft - 15, this.padding + yBlockHeight * 2 - 10)
      }
      ctx.stroke()

      // 0 轴
      ctx.lineWidth = 1
      ctx.beginPath()
      if (channels === 2) {
        ctx.moveTo(yAxisLeft, this.padding + yBlockHeight)
        ctx.lineTo(this.width - this.padding, this.padding + yBlockHeight)
        ctx.moveTo(yAxisLeft, this.padding + yBlockHeight * 3)
        ctx.lineTo(this.width - this.padding, this.padding + yBlockHeight * 3)
      } else {
        ctx.moveTo(yAxisLeft, this.padding + yBlockHeight)
        ctx.lineTo(this.width - this.padding, this.padding + yBlockHeight)
      }
      ctx.stroke()
    },
    // 绘制点
    drawPoints(params) {
      const { ctx, channels } = params

      const { xAxisWidth, waveArea } = this.generateCommonData()

      const dataLength = this.startIndex === this.endIndex ? this._audioData.frameIndex.length : this.endIndex - this.startIndex
      const step = dataLength / xAxisWidth > this.pointsPerPx ? dataLength / xAxisWidth / this.pointsPerPx : 1 // 一个像素点取十个或一个数据
      const sampleDataLength = Math.floor(dataLength / step)
      // 计算数据点的位置
      this._audioData.chartWaveData = Array.isArray(this._audioData.chartWaveData) ? this._audioData.chartWaveData : []
      let calcParam = {
        sampleDataLength,
        step,
        startIndex: this.startIndex,
        channel: 0,
        ...waveArea[0]
      }
      this._audioData.chartWaveData[0] = this.calcDataPoint(calcParam)
      // this._audioData.chartWaveData[0] = this.calcAllDataPoint(calcParam)
      if (channels === 2) {
        calcParam = {
          ...calcParam,
          channel: 1,
          ...waveArea[1]
        }
        this._audioData.chartWaveData[1] = this.calcDataPoint(calcParam)
        // this._audioData.chartWaveData[1] = this.calcAllDataPoint(calcParam)
      }
      // 绘制点
      let drawParam = {
        ctx,
        channel: 0
      }
      this.drawCalcedPoints(drawParam)
      if (channels === 2) {
        drawParam = {
          ...drawParam,
          channel: 1
        }
        this.drawCalcedPoints(drawParam)
      }
    },
    // 计算数据点的位置
    calcDataPoint(params) {
      const { sampleDataLength, step, startIndex, channel, startX, startY, width, height } = params
      const tempArray = new Float32Array(Math.floor(sampleDataLength) * 3)
      for (let i = 0; i < sampleDataLength; i++) {
        tempArray[i * 3] = this._audioData.channelData[channel][Math.floor(i * step + startIndex)]
        tempArray[i * 3 + 1] = startX + width * i / sampleDataLength
        tempArray[i * 3 + 2] = startY - (tempArray[i * 3] - 1) * height / 2
      }
      return tempArray
    },
    // 绘制数据点
    drawCalcedPoints(params) {
      const { ctx, channel } = params
      ctx.fillStyle = this.color
      ctx.strokeStyle = this.color
      ctx.lineWidth = 1
      const length = this._audioData.chartWaveData[0].length / 3
      ctx.beginPath()
      ctx.moveTo(this._audioData.chartWaveData[channel][1], this._audioData.chartWaveData[channel][2])
      // 只有数据量少于像素点数量的时候才绘制点
      if (this.lessThanPixel) {
        for (let i = 0; i < length; i++) {
          ctx.fillRect(this._audioData.chartWaveData[channel][i * 3 + 1] - 1, this._audioData.chartWaveData[channel][i * 3 + 2] - 1, 3, 3)
          ctx.lineTo(this._audioData.chartWaveData[channel][i * 3 + 1], this._audioData.chartWaveData[channel][i * 3 + 2])
        }
      } else {
        for (let i = 0; i < length; i++) {
          ctx.lineTo(this._audioData.chartWaveData[channel][i * 3 + 1], this._audioData.chartWaveData[channel][i * 3 + 2])
        }
      }
      ctx.stroke()
    },
    // 计算所有数据点的位置
    calcAllDataPoint(params) {
      const { channel, startX, startY, width, height } = params
      const length = this._audioData.channelData[channel].length / 2
      const tempArray = new Float32Array(Math.floor(length) * 3)
      for (let i = 0; i < length; i++) {
        tempArray[i * 3] = this._audioData.channelData[channel][i]
        tempArray[i * 3 + 1] = startX + width * i / length
        tempArray[i * 3 + 2] = startY - (tempArray[i * 3] - 1) * height / 2
      }
      return tempArray
    },
    // 滚轮缩放
    handleOnWheel(e) {
      let action = 'enlarge'
      if (e.wheelDelta < 0) action = 'shrink'
      const { offsetX, offsetY } = e
      if (this.isInWaveArea({ offsetX, offsetY })) {
        const { waveArea } = this.generateCommonData()
        // 目前数据长度
        const dataLength = this.startIndex === this.endIndex ? this._audioData.frameIndex.length : this.endIndex - this.startIndex
        // 缩放事件数据点
        const dataPoint = Math.floor((offsetX - waveArea[0].startX) / waveArea[0].width * dataLength + this.startIndex)
        // 计算放大/缩小后的开始和结束索引
        let newStartIndex = this.startIndex
        let newEndIndex = this.endIndex
        // 放大
        if (action === 'enlarge') {
          // 如果已经放大到最大，不操作
          if (newEndIndex !== newStartIndex && newEndIndex - newStartIndex <= waveArea[0].width) return
          // 放大的最大程度是一像素一个数据点
          if (dataLength < waveArea[0].width * 2) {
            newStartIndex = dataPoint - (offsetX - waveArea[0].startX)
            newEndIndex = newStartIndex + waveArea[0].width
          } else { // 缩放倍率是0.5
            newStartIndex = Math.floor((dataPoint + newStartIndex) / 2)
            newEndIndex = this.startIndex === this.endIndex ? Math.floor((this._audioData.frameIndex.length - 1 + dataPoint) / 2) : Math.floor((newEndIndex + dataPoint) / 2)
          }
        } else {
          // 缩小
          // 如果已经最小，即处于原始大小，不操作
          if (newStartIndex === newEndIndex || (newStartIndex === 0 && newEndIndex === this._audioData.frameIndex.length - 1)) return
          // 如果总长度不足当前长度的两倍，则为总长度
          if (this._audioData.frameIndex.length - 1 <= (newEndIndex - newStartIndex) * 2) {
            newStartIndex = 0
            newEndIndex = 0
          } else {
            newStartIndex = newStartIndex * 2 - dataPoint
            newEndIndex = newEndIndex * 2 - dataPoint
          }
        }
        // 处理越界
        if (newStartIndex < 0) newStartIndex = 0
        if (newEndIndex >= this._audioData.frameIndex.length) newEndIndex = this._audioData.frameIndex.length - 1
        this.startIndex = newStartIndex
        this.endIndex = newEndIndex

        // 绘制
        this.draw()
      }
    },
    // 是否在波形区
    isInWaveArea(params) {
      const { offsetX, offsetY } = params
      const { channels, waveArea } = this.generateCommonData()
      if (offsetX > waveArea[0].startX && offsetX < waveArea[0].endX && offsetY > waveArea[0].startY && offsetY < waveArea[0].endY) {
        return true
      }
      if (channels === 2 && offsetX > waveArea[1].startX && offsetX < waveArea[1].endX && offsetY > waveArea[1].startY && offsetY < waveArea[1].endY) {
        return true
      }
      return false
    },
    // 生成通用数据
    generateCommonData() {
      const channels = this._audioData.buffer.numberOfChannels
      // 波形图半程高度
      const yBlockHeight = (this.height - this.padding * 2 - this.xAxisHeight - this.scrollHeight) / (channels === 2 ? 4 : 2)
      // y轴基点距左边距离
      const yAxisLeft = this.yAxisWidth + this.padding
      const xAxisWidth = this.width - 10 * 2 - this.yAxisWidth - 2

      // 波形区
      const waveArea = []
      waveArea[0] = {
        startX: yAxisLeft + 2,
        startY: this.padding + 10,
        width: xAxisWidth,
        height: yBlockHeight * 2 - 20,
        endX: yAxisLeft + 2 + xAxisWidth,
        endY: this.padding + yBlockHeight * 2 - 10
      }
      if (channels === 2) {
        waveArea[1] = {
          ...waveArea[0],
          startY: this.padding + yBlockHeight * 2 + 10,
          endY: this.padding + yBlockHeight * 4 - 10
        }
      }

      return {
        channels,
        yBlockHeight,
        yAxisLeft,
        xAxisWidth,
        waveArea
      }
    },
    // 清除
    clear() {
      const chart = this.$refs.chart
      chart.width = this.width
      chart.height = this.height
    }
  }
}
</script>

<style lang='less' scoped>
@import url(~'../styles/variables.less');
.main {
  width: 100%;
  height: 100%;
  .chart {
    width: 100%;
    height: 100%;
  }
}
</style>
