<template>
  <main class="main">
    <div class="wrapper">
      <Window class="code-window" header="Code">
        <template #main>
          <CodeEditor v-model="sourceCode" :highlightLine="highlightCodeLine"
                      :errorLines="errorCodeLines"
                      :readonly="emulationStarted" />
        </template>
        <template #bottom-panel>
          <div class="button-wrapper">
            <Button @click="onAssemble" :active="resourcesLoaded">
              Assemble
            </Button>
            <Button @click="onStartStop" :active="assembled">
              {{ startStopTitle }}
            </Button>
          </div>
        </template>
      </Window>
      <Window class="mem-window" header="Mem">
        <template #main>
          <MemoryView :memory="mem"
                      ref="memory-view"
                      :programCounter="programCounter"
                      :lastWriteAddr="lastWriteAddr"
                      :loaded="memoryLoaded" />
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
            <Button @click="step" :active="emulationStarted">
              Step
            </Button>
            <Button @click="run" :active="emulationStarted">
              Run
            </Button>
            <Input class="input"
                   v-model="nInstructionsRun"
                   @keyup.enter="run"
                   :valid="runInputValid" />
            <Button @click="reset" :active="emulationStarted">
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
  import { ref, useTemplateRef, onMounted, computed, watch} from 'vue';

  import Window from '@/components/Window.vue';
  import Button from '@/components/Button.vue';
  import CodeEditor from '@/components/CodeEditor.vue';
  import MemoryView from '@/components/MemoryView.vue';
  import RegisterView from '@/components/RegisterView.vue';
  import MessageView from "@/components/MessageView.vue";
  import Input from "@/components/Input.vue";

  import { Memory } from "@/memory";
  import { Assembler, AssemblingError } from "@/assembler";
  import { Emulator, EmulatorError } from "@/emulator";
  import { intToHex, parseHex, sleep } from "@/common";
  import logger from "@/logger";

  const memorySize = 2 ** 13;
  const mem = ref(Memory.createEmpty(memorySize));
  const asm = new Assembler(mem.value);
  const sourceCode = ref("");

  const cpu = new Emulator(mem.value);
  const programCounter = ref(0);
  const lastWriteAddr = ref(null);

  const resourcesLoaded = ref(false);
  const memoryLoaded = ref(false);
  const assembled = ref(false);
  const emulationStarted = ref(false);
  const assemblyErrors = ref([]);

  const memoryView = useTemplateRef("memory-view");

  const goToAddressStr = ref("0000");
  const goToAddressValid = ref(true);

  const highlightCodeLine = ref(null);
  const errorCodeLines = ref(new Set());

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

  const startStopTitle = computed(() => {
    if (emulationStarted.value) {
      return "Stop";
    } else {
      return "Start";
    }
  })

  function onStartStop() {
    if (!emulationStarted.value && assembled.value) {
      emulationStarted.value = true;
    } else {
      emulationStarted.value = false;
    }
  }

  watch(emulationStarted, (newValue) => {
    if (newValue) {
      reset();
      highlightCodeLine.value = 1;
      logger.message("EMU", "Emulation started");
    } else {
      highlightCodeLine.value = null;
      logger.message("EMU", "Emulation stopped");
    }
  })

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
    goToAddressStr.value = goToAddressStr.value.padStart(4, "0");
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
      assembled.value = true;
      errorCodeLines.value.clear();
    } catch (e) {
      if (e instanceof AssemblingError) {
        assemblyErrors.value.push(e);
        logger.message(
          "ERROR",
          "Assembling aborted:\n",
          formatExceptions(e)
        );
        setErrorLines(e);
      } else {
        throw e;
      }
    }
    memoryLoaded.value = true;
    console.log("logger.messages", logger.messages.value);
  }

  /**
   * @param {AssemblingError} e
   * @returns {string}
   */
  function formatExceptions(e) {
    const strings = [];
    for (let exc of e.exceptions) {
      strings.push(exc.message);
    }
    return strings.join("\n");
  }

  /**
   * @param {AssemblingError} e
   */
  function setErrorLines(e) {
    for (let exc of e.exceptions) {
      errorCodeLines.value.add(exc.line);
    }
  }

  function step() {
    try {
      cpu.executeInstruction();
      programCounter.value = cpu.getRegister("pc");
      highlightCodeLine.value = addrToLineNoMap.value.get(programCounter.value);
      lastWriteAddr.value = cpu.lastWriteAddr;
      emulationStarted.value = !cpu.isHalted();
    } catch (e) {
      if (e instanceof EmulatorError) {
        emulationStarted.value = false;
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
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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

.button-wrapper {
  display: flex;
  gap: 0 10px;
}
</style>
