import { ref } from "vue";

export class Logger {
  constructor() {
    this.messages = ref([]);
  }

  reset() {
    this.messages.value.length = 0;
  }

  /** Post a message
   *
   * @param {string|null} kind
   * @param {...any} args
   */
  message(kind, ...args) {
    const str = args.join(" ");
    this.messages.value.push({ kind, string: str });
    console.log(`${kind}: ${str}`);
  }
}

const logger = new Logger();
export default logger;
