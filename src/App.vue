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
          <MemoryView :memory="memoryContents" :loaded="memoryLoaded"
                      :errors="assemblyErrors" />
        </template>
      </Window>
      <Window class="cpu-window" header="CPU">
        <template #main>
          <div>Nothing yet</div>
        </template>
      </Window>
    </div>
  </main>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue';

  import Window from './components/Window.vue';
  import Button from './components/Button.vue';
  import CodeEditor from './components/CodeEditor.vue';
  import MemoryView from './components/MemoryView.vue';

  import { Memory } from "./memory.js";
  import { Assembler, AssemblingError } from "./assembler.js";
  import { Emulator } from "./emulator";

  const mem = ref(Memory.createEmpty(2 ** 12));
  const asm = new Assembler(mem.value, __Z80ASM_FILE__, __SCRIPT_FILE__);
  const sourceCode = ref("");

  const cpu = new Emulator(__Z80E_WASM_FILE__);

  const resourcesLoaded = ref(false);
  const memoryLoaded = ref(false);
  const assemblyErrors = ref([]);

  const memoryContents = computed(() => {
    const blocks = [];

    if (!mem.value) {
      return blocks;
    }

    let address = 0;
    for (let block of mem.value.blocks) {
      if (block.bytes === null) {
        continue;
      }

      const rows = [], bytes = [];
      let prevAddress = address;

      for (let b of block.bytes) {
        bytes.push(b);
        ++address;
        if (bytes.length == 4) {
          rows.push({ addr: prevAddress, bytes: [...bytes] });
          prevAddress = address;
          bytes.length = 0;
        }
      }

      if (bytes.length) {
        rows.push({ addr: prevAddress, bytes });
      }

      if (!rows.length) {
        /* It's a crutch. There must be no empty rows. */
        continue;
      }

      blocks.push({
        line: block.line,
        lineNo: block.lineNo,
        rows: rows
      });
    }

    console.log("blocks", blocks);
    return blocks;
  });

  async function onAssemble() {
    memoryLoaded.value = false;
    assemblyErrors.value.length = 0;
    try {
      await asm.assemble(sourceCode.value);
      memoryLoaded.value = true;
    } catch (e) {
      if (e instanceof AssemblingError) {
        assemblyErrors.value.push(e);
        console.log("Caught AssemblingError:", e.message);
      } else {
        throw e;
      }
    }
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
</style>
