import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCitiesStore } from "./cities";

const city = (id) => ({
  id,
  name: id,
  admin: "",
  country: "",
  lat: 10,
  lon: 20,
  timezone: "UTC",
});

describe("cities store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const seeded = () => {
    const store = useCitiesStore();
    ["a", "b", "c"].forEach((id) => store.add(city(id)));
    return store;
  };
  const order = (store) => store.sorted.map((item) => item.id);

  it("adds cities in order and ignores duplicates", () => {
    const store = seeded();
    expect(store.add(city("a"))).toBe(false);
    expect(order(store)).toEqual(["a", "b", "c"]);
    expect(store.sorted.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("moves a city to a new position and renumbers", () => {
    const store = seeded();
    store.reorder(2, 0);
    expect(order(store)).toEqual(["c", "a", "b"]);
    store.reorder(0, 1);
    expect(order(store)).toEqual(["a", "c", "b"]);
    store.reorder(0, 2);
    expect(order(store)).toEqual(["c", "b", "a"]);
    expect(store.sorted.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("ignores moves out of range or to the same place", () => {
    const store = seeded();
    store.reorder(0, -1);
    store.reorder(2, 3);
    store.reorder(5, 0);
    store.reorder(1, 1);
    expect(order(store)).toEqual(["a", "b", "c"]);
  });

  it("removes a city and keeps the rest in order", () => {
    const store = seeded();
    store.remove("b");
    expect(order(store)).toEqual(["a", "c"]);
    store.add(city("d"));
    expect(order(store)).toEqual(["a", "c", "d"]);
  });

  it("remembers the name in the language it was added in", () => {
    const store = useCitiesStore();
    store.add({ ...city("t"), name: "تهران", country: "ایران" }, "fa");
    expect(store.items[0].labels?.fa).toEqual({ name: "تهران", admin: "", country: "ایران" });
  });

  it("switches names to a stored language and reports the missing ones", () => {
    const store = useCitiesStore();
    store.add({ ...city("t"), name: "تهران" }, "fa");
    store.add(city("x"));
    store.setLabel("t", "en", { name: "Tehran", admin: "Tehran", country: "Iran" }, false);
    expect(store.items[0].name).toBe("تهران");
    expect(store.applyLocale("en")).toEqual(["x"]);
    expect(store.items[0]).toMatchObject({ name: "Tehran", country: "Iran" });
    expect(store.applyLocale("fa")).toEqual(["x"]);
    expect(store.items[0].name).toBe("تهران");
  });

  it("applies a fetched label only when asked", () => {
    const store = useCitiesStore();
    store.add(city("x"));
    store.setLabel("x", "fa", { name: "ایکس", admin: "", country: "" }, true);
    expect(store.items[0].name).toBe("ایکس");
  });
});
