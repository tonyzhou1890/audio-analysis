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
      const rect = this.$refs.chart.getBoundingClientRect()
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
      this.zr.clear()
      this.drawAxis()
      // this.drawPoints()
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
          text: this.startIndex === this.endIndex ? this._audioData.frameIndex.length - 1 : this.endIndex,
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
      })
    },
    // 绘制点
    drawPoints(params) {
    },
    // 计算数据点的位置
    calcDataPoint(params) {
    },
    // 绘制数据点
    drawCalcedPoints(params) {
    },
    // 计算所有数据点的位置
    calcAllDataPoint(params) {
    },
    // 滚轮缩放
    handleOnWheel(e) {
    },
    // 是否在波形区
    isInWaveArea(params) {
    },
    // 生成通用数据
    generateCommonData() {
      const channels = this._audioData.buffer.numberOfChannels
      // 波形图半程高度
      const halfWaveHeight = (this.height - this.padding * 2 - this.xAxisHeight - this.scrollHeight) / (channels === 2 ? 4 : 2)
      // y轴基点距左边距离
      const yAxisLeft = this.yAxisWidth + this.padding
      const xAxisWidth = this.width - 10 * 2 - this.yAxisWidth - 2

      // 波形区
      const waveArea = []
      waveArea[0] = {
        startX: yAxisLeft + 2,
        startY: this.padding + 10,
        width: xAxisWidth,
        height: halfWaveHeight * 2 - 20,
        endX: yAxisLeft + 2 + xAxisWidth,
        endY: this.padding + halfWaveHeight * 2 - 10
      }
      if (channels === 2) {
        waveArea[1] = {
          ...waveArea[0],
          startY: this.padding + halfWaveHeight * 2 + 10,
          endY: this.padding + halfWaveHeight * 4 - 10
        }
      }

      return {
        channels,
        halfWaveHeight,
        yAxisLeft,
        xAxisWidth,
        waveArea
      }
    },
    // 清除
    clear() {
      this.resize()
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
