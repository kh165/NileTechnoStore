/**
 * appHistory
 * ----------------------------------------------------------------------------
 * A single, centralized browser-history manager for the whole app.
 *
 * Why: the app used to have several independent pieces of code calling
 * `history.pushState` / `history.back()` (App.jsx, MyAccount, AdminDashboard,
 * useNavigation...). They fought each other, which made the browser/phone
 * "back" gesture close the wrong thing, jump to the wrong tab, or leave the
 * site entirely. It also left the UI in a state where buttons looked dead.
 *
 * Now everything (tabs, sub-sections, admin tabs and every modal/drawer) goes
 * through this one module.
 *
 * Model
 *  - `state` = { tab, sub, adminTab }  -> reflected in the URL hash
 *  - `overlays` = a stack of open modals/drawers -> one history entry each
 *
 * Rules
 *  - Opening an overlay pushes one history entry.
 *  - Back pops the topmost overlay (calling its close callback).
 *  - Closing an overlay from the UI removes its history entry (history.go).
 *  - Navigating between tabs while overlays are open closes them first, then
 *    performs the navigation (queued until the history has settled).
 */

const KNOWN_TABS = ["home", "categories", "wishlist", "account"];
const ADMIN_SUB = "admin-orders";

let state = { tab: "home", sub: null, adminTab: null };
let overlays = []; // [{ id, close }]
let listeners = new Set();
let pendingActions = [];
let skipPopCount = 0;
let started = false;

const isBrowser = typeof window !== "undefined";

/* ------------------------------------------------------------------ utils */

function sameState(a, b) {
  return a.tab === b.tab && a.sub === b.sub && a.adminTab === b.adminTab;
}

export function hashOf(s) {
  if (s.tab === "account" && s.sub === ADMIN_SUB) {
    return s.adminTab ? `#admin/${s.adminTab}` : "#admin";
  }
  if (s.tab === "account" && s.sub) return `#account/${s.sub}`;
  return `#${s.tab}`;
}

export function parseHash(rawHash) {
  const raw = String(rawHash || "").replace(/^#\/?/, "").trim();
  if (!raw) return null;
  const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
  const head = (parts[0] || "").toLowerCase();

  if (head === "admin") {
    return {
      tab: "account",
      sub: ADMIN_SUB,
      adminTab: parts[1] ? parts[1].toUpperCase() : null,
    };
  }
  if (head === "account") {
    return { tab: "account", sub: parts[1] || null, adminTab: null };
  }
  if (head === "track") {
    return { tab: "account", sub: "track", adminTab: null };
  }
  if (KNOWN_TABS.includes(head)) {
    return { tab: head, sub: null, adminTab: null };
  }
  return null;
}

function historyPayload() {
  return {
    app: true,
    tab: state.tab,
    sub: state.sub,
    adminTab: state.adminTab,
    overlays: overlays.length,
  };
}

function emit() {
  const snapshot = state;
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (err) {
      console.error("appHistory listener failed:", err);
    }
  });
}

function runPending() {
  if (!pendingActions.length) return;
  const queue = pendingActions;
  pendingActions = [];
  queue.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("appHistory pending action failed:", err);
    }
  });
}

/**
 * Perform a history traversal that we triggered ourselves. The resulting
 * popstate must be ignored (we already updated our own state). A safety timer
 * makes sure a missing popstate can never freeze navigation.
 */
function scheduleTraversal(delta) {
  skipPopCount += 1;
  const ticket = skipPopCount;
  window.history.go(delta);
  window.setTimeout(() => {
    if (skipPopCount >= ticket) {
      skipPopCount -= 1;
      runPending();
    }
  }, 600);
}

function closeOverlaysDownTo(count) {
  while (overlays.length > count) {
    const overlay = overlays.pop();
    try {
      overlay.close?.();
    } catch (err) {
      console.error("Failed to close overlay:", overlay?.id, err);
    }
  }
}

/* ------------------------------------------------------------------- core */

function handlePopState(event) {
  if (skipPopCount > 0) {
    skipPopCount -= 1;
    runPending();
    return;
  }

  const entry = event?.state;
  const targetOverlays =
    entry && entry.app && Number.isFinite(entry.overlays) ? entry.overlays : 0;

  // Back/forward pressed: close every overlay that is deeper than the target.
  closeOverlaysDownTo(targetOverlays);

  const next =
    entry && entry.app
      ? { tab: entry.tab, sub: entry.sub ?? null, adminTab: entry.adminTab ?? null }
      : parseHash(window.location.hash) || { tab: "home", sub: null, adminTab: null };

  if (!sameState(state, next)) {
    state = next;
    emit();
  }
  runPending();
}

export function start(initialTab) {
  if (!isBrowser || started) return state;
  started = true;

  const fromHash = parseHash(window.location.hash);
  state =
    fromHash ||
    {
      tab: KNOWN_TABS.includes(initialTab) ? initialTab : "home",
      sub: null,
      adminTab: null,
    };

  window.history.replaceState(historyPayload(), "", hashOf(state));
  window.addEventListener("popstate", handlePopState);
  return state;
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyNavigation(next, replace) {
  if (sameState(state, next)) {
    // Keep the URL correct even when nothing else changed.
    if (isBrowser && window.location.hash !== hashOf(next)) {
      window.history.replaceState(historyPayload(), "", hashOf(next));
    }
    return;
  }
  state = next;
  if (isBrowser) {
    const method = replace ? "replaceState" : "pushState";
    window.history[method](historyPayload(), "", hashOf(state));
  }
  emit();
}

/**
 * Navigate to a tab / sub-section. Any open overlay is closed first so the
 * history stack never keeps orphan modal entries behind.
 */
export function navigate(patch = {}, options = {}) {
  const next = {
    tab: patch.tab ?? state.tab,
    sub: patch.sub === undefined ? state.sub : patch.sub,
    adminTab: patch.adminTab === undefined ? state.adminTab : patch.adminTab,
  };

  if (skipPopCount > 0 && isBrowser) {
    pendingActions.push(() => navigate(patch, options));
    return;
  }

  if (overlays.length > 0 && isBrowser) {
    const depth = overlays.length;
    closeOverlaysDownTo(0);
    pendingActions.push(() => applyNavigation(next, options.replace));
    scheduleTraversal(-depth);
    return;
  }

  applyNavigation(next, options.replace);
}

/* --------------------------------------------------------------- overlays */

export function openOverlay(id, close) {
  if (!isBrowser) return;
  if (overlays.some((o) => o.id === id)) return; // already registered
  if (skipPopCount > 0) {
    // A history traversal is still in flight: queue this so entries stay in sync.
    pendingActions.push(() => openOverlay(id, close));
    return;
  }
  overlays.push({ id, close });
  window.history.pushState(historyPayload(), "", hashOf(state));
}

/**
 * Close an overlay from the UI (X button, backdrop click, Escape...).
 * Removes its history entry (and any entry above it) without triggering the
 * popstate handler twice.
 */
export function closeOverlay(id) {
  if (!isBrowser) return;
  const index = overlays.findIndex((o) => o.id === id);
  if (index === -1) return; // already closed by the back button
  if (skipPopCount > 0) {
    pendingActions.push(() => closeOverlay(id));
    return;
  }

  const depth = overlays.length - index;
  // Remove this overlay and close every overlay stacked above it.
  const removed = overlays.splice(index);
  removed.slice(1).forEach((overlay) => {
    try {
      overlay.close?.();
    } catch (err) {
      console.error("Failed to close overlay:", overlay?.id, err);
    }
  });
  scheduleTraversal(-depth);
}

export function overlayDepth() {
  return overlays.length;
}
