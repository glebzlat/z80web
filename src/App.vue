<template>
  <main class="main">
    <div class="wrapper">
      <Window class="code-window" header="Code">
        <template #main>
          <CodeEditor v-model="sourceCode" />
        </template>
        <template #bottom-panel>
          <Button @click="onAssemble" :active="resourcesLoaded">
            Assemble
          </Button>
        </template>
      </Window>
      <Window class="mem-window" header="Mem">
        <template #main>
          <MemoryView :memory="mem"
                      :programCounter="programCounter"
                      :loaded="memoryLoaded"
                      :errors="assemblyErrors" />
        </template>
      </Window>
      <Window class="cpu-window" header="CPU">
        <template #top-panel>
          <div class="cpu-top-panel">
            <Button @click="step" :active="assembled">
              Step
            </Button>
            <Button @click="reset" :active="assembled">
              Reset
            </Button>
          </div>
        </template>
        <template #main>
          <div v-if="resourcesLoaded">{{ cpu.getRegister("a") }}</div>
        </template>
      </Window>
    </div>
  </main>
</template>

<script setup>
  import { ref, onMounted } from 'vue';

  import Window from './components/Window.vue';
  import Button from './components/Button.vue';
  import CodeEditor from './components/CodeEditor.vue';
  import MemoryView from './components/MemoryView.vue';

  import { Memory } from "./memory.js";
  import { Assembler, AssemblingError } from "./assembler.js";
  import { Emulator } from "./emulator";

  const mem = ref(Memory.createEmpty(2 ** 13));
  const asm = new Assembler(mem.value, __Z80ASM_FILE__, __SCRIPT_FILE__);
  const sourceCode = ref("");

  const cpu = new Emulator(mem.value, __Z80E_WASM_FILE__);
  const programCounter = ref(0);

  const resourcesLoaded = ref(false);
  const memoryLoaded = ref(false);
  const assembled = ref(false);
  const assemblyErrors = ref([]);

  async function onAssemble() {
    memoryLoaded.value = false;
    assembled.value = false;
    assemblyErrors.value.length = 0;
    try {
      await asm.assemble(sourceCode.value);
      memoryLoaded.value = true;
      assembled.value = true;
    } catch (e) {
      if (e instanceof AssemblingError) {
        assemblyErrors.value.push(e);
        console.log("Caught AssemblingError:", e.message);
      } else {
        throw e;
      }
    }
  }

  function step() {
    cpu.executeInstruction();
    programCounter.value = cpu.getRegister("pc");
    console.log("pc", programCounter.value);
  }

  function reset() {
    cpu.reset();
    programCounter.value = 0;
  }

  onMounted(async () => {
    await asm.init();
    memoryLoaded.value = true;

    await cpu.init();
    resourcesLoaded.value = true;
  });
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
.code-window {
  grid-area: code-window;
}

.mem-window {
  grid-area: mem-window;
}

.cpu-window {
  grid-area: cpu-window;
}

.cpu-top-panel {
  display: flex;
  gap: 0 10px;
}
</style>
