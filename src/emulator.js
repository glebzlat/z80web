export class Emulator {
  constructor(moduleFile) {
    this.moduleFile = moduleFile;
  }

  async init() {
    const binary = await fetch(this.moduleFile)
      .then(response => response.arrayBuffer());
    const module = await WebAssembly.compile(binary);

    /* Dummy functions for now */
    const imports = {
      env: {
        memread_fn: () => {},
        memwrite_fn: () => {},
        ioread_fn: () => {},
        iowrite_fn: () => {}
      }
    };

    this.instance = await WebAssembly.instantiate(module, imports);
  }
}
