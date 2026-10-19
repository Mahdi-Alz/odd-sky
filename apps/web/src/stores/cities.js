import { defineStore } from "pinia";
import { decodeCities, readTransferHash } from "../storage/transfer";

export const useCitiesStore = defineStore("cities", {
  state: () => ({
    items: /** @type {import("@odd-sky/core/types").Place[]} */ ([]),
  }),
  getters: {
    sorted: (state) => [...state.items].sort((a, b) => a.order - b.order),
  },
  actions: {
    add(place) {
      if (this.items.some((item) => item.id === place.id)) return false;
      const order = this.items.reduce((max, item) => Math.max(max, item.order), -1) + 1;
      this.items.push({ ...place, order });
      return true;
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
