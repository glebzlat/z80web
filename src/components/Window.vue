<template>
  <div class="window">
    <div class="window-header">
      <p class="window-header-text">{{ props.header }}</p>
    </div>
    <div class="window-top" v-if="$slots['top-panel']">
      <slot name="top-panel"></slot>
    </div>
    <div class="window-main">
      <slot name="main"></slot>
    </div>
    <div class="window-bottom" v-if="$slots['bottom-panel']">
      <slot name="bottom-panel"></slot>
    </div>
  </div>
</template>

<script setup>
  const props = defineProps({
    header: {
      type: String,
      required: true
    }
  })
</script>

<style scoped>
.window {
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 5px;
  border: solid 1px var(--main-fg-color);
}

.window-header {
  padding: 2px 6px;
  background-color: var(--second-bg-color);
  user-select: none;
}

.window-main {
  flex-grow: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 6px;
}

.window-top, .window-main, .window-bottom {
  padding: 6px;
}

.window-top {
  border-bottom: solid 1px var(--main-fg-color)
}

.window-bottom {
  border-top: solid 1px var(--main-fg-color)
}
</style>
