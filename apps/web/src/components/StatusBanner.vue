<script setup>
import { useI18n } from "vue-i18n";
import UiIcon from "./UiIcon.vue";

defineProps({
  offline: { type: Boolean, default: false },
});

const { t } = useI18n();
</script>

<template>
  <div
    v-if="offline"
    class="flex items-center justify-center gap-2 bg-black/40 px-4 py-2 text-xs text-white/90"
    role="status"
  >
    <UiIcon name="offline" class="size-4" />
    {{ t("status.offline") }}
  </div>
</template>
