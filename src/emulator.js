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
  }

  async init() {
    const imports = {
      env: {
        memread_fn: (addr, _) => this.mem.buf[addr],
        memwrite_fn: (addr, b, _) => (this.mem.buf[addr] = b),
        ioread_fn: () => {},
        iowrite_fn: () => {},
      },
    };

    const file = await fetch(this.moduleFile).then(async (resp) => await resp.arrayBuffer());
    const module = await WebAssembly.compile(file);
    this.instance = await WebAssembly.instantiate(module, imports);

    this.bufferAddr = this.instance.exports.allocate(this.bufferSize);
    this.instance.exports.init();
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

  executeInstruction() {
    this.instance.exports.execute_instruction();
    switch (this.getStatus()) {
      case Status.STATUS_ERROR_DAA_INVALID_VALUE:
        throw this.createError("invalid DAA value");
      case Status.STATUS_ERROR_INVALID_OPCODE:
        throw this.createError("invalid opcode");
    }
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
