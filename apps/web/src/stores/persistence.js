import { toRaw } from "vue";
import { persistentKv } from "../storage";

export const persistence = ({ store, options }) => {
  const config = options.persist;
  if (!config) return {};

  const ready = (async () => {
    try {
      const saved = await persistentKv.get(config.key);
      if (saved) store.$patch(saved);
    } catch {
      return;
    }
    store.$subscribe(
      (_, state) => {
        persistentKv.set(config.key, JSON.parse(JSON.stringify(toRaw(state)))).catch(() => {});
      },
      { detached: true },
    );
  })();

  return { $ready: ready };
};
