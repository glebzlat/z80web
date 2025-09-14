import logger from "@/logger";
import { Memory } from "@/memory";
import AssemblerWorker from "@/assemblerWorker?worker";

/**
 * @typedef {{message: string, line: number, column: number}} ExceptionInfo
 */

export class AssemblingError extends Error {
  /** Create an AssemblingError object
   *
   * @param {Array<ExceptionInfo>} exceptions
   */
  constructor(exceptions) {
    super("Assembling error");
    this.exceptions = exceptions;
    this.name = this.constructor.name;
  }
}

export class Assembler {
  /** Create an Assembler object
   *
   * @param {Memory} mem
   */
  constructor(mem) {
    this.mem = mem;
  }

  async init() {
    this.worker = new AssemblerWorker();

    const promise = new Promise((resolve, reject) => {
      this.worker.onmessage = (e) => {
        const { message } = e.data;
        switch (message) {
          case "inited":
            resolve();
            break;
          default:
            reject();
            break;
        }
      };

      this.worker.postMessage({ message: "init" });
    });

    await promise;
  }

  /** Assemble the code and return a 64K memory space
   *
   * @param {string} sourceCode
   * @throws {AssemblingError}
   */
  async assemble(sourceCode) {
    this.mem.clear();

    const promise = new Promise((resolve, reject) => {
      this.worker.onmessage = (e) => {
        const { message, data } = e.data;
        switch (message) {
          case "block":
            const [lineNo, lineStr, endAddr, bytes] = data;
            this.mem.addBlock(lineNo, lineStr, endAddr, bytes);
            break;
          case "assembled":
            resolve();
            break;
          case "error":
            reject(new AssemblingError(data));
            break;
          default:
            reject();
            break;
        }
      };

      this.worker.postMessage({
        message: "assemble",
        sourceCode: sourceCode,
      });
    });

    await promise;

    const bytesEmitted = this.mem.bufPtr;
    const occupiedMemPercent = Math.round(100 * (bytesEmitted / this.mem.size));
    logger.message(
      "ASM",
      `Produced ${bytesEmitted} bytes of ${this.mem.size} (${occupiedMemPercent}%)`,
    );

    this.mem.addBlockToSize();
  }
}
