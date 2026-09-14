import "./styles.css";
import { createFragmentStore } from "../domain/store.js";
import { createBrowserPersistence } from "./local-storage.js";
import { createRemoteClient } from "./remote.js";
import { createCaptureViewModel } from "./view-model.js";
import { renderFragments } from "./render.js";
import { shouldPreventCapturePan } from "./capture-pan.js";

const sendIcon = `<svg class="send-icon" viewBox="0 0 24 24" aria-hidden="true"><path class="send-shape" d="M5 12h12.3M13.2 7.6l4.3 4.4-4.3 4.4" /></svg>`;
const retryIcon = `<svg class="retry-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 1.1 4" /><path d="M20 5v6h-6" /></svg>`;

function syncVisualViewportHeight() {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-viewport-height", `${height}px`);
}

syncVisualViewportHeight();
window.visualViewport?.addEventListener("resize", syncVisualViewportHeight);
window.addEventListener("resize", syncVisualViewportHeight);

const persistence = createBrowserPersistence(window.localStorage);
const store = createFragmentStore(persistence.fragments);
const vm = createCaptureViewModel({
  persistence,
  store,
  remote: createRemoteClient(window.fetch.bind(window)),
  makeId: () => crypto.randomUUID(),
  now: () => new Date().toISOString(),
});

const appShell = document.querySelector("#app");
const contentArea = document.querySelector("#content-area");
const captureView = document.querySelector("#capture-view");
const fragmentsView = document.querySelector("#fragments-view");
const tabs = document.querySelector("#app-tabs");
const tabIndicator = document.querySelector("#tab-indicator");
const captureTab = document.querySelector("#capture-tab");
const fragmentsTab = document.querySelector("#fragments-tab");
const input = document.querySelector("#capture-input");
const sendButton = document.querySelector("#send-button");
const status = document.querySelector("#capture-status");
const captureToast = document.querySelector("#capture-toast");
const fragmentsList = document.querySelector("#fragments-list");

let captureTouchY = null;
let pageDrag = null;
let toastTimer = null;
let openFragmentShell = null;

captureView.addEventListener("touchstart", (event) => {
  captureTouchY = event.touches.length === 1 ? event.touches[0].clientY : null;
}, { passive: true });

captureView.addEventListener("touchmove", (event) => {
  if (event.touches.length !== 1 || captureTouchY === null) {
    if (event.cancelable) event.preventDefault();
    return;
  }

  const currentY = event.touches[0].clientY;
  const deltaY = currentY - captureTouchY;
  captureTouchY = currentY;
  const isInput = event.target === input || input.contains(event.target);

  if (shouldPreventCapturePan({
    isInput,
    scrollTop: input.scrollTop,
    scrollHeight: input.scrollHeight,
    clientHeight: input.clientHeight,
    deltaY,
  }) && event.cancelable) {
    event.preventDefault();
  }
}, { passive: false });

function clearCaptureTouch() {
  captureTouchY = null;
}

captureView.addEventListener("touchend", clearCaptureTouch, { passive: true });
captureView.addEventListener("touchcancel", clearCaptureTouch, { passive: true });

function messageFor(error) {
  if (!error) return "";
  if (error === "local_save_failed" || error === "local_clear_failed") return "Couldn’t save locally. Keep this page open.";
  if (error === "unauthorized") return "This Site isn’t authorized for sending.";
  if (error === "runtime_not_configured") return "Miro setup is not configured yet.";
  return "Failed to send. Tap to retry.";
}

function statusFor(state) {
  if (state.sending) return "Sending...";
  if (state.error) return messageFor(state.error);
  return "";
}

function hideCaptureToast() {
  clearTimeout(toastTimer);
  captureToast.classList.remove("is-visible");
}

function showCaptureToast() {
  hideCaptureToast();
  captureToast.classList.add("is-visible");
  toastTimer = setTimeout(() => captureToast.classList.remove("is-visible"), 1350);
}

