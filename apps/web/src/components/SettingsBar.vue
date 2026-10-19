<script setup>
import { useI18n } from "vue-i18n";

defineProps({
  locale: { type: String, required: true },
  units: { type: String, required: true },
  copyStatus: { type: String, default: null },
});
defineEmits(["update:locale", "update:units", "copy-link"]);

const { t } = useI18n();
</script>

<template>
  <div class="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2 text-xs">
    <div class="join" role="group" :aria-label="t('settings.language')">
      <button
        type="button"
        class="btn btn-xs join-item"
        :class="{ 'btn-primary': locale === 'en' }"
        :aria-pressed="locale === 'en'"
        @click="$emit('update:locale', 'en')"
      >
        English
      </button>
      <button
        type="button"
        class="btn btn-xs join-item"
        :class="{ 'btn-primary': locale === 'fa' }"
        :aria-pressed="locale === 'fa'"
        @click="$emit('update:locale', 'fa')"
      >
        فارسی
      </button>
    </div>

    <div class="join" role="group" :aria-label="t('settings.units')">
      <button
        type="button"
        class="btn btn-xs join-item"
        :class="{ 'btn-primary': units === 'metric' }"
        :aria-pressed="units === 'metric'"
        @click="$emit('update:units', 'metric')"
      >
        <span dir="ltr">{{ t("settings.metric") }}</span>
      </button>
      <button
        type="button"
        class="btn btn-xs join-item"
        :class="{ 'btn-primary': units === 'imperial' }"
        :aria-pressed="units === 'imperial'"
        @click="$emit('update:units', 'imperial')"
      >
        <span dir="ltr">{{ t("settings.imperial") }}</span>
      </button>
    </div>

    <button type="button" class="btn btn-xs btn-ghost" @click="$emit('copy-link')">
      {{
        copyStatus === "copied"
          ? t("settings.copied")
          : copyStatus === "failed"
            ? t("settings.copyFailed")
            : t("settings.copyLink")
      }}
    </button>
  </div>
</template>
