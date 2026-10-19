<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useFormat } from "../composables/useFormat";

const props = defineProps({
  count: { type: Number, required: true },
  active: { type: Number, required: true },
});
const emit = defineEmits(["select"]);

const MAX_DOTS = 9;

const { t } = useI18n();
const { formatNumber } = useFormat();

const asDots = computed(() => props.count <= MAX_DOTS);
</script>

<template>
  <div v-if="count > 1" class="flex items-center justify-center gap-2" role="tablist">
    <template v-if="asDots">
      <button
        v-for="index in count"
        :key="index"
        type="button"
        role="tab"
        class="size-2 rounded-full transition-all"
        :class="index - 1 === active ? 'w-4 bg-white' : 'bg-white/40 hover:bg-white/70'"
        :aria-selected="index - 1 === active"
        :aria-label="t('pager.goTo', { n: formatNumber(index) })"
        @click="emit('select', index - 1)"
      ></button>
    </template>
    <span v-else class="text-xs text-white/80" dir="ltr">
      {{ formatNumber(active + 1) }} / {{ formatNumber(count) }}
    </span>
  </div>
</template>
