<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import DataCredit from "./DataCredit.vue";
import SegmentedControl from "./SegmentedControl.vue";
import SwitchRow from "./SwitchRow.vue";
import UiIcon from "./UiIcon.vue";
import { useFormat } from "../composables/useFormat";

const props = defineProps({
  locale: { type: String, required: true },
  units: { type: String, required: true },
  copyStatus: { type: String, default: null },
  activities: { type: /** @type {import("vue").PropType<any[]>} */ (Array), default: () => [] },
});
const emit = defineEmits(["update:locale", "update:units", "set-activity", "copy-link", "close"]);

const { t } = useI18n();
const { formatYear } = useFormat();
const copernicusYear = new Date().getFullYear();

const localeOptions = [
  { value: "en", label: "English" },
  { value: "fa", label: "فارسی" },
];

const unitOptions = computed(() => [
  { value: "metric", label: t("settings.metric"), dir: "ltr" },
  { value: "imperial", label: t("settings.imperial"), dir: "ltr" },
]);

const copyLabel = computed(() => {
  if (props.copyStatus === "copied") return t("settings.copied");
  if (props.copyStatus === "failed") return t("settings.copyFailed");
  return t("settings.copyLink");
});
</script>

<template>
  <div class="no-scrollbar fixed inset-0 z-30 overflow-y-auto bg-ink">
    <div class="safe-top safe-bottom mx-auto flex min-h-full max-w-xl flex-col gap-5 px-4">
      <header class="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          :aria-label="t('settings.back')"
          @click="emit('close')"
        >
          <UiIcon name="back" class="size-5 rtl:rotate-180" />
        </button>
        <h1 class="text-lg font-semibold">{{ t("settings.title") }}</h1>
        <span class="size-10"></span>
      </header>

      <section class="glass space-y-3 p-4">
        <h2 class="text-sm font-semibold text-white/80">{{ t("settings.language") }}</h2>
        <SegmentedControl
          :model-value="locale"
          :options="localeOptions"
          :label="t('settings.language')"
          @update:model-value="emit('update:locale', $event)"
        />
      </section>

      <section class="glass space-y-3 p-4">
        <h2 class="text-sm font-semibold text-white/80">{{ t("settings.units") }}</h2>
        <SegmentedControl
          :model-value="units"
          :options="unitOptions"
          :label="t('settings.units')"
          @update:model-value="emit('update:units', $event)"
        />
      </section>

      <section class="glass p-4">
        <h2 class="text-sm font-semibold text-white/80">{{ t("settings.activities") }}</h2>
        <p class="mt-1 text-sm text-white/65">{{ t("settings.activitiesHelp") }}</p>
        <div class="mt-2 divide-y divide-line">
          <SwitchRow
            v-for="activity in activities"
            :key="activity.id"
            :model-value="activity.enabled"
            :label="t(`activities.names.${activity.id}`)"
            @update:model-value="emit('set-activity', activity.id, $event)"
          />
        </div>
      </section>

      <section class="glass space-y-3 p-4">
        <h2 class="text-sm font-semibold text-white/80">{{ t("settings.transfer") }}</h2>
        <p class="text-sm text-white/65">{{ t("settings.transferHelp") }}</p>
        <button
          type="button"
          class="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink"
          @click="emit('copy-link')"
        >
          {{ copyLabel }}
        </button>
      </section>

      <section class="glass space-y-2 p-4 text-sm text-white/65">
        <h2 class="text-sm font-semibold text-white/80">{{ t("settings.about") }}</h2>
        <p><DataCredit /></p>
        <p>{{ t("settings.era5") }}</p>
        <p>{{ t("settings.copernicus", { year: formatYear(copernicusYear) }) }}</p>
      </section>
    </div>
  </div>
</template>
