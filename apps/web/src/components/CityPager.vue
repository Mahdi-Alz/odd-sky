<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import CityPage from "./CityPage.vue";
import PageDots from "./PageDots.vue";
import UiIcon from "./UiIcon.vue";
import { useCityPager } from "../composables/useCityPager";

const props = defineProps({
  places: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
  states: { type: Object, required: true },
  active: { type: Number, required: true },
});
const emit = defineEmits(["update:active", "open-list", "retry"]);

const { t } = useI18n();
const container = ref(null);
const count = computed(() => props.places.length);
const activeIndex = computed({
  get: () => props.active,
  set: (value) => emit("update:active", value),
});

useCityPager(container, activeIndex, count);
</script>

<template>
  <div class="relative h-dvh overflow-hidden">
    <div
      ref="container"
      class="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    >
      <CityPage
        v-for="place in places"
        :key="place.id"
        :place="place"
        :forecast="states[place.id]?.forecast"
        :facts="states[place.id]?.facts"
        :loading="states[place.id]?.loading"
        :error="states[place.id]?.error"
        @retry="emit('retry', place)"
      />
    </div>

    <nav
      class="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/25 to-transparent pt-10"
    >
      <div class="pointer-events-auto">
        <slot name="above" />
      </div>
      <div class="pointer-events-auto flex min-h-10 items-center justify-center px-4">
        <PageDots :count="count" :active="active" @select="emit('update:active', $event)" />
      </div>
    </nav>

    <div class="safe-top pointer-events-none absolute inset-x-0 top-0">
      <div class="mx-auto flex max-w-xl justify-end px-4 pt-2">
        <button
          type="button"
          class="pointer-events-auto grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25"
          :aria-label="t('list.open')"
          @click="emit('open-list')"
        >
          <UiIcon name="list" class="size-5" />
        </button>
      </div>
    </div>
  </div>
</template>
