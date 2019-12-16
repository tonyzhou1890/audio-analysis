<template>
  <div ref="chart" class="main" />
</template>

<script>
export default {
  name: 'Panel',
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
      tempData: [0.3, 0.1, -0.5, 1, 0, -1]
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
    draw() {
      if (!this._echartInstance) {
        this._echartInstance = echarts.init(this.$refs.chart)
      }

      // 声道数
      const channels = this._audioData.rawBuffer.numberOfChannels

      // x 轴
      const _xAxis = {
        type: 'category',
        splitLine: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: '#eee'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#eee'
          }
        },
        axisLabel: {
          color: '#eee'
        }
        // data: [...this._audioData.frameIndex]
      }

      const xAxis = [{ ..._xAxis }]
      if (channels === 2) {
        xAxis.push({ ..._xAxis, gridIndex: 1, position: 'top' })
      }

      // y 轴
      const _yAxis = {
        type: 'value',
        min: -1,
        max: 1,
        splitLine: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: '#eee'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#eee'
          }
        },
        axisLabel: {
          color: '#eee'
        }
      }

      const yAxis = [{ ..._yAxis }]
      if (channels === 2) {
        yAxis.push({ ..._yAxis, gridIndex: 1 })
      }

      // series
      const _series = {
        type: 'line',
        data: this._audioData.channelData[0],
        dimensions: ['x', 'y'],
        large: true
        // data: this.tempData
      }

      const series = [{ ..._series }]
      if (channels === 2) {
        series.push({
          ..._series,
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: this._audioData.channelData[1],
          dimensions: ['x', 'y'],
          large: true
          // data: this.tempData
        })
      }

      // dataZoom
      const dataZoom = [
        {
          show: true,
          realtime: true,
          start: 0,
          end: 100
        },
        {
          type: 'inside',
          realtime: true,
          start: 0,
          end: 100
        }
      ]

      if (channels === 2) {
        dataZoom[0].xAxisIndex = [0, 1]
        dataZoom[1].xAxisIndex = [0, 1]
      }

      // grid
      const _grid = {
        left: 50,
        right: 50,
        height: '40%'
      }

      const grid = [{ ..._grid }]
      if (channels === 2) {
        grid.push({
          ..._grid,
          top: '55%'
        })
      } else {
        grid[0].height = '80%'
      }

      const option = {
        tooltip: {
          trigger: 'axis'
        },
        toolbox: {
          feature: {
            dataZoom: {
              yAxisIndex: 'none'
            },
            restore: {},
            saveAsImage: {}
          }
        },
        axisPointer: {
          link: { xAxisIndex: 'all' }
        },
        dataZoom,
        grid,
        xAxis,
        yAxis,
        series
      }

      console.log(option)

      this._echartInstance.setOption(option)

      window.addEventListener('resize', this._echartInstance.resize)
    }
  }
}
</script>

<style lang='less' scoped>
@import url(~'../styles/variables.less');
.main {
  width: 100%;
  height: 100%;
}
</style>
