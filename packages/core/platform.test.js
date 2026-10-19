import { describe, expect, it } from "vitest";
import { isIosSafari, shouldShowInstallHint } from "./platform.js";

const iphoneSafari =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const iphoneChrome =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
const ipadSafari =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const macSafari = ipadSafari;
const androidChrome =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("isIosSafari", () => {
  it("detects Safari on iPhone", () => {
    expect(isIosSafari({ userAgent: iphoneSafari })).toBe(true);
  });

  it("detects Safari on iPadOS, which reports a Mac user agent", () => {
    expect(isIosSafari({ userAgent: ipadSafari, maxTouchPoints: 5 })).toBe(true);
  });

  it("does not match Safari on a Mac", () => {
    expect(isIosSafari({ userAgent: macSafari, maxTouchPoints: 0 })).toBe(false);
  });

  it("does not match other iOS browsers", () => {
    expect(isIosSafari({ userAgent: iphoneChrome })).toBe(false);
  });

  it("does not match Android", () => {
    expect(isIosSafari({ userAgent: androidChrome, maxTouchPoints: 5 })).toBe(false);
  });
});

describe("shouldShowInstallHint", () => {
  const base = { userAgent: iphoneSafari, standalone: false, dismissed: false };

  it("shows in a Safari tab", () => {
    expect(shouldShowInstallHint(base)).toBe(true);
  });

  it("hides once installed or dismissed", () => {
    expect(shouldShowInstallHint({ ...base, standalone: true })).toBe(false);
    expect(shouldShowInstallHint({ ...base, dismissed: true })).toBe(false);
  });
});
