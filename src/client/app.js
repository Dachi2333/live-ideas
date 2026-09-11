import "./styles.css";
import { createFragmentStore } from "../domain/store.js";
import { createBrowserPersistence } from "./local-storage.js";
import { createRemoteClient } from "./remote.js";
import { createCaptureViewModel } from "./view-model.js";
import { renderFragments } from "./render.js";
import { shouldPreventCapturePan } from "./capture-pan.js";

const sendIcon = `<svg class="send-icon" viewBox="0 0 24 24" aria-hidden="true"><path class="send-shape" d="M5.25 12h12.4M13.35 7.7 17.65 12l-4.3 4.3" /></svg>`;
const retryIcon = `<svg class="retry-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" /><path d="M21 3v5h-5" /></svg>`;

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
const captureTab = document.querySelector("#capture-tab");
const fragmentsTab = document.querySelector("#fragments-tab");
const input = document.querySelector("#capture-input");
const sendButton = document.querySelector("#send-button");
const status = document.querySelector("#capture-status");
const fragmentsList = document.querySelector("#fragments-list");

let captureTouchY = null;
let touchStartX = null;
let touchStartY = null;

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
  if (error === "miro_create_failed") return "Failed to send. Tap to retry.";
  if (error === "network_error") return "Offline. Tap to retry.";
  return "Failed to send. Tap to retry.";
}

function statusFor(state) {
  if (state.sending) return "Sending…";
  if (state.error) return messageFor(state.error);
  if (state.text.length >= 120) return `${state.text.length} characters`;
  if (state.text.length > 0) return "Typing…";
  return "Ready";
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

function renderFragmentsView() {
  const sent = vm.listSent();
  fragmentsList.innerHTML = sent.length
    ? renderFragments(sent, { formatTime })
    : '<div class="fragments-empty">No fragments yet.</div>';
}

function setActiveView(view) {
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

input.value = vm.getState().text;
input.addEventListener("input", () => {
  vm.setText(input.value);
  renderCaptureState();
});

sendButton.addEventListener("click", async () => {
  renderCaptureState();
  const pending = vm.send();
  renderCaptureState();
  await pending;
  input.value = vm.getState().text;
  renderCaptureState();
  if (vm.getState().text.length === 0) input.focus();
});

captureTab.addEventListener("click", showCapture);
fragmentsTab.addEventListener("click", showFragments);

contentArea.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

contentArea.addEventListener("touchend", (event) => {
  if (touchStartX === null || touchStartY === null || event.changedTouches.length !== 1) return;
  const dx = event.changedTouches[0].clientX - touchStartX;
  const dy = event.changedTouches[0].clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;

  if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy)) return;
  if (dx < 0 && appShell.dataset.page === "capture") showFragments();
  if (dx > 0 && appShell.dataset.page === "fragments") showCapture();
}, { passive: true });

setActiveView("capture");
renderCaptureState();
