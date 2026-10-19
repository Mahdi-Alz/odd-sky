import { createStore, del, get, set } from "idb-keyval";

export const idbBackend = (name) => {
  const store = createStore(name, "kv");
  return {
    get: (key) => get(key, store),
    set: (key, value) => set(key, value, store),
    del: (key) => del(key, store),
  };
};

export const localBackend = (prefix, storage = globalThis.localStorage) => ({
  get: async (key) => {
    const raw = storage.getItem(`${prefix}:${key}`);
    return raw === null ? undefined : JSON.parse(raw);
  },
  set: async (key, value) => storage.setItem(`${prefix}:${key}`, JSON.stringify(value)),
  del: async (key) => storage.removeItem(`${prefix}:${key}`),
});

export const createKv = (primary, fallback) => {
  const run = async (action, ...args) => {
    try {
      return await primary[action](...args);
    } catch {
      return fallback[action](...args);
    }
  };
  return {
    get: (key) => run("get", key),
    set: (key, value) => run("set", key, value),
    del: (key) => run("del", key),
  };
};

export const createDefaultKv = (name) => {
  let primary;
  try {
    primary = idbBackend(name);
  } catch {
    primary = {
      get: () => Promise.reject(new Error("indexeddb unavailable")),
      set: () => Promise.reject(new Error("indexeddb unavailable")),
      del: () => Promise.reject(new Error("indexeddb unavailable")),
    };
  }
  return createKv(primary, localBackend(name));
};
