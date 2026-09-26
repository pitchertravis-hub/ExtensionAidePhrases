// Message en bas de la fenêtre, avec une action facultative (ex. « Annuler »).
const el = document.getElementById('toast');
const label = document.getElementById('toastText');
const action = document.getElementById('toastAction');
let timer = null;
let onAction = null;

action.addEventListener('click', () => {
  const fn = onAction;
  hideToast();
  fn?.();
});

export function showToast(message, { actionLabel = '', onClick = null, duration = 5000 } = {}) {
  clearTimeout(timer);
  label.textContent = message;
  action.textContent = actionLabel;
  onAction = onClick;
  el.hidden = false;
  timer = setTimeout(hideToast, duration);
}

export function hideToast() {
  clearTimeout(timer);
  el.hidden = true;
  onAction = null;
}
