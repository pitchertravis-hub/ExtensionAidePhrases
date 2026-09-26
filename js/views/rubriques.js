// Vue 1 · Listes et rubriques.
import { store } from '../store.js';
import { show, icon } from '../app.js';
import { normalizeText, fuzzyMatch, similarity } from '../core/text.js';
import { createVoice } from '../core/voice.js';
import { exportJson, exportCsv, readImportFile, mergeLists } from '../core/backup.js';
import { askText, confirmAction, inform } from '../ui/dialog.js';
import { openMenu, bindMenu } from '../ui/menu.js';
import { showToast } from '../ui/toast.js';
import { openPhrases } from './phrases.js';

const $ = (id) => document.getElementById(id);
const select = $('listSelect');
const ul = $('rubriqueList');
const search = $('searchBar');
const emptyEl = $('rubEmpty');
const countEl = $('rubCount');
const listMenu = $('listMenu');
const rubMenu = $('rubMenu');
const settingsMenu = $('settingsMenu');
const fileInput = $('fileInput');

let sortable = null;
let menuIndex = -1;

const currentList = () => select.value;

function uniqueName(existing, label) {
  return (v) => (existing.includes(v) ? `« ${v} » existe déjà.` : v ? '' : `Saisissez un nom de ${label}.`);
}

// ---------- Affichage ----------
export function renderLists() {
  const names = store.listNames();
  let selected = store.selectedList;
  if (!names.includes(selected)) selected = names[0] ?? '';
  select.textContent = '';
  if (!names.length) select.append(new Option('Aucune liste', ''));
  for (const name of names) select.append(new Option(name, name));
  select.value = selected;
  store.selectedList = selected;
  renderRubriques();
}

export function renderRubriques() {
  const listName = currentList();
  const rubs = store.rubriques(listName);
  ul.textContent = '';
  rubs.forEach((r, i) => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.dataset.index = i;
    li.title = r.name;
    li.innerHTML = `<span class="n"></span><span class="c"></span>
      <button class="ibtn more" type="button" aria-label="Actions sur la rubrique">${icon('dots')}</button>`;
    li.querySelector('.n').textContent = r.name;
    li.querySelector('.c').textContent = r.phrases.length;
    ul.append(li);
  });
  countEl.textContent = rubs.length || '';
  applySearch();
}

function applySearch() {
  const q = normalizeText(search.value);
  let visible = 0;
  for (const li of ul.children) {
    const match = !q || fuzzyMatch(q, normalizeText(li.querySelector('.n').textContent));
    li.hidden = !match;
    if (match) visible++;
  }
  sortable?.option('disabled', !!q);
  const listName = currentList();
  emptyEl.hidden = visible > 0;
  emptyEl.textContent = !listName
    ? 'Créez une liste avec le bouton ⋯.'
    : store.rubriques(listName).length
      ? 'Aucune rubrique trouvée.'
      : 'Aucune rubrique dans cette liste.';
}

// Surligne la rubrique la plus proche de ce qui a été dit.
function highlightBest(transcript) {
  let best = null;
  let bestScore = 0;
  for (const li of ul.children) {
    li.classList.remove('hl');
    const score = similarity(transcript, li.querySelector('.n').textContent);
    if (score > bestScore) { bestScore = score; best = li; }
  }
  if (best && bestScore > 0.4) {
    best.classList.add('hl');
    best.scrollIntoView({ block: 'nearest' });
  }
}

// ---------- Listes ----------
async function newList() {
  const name = await askText('Nouvelle liste', '', { validate: uniqueName(store.listNames(), 'liste') });
  if (!name) return;
  store.lists[name] = { rubriques: [] };
  store.save();
  store.selectedList = name;
  renderLists();
}

async function renameList() {
  const old = currentList();
  if (!old) return;
  const others = store.listNames().filter((n) => n !== old);
  const name = await askText('Renommer la liste', old, { validate: uniqueName(others, 'liste') });
  if (!name || name === old) return;
  // Garde l'ordre des listes.
  store.lists = Object.fromEntries(Object.entries(store.lists).map(([k, v]) => [k === old ? name : k, v]));
  store.save();
  store.selectedList = name;
  renderLists();
}

async function deleteList() {
  const name = currentList();
  if (!name) return;
  const n = store.rubriques(name).length;
  const ok = await confirmAction('Supprimer la liste ?', `« ${name} » et ses ${n} rubrique(s) seront supprimées.`);
  if (!ok) return;
  delete store.lists[name];
  store.save();
  renderLists();
}

// ---------- Rubriques ----------
async function addRubrique() {
  let listName = currentList();
  if (!listName) {
    await newList();
    listName = currentList();
    if (!listName) return;
  }
  const name = await askText('Nouvelle rubrique', '', { validate: (v) => (v ? '' : 'Saisissez un nom de rubrique.') });
  if (!name) return;
  store.lists[listName].rubriques.push({ name, phrases: [] });
  store.save();
  search.value = '';
  renderRubriques();
  ul.lastElementChild?.scrollIntoView({ block: 'nearest' });
}

async function renameRubrique(i) {
  const r = store.rubriques(currentList())[i];
  if (!r) return;
  const name = await askText('Renommer la rubrique', r.name);
  if (!name) return;
  r.name = name;
  store.save();
  renderRubriques();
}

