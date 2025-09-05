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
                      ref="memory-view"
                      :programCounter="programCounter"
                      :loaded="memoryLoaded"
                      :errors="assemblyErrors" />
        </template>
        <template #bottom-panel>
          <div class="mem-window-bottom-panel">
            <Button @click="onGoTo" :active="resourcesLoaded">Go to</Button>
            <Input v-model="goToAddressStr" :valid="goToAddressValid"
                   @keyup.enter="onGoTo" />
          </div>
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
          <div v-if="resourcesLoaded">
            <RegisterView :emulator="cpu" :key="programCounter" />
          </div>
        </template>
      </Window>
      <Window class="status-window" header="Status">
        <template #main>
          <MessageView />
        </template>
      </Window>
    </div>
  </main>
</template>

<script setup>
  import { ref, useTemplateRef, onMounted } from 'vue';

  import Window from './components/Window.vue';
  import Button from './components/Button.vue';
  import CodeEditor from './components/CodeEditor.vue';
  import MemoryView from './components/MemoryView.vue';
  import RegisterView from './components/RegisterView.vue';
  import MessageView from "./components/MessageView.vue";
  import Input from "./components/Input.vue";

  import { Memory } from "./memory.js";
  import { Assembler, AssemblingError } from "./assembler.js";
  import { Emulator, EmulatorError } from "./emulator";
  import { intToHex, parseHex } from "./common";
  import logger from "@/logger"

  const memorySize = 2 ** 13;
  const mem = ref(Memory.createEmpty(memorySize));
  const asm = new Assembler(mem.value, __Z80ASM_FILE__, __SCRIPT_FILE__);
  const sourceCode = ref("");

  const cpu = new Emulator(mem.value, __Z80E_WASM_FILE__);
  const programCounter = ref(0);

  const resourcesLoaded = ref(false);
  const memoryLoaded = ref(false);
  const assembled = ref(false);
  const assemblyErrors = ref([]);

  const memoryView = useTemplateRef("memory-view");
  const registerView = useTemplateRef("register-view");

  const goToAddressStr = ref("0000");
  const goToAddressValid = ref(true);

  function onGoTo() {
    if (!resourcesLoaded.value) {
      return;
    }

    const value = parseHex(goToAddressStr.value);
    if (isNaN(value) || value >= memorySize) {
      goToAddressValid.value = false;
      return;
    }

    console.log("go to address", intToHex(value, 4));
    goToAddressValid.value = true;
    memoryView.value.goToAddress(value);
  }

  async function onAssemble() {
    memoryLoaded.value = false;
    assembled.value = false;
    assemblyErrors.value.length = 0;
    cpu.reset();
    programCounter.value = 0;
    logger.reset();
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
    console.log("logger.messages", logger.messages.value);
  }

  function step() {
    try {
      cpu.executeInstruction();
      programCounter.value = cpu.getRegister("pc");
      console.log("pc", programCounter.value);
    } catch (e) {
      if (e instanceof EmulatorError) {
        logger.message("ERROR", e.message);
      }
    }
  }

  function reset() {
    cpu.reset();
    programCounter.value = 0;
  }

  onMounted(async () => {
    await asm.init();
    memoryLoaded.value = true;

    await cpu.init();
    logger.reset();
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
    "cpu-window status-window"
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

.mem-window-bottom-panel {
  display: flex;
  gap: 0 10px;
}
</style>
