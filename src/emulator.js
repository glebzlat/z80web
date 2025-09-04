import { intToHex } from "@/common";

const Status = {
  STATUS_OK: 0,
  STATUS_ERROR_NO_REGISTER: 1,
  STATUS_ERROR_DAA_INVALID_VALUE: -1,
  STATUS_ERROR_INVALID_OPCODE: -2,
};

export class EmulatorError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class Emulator {
  /** Create an Emulator instance
   *
   * @param {Memory} mem
   * @param {string} moduleFile
   */
  constructor(mem, moduleFile) {
    this.mem = mem;
    this.moduleFile = moduleFile;
    this.bufferSize = 2 ** 4;
    this.changedAddresses = new Set();
  }

  async init() {
    const imports = {
      env: {
        memread_fn: this.memread.bind(this),
        memwrite_fn: this.memwrite.bind(this),
        ioread_fn: () => this.ioread.bind(this),
        iowrite_fn: () => this.iowrite.bind(this),
      },
    };

    const file = await fetch(this.moduleFile).then(async (resp) => await resp.arrayBuffer());
    const module = await WebAssembly.compile(file);
    this.instance = await WebAssembly.instantiate(module, imports);

    this.bufferAddr = this.instance.exports.allocate(this.bufferSize);
    this.instance.exports.init();
  }

  memread(addr, _) {
    const val = this.mem.buf[addr];
    console.log(`read at ${intToHex(addr, 4)}: ${intToHex(val, 2)}`);
    return val;
  }

  memwrite(addr, b, _) {
    console.log(`write at ${intToHex(addr, 4)}: ${intToHex(b, 2)}`);
    this.mem.buf[addr] = b;
    this.changedAddresses.add(addr);
  }

  ioread(port, b, _) {
    console.log(`IO read at port ${intToHex(port, 4)}`);
    return 0;
  }

  iowrite(port, b, _) {
    console.log(`IO write at port ${intToHex(port, 4)}`);
  }
  /** Switch to main register set and call the given function
   *
   * @param {(e: Emulator) => void} fn
   */
  accessMainRegisters(fn) {
    const tmp = this.registerSet;
    this.registerSet = RegisterSet.MAIN;
    fn(this);
    this.registerSet = tmp;
  }

  hex(n, len) {
    return n.toString(16).padStart(len, "0");
  }

  /** Get the value of the register
   *
   * @param {string} r
   * @returns {number}
   */
  getRegister(r) {
    this.putString(r);

    let res = this.getRegister8();
    if (this.getStatus() == Status.STATUS_OK) {
      return res;
    }

    res = this.getRegister16();
    if (this.getStatus() == Status.STATUS_ERROR_NO_REGISTER) {
      throw new EmulatorError(`no such register ${r}`);
    }

    return res;
  }

  /** Set the value of the register
   *
   * @param {string} r
   * @param {number} v
   */
  setRegister(r, v) {
    this.putString(r);

    this.setRegister8(v);
    if (this.getStatus() == Status.STATUS_OK) {
      return;
    }

    this.setRegister16(v);
    if (this.getStatus() == Status.STATUS_ERROR_NO_REGISTER) {
      throw new EmulatorError(`no such register ${r}`);
    }
  }

  /** Execute one instruction
   *
   * @throws {EmulatorError}
   */
  executeInstruction() {
    this.instance.exports.execute_instruction();
    switch (this.getStatus()) {
      case Status.STATUS_ERROR_DAA_INVALID_VALUE:
        throw this.createError("invalid DAA value");
      case Status.STATUS_ERROR_INVALID_OPCODE:
        throw this.createError("invalid opcode");
    }
  }

  /** Reset the CPU and set zeros to changed memory cells */
  reset() {
    this.instance.exports.reset();

    for (let addr of this.changedAddresses.values()) {
      this.mem.buf[addr] = 0;
    }

    this.changedAddresses.clear();
  }

  createError(message) {
    const pc = this.getRegister("pc");
    return new EmulatorError(`At ${pc.toString(16)}: ${message}`);
  }

  /** Put the string into the WebAssembly module's memory
   *
   * @param {string} s
   */
  putString(s) {
    console.assert(s.length < this.bufferSize - 1);

    const utf8Str = new TextEncoder().encode(s + "\0");
    const dest = new Uint8Array(this.instance.exports.memory.buffer, this.bufferAddr);
    dest.set(utf8Str);
  }

  getRegister8() {
    return this.instance.exports.get_register8(this.bufferAddr);
  }

  getRegister16() {
    return this.instance.exports.get_register16(this.bufferAddr);
  }

  setRegister8(v) {
    this.instance.exports.set_register8(this.bufferAddr, v);
  }

  setRegister16(v) {
    this.instance.exports.set_register16(this.bufferAddr, v);
  }

  /** Get the status of the CPU
   *
   * @returns {number}
   */
  getStatus() {
    return this.instance.exports.get_status();
  }
}
