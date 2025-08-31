<template>
  <div class="memory-contents">
    <div v-if="props.loaded">
      <div class="memory-block"
           v-for="line in props.memory">
        <div class="memory-row">
          <span class="memory-addr">{{ intToHex(line.rows[0].addr, 4) }}</span>
          <span class="memory-cell" v-for="byte in line.rows[0].bytes">
            {{ intToHex(byte, 2) }}
          </span>
        </div>
        <div class="memory-row" v-for="row in line.rows.slice(1)">
          <span class="memory-addr">{{ intToHex(row.addr, 4) }}</span>
          <span class="memory-cell" v-for="byte in row.bytes">
            {{ intToHex(byte, 2) }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="memory-loading">
      <p class="memory-loading-message">Loading...</p>
    </div>
  </div>
</template>

<script setup>
  const props = defineProps({
    memory: {
      type: Array,
      required: true
    },
    loaded: {
      type: Boolean,
      default: true
    }
  });

  function intToHex(i, length) {
    const str = i.toString(16);
    return str.padStart(length, "0");
  }

</script>

<style scoped>
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

.memory-addr {
  padding: 0 10px;
}

.memory-row-fold {
  background-color: var(--second-bg-color);
  cursor: pointer;
}

.memory-cell {
  padding: 0 5px;
}

.memory-addr + .memory-cell {
  border-left: solid 1px var(--second-bg-color);
  padding-left: 10px;
}

.memory-row-fold .memory-addr + .memory-cell {
  border-left: solid 1px #000;
}
</style>
