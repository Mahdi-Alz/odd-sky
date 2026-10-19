import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatInstant, formatIsoDate, toDisplaySpeed, toDisplayTemp } from "@odd-sky/core";
import { useSettingsStore } from "../stores/settings";

export const useFormat = () => {
  const settings = useSettingsStore();
  const { t } = useI18n();

  const numberFormat = computed(
    () => new Intl.NumberFormat(settings.locale, { maximumFractionDigits: 0 }),
  );

  const formatNumber = (value) => numberFormat.value.format(Math.round(value) || 0);

  const formatTemp = (celsius) => `${formatNumber(toDisplayTemp(celsius, settings.units))}°`;

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
    if (fact.family === "precipitation") return "badge-primary";
    if (fact.kind === "record-high") return "badge-warning";
    if (fact.kind === "record-low") return "badge-info";
    return "";
  };

  const factsFootnote = (years) => t("facts.footnote", { years: formatNumber(years) });

  return {
    formatNumber,
    formatTemp,
    tempUnit,
    formatSpeed,
    formatWeekday,
    formatCityTime,
    formatLongDate,
    listSeparator,
    placeDetail,
    factText,
    factTone,
    factsFootnote,
  };
};
