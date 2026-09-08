import "./styles.css";
import { createFragmentStore } from "../domain/store.js";
import { createBrowserPersistence } from "./local-storage.js";
import { createRemoteClient } from "./remote.js";
import { createCaptureViewModel } from "./view-model.js";
import { renderFragments } from "./render.js";

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

const captureView = document.querySelector("#capture-view");
const fragmentsView = document.querySelector("#fragments-view");
const fragmentsButton = document.querySelector("#fragments-button");
const backButton = document.querySelector("#back-button");
const input = document.querySelector("#capture-input");
const sendButton = document.querySelector("#send-button");
const status = document.querySelector("#capture-status");
const fragmentsList = document.querySelector("#fragments-list");

function messageFor(error) {
  if (!error) return "";
  if (error === "local_save_failed" || error === "local_clear_failed") return "Couldn’t save locally. Keep this page open.";
  if (error === "unauthorized") return "This Site isn’t authorized for sending.";
  if (error === "runtime_not_configured") return "Miro setup is not configured yet.";
  if (error === "miro_create_failed") return "Miro send failed. Tap ↗ to retry.";
  if (error === "network_error") return "Offline. Your words are still here — tap ↗ to retry.";
  return "Send failed. Your words are still here — tap ↗ to retry.";
}

function renderCaptureState() {
  const state = vm.getState();
  if (document.activeElement !== input && input.value !== state.text) input.value = state.text;
  input.disabled = state.sending;
  sendButton.disabled = state.sending || state.text.length === 0;
  status.textContent = state.sending ? "Sending…" : messageFor(state.error);
}

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today - day) / 86400000);
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Yesterday ${time}`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function showCapture() {
  fragmentsView.hidden = true;
  captureView.hidden = false;
  renderCaptureState();
  requestAnimationFrame(() => input.focus());
}

function showFragments() {
  const sent = vm.listSent();
  fragmentsList.innerHTML = sent.length
    ? renderFragments(sent, { formatTime })
    : '<div class="fragments-empty">No fragments yet.</div>';
  captureView.hidden = true;
  fragmentsView.hidden = false;
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

fragmentsButton.addEventListener("click", showFragments);
backButton.addEventListener("click", showCapture);

renderCaptureState();
