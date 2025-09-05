<template>
  <input class="input"
         type="text"
         v-model="modelValue"
         :placeholder="props.placeholder"
         :class="{ invalid: !props.valid }"
         />
</template>

<script setup>
  const modelValue = defineModel({ type: String, default: "" });
  const props = defineProps({
    placeholder: {
      type: String,
      default: ""
    },
    valid: {
      type: Boolean,
      default: true
    }
  });
</script>

<style scoped>
.input {
  padding: 2px;
  border-radius: 0;
  border: solid 1px var(--main-fg-color);
  color: var(--main-fg-color);
  background-color: var(--main-bg-color);
  font-family: inherit;
  outline: 0;
  text-decoration: none;
}

.input:focus {
  border: solid 2px var(--main-fg-color);
}

.input.invalid {
  border-color: var(--main-fg-error-color);
}
</style>
