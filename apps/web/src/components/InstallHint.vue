<script setup>
import { useI18n } from "vue-i18n";
import UiIcon from "./UiIcon.vue";

defineProps({
  show: { type: Boolean, default: false },
});
const emit = defineEmits(["dismiss"]);

const { t } = useI18n();
</script>

<template>
  <aside
    v-if="show"
    class="mx-4 mb-3 flex items-start gap-3 rounded-card border border-line bg-ink-soft/95 p-4 text-sm shadow-xl shadow-black/40"
    role="region"
    :aria-label="t('install.title')"
  >
    <UiIcon name="share" class="mt-0.5 size-5 shrink-0 text-white/80" />
    <div class="min-w-0 flex-1">
      <p class="font-semibold">{{ t("install.title") }}</p>
      <p class="mt-1 text-white/70">{{ t("install.steps") }}</p>
    </div>
    <button
      type="button"
      class="-m-1 rounded-full p-1 text-white/70 hover:text-white"
      :aria-label="t('install.dismiss')"
      @click="emit('dismiss')"
    >
      <UiIcon name="close" class="size-5" />
    </button>
  </aside>
</template>
