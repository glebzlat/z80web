import { Memory } from "./memory";

class StdinHandler {
  /** Create an StdinHandler object
   *
   * @param {Array<string>} lines
   */
  constructor(lines) {
    this.lines = lines;
    this.idx = 0;
  }

  stdin() {
    return this.lines[this.idx++];
  }
}

export class AssemblingError extends Error {
  /** Create an AssemblingError object
   *
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class Assembler {
  /** Create an Assembler object
   *
   * @param {Memory} mem
   * @param {string} z80asmFile
   * @param {string} scriptFile
   */
  constructor(mem, z80asmFile, scriptFile) {
    this.mem = mem;
    this.z80asmFile = z80asmFile;
    this.scriptFile = scriptFile;
    this.programLength = 2 ** 16;
  }

  async init() {
    const { loadPyodide } = await import("pyodide");

    this.pyodide = await loadPyodide();

    await this.pyodide.runPythonAsync(`
      from pyodide.http import pyfetch

      response = await pyfetch("${this.z80asmFile}")
      with open("z80asm.py", "wb") as fout:
          fout.write(await response.bytes())

      response = await pyfetch("${this.scriptFile}")
      with open("script.py", "wb") as fout:
          fout.write(await response.bytes())
    `);
  }

  /** Assemble the code and return a 64K memory space
   *
   * @param {string} sourceCode
   * @throws {AssemblingError}
   */
  async assemble(sourceCode) {
    this.mem.clear();
    await this.getProgram(sourceCode);
    this.mem.addBlockToSize();
  }

  /** Assemble the code and yield encoded blocks
   *
   * @param {string} sourceCode
   * @throws {AssemblingError}
   */
  async getProgram(sourceCode) {
    this.pyodide.setStdin(new StdinHandler(sourceCode.split("\n")));

    const readLines = new Array();
    this.pyodide.setStdout({ batched: (line) => readLines.push(line) });

    try {
      await this.pyodide.runPythonAsync(`
        from script import assemble

        assemble()
      `);
    } catch (e) {
      if (e instanceof this.pyodide.ffi.PythonError && e.type == "Z80Error") {
        throw new AssemblingError(await this.getLastExceptionString());
      }
      throw e;
    }

    for (const line of readLines) {
      const block = JSON.parse(line);
      const [lineNo, lineStr, endAddr, bytes] = block;
      this.mem.addBlock(lineNo, lineStr, endAddr, bytes);
    }
  }

  async getLastExceptionString() {
    const str = this.pyodide.runPythonAsync(`
      import sys

      str(sys.last_exc)
    `);

    if (str) {
      return str;
    }

    return "";
  }
}
