// État de l'interface partagé par les vues, et rafraîchissement.
import { store } from './store.js';

function readPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export const state = {
  list: '',        // liste affichée
  rub: 0,          // index de la rubrique ouverte
  mode: 'rub',     // 'rub' (une rubrique) ou 'fav' (favoris de la liste)
  q: '',           // recherche en cours
  tab: 'ph',       // 'ph' (phrases) ou 'id' (Navigation ID)
  sort: readPref('zt-sort', 'order'), // 'order' ou 'used'
  sel: 0,          // carte sélectionnée au clavier
  edit: null,      // { l, r, p, isNew } de la phrase en cours de modification
  fill: null,      // { l, r, p } de la phrase dont on remplit les champs
};

export function setSort(value) {
  state.sort = value;
  try { localStorage.setItem('zt-sort', value); } catch {}
}

export function rubriques(listName = state.list) {
  return store.rubriques(listName);
}

const renderers = [];
export function onRender(fn) {
  renderers.push(fn);
}
export function render() {
  for (const fn of renderers) fn();
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Copie impossible', e);
    return false;
  }
}

export function icon(name) {
  return `<svg class="ico"><use href="#i-${name}"/></svg>`;
}