function renderCaptureState() {
  const state = vm.getState();
  if (document.activeElement !== input && input.value !== state.text) input.value = state.text;

  input.disabled = state.sending;
  sendButton.disabled = state.sending || state.text.length === 0;
  status.textContent = statusFor(state);
  status.classList.toggle("is-error", Boolean(state.error));

  sendButton.classList.toggle("is-sending", state.sending);
  sendButton.classList.toggle("is-retry", Boolean(state.error) && !state.sending);
  if (state.sending) {
    sendButton.innerHTML = "";
  } else if (state.error) {
    sendButton.innerHTML = retryIcon;
  } else {
    sendButton.innerHTML = sendIcon;
  }
  sendButton.setAttribute(
    "aria-label",
    state.sending ? "Sending fragment" : state.error ? "Retry fragment" : "Send fragment",
  );
}

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today - day) / 86400000);
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function setFragmentOffset(shell, x, animate = false) {
  const row = shell.querySelector(".fragment-row");
  const deleteZone = shell.querySelector(".delete-zone");
  if (!row || !deleteZone) return;
  row.style.transition = animate ? "transform 220ms var(--ease)" : "none";
  row.style.transform = `translateX(${x}px)`;
  row.dataset.x = String(x);
  deleteZone.style.opacity = String(Math.min(1, Math.abs(x) / 14));
  shell.classList.toggle("is-open", x < 0);
}

function closeFragmentShell(shell, animate = true) {
  if (!shell) return;
  setFragmentOffset(shell, 0, animate);
  if (openFragmentShell === shell) openFragmentShell = null;
}

function closeOpenFragment(except = null, animate = true) {
  if (!openFragmentShell || openFragmentShell === except) return;
  closeFragmentShell(openFragmentShell, animate);
}

function openFragment(shell, animate = true) {
  if (openFragmentShell && openFragmentShell !== shell) closeOpenFragment(shell, animate);
  setFragmentOffset(shell, -63, animate);
  openFragmentShell = shell;
}

function bindFragmentRow(shell) {
  const row = shell.querySelector(".fragment-row");
  const deleteZone = shell.querySelector(".delete-zone");
  if (!row || !deleteZone) return;

  let drag = null;
  row.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (openFragmentShell && openFragmentShell !== shell) closeOpenFragment(shell);
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: Number.parseFloat(row.dataset.x || "0"),
      active: false,
    };
    row.setPointerCapture?.(event.pointerId);
  });

  row.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) drag.active = true;
    if (!drag.active) return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    const x = Math.max(-63, Math.min(0, drag.start + dx));
    setFragmentOffset(shell, x);
    if (x < 0) openFragmentShell = shell;
  });

  const endDrag = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const x = Number.parseFloat(row.dataset.x || "0");
    if (x < -30) openFragment(shell);
    else closeFragmentShell(shell);
    drag = null;
  };

  row.addEventListener("pointerup", endDrag);
  row.addEventListener("pointercancel", endDrag);

  deleteZone.addEventListener("click", (event) => {
    event.stopPropagation();
    const id = shell.dataset.fragmentId;
    if (!id || !vm.deleteSent(id)) return;
    if (openFragmentShell === shell) openFragmentShell = null;
    const height = shell.getBoundingClientRect().height;
    shell.style.height = `${height}px`;
    requestAnimationFrame(() => {
      shell.classList.add("is-deleting");
      shell.style.height = "0px";
    });
    setTimeout(renderFragmentsView, 190);
  });
}

function bindFragmentInteractions() {
  fragmentsList.querySelectorAll(".fragment-shell").forEach(bindFragmentRow);
}

function renderFragmentsView() {
  openFragmentShell = null;
  const sent = vm.listSent();
  fragmentsList.innerHTML = sent.length
    ? renderFragments(sent, { formatTime })
    : '<div class="fragments-empty">No fragments yet.</div>';
  bindFragmentInteractions();
}

function updateActiveView(view) {
  const captureActive = view === "capture";
  appShell.dataset.page = view;
  tabs.dataset.active = view;
  captureTab.classList.toggle("is-active", captureActive);
  fragmentsTab.classList.toggle("is-active", !captureActive);
  captureTab.setAttribute("aria-selected", String(captureActive));
  fragmentsTab.setAttribute("aria-selected", String(!captureActive));
  captureView.setAttribute("aria-hidden", String(!captureActive));
  fragmentsView.setAttribute("aria-hidden", String(captureActive));
}

function resetPageDragStyles() {
  appShell.classList.remove("is-page-dragging");
  captureView.style.transform = "";
  fragmentsView.style.transform = "";
  tabIndicator.style.left = "";
}

function setActiveView(view) {
  closeOpenFragment(null, false);
  updateActiveView(view);
  resetPageDragStyles();
}

