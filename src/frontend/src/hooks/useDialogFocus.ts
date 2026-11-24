import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last: only the top one answers Tab and Escape
const openDialogs: symbol[] = [];

/**
 * Keyboard behavior every dialog needs: focus moves into it on open, Tab and
 * Shift+Tab cycle inside it, Escape closes it (when onEscape is given), and
 * focus returns to whatever opened it on close.
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, isOpen: boolean, onEscape?: () => void) {
  // Kept in a ref so a new onEscape each render doesn't re-run the effect and steal focus back
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!isOpen) return;
    const token = Symbol('dialog');
    openDialogs.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = ref.current;
    if (root && !root.contains(document.activeElement)) {
      if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1');
      root.focus({ preventScroll: true });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== token) return;
      if (e.key === 'Escape' && escapeRef.current) {
        escapeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !root) return;
      const focusable = root.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openDialogs.splice(openDialogs.indexOf(token), 1);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, ref]);
}
