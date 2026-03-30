/** Light haptic tap — used for toggles, tab switches, minor actions */
export function hapticLight() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(6);
  }
}

/** Medium haptic — used for saves, confirm actions, mode changes */
export function hapticMedium() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(12);
  }
}

/** Success pattern — used for successful save, share complete */
export function hapticSuccess() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([8, 60, 8]);
  }
}