function showCapture() {
  setActiveView("capture");
  renderCaptureState();
  requestAnimationFrame(() => input.focus());
}

function showFragments() {
  renderFragmentsView();
  input.blur();
  setActiveView("fragments");
}

function pageDistance() {
  return contentArea.getBoundingClientRect().width * 1.12;
}

function setPageDragProgress(dx) {
  const distance = pageDistance();
  const fromCapture = appShell.dataset.page !== "fragments";
  const travel = fromCapture
    ? Math.min(0, Math.max(-distance, dx))
    : Math.max(0, Math.min(distance, dx));
  const captureBase = fromCapture ? 0 : -distance;
  const fragmentsBase = fromCapture ? distance : 0;
  captureView.style.transform = `translateX(${captureBase + travel}px)`;
  fragmentsView.style.transform = `translateX(${fragmentsBase + travel}px)`;
  const progress = fromCapture ? -travel / distance : 1 - travel / distance;
  tabIndicator.style.left = `${37 + (176 * Math.max(0, Math.min(1, progress)))}px`;
}

function canStartPageSwipe(target, pointerType) {
  if (target.closest(".fragment-shell") || target.closest("button")) return false;
  if (target.closest("textarea") && pointerType === "mouse") return false;
  return true;
}

contentArea.addEventListener("pointerdown", (event) => {
  if (!canStartPageSwipe(event.target, event.pointerType)) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (appShell.dataset.page === "capture") renderFragmentsView();
  pageDrag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    lastX: event.clientX,
    lastT: performance.now(),
    vx: 0,
    active: false,
  };
  contentArea.setPointerCapture?.(event.pointerId);
});

contentArea.addEventListener("pointermove", (event) => {
  if (!pageDrag || pageDrag.id !== event.pointerId) return;
  const dx = event.clientX - pageDrag.x;
  const dy = event.clientY - pageDrag.y;
  if (!pageDrag.active) {
    if (Math.abs(dx) < 7 || Math.abs(dx) <= Math.abs(dy)) return;
    pageDrag.active = true;
    appShell.classList.add("is-page-dragging");
  }
  if (event.cancelable) event.preventDefault();
  setPageDragProgress(dx);
  const now = performance.now();
  const dt = Math.max(1, now - pageDrag.lastT);
  pageDrag.vx = (event.clientX - pageDrag.lastX) / dt;
  pageDrag.lastX = event.clientX;
  pageDrag.lastT = now;
});

function endPageDrag(event) {
  if (!pageDrag || pageDrag.id !== event.pointerId) return;
  if (!pageDrag.active) {
    pageDrag = null;
    return;
  }

  const dx = event.clientX - pageDrag.x;
  const distance = pageDistance();
  const fast = Math.abs(pageDrag.vx) > .45;
  const fromCapture = appShell.dataset.page !== "fragments";
  let next = fromCapture ? "capture" : "fragments";
  if (fromCapture && (dx < -distance * .25 || (fast && pageDrag.vx < 0))) next = "fragments";
  if (!fromCapture && (dx > distance * .25 || (fast && pageDrag.vx > 0))) next = "capture";

  updateActiveView(next);
  appShell.classList.remove("is-page-dragging");
  requestAnimationFrame(() => {
    captureView.style.transform = "";
    fragmentsView.style.transform = "";
    tabIndicator.style.left = "";
  });
  pageDrag = null;
}

contentArea.addEventListener("pointerup", endPageDrag);
contentArea.addEventListener("pointercancel", endPageDrag);

document.addEventListener("pointerdown", (event) => {
  if (openFragmentShell && !openFragmentShell.contains(event.target)) closeOpenFragment();
});

input.value = vm.getState().text;
input.addEventListener("input", () => {
  vm.setText(input.value);
  renderCaptureState();
});

sendButton.addEventListener("click", async () => {
  hideCaptureToast();
  renderCaptureState();
  const pending = vm.send();
  renderCaptureState();
  const result = await pending;
  input.value = vm.getState().text;
  renderCaptureState();
  if (result.ok && result.clearInput) showCaptureToast();
  if (vm.getState().text.length === 0) input.focus();
});

captureTab.addEventListener("click", showCapture);
fragmentsTab.addEventListener("click", showFragments);

setActiveView("capture");
renderCaptureState();
