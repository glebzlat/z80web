<template>
  <div class="memory-contents">
    <div class="memory-block"
         v-for="(line, index) in props.memory">
      <div class="memory-row"
           :class="{'memory-row-fold': line.fold == true}"
           @click="onMemoryRowClick(index)">
        <span class="memory-addr">{{ intToHex(line.blocks[0].addr, 4) }}</span>
        <span class="memory-cell" v-for="byte in line.blocks[0].bytes">
          {{ intToHex(byte, 2) }}
        </span>
      </div>
      <div v-if="isUnfolded(index)">
        <div class="memory-row" v-for="block in line.blocks.slice(1)">
          <span class="memory-addr">{{ intToHex(block.addr, 4) }}</span>
          <span class="memory-cell memory-cell-folded" v-for="byte in block.bytes">
            {{ intToHex(byte, 2) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from "vue";

  const props = defineProps({
    memory: {
      required: true
    }
  });

  const unfoldedSet = ref(new Set());

  function intToHex(i, length) {
    const str = i.toString(16);
    return str.padStart(length, "0");
  }

  function onMemoryRowClick(index) {
    if (unfoldedSet.value.has(index)) {
      unfoldedSet.value.delete(index);
    } else {
      unfoldedSet.value.add(index);
    }
  }

  function isUnfolded(index) {
    return unfoldedSet.value.has(index);
  }
</script>

<style scoped>
.memory-contents {
  font-size: 0.9rem;
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

.memory-addr + .memory-cell-folded {
  border-left: dotted 1px var(--second-bg-color);
}

.memory-row-fold .memory-addr + .memory-cell {
  border-left: solid 1px #000;
}
</style>
