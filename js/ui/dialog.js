// Fenêtre de dialogue native (<dialog>) : remplace prompt(), confirm() et alert().
const dlg = document.getElementById('dialog');
const title = document.getElementById('dlgTitle');
const text = document.getElementById('dlgText');
const input = document.getElementById('dlgInput');
const ok = document.getElementById('dlgOk');
const cancel = document.getElementById('dlgCancel');

cancel.type = 'button';
cancel.addEventListener('click', () => dlg.close('cancel'));

function open({ heading, message = '', value = null, okLabel = 'OK', danger = false, showCancel = true, validate }) {
  title.textContent = heading;
  text.textContent = message;
  text.hidden = !message;
  input.hidden = value === null;
  input.value = value ?? '';
  input.setCustomValidity('');
  ok.textContent = okLabel;
  ok.classList.toggle('danger', danger);
  ok.classList.toggle('solid', !danger);
  cancel.hidden = !showCancel;
  dlg.returnValue = '';

  const onInput = () => input.setCustomValidity(validate ? validate(input.value.trim()) || '' : '');
  input.oninput = onInput;
  onInput();

  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
    if (value !== null) { input.focus(); input.select(); } else { ok.focus(); }
  });
}

// Demande un texte. Renvoie le texte saisi, ou null si annulé.
export async function askText(heading, value = '', { message, okLabel = 'Valider', validate } = {}) {
  input.required = true;
  const confirmed = await open({ heading, message, value, okLabel, validate });
  const v = input.value.trim();
  return confirmed && v ? v : null;
}

// Demande une confirmation. Renvoie true ou false.
export function confirmAction(heading, message, okLabel = 'Supprimer') {
  input.required = false;
  return open({ heading, message, okLabel, danger: true });
}

// Affiche une information.
export function inform(heading, message = '') {
  input.required = false;
  return open({ heading, message, showCancel: false });
}
