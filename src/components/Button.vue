<template>
  <button class="button" :class="{ active: props.active }" @click="onClick">
    <div class="mask" v-if="!props.active"></div>
    <slot></slot>
  </button>
</template>

<script setup>
  const props = defineProps({
    active: {
      type: Boolean,
      default: true
    }
  });

  const emit = defineEmits(["click"]);

  function onClick() {
    if (props.active) {
      emit("click");
    }
  }
</script>

<style scoped>
.button {
  display: block;
  position: relative;
  border: solid 1px var(--main-fg-color);
  border-radius: 0;
  outline: 0;
  background-color: var(--second-bg-color);
  color: var(--main-fg-color);
  padding: 3px 9px;
  cursor: not-allowed;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
}

.button.active {
  background-color: var(--main-bg-color);
  cursor: pointer;
}

.button.active:hover {
  background-color: var(--main-fg-color);
  color: var(--main-bg-color);
}

.mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    var(--second-bg-color) 1px,
    var(--second-bg-color) 4px
  );
}
</style>
