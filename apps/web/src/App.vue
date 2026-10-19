<script setup>
import { computed, ref, watch } from "vue";
import { ACTIVITIES } from "@odd-sky/core";
import CityList from "./components/CityList.vue";
import CityPager from "./components/CityPager.vue";
import InstallHint from "./components/InstallHint.vue";
import SettingsScreen from "./components/SettingsScreen.vue";
import StatusBanner from "./components/StatusBanner.vue";
import { useCityLabels } from "./composables/useCityLabels";
import { useCityWeather } from "./composables/useCityWeather";
import { useInstallHint } from "./composables/useInstallHint";
import { useLocaleSync } from "./composables/useLocaleSync";
import { useNavigation } from "./composables/useNavigation";
import { useOnline } from "./composables/useOnline";
import { useRefreshPolicy } from "./composables/useRefreshPolicy";
import { useTransfer } from "./composables/useTransfer";
import { useCitiesStore } from "./stores/cities";
import { useSettingsStore } from "./stores/settings";

const settings = useSettingsStore();
const cities = useCitiesStore();
const places = computed(() => cities.sorted);
const activeIndex = ref(0);

const nav = useNavigation();
const online = useOnline();
const { status: copyStatus, copyLink } = useTransfer();
const { show: showInstallHint, dismiss: dismissInstallHint } = useInstallHint();
const { states, refresh, ready } = useCityWeather(places);

useLocaleSync();
useCityLabels();
useRefreshPolicy({
  places,
  activeIndex,
  states,
  refresh,
  ready,
  online,
  enabled: computed(() => places.value.length > 0),
});

const activityOptions = computed(() =>
  ACTIVITIES.map((activity) => ({ id: activity.id, enabled: settings.isActivityOn(activity.id) })),
);

const view = computed(() => {
  if (!places.value.length && nav.view.value !== "settings") return "list";
  return nav.view.value;
});

watch(
  () => places.value.length,
  (count) => {
    if (activeIndex.value > count - 1) activeIndex.value = Math.max(count - 1, 0);
  },
);

const selectCity = (index) => {
  activeIndex.value = index;
  nav.back();
};

const addCity = (place) => {
  cities.add(place, settings.locale);
  const index = places.value.findIndex((item) => item.id === place.id);
  selectCity(index);
};
</script>

<template>
  <main class="relative h-dvh overflow-hidden">
    <StatusBanner :offline="!online" class="absolute inset-x-0 top-0 z-10" />

    <CityPager
      v-if="places.length"
      v-model:active="activeIndex"
      :places="places"
      :states="states"
      @open-list="nav.open('list')"
      @retry="refresh"
    >
      <template #above>
        <InstallHint :show="showInstallHint" @dismiss="dismissInstallHint" />
      </template>
    </CityPager>

    <CityList
      v-if="view === 'list' || view === 'settings'"
      :places="places"
      :states="states"
      @select="selectCity"
      @add="addCity"
      @remove="cities.remove"
      @move="cities.move"
      @open-settings="nav.open('settings')"
      @close="nav.back()"
    />

    <SettingsScreen
      v-if="view === 'settings'"
      :locale="settings.locale"
      :units="settings.units"
      :copy-status="copyStatus"
      :activities="activityOptions"
      @update:locale="settings.setLocale"
      @update:units="settings.setUnits"
      @set-activity="settings.setActivity"
      @copy-link="copyLink"
      @close="nav.back()"
    />
  </main>
</template>
