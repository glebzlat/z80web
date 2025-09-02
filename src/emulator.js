const Status = {
  STATUS_OK: 0,
  STATUS_ERROR_NO_REGISTER: 1
};

export class EmulatorError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};

export class Emulator {
  constructor(moduleFile) {
    this.moduleFile = moduleFile;
    this.bufferSize = 2 ** 4;
  }

  async init() {
    /* Dummy functions for now */
    const imports = {
      env: {
        memread_fn: () => {},
        memwrite_fn: () => {},
        ioread_fn: () => {},
        iowrite_fn: () => {}
      }
    };

    const module = await WebAssembly.compileStreaming(fetch(this.moduleFile));
    this.instance = await WebAssembly.instantiate(module, imports);

    this.bufferAddr = this.instance.exports.allocate(this.bufferSize);
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
      throw new EmulatorError(`no such register ${r}`)
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

  /** Put the string into the WebAssembly module's memory
   *
   * @param {string} s
   */
  putString(s) {
    console.assert(s.length < this.bufferSize - 1);

    const utf8Str = (new TextEncoder()).encode(s + "\0");
    const dest = new Uint8Array(this.instance.exports.memory.buffer, this.bufferAddr);
    dest.set(utf8Str);
    console.log(this.instance.exports.memory.buffer, this.bufferAddr);
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
