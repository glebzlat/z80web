import { ref } from "vue";

export class Logger {
  constructor() {
    this.messages = ref([]);
    this.frozenIndex = 0;
  }

  reset() {
    this.messages.value.length = this.frozenIndex;
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

  /** Save the current history of messages */
  freeze() {
    this.frozenIndex = this.messages.value.length;
  }
}

const logger = new Logger();
export default logger;
