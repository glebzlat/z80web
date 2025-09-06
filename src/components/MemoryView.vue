<template>
  <div class="memory-contents">
    <div v-if="props.errors && props.errors.length" class="error-display">
      <p class="error-message">
        Program cannot be assembled due to following errors:
      </p>
      <div v-for="error in props.errors" class="error-message">
        <pre>{{ error.message }}</pre>
      </div>
    </div>
    <div v-else-if="props.loaded">
      <div class="memory-row" v-for="row, idx in memoryRows" ref="memory-row">
        <span class="memory-addr">
          {{ intToHex(idx * totalBytesInARow, 4) }}
        </span>
        <span class="memory-cell" v-for="byte, byteIdx of row"
              key="byteIdx" ref="memory-cell"
              :class="{ 'memory-cell-current': isCurrentCell(idx, byteIdx) }">
          {{ intToHex(byte, 2) }}
        </span>
      </div>
    </div>
    <div v-else class="memory-loading">
      <p class="memory-loading-message">Loading...</p>
    </div>
  </div>
</template>

<script setup>
  import { computed, useTemplateRef, watch } from "vue";

  import { Memory } from "@/memory";

  import { intToHex } from "@/common.js";

  const props = defineProps({
    memory: {
      type: Memory,
      required: true
    },
    loaded: {
      type: Boolean,
      default: true
    },
    errors: {
      type: Array
    },
    programCounter: {
      type: Number,
      required: true
    },
    lastWriteAddr: {
      type: Number
    }
  });

  const totalBytesInARow = 4;

  const memoryRows = computed(() => {
    const rows = [];

    let i = 0, j = 0;
    for (; i < props.memory.buf.length; ++i) {
      if (i != 0 && i % totalBytesInARow == 0) {
        rows.push(props.memory.buf.subarray(j, i));
        j = i;
      }
    }

    rows.push(props.memory.buf.subarray(j, i));

    return rows;
  })

  function isCurrentCell(rowIdx, byteIdx) {
    return props.programCounter == rowIdx * totalBytesInARow + byteIdx;
  }

  const memoryRowElements = useTemplateRef("memory-row");
  const memoryCellElements = useTemplateRef("memory-cell");

  function goToAddress(addr) {
    if (addr === undefined) {
      return;
    }

    const rowIdx = Math.floor(addr / totalBytesInARow);
    const row = memoryRowElements.value[rowIdx];
    row.scrollIntoView({ block: "center" });

    row.classList.add("highlighted");
    setTimeout(() => row.classList.remove("highlighted"), 1000);
  }

  defineExpose({ goToAddress });

  watch(() => props.lastWriteAddr, (addr) => {
    if (addr === undefined || addr === null) {
      return;
    }
    const el = memoryCellElements.value[addr];
    if (el === undefined) {
      return;
    }
    el.classList.add("highlight-altered");
    setTimeout(() => el.classList.remove("highlight-altered"), 1000);
  });
</script>

<style scoped>
.error-message + .error-message {
  margin-top: 5px;
  margin-left: 15px;
}

.memory-contents {
  font-size: 0.9rem;
  height: 100%;
}

.memory-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1rem;
  height: 100%;
}

.memory-row.highlighted {
  background-color: var(--second-bg-color);
}

.memory-addr {
  padding: 0 10px;
  border-right: solid 1px var(--second-bg-color);
}

.memory-cell {
  padding: 0 5px;
}

.memory-cell.highlight-altered {
  background-color: var(--second-bg-color);
}

.memory-cell-current {
  background-color: var(--main-fg-color);
  color: var(--main-bg-color);
}

.memory-addr + .memory-cell {
  margin-left: 5px;
}

.memory-row-fold .memory-addr + .memory-cell {
  border-left: solid 1px #000;
}
</style>
