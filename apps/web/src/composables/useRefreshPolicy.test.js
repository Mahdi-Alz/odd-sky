import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, reactive, ref } from "vue";
import { useRefreshPolicy } from "./useRefreshPolicy";
import { ACTIVE_REFRESH_MS, STALE_AFTER_MS } from "../config/refresh";

const places = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

/** @param {{ states: any, active?: number, online?: boolean, enabled?: boolean }} options */
const setup = ({ states, active = 0, online = true, enabled = true }) => {
  const refresh = vi.fn(() => Promise.resolve());
  const scope = effectScope();
  const activeIndex = ref(active);
  const onlineRef = ref(online);
  scope.run(() =>
    useRefreshPolicy({
      places: ref(places),
      activeIndex,
      states: reactive(states),
      refresh,
      ready: () => Promise.resolve(),
      online: onlineRef,
      enabled: ref(enabled),
    }),
  );
  return { refresh, scope, activeIndex, onlineRef };
};

const ids = (refresh) => refresh.mock.calls.map(([place]) => place.id);
const settle = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await nextTick();
};

const fresh = () => ({ updatedAt: Date.now(), refreshing: false, error: false });
const old = () => ({ updatedAt: Date.now() - STALE_AFTER_MS - 1, refreshing: false, error: false });
const never = () => ({ updatedAt: null, refreshing: false, error: false });

describe("useRefreshPolicy", () => {
  let doc;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T12:00:00Z"));
    doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", new EventTarget());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refreshes the active page and its neighbours when they are stale", async () => {
    const { refresh, scope } = setup({
      active: 1,
      states: { a: never(), b: never(), c: old(), d: never() },
    });
    await settle();
    expect(ids(refresh).sort()).toEqual(["a", "b", "c"]);
    scope.stop();
  });

  it("leaves fresh pages alone", async () => {
    const { refresh, scope } = setup({
      states: { a: fresh(), b: fresh(), c: never(), d: never() },
    });
    await settle();
    expect(refresh).not.toHaveBeenCalled();
    scope.stop();
  });

  it("retries pages that failed even when they are recent", async () => {
    const { refresh, scope } = setup({
      states: { a: { ...fresh(), error: true }, b: fresh(), c: never(), d: never() },
    });
    await settle();
    expect(ids(refresh)).toEqual(["a"]);
    scope.stop();
  });

  it("skips pages that are already refreshing", async () => {
    const { refresh, scope } = setup({
      states: { a: { ...never(), refreshing: true }, b: fresh(), c: never(), d: never() },
    });
    await settle();
    expect(refresh).not.toHaveBeenCalled();
    scope.stop();
  });

  it("refreshes the page it moves to", async () => {
    const { refresh, activeIndex, scope } = setup({
      states: { a: fresh(), b: fresh(), c: never(), d: never() },
    });
    await settle();
    activeIndex.value = 2;
    await settle();
    expect(ids(refresh).sort()).toEqual(["c", "d"]);
    scope.stop();
  });

  it("does nothing while offline, then catches up when back online", async () => {
    const { refresh, onlineRef, scope } = setup({
      online: false,
      states: { a: never(), b: never(), c: never(), d: never() },
    });
    await settle();
    expect(refresh).not.toHaveBeenCalled();
    onlineRef.value = true;
    await settle();
    expect(ids(refresh).sort()).toEqual(["a", "b"]);
    scope.stop();
  });

  it("does nothing while disabled or hidden", async () => {
    const hidden = setup({
      enabled: false,
      states: { a: never(), b: never(), c: never(), d: never() },
    });
    await settle();
    expect(hidden.refresh).not.toHaveBeenCalled();
    hidden.scope.stop();

    doc.visibilityState = "hidden";
    const background = setup({ states: { a: never(), b: never(), c: never(), d: never() } });
    await settle();
    expect(background.refresh).not.toHaveBeenCalled();
    background.scope.stop();
  });

  it("revalidates stale pages when the tab becomes visible", async () => {
    const states = { a: fresh(), b: fresh(), c: never(), d: never() };
    const { refresh, scope } = setup({ states });
    await settle();
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(STALE_AFTER_MS + 1000);
    doc.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(ids(refresh).sort()).toEqual(["a", "b"]);
    scope.stop();
  });

  it("refreshes only the active page on the 15 minute timer", async () => {
    const { refresh, scope } = setup({
      active: 2,
      states: { a: fresh(), b: fresh(), c: fresh(), d: fresh() },
    });
    await settle();
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(ACTIVE_REFRESH_MS);
    expect(ids(refresh)).toEqual(["c"]);
    vi.advanceTimersByTime(ACTIVE_REFRESH_MS);
    expect(ids(refresh)).toEqual(["c", "c"]);
    scope.stop();
  });

  it("stops its timer and listeners when the scope ends", async () => {
    const { refresh, scope } = setup({
      states: { a: fresh(), b: fresh(), c: fresh(), d: fresh() },
    });
    await settle();
    scope.stop();
    vi.advanceTimersByTime(ACTIVE_REFRESH_MS * 3);
    doc.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(refresh).not.toHaveBeenCalled();
  });
});
