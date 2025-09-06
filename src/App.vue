<template>
  <main class="main">
    <div class="wrapper">
      <Window class="code-window" header="Code">
        <template #main>
          <CodeEditor v-model="sourceCode" :highlightLine="highlightCodeLine" />
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
                      :lastWriteAddr="lastWriteAddr"
                      :loaded="memoryLoaded"
                      :errors="assemblyErrors" />
        </template>
        <template #bottom-panel>
          <div class="mem-window-bottom-panel">
            <Button @click="onGoTo" :active="resourcesLoaded">Go to</Button>
            <Input class="input"
                   v-model="goToAddressStr" :valid="goToAddressValid"
                   @keyup.enter="onGoTo"
                   @blur="onGoToInputLeave" />
          </div>
        </template>
      </Window>
      <Window class="cpu-window" header="CPU">
        <template #top-panel>
          <div class="cpu-top-panel">
            <Button @click="step" :active="assembled && allowExecution">
              Step
            </Button>
            <Button @click="run" :active="assembled && allowExecution">
              Run
            </Button>
            <Input class="input"
                   v-model="nInstructionsRun"
                   @keyup.enter="run"
                   :valid="runInputValid" />
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
  import { ref, useTemplateRef, onMounted, computed } from 'vue';

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
  import { intToHex, parseHex, sleep } from "./common";
  import logger from "@/logger"

  const memorySize = 2 ** 13;
  const mem = ref(Memory.createEmpty(memorySize));
  const asm = new Assembler(mem.value, __Z80ASM_FILE__, __SCRIPT_FILE__);
  const sourceCode = ref("");

  const cpu = new Emulator(mem.value, __Z80E_WASM_FILE__);
  const programCounter = ref(0);
  const lastWriteAddr = ref(null);
  const allowExecution = ref(true);

  const resourcesLoaded = ref(false);
  const memoryLoaded = ref(false);
  const assembled = ref(false);
  const assemblyErrors = ref([]);

  const memoryView = useTemplateRef("memory-view");
  const registerView = useTemplateRef("register-view");

  const goToAddressStr = ref("0000");
  const goToAddressValid = ref(true);

  const highlightCodeLine = ref(null);

  const nInstructionsRun = ref("16");
  const runInputValid = ref(true);

  const addrToLineNoMap = computed(() => {
    const map = new Map();
    for (const block of mem.value.blocks) {
      if (block.lineNo === null) {
        continue;
      }
      for (let addr = block.startAddr; addr < block.endAddr; ++addr) {
        map.set(addr, block.lineNo);
      }
    }
    return map;
  });

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

  function onGoToInputLeave() {
    if (goToAddressValid.value) {
      goToAddressStr.value = goToAddressStr.value.padStart(4, "0");
    }
  }

  async function onAssemble() {
    memoryLoaded.value = false;
    assembled.value = false;
    assemblyErrors.value.length = 0;
    reset();
    try {
      await asm.assemble(sourceCode.value);
      memoryLoaded.value = true;
      assembled.value = true;
    } catch (e) {
      if (e instanceof AssemblingError) {
        assemblyErrors.value.push(e);
        logger.message(
          "ERROR",
          "Assembling aborted:\n",
          e.message
        );
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
      highlightCodeLine.value = addrToLineNoMap.value.get(programCounter.value);
      lastWriteAddr.value = cpu.lastWriteAddr;
      allowExecution.value = !cpu.isHalted();
    } catch (e) {
      if (e instanceof EmulatorError) {
        allowExecution.value = false;
        logger.message("ERROR", e.message);
      }
    }
  }

  async function run() {
    const value = Number(nInstructionsRun.value);
    if (isNaN(value) || value == 0) {
      runInputValid.value = false;
      return;
    }

    runInputValid.value = true;
    for (let i = 0; i < value; ++i) {
      step();
      await sleep(200);
    }
  }

  function reset() {
    cpu.reset();
    allowExecution.value = true;
    programCounter.value = 0;
    highlightCodeLine.value = null;
    logger.reset();
  }

  function printHeader() {
    logger.message(null, "=== Z80 CPU Emulator ===");
  }

  onMounted(async () => {
    const startTimeMs = Date.now();

    await asm.init();
    memoryLoaded.value = true;

    await cpu.init();
    logger.reset();
    resourcesLoaded.value = true;

    printHeader();
    const elapsedTimeSec = (Date.now() - startTimeMs) / 1000;
    logger.message(
      null,
      `Resources loaded in ${elapsedTimeSec.toFixed(2)}s`
    );

    logger.freeze();
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

.input {
  font-size: 0.9rem;
}
</style>
