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

export class EncodedBlock {
  /** Create an EncodedBlock object
   *
   * @param {number} lineNo
   * @param {str} line
   * @param {number} addr
   * @param {Array<number>} bytes
   */
  constructor(lineNo, line, addr, bytes) {
    this.lineNo = lineNo;
    this.line = line;
    this.addr = addr;
    this.bytes = bytes;
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
   * @param {string} z80asmFile
   * @param {string} scriptFile
   */
  constructor(z80asmFile, scriptFile) {
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
   * @returns {Promise<Array<EncodedBlock>>}
   * @throws {AssemblingError}
   */
  async assemble(sourceCode) {
    const program = await Array.fromAsync(this.getProgram(sourceCode));

    if (!program.length) {
      return this.getBlank();
    }

    const lastEl = program[program.length - 1];
    const filler = Array(this.programLength - lastEl.addr).fill(0x00);
    program.push(new EncodedBlock(null, null, lastEl.addr, filler));

    console.log(program);
    return program;
  }

  /** Create an empty memory space
   *
   * @returns {Array<EncodedBlock>}
   */
  getBlank() {
    const arr = Array(this.programLength).fill(0x00);
    return [new EncodedBlock(null, null, 0, arr)];
  }

  /** Assemble the code and yield encoded blocks
   *
   * @param {string} sourceCode
   * @yields {EncodedBlock}
   * @throws {AssemblingError}
   */
  async *getProgram(sourceCode) {
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
      const [lineNo, lineStr, addr, bytes] = block;
      yield new EncodedBlock(lineNo, lineStr, addr, bytes);
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
