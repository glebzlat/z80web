export class MemoryBlock {
  /** Create an annotated memory block
   *
   * @param {number?} lineNo
   * @param {str} line
   * @param {number} startAddr
   * @param {number} endAddr
   * @param {number} bufStart
   * @param {number} bufEnd
   * @param {Memory} mem
   */
  constructor(lineNo, line, startAddr, endAddr, bufStart, bufEnd, mem) {
    this.lineNo = lineNo;
    this.line = line;
    this.startAddr = startAddr;
    this.endAddr = endAddr;
    this.bufStart = bufStart;
    this.bufEnd = bufEnd;
    this.mem = mem;
    this.bytes = this.mem.buf.subarray(this.bufStart, this.bufEnd);
  }

  get addr() {
    return this.startAddr;
  }
}

export class MemoryError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class Memory {

  /** Create a memory manager
   *
   * @param {number} size Memory buffer size
   */
  constructor(size) {
    this.size = size;
    this.buf = new Uint8Array(this.size);
    this.blocks = [];
    this.bufPtr = 0;
  }

  /** Create empty Memory
   *
   * @param {number} size Memory buffer size
   * @returns {Memory}
   */
  static createEmpty(size) {
    const mem = new Memory(size);
    const block = new MemoryBlock(null, "", 0, mem.size, 0, mem.size, mem);
    mem.blocks.push(block);
    mem.bufPtr = mem.size;
    return mem;
  }

  /** Add an annotated memory block
   *
   * @param {number} lineNo
   * @param {string} lineStr
   * @param {number} startAddr
   * @param {number} endAddr
   * @param {Array<number>} bytes
   */
  addBlock(lineNo, lineStr, endAddr, bytes) {
    const bufEndPtr = this.bufPtr + bytes.length;
    if (bufEndPtr > this.size) {
      throw new MemoryError(`the length of the buffer exceeds memory limit: ${bufEndPtr} > ${this.size}`);
    }

    const block = new MemoryBlock(lineNo, lineStr, this.bufPtr, endAddr, this.bufPtr, bufEndPtr, this);
    this.blocks.push(block);

    for (let i = this.bufPtr; i < bufEndPtr; ++i) {
      this.buf[i] = bytes[i - this.bufPtr];
    }

    this.bufPtr = bufEndPtr;
  }

  addBlockToSize() {
    if (this.size - this.bufPtr) {
      this.addBlock(null, null, this.size, new Array(this.size - this.bufPtr));
    }
  }

  clear() {
    this.buf.fill(0x00);
    this.bufPtr = 0;
    this.blocks.length = 0;
  }
}
