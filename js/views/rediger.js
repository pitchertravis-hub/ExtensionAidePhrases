// Onglet Rédiger : on écrit (ou dicte) un brouillon, l'IA de Chrome le corrige
// et le rend professionnel. Le résultat se copie ou se garde comme phrase.
import { store } from '../store.js';
import { state, render, rubriques, copyText } from '../state.js';
import { textToHtml, escapeHtml } from '../core/text.js';
import { aiStatus, rewriteText } from '../core/ai.js';
import { createVoice } from '../core/voice.js';
import { openMenu, bindMenu } from '../ui/menu.js';
import { inform } from '../ui/dialog.js';
import { showToast } from '../ui/toast.js';

const $ = (id) => document.getElementById(id);
const KEY = 'tp-rediger';   // brouillon et résultat, gardés à la fermeture de la fenêtre
let busy = false;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ draft: $('rdDraft').value, out: $('rdOut').value })); } catch { /* rien à faire */ }
}

function setTag(text, warn = false) {
  const tag = $('rdTag');
  tag.textContent = text;
  tag.classList.toggle('warn', warn);
}

function updateButtons() {
  const hasDraft = !!$('rdDraft').value.trim();
  const hasOut = !!$('rdOut').value.trim();
  $('rdGo').disabled = busy || !hasDraft;
  $('rdAgain').disabled = busy || !hasDraft || !hasOut;
  $('rdCopy').disabled = busy || !hasOut;
  $('rdKeep').disabled = busy || !hasOut;
}

async function run() {
  const text = $('rdDraft').value.trim();
  if (!text || busy) return;
  busy = true;
  const out = $('rdOut');
  const box = out.closest('.box');
  box.classList.add('busy');
  out.readOnly = true;
  setTag('L’IA réfléchit…');
  updateButtons();
  try {
    const res = await rewriteText(text, (x) => setTag(`Préparation de l’IA… ${Math.round(x * 100)} %`));
    out.value = res.text;
    if (res.ok) setTag('Reformulé');
    else setTag('Vérifiez les champs {…} et les liens', true);
  } catch (e) {
    console.warn('Reformulation IA :', e);
    setTag('La reformulation n’a pas marché. Réessayez.', true);
  } finally {
    busy = false;
    box.classList.remove('busy');
    out.readOnly = false;
    save();
    updateButtons();
  }
}

async function copyOut() {
  const text = $('rdOut').value.trim();
  if (!text) return;
  const ok = await copyText(text);
  showToast(ok ? 'Copié' : 'Copie impossible : cliquez dans la fenêtre puis réessayez.');
}

// Menu « Garder comme phrase » : les rubriques de la liste en cours.
function openKeepMenu(anchor) {
  const menu = $('rdKeepMenu');
  const rubs = rubriques();
  if (!rubs.length) {
    inform('Aucune rubrique', 'Créez d’abord une rubrique dans l’onglet Phrases (bouton + Rubrique).');
    return;
  }
  menu.innerHTML = `<div class="cap">Ajouter dans ${escapeHtml(state.list)}</div>` + rubs
    .map((r, i) => `<button type="button" data-act="${i}"><svg class="ico"><use href="#i-text"/></svg><span>${escapeHtml(r.name)}</span></button>`)
    .join('');
  openMenu(menu, { anchor });
}

function keep(index) {
  const text = $('rdOut').value.trim();
  const rub = rubriques()[index];
  if (!text || !rub) return;
  rub.phrases.push(textToHtml(text));
  store.save();
  render();
  showToast(`Phrase ajoutée dans « ${rub.name} »`, {
    actionLabel: 'Voir',
    onClick: () => {
      state.tab = 'ph';
      state.mode = 'rub';
      state.q = '';
      $('q').value = '';
      state.rub = index;
      state.sel = rub.phrases.length - 1;
      render();
      document.querySelector('.ph.sel')?.scrollIntoView({ block: 'nearest' });
    },
  });
}

export function initRediger() {
  const draft = $('rdDraft');
  const out = $('rdOut');
  const saved = load();
  draft.value = saved.draft ?? '';
  out.value = saved.out ?? '';
  updateButtons();

  // L'onglet n'apparaît que si l'IA de Chrome peut tourner sur cet ordinateur.
  aiStatus().then((s) => { $('tabBtnRd').hidden = s === 'unavailable'; });

  draft.addEventListener('input', () => { save(); updateButtons(); });
  out.addEventListener('input', () => { save(); updateButtons(); });
  draft.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
  $('rdGo').addEventListener('click', run);
  $('rdAgain').addEventListener('click', run);
  $('rdCopy').addEventListener('click', copyOut);
  $('rdKeep').addEventListener('click', (e) => openKeepMenu(e.currentTarget));
  bindMenu($('rdKeepMenu'), (act) => keep(Number(act)));

  const mic = $('rdMic');
  const voice = createVoice({
    onText: (t) => {
      draft.value = draft.value.trim() ? `${draft.value.trimEnd()} ${t}` : t;
      save();
      updateButtons();
    },
    onState: (on) => { mic.classList.toggle('on', on); mic.title = on ? 'Arrêter la dictée' : 'Dicter (reconnaissance vocale de Chrome, qui peut passer par les serveurs de Google)'; },
  });
  if (voice) mic.addEventListener('click', () => voice.toggle());
  else mic.hidden = true;
}
