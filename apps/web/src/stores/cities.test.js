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

  it("moves a city up and down and renumbers", () => {
    const store = seeded();
    store.move("c", -1);
    expect(order(store)).toEqual(["a", "c", "b"]);
    store.move("a", 1);
    expect(order(store)).toEqual(["c", "a", "b"]);
    expect(store.sorted.map((item) => item.order)).toEqual([0, 1, 2]);
  });

  it("ignores moves past either end and unknown ids", () => {
    const store = seeded();
    store.move("a", -1);
    store.move("c", 1);
    store.move("zzz", 1);
    expect(order(store)).toEqual(["a", "b", "c"]);
  });

  it("removes a city and keeps the rest in order", () => {
    const store = seeded();
    store.remove("b");
    expect(order(store)).toEqual(["a", "c"]);
    store.add(city("d"));
    expect(order(store)).toEqual(["a", "c", "d"]);
  });
});
