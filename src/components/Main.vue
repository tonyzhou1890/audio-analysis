<template>
  <div ref="chartContainer" class="main">
    <canvas ref="chart" class="chart" />
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
      axisFontSize: 12, // 轴线字体大小
      lessThanPixel: false, // 点的数量是否小于像素数量
      startIndex: 0, // 开始绘制的点的索引
      endIndex: 0 // 结束绘制的点的索引
    }
  },
  mounted() {
    this.zr = window.zrender.init(this.$refs.chart)
    this.zrender = window.zrender
    this.setSize()
    window.addEventListener('resize', () => {
      this.setSize()
    })
  },
  methods: {
    // setSize
    setSize() {
      const rect = this.$refs.chartContainer.getBoundingClientRect()
      this.width = rect.width
      this.height = rect.height
      this.zr.resize({
        width: this.width,
        height: this.height
      })
    },
    // 绘制canvas
    // 参数：init，是否重置，比如打开文件时需要重置
    draw(init) {
      if (init) {
        this.startIndex = 0
        this.endIndex = 0
      }
      console.time('draw')
      this.zr.clear()
      this.drawAxis()
      this.drawPoints()
      console.timeEnd('draw')
    },
    // 绘制坐标系
    drawAxis() {
      const { yAxisLeft, waveArea } = this.generateCommonData()
      // 样式
      const style = {
        stroke: this.axisColor || this.color,
        fill: this.axisColor || this.color,
        textStroke: this.axisColor || this.color,
        textFill: this.axisColor || this.color,
        lineWidth: 2,
        font: `${this.axisFontSize}px Arial`,
        textAlign: 'center',
        textVerticalAlign: 'middle'
      }
      // x 轴起点
      const xAxisStart = [yAxisLeft, this.height - this.padding - this.xAxisHeight - this.scrollHeight]
      // x 轴终点
      const xAxisEnd = [this.width - this.padding, xAxisStart[1]]
      // x 轴
      const xAxis = new this.zrender.Line({
        shape: {
          x1: xAxisStart[0],
          y1: xAxisStart[1],
          x2: xAxisEnd[0],
          y2: xAxisEnd[1]
        },
        style
      })
      this.zr.add(xAxis)

      // x 轴刻度
      // 左侧刻度
      const xAxisSplitLeft = new this.zrender.Line({
        shape: {
          x1: xAxisStart[0] + 1,
          y1: xAxisStart[1] + 2,
          x2: xAxisStart[0] + 1,
          y2: xAxisStart[1] + 10
        },
        style
      })
      this.zr.add(xAxisSplitLeft)
      // 右侧刻度
      const xAxisSplitRight = new this.zrender.Line({
        shape: {
          x1: xAxisEnd[0] - 1,
          y1: xAxisEnd[1] + 2,
          x2: xAxisEnd[0] - 1,
          y2: xAxisEnd[1] + 10
        },
        style
      })
      this.zr.add(xAxisSplitRight)
      // x 轴文字
      // 左侧
      const xAxisLeftText = new this.zrender.Text({
        style: {
          ...style,
          text: this.startIndex,
          textAlign: 'left',
          lineWidth: 0
        },
        position: [xAxisStart[0], this.height - this.padding - this.scrollHeight]
      })
      this.zr.add(xAxisLeftText)
      // 右侧
      const xAxisRightText = new this.zrender.Text({
        style: {
          ...style,
          text: this.endIndex,
          textAlign: 'right',
          lineWidth: 0
        },
        position: [xAxisEnd[0], this.height - this.padding - this.scrollHeight]
      })
      this.zr.add(xAxisRightText)

      // y 轴
      waveArea.map(wave => {
        const yAxisFirst = new this.zrender.Line({
          shape: {
            x1: wave.startX - 4,
            y1: wave.startY,
            x2: wave.startX - 4,
            y2: wave.endY
          },
          style
        })
        this.zr.add(yAxisFirst)
        // 刻度
        ;[
          [wave.startX - 12, wave.startY, wave.startX - 4, wave.startY],
          [wave.startX - 12, (wave.startY + wave.endY) / 2, wave.startX - 4, (wave.startY + wave.endY) / 2],
          [wave.startX - 12, wave.endY, wave.startX - 4, wave.endY]
        ].map(line => {
          this.zr.add(new this.zrender.Line({
            shape: { x1: line[0], y1: line[1], x2: line[2], y2: line[3] },
            style
          }))
        })
        // y 刻度文字
        const yAxisSplitText = [1, 0, -1]
        ;[
          [yAxisLeft - 15, wave.startY],
          [yAxisLeft - 15, (wave.startY + wave.endY) / 2],
          [yAxisLeft - 15, wave.endY]
        ].map((p, index) => {
          this.zr.add(new this.zrender.Text({
            style: {
              ...style,
              text: yAxisSplitText[index],
              textAlign: 'right',
              lineWidth: 0
            },
            position: p
          }))
        })

        // y = 0
        const yZero = new this.zrender.Line({
          shape: {
            x1: xAxisStart[0],
            y1: (wave.startY + wave.endY) / 2,
            x2: xAxisEnd[0],
            y2: (wave.startY + wave.endY) / 2
          },
          style: {
            ...style,
            lineWidth: 1
          },
          cursor: 'default'
        })
        this.zr.add(yZero)
      })
    },
    // 绘制点
    drawPoints(params) {
      const { xAxisWidth, waveArea } = this.generateCommonData()

      // 步进。总的点数除以轴允许的数据点数（像素点乘以每像素数据点）。步进最小为1，即每个数据点都绘制。
      let step = (this.endIndex - this.startIndex) / (xAxisWidth * this.pointsPerPx)
      step = step < 1 ? 1 : step
      // 先清空波形数据
      this._audioData.chartWaveData = []

      waveArea.map((wave, index) => {
        // 绘制波形区域矩形，用来响应滚轮事件
        const rect = new this.zrender.Rect({
          shape: {
            x: wave.startX,
            y: wave.startY,
            width: wave.width,
            height: wave.height
          },
          cursor: 'default',
          invisible: true
        })
        this.zr.add(rect)
        rect.on('mousewheel', this.handleOnWheel, this)

        // 计算绘制点
        const calcParam = {
          step,
          channel: index,
          ...wave
        }
        this._audioData.chartWaveData[index] = this.calcDataPoint(calcParam)
        this.drawCalcedPoints({ channel: index })
      })
    },
    // 计算数据点的位置
    calcDataPoint(params) {
      const { step, channel, startX, startY, width, height } = params
      console.time(`calcDataPoints channel${channel}`)
      // 需要的数据点数量
      const pointsLen = ((this.endIndex - this.startIndex) / step) | 0
      // 每个数据点占用三个元素，第一个是数据本身，第二个是 x 轴位置，第三个是 y 轴位置
      const arr = new Float32Array(pointsLen * 3)
      for (let i = 0; i < pointsLen; i++) {
        arr[i * 3] = this._audioData.lastChannelData[channel][(i * step + this.startIndex) | 0]
        arr[i * 3 + 1] = startX + width * (i / pointsLen)
        arr[i * 3 + 2] = startY - (arr[i * 3] - 1) * height / 2
      }
      console.timeEnd(`calcDataPoints channel${channel}`)
      return arr
    },
    // 绘制数据点
    drawCalcedPoints(params) {
      const { channel } = params
      console.time(`drawCalcedPoints channel${channel}`)

      // 样式
      const style = {
        stroke: this.color,
        fill: 'none',
        lineWidth: 1
      }
      // 点数量
      const len = this._audioData.chartWaveData[channel].length / 3
      const points = new Array(len)
      for (let i = 0; i < len; i++) {
        points[i] = [
          this._audioData.chartWaveData[channel][i * 3 + 1],
          this._audioData.chartWaveData[channel][i * 3 + 2]
        ]
      }
      const polyline = new this.zrender.Polyline({
        shape: {
          points
        },
        style
      })
      polyline.on('mousewheel', this.handleOnWheel, this)
      this.zr.add(polyline)
      console.timeEnd(`drawCalcedPoints channel${channel}`)
    },
    // 滚轮缩放
    handleOnWheel(e) {
      let action = 'enlarge'
      if (e.wheelDelta < 0) action = 'shrink'
      const { offsetX } = e
      const { waveArea } = this.generateCommonData()
      // 目前数据长度
      const dataLength = this.endIndex - this.startIndex
      // 缩放事件数据点
      const dataPoint = Math.floor((offsetX - waveArea[0].startX) / waveArea[0].width * dataLength + this.startIndex)
      // 计算放大/缩小后的开始和结束索引
      let newStartIndex = this.startIndex
      let newEndIndex = this.endIndex
      // 放大
      if (action === 'enlarge') {
        // 如果已经放大到最大，不操作
        if (newEndIndex - newStartIndex <= waveArea[0].width) return
        // 放大的最大程度是一像素一个数据点
        if (dataLength < waveArea[0].width * 2) {
          newStartIndex = dataPoint - (offsetX - waveArea[0].startX)
          newEndIndex = newStartIndex + waveArea[0].width
        } else { // 缩放倍率是0.5
          newStartIndex = Math.floor((dataPoint + newStartIndex) / 2)
          newEndIndex = Math.floor((newEndIndex + dataPoint) / 2)
        }
      } else {
        // 缩小
        // 如果已经最小，即处于原始大小，不操作
        if (newStartIndex === 0 && newEndIndex === this._audioData.buffer.length - 1) return
        // 如果总长度不足当前长度的两倍，则为总长度
        if (this._audioData.buffer.length - 1 <= (newEndIndex - newStartIndex) * 2) {
          newStartIndex = 0
          newEndIndex = this._audioData.buffer.length - 1
        } else {
          newStartIndex = newStartIndex * 2 - dataPoint
          newEndIndex = newEndIndex * 2 - dataPoint
        }
      }
      // 处理越界
      if (newStartIndex < 0) newStartIndex = 0
      if (newEndIndex >= this._audioData.buffer.length) newEndIndex = this._audioData.buffer.length - 1
      this.startIndex = newStartIndex
      this.endIndex = newEndIndex

      // 绘制
      this.draw()
    },
    // 是否在波形区
    isInWaveArea(params) {
    },
    // 生成通用数据
    generateCommonData() {
      const channels = this._audioData.buffer.numberOfChannels
      // 波形图半程高度(包括波形图边距)
      const halfBlockHeight = (this.height - this.padding * 2 - this.xAxisHeight - this.scrollHeight) / (channels === 2 ? 4 : 2)
      // y轴基点距左边距离
      const yAxisLeft = this.yAxisWidth + this.padding
      const xAxisWidth = this.width - 10 * 2 - this.yAxisWidth - 2

      // 波形区
      const waveArea = []
      waveArea[0] = {
        startX: yAxisLeft + 2,
        startY: this.padding + 10,
        width: xAxisWidth,
        height: halfBlockHeight * 2 - 20,
        endX: yAxisLeft + 2 + xAxisWidth,
        endY: this.padding + halfBlockHeight * 2 - 10
      }
      if (channels === 2) {
        waveArea[1] = {
          ...waveArea[0],
          startY: this.padding + halfBlockHeight * 2 + 10,
          endY: this.padding + halfBlockHeight * 4 - 10
        }
      }

      // 如果 startIndex 和 endIndex 都是零的初始状态，需要将其设置为正确的数值
      if (this.startIndex === this.endIndex && this.startIndex === 0) {
        this.endIndex = this._audioData.lastChannelData[0].length
      }

      return {
        channels,
        halfBlockHeight,
        yAxisLeft,
        xAxisWidth,
        waveArea
      }
    },
    // 清除
    clear() {
      this.zr.clear()
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
