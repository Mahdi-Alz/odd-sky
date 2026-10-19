import { createCache } from "./cache";
import { createDefaultKv } from "./kv";

export const persistentKv = createDefaultKv("odd-sky-data");
export const cache = createCache(createDefaultKv("odd-sky-cache"));
