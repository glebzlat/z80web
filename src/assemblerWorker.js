/* Web Worker assembler manager
 *
 * Initializes Pyodide and z80asm package, as well as handles source code
 * assembling.
 *
 * Accepts messages of type object, where the `message` property is required,
 * and `data` is optional. Responds with the same message format.
 *
 * Accepted messages:
 * - init: Initialize the module
 * - assemble: Convert the assembler code into chunks of data
 *
 * Response messages:
 * - inited: The initialization process is finished
 * - assembled: The convertion process is finished
 * - block: The message carries a chunk of bytes
 * - error: The message carries a compilation error
 *
 * When the caller start the initiation process by sending `init` message, it
 * should supply it with the `data` field, containing `z80asmFile` and
 * `scriptFile` fields of type string, representing relative paths to
 * corresponding files. When the module is initialized, it sends a `inited`
 * message.
 *
 * When the caller sends the `assemble` message, it should provide the source
 * code as the `data`. The assember then will convert the code into bytes and
 * send `block` messages, or send an `error` message in case of an assembling
 * error. The module will send `assembled` message upon completion.
 */

import { loadPyodide } from "pyodide";
import { resolveURL } from "@/common";

/**
 * @type { import("pyodide").PyodideAPI }
 */
let pyodide = null;

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

/** Initialize Pyodide and the Assembler module */
async function init() {
  pyodide = await loadPyodide();

  const z80asmFileURL = resolveURL(__Z80ASM_FILE__);
  const scriptFileURL = resolveURL(__SCRIPT_FILE__);

  console.log(`z80asmFileURL=${z80asmFileURL}`);
  console.log(`scriptFileURL=${scriptFileURL}`);

  await pyodide.runPythonAsync(`
  from pyodide.http import pyfetch

  response = await pyfetch("${z80asmFileURL}")
  with open("z80asm.py", "wb") as fout:
      fout.write(await response.bytes())

  response = await pyfetch("${scriptFileURL}")
  with open("script.py", "wb") as fout:
      fout.write(await response.bytes())
  `)

  self.postMessage({ message: "inited" });
}

/** Convert the source code into the stream of encoded blocks
 *
 * Each block is a list of [lineNumber, line, endAddr, bytes].
 *
 * Posts the messages of type "block" passing blocks as data.
 *
 * @param {string} sourceCode
 */
async function assemble(sourceCode) {
  pyodide.setStdin(new StdinHandler(sourceCode.split("\n")));

  const readLines = new Array();
  pyodide.setStdout({ batched: (line) => readLines.push(line) });

  try {
    await pyodide.runPythonAsync(`
    from script import assemble

    assemble()
    `)
  } catch (e) {
    if (e instanceof pyodide.ffi.PythonError && e.type == "Z80Error") {
      await postError();
      return;
    }
    throw e;
  }

  for (const line of readLines) {
    const block = JSON.parse(line);
    postMessage({ message: "block", data: block});
  }

  pyodide.setStdin();
  pyodide.setStdout();

  self.postMessage({ message: "assembled" });
}

/** Post a Z80Error message */
async function postError() {
  postMessage({ message: "error", data: await getLastExceptionArgs() });
}

/**
 * @returns {Promise<Array<import("./assembler").ExceptionInfo>>}
 */
async function getLastExceptionArgs() {
  /** @type { import("pyodide/ffi").PyProxy } */
  let args;
  try {
    args = await pyodide.runPythonAsync(`
      import sys

      print(f"{sys.last_exc.args=}")
      [{"message": e.args[0], "line": e.line, "column": e.column} for e in sys.last_exc.args]
    `);

    if (!args) {
      return [];
    }

    // Pyodide converts Python dict to JS's Map, which cannot be serialized
    // by `postMessage`.
    const excMaps = args.toJs();
    const excObjs = [];
    for (let m of excMaps) {
      excObjs.push(Object.fromEntries(m));
    }

    return excObjs;
  } finally {
    if (args) {
      args.destroy();
    }
  }
}

self.onmessage = async (e) => {
  console.log("assemblerWorker.onmessage:", e.data);

  switch (e.data.message) {
    case "init":
      await init(e.data.z80asmFile, e.data.scriptFile);
      break;
    case "assemble":
      assemble(e.data.sourceCode);
      break;
    default:
      console.error(`unexpected message: ${e.data.message}`);
      break;
  }
}
