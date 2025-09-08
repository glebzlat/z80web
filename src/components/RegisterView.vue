<template>
  <div class="register-view">
    <div class="register-set">
      <div class="register-set-header">
        Main registers
      </div>
      <div class="register"
           v-for="[regName, regValue] in mainRegisterSet()"
           :key="regName">
        <div class="register-name">{{ regName }}:</div>
        <div class="register-value">{{ intToHex(regValue, 2) }}</div>
      </div>
    </div>
    <div class="register-set">
      <div class="register-set-header">
        Alt registers
      </div>
      <div class="register"
           v-for="[regName, regValue] in altRegisterSet()"
           :key="regName">
        <div class="register-name">{{ regName }}:</div>
        <div class="register-value">{{ intToHex(regValue, 2) }}</div>
      </div>
    </div>
    <div class="register-set">
      <div class="register-set-header">
        Special registers
      </div>
      <div class="register">
        <div class="register-name">i:</div>
        <div class="register-value">
          {{ intToHex(props.emulator.getRegister("i"), 2) }}
        </div>
      </div>
      <div class="register"
           v-for="[regName, regValue] in specialRegisters()"
           :key="regName">
        <div class="register-name">{{ regName }}:</div>
        <div class="register-value">{{ intToHex(regValue, 4) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { Emulator } from "@/emulator";

  import { intToHex } from "@/common";

  const props = defineProps({
    emulator: {
      type: Emulator,
      required: true
    }
  });

  const registerNamesSwitched = ["a", "b", "c", "d", "e", "h", "l", "f"];
  const registerNames16Bit = ["ix", "iy", "sp", "pc"];

  const mainRegisterSet = () => {
    const regs = new Map();
    props.emulator.accessMainRegisters((emu) => {
      for (let reg of registerNamesSwitched) {
        regs.set(reg, emu.getRegister(reg));
      }
    });
    return regs;
  };

  const altRegisterSet = () => {
    const regs = new Map();
    props.emulator.accessAltRegisters((emu) => {
      for (let reg of registerNamesSwitched) {
        regs.set(reg, emu.getRegister(reg));
      }
    })
    return regs;
  };

  const specialRegisters = () => {
    const regs = new Map();
    for (let reg of registerNames16Bit) {
      regs.set(reg, props.emulator.getRegister(reg));
    }
    return regs;
  };

</script>

<style scoped>
.register-view {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.register-set {
  min-width: 180px;
  font-size: 0.9rem;
}

.register-set-header {
  padding: 0 5px;
  text-align: center;
}

.register {
  display: flex;
  gap: 0 10px;
  border: solid 1px var(--main-fg-color);
  padding: 4px 20px;
  margin-top: 5px;
}

.register-value {
  flex-grow: 1;
  text-align: center;
}

</style>
