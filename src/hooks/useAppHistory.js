import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import * as appHistory from "../lib/appHistory";

/**
 * Read the current navigation state ({ tab, sub, adminTab }) and re-render
 * whenever it changes (including on browser back/forward).
 */
export function useHistoryState() {
  return useSyncExternalStore(
    appHistory.subscribe,
    appHistory.getState,
    appHistory.getState
  );
}

/**
 * Register a modal / drawer / panel with the browser history.
 *
 * While `isOpen` is true, one history entry belongs to this overlay:
 *  - pressing back closes the overlay instead of leaving the page
 *  - closing it from the UI removes that entry again (no "ghost" back steps)
 *
 * Usage inside any modal component:
 *   useOverlayHistory(isOpen, onClose, "cart-drawer");
 *
 * For modals that are mounted only while open, pass `true`:
 *   useOverlayHistory(true, onClose, "admin-order-detail");
 */
export function useOverlayHistory(isOpen, onClose, name) {
  const autoId = useId();
  const id = `${name || "overlay"}:${autoId}`;
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    appHistory.openOverlay(id, () => {
      closeRef.current?.();
    });
    return () => appHistory.closeOverlay(id);
  }, [isOpen, id]);
}
