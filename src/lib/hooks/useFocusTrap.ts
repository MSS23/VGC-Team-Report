import { useEffect, RefObject } from "react";

/**
 * Trap keyboard focus inside `ref` while `active` is true.
 *
 * Behaviour (WCAG 2.4.3 Focus Order, 2.1.2 No Keyboard Trap exception for modals):
 * - On activation, moves focus to the first focusable element in the container.
 * - Tab from the last focusable wraps to the first; Shift+Tab from the first
 *   wraps to the last.
 * - On deactivation/unmount, restores focus to whatever was focused before.
 *
 * Extracted from the ShareModal focus-trap so dialogs across the app can share
 * one implementation. Callers are responsible for Escape-to-close and for
 * setting role="dialog" / aria-modal="true" on the container.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active || !ref.current) return;
    const container = ref.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    first?.focus();
    container.addEventListener("keydown", handleKey);
    return () => {
      container.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}
