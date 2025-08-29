<template>
  <div class="code-editor">
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
              :value="codeValue"
              @input="onCodeAreaInput"
              @scroll="onCodeAreaScroll"
              placeholder="; input code here"
              spellcheck="false"
              wrap="soft">
    </textarea>
  </div>
</template>

<script setup>
  import { useTemplateRef, ref, computed, onMounted } from 'vue';

  const codeLinesEl = useTemplateRef("code-lines");
  const codeAreaEl = useTemplateRef("code-input")

  const codeValue = ref("");

  const codeLineNumbers = computed(() => {
    return codeValue.value.split("\n").length
  });

  function onCodeAreaInput(event) {
    codeValue.value = event.target.value;
  }

  function onCodeAreaScroll(event) {
    console.log("scroll", event)
    codeLinesEl.value.scrollTop = codeAreaEl.value.scrollTop;
  }

  onMounted(() => {
    codeLinesEl.value.style.maxHeight = `${codeAreaEl.value.offsetHeight}px`;
  });
</script>

<style scoped>
.code-editor {
  display: flex;
  gap: 5px;
  height: 100%;
  font-size: 0.8rem;
  overflow-y: auto;
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
