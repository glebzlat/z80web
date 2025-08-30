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
   * @param {Array<int]} bytes
   */
  constructor(lineNo, line, bytes) {
    this.lineNo = lineNo;
    this.line = line;
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
   * @param {string} z80asm_file
   * @param {string} script_file
   */
  constructor(z80asm_file, script_file) {
    this.z80asm_file = z80asm_file;
    this.script_file = script_file;
  }

  async init() {
    const { loadPyodide } = await import("pyodide");

    this.pyodide = await loadPyodide();

    await this.pyodide.runPythonAsync(`
      from pyodide.http import pyfetch

      response = await pyfetch("${this.z80asm_file}")
      with open("z80asm.py", "wb") as fout:
          fout.write(await response.bytes())

      response = await pyfetch("${this.script_file}")
      with open("script.py", "wb") as fout:
          fout.write(await response.bytes())
    `);
  }

  /** Assemble the code
   *
   * @param {string} sourceCode
   * @yields {EncodedBlock}
   * @throws {AssemblingError}
   */
  async* assemble(sourceCode) {
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
        throw new AssemblingError(await this.getLastExceptionString())
      }
      throw e;
    }

    for (const line of readLines) {
      const block = JSON.parse(line);
      const [lineNo, lineStr, bytes] = block;
      yield new EncodedBlock(lineNo, lineStr, bytes);
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
