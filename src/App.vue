<template>
  <main class="main">
    <div class="wrapper">
      <div class="window code-window">
        <div class="window-header">
          <p class="window-header-text">Code</p>
        </div>
        <div class="window-contents">
          <CodeEditor />
        </div>
      </div>
      <div class="window mem-window">
        <div class="window-header">
          <p class="window-header-text">Memory</p>
        </div>
        <div class="window-contents">
          <MemoryView :memory="memoryContents" />
        </div>
      </div>
      <div class="window cpu-window">
        <div class="window-header">
          <p class="window-header-text">CPU</p>
        </div>
        <div class="window-contents"></div>
      </div>
    </div>
  </main>
</template>

<script setup>
  import { useTemplateRef, ref, computed, onMounted } from 'vue';
  import CodeEditor from './components/CodeEditor.vue';
  import MemoryView from './components/MemoryView.vue';

  /* Mock data */
  const memoryContents = [
    {fold: false, blocks: [{addr: 0x0000, bytes: [0x10, 0x20, 0x30]}]},
    {fold: true, blocks: [
      {addr: 0x0003, bytes: [0x10, 0x20, 0x30, 0x40]},
      {addr: 0x0007, bytes: [0x50, 0x60, 0x70, 0x80]},
      {addr: 0x000b, bytes: [0x90, 0xa0, 0xb0, 0xc0]}
    ]},
    {fold: false, blocks: [{addr: 0x000f, bytes: [0x2c]}]}
  ];

</script>

<style scoped>
.main {
  height: 100vh;
}

.wrapper {
  display: grid;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "code-window mem-window"
    "cpu-window cpu-window"
  ;
  height: 100%;
}

.window {
  display: flex;
  flex-direction: column;
  margin: 5px;
  border: solid 1px var(--main-fg-color);
}

.code-window {
  grid-area: code-window;
}

.mem-window {
  grid-area: mem-window;
}

.cpu-window {
  grid-area: cpu-window;
}

.window-header {
  padding: 2px 6px;
  background-color: var(--second-bg-color);
  user-select: none;
}

.window-contents {
  flex-grow: 1;
  padding: 2px 6px;
}
</style>
