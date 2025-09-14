<template>
  <div class="code-editor">
    <div class="code-input">
      <div class="code-lines" ref="code-lines">
        <div class="code-line"
             v-for="lineNo in nLines">
          {{ lineNo }}
        </div>
      </div>
      <div class="input-wrapper">
        <textarea name="code-input"
                  id="code-input"
                  class="code-input"
                  ref="code-input"
                  :value="modelValue"
                  @input="onCodeAreaInput"
                  @scroll="onCodeAreaScroll"
                  placeholder="; input code here"
                  spellcheck="false"
                  :readonly="props.readonly"
                  wrap="soft">
        </textarea>
        <div class="background-lines" ref="background-lines">
          <div class="background-line" v-for="i in nLines"
               :class="{ 'highlight': i == props.highlightLine,
                         'highlight-error': props.errorLines.has(i) }">
            &nbsp
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useTemplateRef, ref, computed, onMounted } from 'vue';

  const modelValue = defineModel({ type: String, default: "" });

  const props = defineProps({
    highlightLine: {
      type: Number,
    },
    errorLines: {
      type: Set,
      default: new Set()
    },
    readonly: {
      type: Boolean,
      default: false
    }
  });

  const codeLinesEl = useTemplateRef("code-lines");
  const codeAreaEl = useTemplateRef("code-input")
  const backgroundEl = useTemplateRef("background-lines");

  const emit = defineEmits(["assemble"]);

  const nLines = computed(() => {
    return modelValue.value.split("\n").length;
  });

  function onCodeAreaInput(event) {
    modelValue.value = event.target.value;
  }

  function onCodeAreaScroll() {
    codeLinesEl.value.scrollTop = codeAreaEl.value.scrollTop;
    backgroundEl.value.scrollTop = codeAreaEl.value.scrollTop;
  }

  function codeAreaKeydownEventListener(ev) {
    const tabStr = "    ";
    if (ev.key == "Tab") {
      ev.preventDefault();
      const start = this.selectionStart, end = this.selectionEnd;
      this.value = this.value.substring(0, start) + tabStr +
        this.value.substring(end)
      this.selectionStart = this.selectionEnd = start + tabStr.length;
    }
  }

  onMounted(() => {
    codeLinesEl.value.style.maxHeight = `${codeAreaEl.value.offsetHeight}px`;
    codeAreaEl.value.addEventListener("keydown", codeAreaKeydownEventListener);
  });
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 0.8rem;
}

.input-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.code-input {
  position: relative;
  z-index: 1;
  flex-grow: 1;
  display: flex;
  overflow-y: auto;
  gap: 5px;
  margin: 0;
  border-radius: 0;
}

.background-lines {
  position: absolute;
  z-index: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  user-select: none;
  overflow: auto;
}

.background-line {
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: var(--main-bg-color);
}

.background-line.highlight {
  background-color: var(--second-bg-color);
}

.background-line.highlight-error {
  background-color: var(--bg-error-color);
}

.code-lines {
  border-right: solid 1px var(--second-bg-color);
  overflow: hidden;
  user-select: none;
}

.code-line {
  padding: 0 10px 0 5px;
}

.code-input {
  height: 100%;
  width: 100%;
  resize: none;
  white-space: preserve nowrap;
  overflow-x: auto;
  background-color: transparent;
  color: var(--main-fg-color);
  border: none;
  outline: none;
  font-size: 0.9rem;
}
</style>
