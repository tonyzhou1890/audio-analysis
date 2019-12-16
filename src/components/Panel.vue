<template>
  <div class="panel">
    <!-- 文件信息 -->
    <div class="file-info" :class="Object.keys(file).length ? '' : 'no-file'">
      <div v-if="Object.keys(file).length" class="file-info-inner">
        <p class="file-info-item">
          <span class="file-info-item-label">文件名：</span>
          <span class="file-info-item-value">{{ file.name }}</span>
        </p>
        <p class="file-info-item">
          <span class="file-info-item-label">类型：</span>
          <span class="file-info-item-value">{{ file.type }}</span>
        </p>
        <p class="file-info-item">
          <span class="file-info-item-label">大小：</span>
          <span class="file-info-item-value">{{ file.size }}</span>
        </p>
        <p class="file-info-item">
          <span class="file-info-item-label">时长：</span>
          <span class="file-info-item-value">{{ file.duration }}</span>
        </p>
        <p class="file-info-item">
          <span class="file-info-item-label">帧数：</span>
          <span class="file-info-item-value">{{ file.length }}</span>
        </p>
        <p class="file-info-item">
          <span class="file-info-item-label">采样率：</span>
          <span class="file-info-item-value">{{ file.sampleRate }}</span>
        </p>
        <p class="file-info-item">
          <span class="file-info-item-label">声道数：</span>
          <span class="file-info-item-value">{{ file.numberOfChannels }}</span>
        </p>
      </div>
      <p v-else>未选择/新建文件</p>
    </div>
    <!-- 过滤函数 -->
    <div class="filter">
      <p>过滤函数：</p>
      <textarea
        v-model="filterFunctionText"
        class="filter-text"
        :placeholder="placeholder"
      />
      <div class="apply">
        <button
          class="apply-button"
          @click="apply"
        >应用</button>
      </div>
      <div v-show="errorInfo" class="error-info">
        <p>错误信息：</p>
        <p>{{ errorInfo }}</p>
      </div>
    </div>
  </div>
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
  methods: {
    apply() {
      try {
        const temp = eval(this.filterFunctionText)
        if (typeof temp !== 'function') {
          throw new Error('请输入箭头函数')
        }
        this.errorInfo = ''
        this.filterFunction = temp
      } catch (e) {
        this.errorInfo = e.message
      }
    }
  }
}
</script>

<style lang='less' scoped>
@import url(~'../styles/variables.less');
.panel {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .2);
  padding: 10px;
  overflow: auto;
  font-size: 12px;
  .file-info {
    width: 100%;
    min-height: 200px;
    padding: 1px 0;
    .file-info-item {
      .file-info-item-label {
        display: inline-block;
        width: 50px;
      }
    }
    &.no-file {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .filter {
    width: 100%;
    .filter-text {
      width: 100%;
      height: 200px;
      resize: none;
    }
  }
  .apply {
    text-align: center;
    padding: 10px;
    .apply-button {
      padding: 8px 16px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      background-color: @primary;
      color: inherit;
      &:hover {
        background-color: @primary-hover;
      }
      &:active {
        background-color: @primary-active;
      }
    }
  }
  .error-info {
    color: red;
  }
}
</style>
