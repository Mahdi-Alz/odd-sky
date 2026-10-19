const PREFIX = "#import=";
const MAX_CITIES = 100;
const MAX_BYTES = 64 * 1024;
const MAX_TEXT = 120;

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const fromBase64Url = (text) => {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const deflate = async (bytes) => {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const inflate = async (bytes) => {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("transfer data too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

const isText = (value) => typeof value === "string" && value.length <= MAX_TEXT;

const parseRow = (row, order) => {
  if (!Array.isArray(row) || row.length !== 7) return null;
  const [id, name, admin, country, lat, lon, timezone] = row;
  if (![id, name, admin, country, timezone].every(isText) || !id || !name || !timezone) return null;
  if (typeof lat !== "number" || lat < -90 || lat > 90) return null;
  if (typeof lon !== "number" || lon < -180 || lon > 180) return null;
  return { id, name, admin, country, lat, lon, timezone, order };
};

export const encodeCities = async (cities) => {
  const rows = cities.map((c) => [c.id, c.name, c.admin, c.country, c.lat, c.lon, c.timezone]);
  const bytes = new TextEncoder().encode(JSON.stringify(rows));
  return toBase64Url(await deflate(bytes));
};

export const decodeCities = async (encoded) => {
  const bytes = await inflate(fromBase64Url(encoded));
  const rows = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(rows) || rows.length > MAX_CITIES) throw new Error("invalid transfer data");
  const cities = rows.map(parseRow);
  if (cities.some((city) => city === null)) throw new Error("invalid transfer data");
  return cities;
};

export const buildTransferLink = async (cities, base) =>
  `${base}${PREFIX}${await encodeCities(cities)}`;

export const readTransferHash = (hash) =>
  hash.startsWith(PREFIX) ? hash.slice(PREFIX.length) : null;
