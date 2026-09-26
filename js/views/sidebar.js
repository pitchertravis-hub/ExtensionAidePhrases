// Colonne de gauche : choix de la liste, favoris et rubriques.
import { store } from '../store.js';
import { state, render, rubriques, onRender, icon } from '../state.js';
import { stats } from '../core/stats.js';
import { askText, confirmAction } from '../ui/dialog.js';
import { openMenu, bindMenu } from '../ui/menu.js';
import { escapeHtml } from '../core/text.js';

const $ = (id) => document.getElementById(id);
const select = $('listSelect');
const nav = $('nav');
const listMenu = $('listMenu');
const rubMenu = $('rubMenu');
let menuIndex = -1;
let sortable = null;

export function favCount(listName = state.list) {
  let n = 0;
  for (const r of rubriques(listName)) for (const p of r.phrases) if (stats.isFav(p)) n++;
  return n;
}

// Ouvre une rubrique (ou les favoris) et vide la recherche.
export function openRubrique(index, mode = 'rub') {
  state.mode = mode;
  if (mode === 'rub') state.rub = index;
  state.q = '';
  $('q').value = '';
  state.sel = 0;
  state.edit = state.fill = null;
  state.tab = 'ph';
  render();
}

export function setList(name) {
  state.list = name;
  store.selectedList = name;
  state.rub = 0;
  state.mode = 'rub';
  state.sel = 0;
  state.edit = state.fill = null;
}

function renderSide() {
  const names = store.listNames();
  if (!names.includes(state.list)) setList(names[0] ?? '');
  select.textContent = '';
  if (!names.length) select.append(new Option('Aucune liste', ''));
  for (const n of names) select.append(new Option(n, n));
  select.value = state.list;

  const rubs = rubriques();
  if (state.rub >= rubs.length) state.rub = Math.max(0, rubs.length - 1);
  const onPh = state.tab === 'ph' && !state.q;
  let h = '';
  if (state.list) {
    h += `<li class="fav"><button class="item" type="button" data-fav="1" aria-current="${onPh && state.mode === 'fav'}">${icon('star')}<span class="n">Favoris</span><span class="c">${favCount()}</span></button></li><li class="sep" aria-hidden="true"></li>`;
  }
  rubs.forEach((r, i) => {
    h += `<li class="r" data-r="${i}"><button class="item" type="button" data-r="${i}" aria-current="${onPh && state.mode === 'rub' && state.rub === i}" title="${escapeHtml(r.name)}"><span class="n">${escapeHtml(r.name)}</span><span class="c">${r.phrases.length}</span></button><button class="ibtn more" type="button" aria-label="Actions sur la rubrique">${icon('dots')}</button></li>`;
  });
  nav.innerHTML = h;
  nav.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

// ---------- Listes ----------
const uniqueName = (existing) => (v) => (existing.includes(v) ? `« ${v} » existe déjà.` : v ? '' : 'Saisissez un nom.');

async function newList() {
  const name = await askText('Nouvelle liste', '', { validate: uniqueName(store.listNames()) });
  if (!name) return;
  store.lists[name] = { rubriques: [] };
  store.save();
  setList(name);
  render();
}

async function renameList() {
  const old = state.list;
  if (!old) return;
  const name = await askText('Renommer la liste', old, { validate: uniqueName(store.listNames().filter((n) => n !== old)) });
  if (!name || name === old) return;
  store.lists = Object.fromEntries(Object.entries(store.lists).map(([k, v]) => [k === old ? name : k, v]));
  store.save();
  state.list = name;
  store.selectedList = name;
  render();
}

async function deleteList() {
  const name = state.list;
  if (!name) return;
  const ok = await confirmAction('Supprimer la liste ?', `« ${name} » et ses ${rubriques(name).length} rubrique(s) seront supprimées.`);
  if (!ok) return;
  delete store.lists[name];
  store.save();
  setList(store.listNames()[0] ?? '');
  render();
}

// ---------- Rubriques ----------
export async function addRubrique() {
  if (!state.list) await newList();
  if (!state.list) return;
  const name = await askText('Nouvelle rubrique', '', { validate: (v) => (v ? '' : 'Saisissez un nom.') });
  if (!name) return;
  store.lists[state.list].rubriques.push({ name, phrases: [] });
  store.save();
  openRubrique(rubriques().length - 1);
}

async function renameRubrique(i) {
  const r = rubriques()[i];
  if (!r) return;
  const name = await askText('Renommer la rubrique', r.name);
  if (!name) return;
  r.name = name;
  store.save();
  render();
}

async function deleteRubrique(i) {
  const rubs = rubriques();
  const r = rubs[i];
  if (!r) return;
  const ok = await confirmAction('Supprimer la rubrique ?', `« ${r.name} » et ses ${r.phrases.length} phrase(s) seront supprimées.`);
  if (!ok) return;
  rubs.splice(i, 1);
  store.save();
  if (state.rub > i || state.rub >= rubs.length) state.rub = Math.max(0, state.rub - 1);
  render();
}

export function initSidebar() {
  onRender(renderSide);

  select.addEventListener('change', () => {
    setList(select.value);
    openRubrique(0);
  });
  select.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openMenu(listMenu, { x: e.clientX, y: e.clientY });
  });
  $('listMenuBtn').addEventListener('click', (e) => {
    listMenu.querySelector('[data-act="rename"]').disabled = !state.list;
    listMenu.querySelector('[data-act="delete"]').disabled = !state.list;
    openMenu(listMenu, { anchor: e.currentTarget });
  });
  bindMenu(listMenu, (act) => ({ new: newList, rename: renameList, delete: deleteList })[act]?.());

  nav.addEventListener('click', (e) => {
    const more = e.target.closest('.more');
    if (more) {
      menuIndex = Number(more.closest('li').dataset.r);
      openMenu(rubMenu, { anchor: more });
      return;
    }
    const item = e.target.closest('.item');
    if (!item) return;
    if (item.dataset.fav) openRubrique(0, 'fav');
    else openRubrique(Number(item.dataset.r));
  });
  nav.addEventListener('contextmenu', (e) => {
    const li = e.target.closest('li.r');
    if (!li) return;
    e.preventDefault();
    menuIndex = Number(li.dataset.r);
    openMenu(rubMenu, { x: e.clientX, y: e.clientY });
  });
  bindMenu(rubMenu, (act) => (act === 'rename' ? renameRubrique(menuIndex) : deleteRubrique(menuIndex)));
  $('addRubBtn').addEventListener('click', addRubrique);

  if (window.Sortable) {
    sortable = new Sortable(nav, {
      animation: 150,
      draggable: 'li.r',
      filter: '.more',
      preventOnFilter: false,
      onEnd(evt) {
        const from = evt.oldDraggableIndex;
        const to = evt.newDraggableIndex;
        if (from === to) return;
        const rubs = rubriques();
        const open = rubs[state.rub];
        const [moved] = rubs.splice(from, 1);
        rubs.splice(to, 0, moved);
        state.rub = rubs.indexOf(open);
        store.save();
        render();
      },
    });
  }
}
