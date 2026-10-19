import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { i18n } from "./i18n";
import { persistence } from "./stores/persistence";
import { useCitiesStore } from "./stores/cities";
import { useSettingsStore } from "./stores/settings";
import { requestPersistence } from "./storage/persist";

import "./assets/css/style.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/vazirmatn/300.css";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import { registerSW } from "virtual:pwa-register";

const start = async () => {
  const pinia = createPinia();
  pinia.use(persistence);

  const app = createApp(App).use(pinia).use(i18n);

  const cities = useCitiesStore(pinia);
  const settings = useSettingsStore(pinia);
  await Promise.all([cities.$ready, settings.$ready]);

  const importFromLocation = async () => {
    if (!location.hash.startsWith("#import=")) return;
    try {
      await cities.importFromHash(location.hash);
    } catch {
      console.warn("Ignored an invalid transfer link");
    }
    history.replaceState(null, "", location.pathname + location.search);
  };

  await importFromLocation();
  window.addEventListener("hashchange", importFromLocation);

  requestPersistence();
  registerSW({ immediate: true });
  app.mount("#app");
};

start();
