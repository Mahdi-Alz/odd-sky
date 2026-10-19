import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  formatInstant,
  formatIsoDate,
  formatLocalIso,
  toDisplaySpeed,
  toDisplayTemp,
} from "@odd-sky/core";
import { useSettingsStore } from "../stores/settings";

export const useFormat = () => {
  const settings = useSettingsStore();
  const { t } = useI18n();

  const numberFormat = computed(
    () => new Intl.NumberFormat(settings.locale, { maximumFractionDigits: 0 }),
  );

  const formatNumber = (value) => numberFormat.value.format(Math.round(value) || 0);

  const formatTempValue = (celsius) => formatNumber(toDisplayTemp(celsius, settings.units));

  const formatTemp = (celsius) => `${formatTempValue(celsius)}°`;

  const tempUnit = computed(() => (settings.units === "imperial" ? "F" : "C"));

  const formatSpeed = (kmh) =>
    `${formatNumber(toDisplaySpeed(kmh, settings.units))} ${t(settings.units === "imperial" ? "units.mph" : "units.kmh")}`;

  const formatWeekday = (isoDate) => formatIsoDate(isoDate, settings.locale, { weekday: "short" });

  const formatCityTime = (instant, timeZone) =>
    formatInstant(instant, settings.locale, timeZone, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatHour = (localIso) => formatLocalIso(localIso, settings.locale, { hour: "numeric" });

  const formatFactsDate = (isoDate) =>
    formatIsoDate(isoDate, settings.locale, { weekday: "long", month: "long", day: "numeric" });

  const formatCityClock = (instant, timeZone) =>
    formatInstant(instant, settings.locale, timeZone, { hour: "numeric", minute: "2-digit" });

  const formatPercent = (value) => `${formatNumber(value)}%`;

  const formatLongDate = (instant) =>
    formatInstant(instant, settings.locale, undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const factText = (fact) =>
    t(
      fact.messageKey,
      Object.fromEntries(
        Object.entries(fact.params).map(([key, value]) => [
          key,
          typeof value === "number" ? formatNumber(value) : value,
        ]),
      ),
    );

  const listSeparator = computed(() => (settings.locale === "fa" ? "، " : ", "));

  const placeDetail = (place) =>
    [place.admin, place.country].filter(Boolean).join(listSeparator.value);

  const factTone = (fact) => {
    if (fact.family === "precipitation") return "bg-cool";
    if (fact.kind === "record-high") return "bg-warm";
    if (fact.kind === "record-low") return "bg-cool";
    return "bg-white/60";
  };

  const activityName = (id) => t(`activities.names.${id}`);

  const activityLabel = (label) => t(`activities.labels.${label}`);

  const activityReason = (reason) => t(`activities.reasons.${reason.factor}.${reason.side}`);

  const formatWindow = (window, tomorrow = false) =>
    t(tomorrow ? "activities.bestTomorrow" : "activities.best", {
      from: formatHour(window.start),
      to: formatHour(window.end),
    });

  const factsFootnote = (years) => t("facts.footnote", { years: formatNumber(years) });

  return {
    formatNumber,
    formatTemp,
    formatTempValue,
    tempUnit,
    formatSpeed,
    formatWeekday,
    formatHour,
    formatFactsDate,
    formatCityClock,
    formatPercent,
    formatCityTime,
    formatLongDate,
    listSeparator,
    placeDetail,
    factText,
    factTone,
    factsFootnote,
    activityName,
    activityLabel,
    activityReason,
    formatWindow,
  };
};
