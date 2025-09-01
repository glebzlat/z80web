<template>
  <div class="code-editor">
    <div class="code-input">
      <div class="code-lines" ref="code-lines">
        <div class="code-line"
             v-for="lineNo of codeLineNumbers">
          {{ lineNo }}
        </div>
      </div>
      <textarea name="code-input"
                id="code-input"
                class="code-input"
                ref="code-input"
                :value="modelValue"
                @input="onCodeAreaInput"
                @scroll="onCodeAreaScroll"
                placeholder="; input code here"
                spellcheck="false"
                wrap="soft">
      </textarea>
    </div>
  </div>
</template>

<script setup>
  import { useTemplateRef, ref, computed, onMounted } from 'vue';

  const modelValue = defineModel({ type: String, default: "" });

  const codeLinesEl = useTemplateRef("code-lines");
  const codeAreaEl = useTemplateRef("code-input")

  const emit = defineEmits(["assemble"]);

  const codeLineNumbers = computed(() => {
    return modelValue.value.split("\n").length
  });

  function onCodeAreaInput(event) {
    modelValue.value = event.target.value;
  }

  function onCodeAreaScroll() {
    codeLinesEl.value.scrollTop = codeAreaEl.value.scrollTop;
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

.code-input {
  flex-grow: 1;
  display: flex;
  overflow-y: auto;
  gap: 5px;
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
  white-space: nowrap;
  overflow-x: auto;
  background-color: transparent;
  color: var(--main-fg-color);
  border: none;
  outline: none;
  font-size: 0.9rem;
}
</style>
