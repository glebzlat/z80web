<template>
  <div class="message-container" ref="message-container">
    <div class="message" ref="message"
         v-for="msg in logger.messages.value"
         :class="getMessageClass(msg)">
      <pre v-if="msg.kind !== null">[{{ msg.kind }}]: {{ msg.string }}</pre>
      <pre v-else>{{ msg.string }}</pre>
    </div>
  </div>
</template>

<script setup>
  import { useTemplateRef, watch, nextTick } from "vue";
  import logger from "@/logger";

  const messageElements = useTemplateRef("message");

  function getMessageClass(message) {
    switch (message.kind) {
      case "ERROR":
        return "error-message";
      default:
        return "";
    }
  }

  watch(logger.messages, () => {
    nextTick(() => {
      if (messageElements.value.length == 0) {
        return;
      }
      messageElements.value[messageElements.value.length - 1].scrollIntoView({
        block: "end"
      });
    });
  }, { deep: true });
</script>

<style scoped>
.message-container {
  font-size: 0.9rem;
  height: 100%;
  overflow: auto;
}

.error-message {
  color: var(--main-fg-error-color);
}
</style>
