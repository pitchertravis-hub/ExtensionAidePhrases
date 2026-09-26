// Démarrage : barre du haut, onglets, clavier, réglages.
import { store } from './store.js';
import { state, render, onRender } from './state.js';
import { stats } from './core/stats.js';
import { backupIfDue, exportJson, exportCsv, readImportFile, mergeLists } from './core/backup.js';
import { createVoice } from './core/voice.js';
import { confirmAction, inform } from './ui/dialog.js';
import { openMenu, bindMenu } from './ui/menu.js';
import { showToast } from './ui/toast.js';
import { initSidebar, setList } from './views/sidebar.js';
import { initPhrases, moveSel, copyItem, editItem, toggleFavItem, selected, hasItems, addPhrase } from './views/phrases.js';
import { initNavigation } from './views/navigation-id.js';

const $ = (id) => document.getElementById(id);
const q = $('q');
const settingsMenu = $('settingsMenu');
const isPopup = document.documentElement.classList.contains('is-popup');

// ---------- Onglets ----------
function renderTabs() {
  $('tabBtnPh').setAttribute('aria-selected', state.tab === 'ph');
  $('tabBtnId').setAttribute('aria-selected', state.tab === 'id');
  $('tabPh').hidden = state.tab !== 'ph';
  $('tabId').hidden = state.tab !== 'id';
}
function setTab(tab) {
  state.tab = tab;
  state.edit = state.fill = null;
  render();
}
$('tabBtnPh').addEventListener('click', () => setTab('ph'));
$('tabBtnId').addEventListener('click', () => setTab('id'));

// ---------- Recherche ----------
q.addEventListener('input', () => {
  state.q = q.value;
  state.sel = 0;
  state.edit = state.fill = null;
  state.tab = 'ph';
  render();
});

// ---------- Clavier ----------
const typing = (el) => el.matches('input, textarea, select, [contenteditable="true"]');

document.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]') || e.defaultPrevented) return;
  const inSearch = e.target === q;
  if (typing(e.target) && !inSearch) return;

  if (e.key === '/' && !inSearch) { e.preventDefault(); q.focus(); q.select(); return; }
  if (e.key === 'Escape' && inSearch && q.value) { e.preventDefault(); q.value = ''; q.dispatchEvent(new Event('input')); return; }
  if (state.tab !== 'ph' || state.edit) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); moveSel(e.key === 'ArrowDown' ? 1 : -1); return; }
  if (e.key === 'Enter' && hasItems() && !e.target.closest('button')) { e.preventDefault(); copyItem(selected()); return; }
  if (inSearch || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'e' || e.key === 'E') { e.preventDefault(); editItem(selected()); }
  else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFavItem(selected()); }
  else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); addPhrase(); }
});

// ---------- Recherche vocale ----------
const mic = $('micBtn');
const voice = createVoice({
  onText: (t) => { q.value = t; q.dispatchEvent(new Event('input')); },
  onState: (on) => { mic.classList.toggle('on', on); mic.title = on ? 'Arrêter l’écoute' : 'Recherche vocale'; },
});
if (voice) mic.addEventListener('click', () => voice.toggle());
else mic.hidden = true;

// ---------- Réglages ----------
function updateSettingsMenu() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const theme = settingsMenu.querySelector('[data-act="theme"]');
  theme.querySelector('span').textContent = dark ? 'Thème clair' : 'Thème sombre';
  theme.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
  const panel = settingsMenu.querySelector('[data-act="panel"]');
  panel.querySelector('span').textContent = isPopup ? 'Ancrer sur le côté' : 'Fermer le panneau';
  panel.hidden = !chrome?.sidePanel;
}

function renderBackupInfo() {
  const el = $('backupInfo');
  const d = store.lastExport;
  if (!d) { el.textContent = 'Pas de sauvegarde'; return; }
  const late = Date.now() - d.getTime() > 7 * 24 * 3600 * 1000;
  el.innerHTML = `<i${late ? ' class="late"' : ''}></i>`;
  el.append(`Sauvegardé ${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`);
}

// L'identifiant de fenêtre est lu d'avance : Chrome n'ouvre le panneau
// que dans la foulée du clic.
let windowId = null;
chrome.windows?.getCurrent().then((w) => { windowId = w.id; }).catch(() => {});

function openSidePanel() {
  chrome.sidePanel.open({ windowId })
    .then(() => window.close())
    .catch((e) => {
      console.error(e);
      inform('Panneau latéral indisponible', 'Mettez Chrome à jour (version 116 ou plus récente).');
    });
}

async function importFile(file) {
  try {
    const lists = await readImportFile(file);
    const nbRub = Object.values(lists).reduce((s, l) => s + l.rubriques.length, 0);
    const ok = await confirmAction('Importer ce fichier ?',
      `${Object.keys(lists).length} liste(s), ${nbRub} rubrique(s).\nLes données sont ajoutées aux vôtres, rien n'est effacé.`, 'Importer');
    if (!ok) return;
    const s = mergeLists(lists);
    render();
    showToast(`Import : ${s.lists} liste(s), ${s.rubriques} rubrique(s), ${s.phrases} phrase(s) ajoutées.`, { duration: 6000 });
  } catch (e) {
    console.error(e);
    inform('Import impossible', e.message || 'Fichier illisible.');
  }
}

$('settingsBtn').addEventListener('click', (e) => { updateSettingsMenu(); openMenu(settingsMenu, { anchor: e.currentTarget }); });
bindMenu(settingsMenu, (act) => {
  if (act === 'panel') {
    if (isPopup) openSidePanel();
    else window.close();
  } else if (act === 'shortcut') {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  } else if (act === 'import') {
    $('fileInput').value = '';
    $('fileInput').click();
  } else if (act === 'export-json') {
    exportJson();
    store.lastExport = new Date();
    renderBackupInfo();
  } else if (act === 'export-csv') {
    exportCsv();
  } else if (act === 'theme') {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    store.theme = dark ? 'dark' : 'light';
  }
});
$('fileInput').addEventListener('change', (e) => e.target.files[0] && importFile(e.target.files[0]));

// ---------- Démarrage ----------
store.load();
setList(store.selectedList);
onRender(renderTabs);
initSidebar();
initPhrases();
initNavigation();
render();

try {
  $('version').textContent = 'v' + chrome.runtime.getManifest().version;
} catch {
  $('version').textContent = '';
}
backupIfDue();
renderBackupInfo();
q.focus();

// Texte d'aide plus court dans le panneau étroit.
const narrow = matchMedia('(max-width: 619px)');
const setPlaceholder = () => { q.placeholder = narrow.matches ? 'Rechercher partout' : 'Chercher une rubrique, une phrase ou un menu ID'; };
narrow.addEventListener('change', setPlaceholder);
setPlaceholder();

// Fenêtre et panneau ouverts en même temps : on se tient à jour.
window.addEventListener('storage', (e) => {
  if (!e.key || ['listes', 'zt-favs', 'zt-used'].includes(e.key)) {
    if (state.edit) return;
    store.load();
    stats.reload();
    render();
  } else if (e.key === 'theme' && e.newValue) {
    document.documentElement.dataset.theme = e.newValue;
  }
});
