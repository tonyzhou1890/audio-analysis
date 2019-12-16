<template>
  <div class="toolbar">
    <div
      v-for="(group, index) in menu"
      :key="index"
      class="menu-group"
    >
      <button
        v-for="item in group"
        :key="item.name"
        class="menu-button"
        @click="() => trigger(item.action)"
      >{{ item.name }}</button>
      <span v-if="index !== menu.length - 1" class="divided" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    menu: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    trigger(action) {
      this.$emit('menu-trigger', action)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang='less' scoped>
.toolbar {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .2);
  padding: 0 10px;
  .menu-group {
    display: inline-block;
    height: 24px;
    margin-top: 3px;
    vertical-align: middle;
    .menu-button {
      background-color: transparent;
      color: inherit;
      vertical-align: middle;
      border: 0;
      cursor: pointer;
      height: 100%;
      line-height: 1;
      &:hover {
        background-color: rgba(0, 0, 0, .2)
      }
      &:active {
        border: 0;
        outline: 0;
        background-color: rgba(0, 0, 0, .5)
      }
      &:focus {
        border: 0;
        outline: 0;
      }
    }
    .divided {
      display: inline-block;
      width: 2px;
      height: 100%;
      margin: 0 4px;
      background-color: gray;
      vertical-align: middle;
    }
  }
}
</style>
