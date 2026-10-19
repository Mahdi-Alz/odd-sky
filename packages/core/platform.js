const OTHER_IOS_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//;

/**
 * @param {{ userAgent: string, maxTouchPoints?: number }} env
 */
export const isIosSafari = ({ userAgent, maxTouchPoints = 0 }) => {
  const iPhoneOrPod = /iPhone|iPod/.test(userAgent);
  const iPad = /iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (!iPhoneOrPod && !iPad) return false;
  return /Safari/.test(userAgent) && !OTHER_IOS_BROWSERS.test(userAgent);
};

/**
 * @param {{ userAgent: string, maxTouchPoints?: number, standalone: boolean, dismissed: boolean }} env
 */
export const shouldShowInstallHint = ({ standalone, dismissed, ...env }) =>
  !standalone && !dismissed && isIosSafari(env);
