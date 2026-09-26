// Onglet Rédiger : on écrit (ou dicte) un brouillon, l'IA de Chrome le corrige
// et le rend professionnel. Le résultat se copie ou se garde comme phrase.
import { store } from '../store.js';
import { state, render, rubriques, copyText } from '../state.js';
import { textToHtml, escapeHtml } from '../core/text.js';
import { aiStatus, rewriteText, chromeVersion } from '../core/ai.js';
import { createVoice } from '../core/voice.js';
import { openMenu, bindMenu } from '../ui/menu.js';
import { inform } from '../ui/dialog.js';
import { showToast } from '../ui/toast.js';

const $ = (id) => document.getElementById(id);
const KEY = 'tp-rediger';   // brouillon et résultat, gardés à la fermeture de la fenêtre
let busy = false;
let usable = false;         // l'IA de Chrome peut tourner ici

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ draft: $('rdDraft').value, out: $('rdOut').value })); } catch { /* rien à faire */ }
}

// Sans message particulier, l'étiquette rappelle que l'IA peut se tromper.
function setTag(text = '', warn = false) {
  const tag = $('rdTag');
  tag.textContent = text || 'L’IA peut se tromper : relisez avant d’envoyer.';
  tag.classList.toggle('warn', warn);
  tag.classList.toggle('note', !text);
}

function updateButtons() {
  const hasDraft = !!$('rdDraft').value.trim();
  const hasOut = !!$('rdOut').value.trim();
  $('rdGo').disabled = busy || !usable || !hasDraft;
  $('rdAgain').disabled = busy || !usable || !hasDraft || !hasOut;
  $('rdCopy').disabled = busy || !hasOut;
  $('rdKeep').disabled = busy || !hasOut;
  $('rdClear').disabled = busy || (!hasDraft && !hasOut);
}

async function run() {
  const text = $('rdDraft').value.trim();
  if (!text || busy || !usable) return;
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
    if (res.ok) setTag('Reformulé · relisez avant d’envoyer');
    else setTag(res.why, true);
    check(); // le modèle vient peut-être d'être téléchargé
  } catch (e) {
    console.warn('Reformulation IA :', e);
    setTag(`La reformulation n’a pas marché (${e.name}). Réessayez.`, true);
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

// Dit pourquoi l'IA ne marche pas ici, ou ce qu'il faut savoir avant de s'en servir.
function note(title, text, { info = '', actions = true } = {}) {
  $('rdNote').hidden = !title;
  $('rdNoteTitle').textContent = title;
  $('rdNoteText').textContent = text;
  $('rdNoteInfo').textContent = info;
  $('rdNoteActs').hidden = !actions;
}

async function check() {
  const v = chromeVersion();
  const st = await aiStatus();
  usable = st.status !== 'unavailable';
  const info = `Chrome ${v || '?'} · IA intégrée : ${st.api ? 'présente' : 'absente'} · état : ${st.status}${usable && !st.fr ? ' · français non pris en charge' : ''}`;
  if (!st.api && v && v < 138) {
    note('Chrome est trop ancien pour l’IA',
      `Votre Chrome est en version ${v}. L’IA intégrée demande la version 138 ou plus récente (149 pour le français). Mettez Chrome à jour : menu ⋮ › Aide › À propos de Google Chrome, puis relancez Chrome.`, { info });
  } else if (!st.api) {
    note('Chrome n’active pas son IA sur cet ordinateur',
      'Causes possibles : ordinateur pas assez puissant, Chrome géré par une entreprise ou une école qui a coupé l’IA, ou Chrome sur téléphone. La page Diagnostic de Chrome indique la raison exacte.', { info });
  } else if (!usable) {
    note('Cet ordinateur ne peut pas faire tourner l’IA de Chrome',
      'Il faut Windows 10/11, macOS 13+ ou Linux, 22 Go libres sur le disque, et 16 Go de mémoire (4 cœurs) ou une carte graphique de plus de 4 Go. Libérez de la place sur le disque si besoin, puis cliquez Revérifier.', { info });
  } else if (!st.fr) {
    note('Le français n’est pas encore officiel dans votre Chrome',
      `L’IA marche, mais Chrome ${v} ne gère officiellement le français qu’à partir de la version 149 : les textes peuvent être moins bons. Mettez Chrome à jour pour de meilleurs résultats.`, { info, actions: false });
  } else if (st.status !== 'available') {
    note('Première utilisation',
      'Au premier clic sur Reformuler, Chrome télécharge son IA (plusieurs Go, une seule fois). Ensuite, tout marche même sans Internet.', { info, actions: false });
  } else {
    note('');
  }
  updateButtons();
}

// Vide les deux zones ; « Annuler » les remet.
function clearAll() {
  const draft = $('rdDraft');
  const out = $('rdOut');
  const before = { draft: draft.value, out: out.value };
  draft.value = out.value = '';
  setTag();
  save();
  updateButtons();
  draft.focus();
  showToast('Texte effacé', {
    actionLabel: 'Annuler',
    onClick: () => { draft.value = before.draft; out.value = before.out; save(); updateButtons(); },
  });
}

export function initRediger() {
  const draft = $('rdDraft');
  const out = $('rdOut');
  const saved = load();
  draft.value = saved.draft ?? '';
  out.value = saved.out ?? '';
  setTag();
  updateButtons();

  check();
  $('rdCheck').addEventListener('click', check);
  $('rdDiag').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://on-device-internals' }));

  draft.addEventListener('input', () => { save(); updateButtons(); });
  out.addEventListener('input', () => { save(); updateButtons(); });
  draft.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
  $('rdGo').addEventListener('click', run);
  $('rdClear').addEventListener('click', clearAll);
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