async function deleteRubrique(i) {
  const rubs = store.rubriques(currentList());
  const r = rubs[i];
  if (!r) return;
  const ok = await confirmAction('Supprimer la rubrique ?', `« ${r.name} » et ses ${r.phrases.length} phrase(s) seront supprimées.`);
  if (!ok) return;
  rubs.splice(i, 1);
  store.save();
  renderRubriques();
}

// ---------- Réglages ----------
function updateThemeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const btn = settingsMenu.querySelector('[data-act="theme"]');
  btn.querySelector('span').textContent = dark ? 'Thème clair' : 'Thème sombre';
  btn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
}

function toggleTheme() {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  store.theme = dark ? 'dark' : 'light';
  updateThemeLabel();
}

export function renderBackupInfo() {
  const el = $('backupInfo');
  const d = store.lastExport;
  if (d) {
    const late = Date.now() - d.getTime() > 7 * 24 * 3600 * 1000;
    el.innerHTML = `<i${late ? ' class="late"' : ''}></i>`;
    el.append(`Sauvegardé ${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`);
  } else {
    el.textContent = 'Pas de sauvegarde';
  }
}

async function importFile(file) {
  try {
    const lists = await readImportFile(file);
    const nbRub = Object.values(lists).reduce((s, l) => s + l.rubriques.length, 0);
    const ok = await confirmAction(
      'Importer ce fichier ?',
      `${Object.keys(lists).length} liste(s), ${nbRub} rubrique(s).\nLes données sont ajoutées aux vôtres, rien n'est effacé.`,
      'Importer',
    );
    if (!ok) return;
    const s = mergeLists(lists);
    renderLists();
    showToast(`Import : ${s.lists} liste(s), ${s.rubriques} rubrique(s), ${s.phrases} phrase(s) ajoutées.`, { duration: 6000 });
  } catch (e) {
    console.error(e);
    inform('Import impossible', e.message || 'Fichier illisible.');
  }
}

async function onSettings(act) {
  if (act === 'import') {
    fileInput.value = '';
    fileInput.click();
  } else if (act === 'export-json') {
    exportJson();
    store.lastExport = new Date();
    renderBackupInfo();
  } else if (act === 'export-csv') {
    exportCsv();
  } else if (act === 'theme') {
    toggleTheme();
  }
}

// ---------- Initialisation ----------
export function initRubriques() {
  select.addEventListener('change', () => {
    store.selectedList = select.value;
    search.value = '';
    renderRubriques();
  });
  select.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openMenu(listMenu, { x: e.clientX, y: e.clientY });
  });

  $('listMenuBtn').addEventListener('click', (e) => {
    const hasList = !!currentList();
    listMenu.querySelector('[data-act="rename"]').disabled = !hasList;
    listMenu.querySelector('[data-act="delete"]').disabled = !hasList;
    openMenu(listMenu, { anchor: e.currentTarget });
  });
  bindMenu(listMenu, (act) => ({ new: newList, rename: renameList, delete: deleteList })[act]?.());

  $('settingsBtn').addEventListener('click', (e) => openMenu(settingsMenu, { anchor: e.currentTarget }));
  bindMenu(settingsMenu, onSettings);
  fileInput.addEventListener('change', () => fileInput.files[0] && importFile(fileInput.files[0]));

  $('addRubriqueBtn').addEventListener('click', addRubrique);
  $('openNav').addEventListener('click', () => show('nav'));
  search.addEventListener('input', applySearch);

  // Clic, clavier, clic droit et bouton ⋯ sur une rubrique.
  const openRubMenu = (li, pos) => {
    menuIndex = Number(li.dataset.index);
    openMenu(rubMenu, pos);
  };
  ul.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    if (e.target.closest('.more')) openRubMenu(li, { anchor: e.target.closest('.more') });
    else openPhrases(currentList(), Number(li.dataset.index));
  });
  ul.addEventListener('keydown', (e) => {
    const li = e.target.closest('li');
    if (li && e.target === li && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openPhrases(currentList(), Number(li.dataset.index));
    }
  });
  ul.addEventListener('contextmenu', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    e.preventDefault();
    openRubMenu(li, { x: e.clientX, y: e.clientY });
  });
  bindMenu(rubMenu, (act) => (act === 'rename' ? renameRubrique(menuIndex) : deleteRubrique(menuIndex)));

  // Micro : masqué si Chrome ne gère pas la reconnaissance vocale.
  const mic = $('micBtn');
  const voice = createVoice({
    onText: (t) => highlightBest(t),
    onState: (on) => {
      mic.classList.toggle('is-on', on);
      mic.title = on ? 'Arrêter l’écoute' : 'Recherche vocale';
    },
  });
  if (voice) mic.addEventListener('click', () => voice.toggle());
  else mic.hidden = true;

  if (window.Sortable) {
    sortable = new Sortable(ul, {
      animation: 150,
      filter: '.more',
      preventOnFilter: false,
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        const rubs = store.rubriques(currentList());
        const [moved] = rubs.splice(evt.oldIndex, 1);
        rubs.splice(evt.newIndex, 0, moved);
        store.save();
        renderRubriques();
      },
    });
  }

  updateThemeLabel();
}
