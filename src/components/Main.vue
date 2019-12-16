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
      placeholder: `请在这里输入音频过滤函数\r\n请注意，函数需要是箭头函数，比如：() => 1`,
      filterFunctionText: '',
      errorInfo: ''
    }
  },
  created() {
    console.log(this._audioData)
  },
  methods: {
    draw() {
      console.log(this._audioData)
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
