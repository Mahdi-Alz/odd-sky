export class QuotaError extends Error {
  /** @param {number} retryAfterMs */
  constructor(retryAfterMs) {
    super("Open-Meteo budget used up");
    this.name = "QuotaError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class UpstreamError extends Error {
  /** @param {number} status */
  constructor(status) {
    super(`Open-Meteo request failed: ${status}`);
    this.name = "UpstreamError";
    this.status = status;
  }
}
