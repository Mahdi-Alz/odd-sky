import { computed } from "vue";
import { shouldShowInstallHint } from "@odd-sky/core";
import { useSettingsStore } from "../stores/settings";

export const useInstallHint = () => {
  const settings = useSettingsStore();

  const standalone =
    /** @type {any} */ (navigator).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  const show = computed(() =>
    shouldShowInstallHint({
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      standalone,
      dismissed: settings.installHintDismissed,
    }),
  );

  return { show, dismiss: settings.dismissInstallHint };
};
