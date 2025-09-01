export class Emulator {
  constructor(moduleFile) {
    this.moduleFile = moduleFile;
  }

  async init() {
    const binary = await fetch(this.moduleFile)
      .then(response => response.arrayBuffer());
    const module = await WebAssembly.compile(binary);
    this.instance = await WebAssembly.instantiate(module);
  }
}
