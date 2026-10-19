import { defineStore } from "pinia";
import { decodeCities, readTransferHash } from "../storage/transfer";

const labelOf = ({ name, admin, country }) => ({ name, admin, country });

export const useCitiesStore = defineStore("cities", {
  state: () => ({
    items: /** @type {import("@odd-sky/core/types").Place[]} */ ([]),
  }),
  getters: {
    sorted: (state) => [...state.items].sort((a, b) => a.order - b.order),
  },
  actions: {
    add(place, locale) {
      if (this.items.some((item) => item.id === place.id)) return false;
      const order = this.items.reduce((max, item) => Math.max(max, item.order), -1) + 1;
      const labels = { ...place.labels };
      if (locale) labels[locale] = labelOf(place);
      this.items.push({ ...place, labels, order });
      return true;
    },
    applyLocale(locale) {
      this.items = this.items.map((item) => {
        const label = item.labels?.[locale];
        return label ? { ...item, ...label } : item;
      });
      return this.items.filter((item) => !item.labels?.[locale]).map((item) => item.id);
    },
    setLabel(id, locale, label, apply) {
      this.items = this.items.map((item) =>
        item.id === id
          ? { ...item, ...(apply ? label : {}), labels: { ...item.labels, [locale]: label } }
          : item,
      );
    },
    move(id, delta) {
      const list = this.sorted;
      const from = list.findIndex((item) => item.id === id);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= list.length) return;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      this.items = list.map((item, order) => ({ ...item, order }));
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id);
    },
    async importFromHash(hash) {
      const encoded = readTransferHash(hash);
      if (!encoded) return 0;
      let added = 0;
      for (const city of await decodeCities(encoded)) {
        if (this.add(city)) added += 1;
      }
      return added;
    },
  },
  persist: { key: "cities" },
});
