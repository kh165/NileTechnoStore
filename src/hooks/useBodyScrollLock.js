import { useEffect } from "react";

/**
 * Custom hook to lock body scrolling when a modal, drawer, or tab overlay is open.
 * Prevents background page scrolling while allowing smooth scrolling inside the modal.
 * 
 * @param {boolean} isLocked - Whether scroll lock should be active
 */
export function useBodyScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    // Store original overflow styles to restore later
    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow || "";
      document.documentElement.style.overflow = prevDocOverflow || "";
    };
  }, [isLocked]);
}
