// Menu Apparence : couleurs, disposition (bandeau / colonne sombre) et mode.
// Le choix est gardé dans localStorage et appliqué avant l'affichage par theme.js.
import { openMenu } from './menu.js';

// [id, nom, couleur sombre, accent]
const PALETTES = [
  ['or', 'Noir & or', '#16181D', '#B8904F'],
  ['cuivre', 'Nuit & cuivre', '#14213D', '#C8743F'],
  ['sapin', 'Sapin & laiton', '#16302B', '#B39245'],
  ['bordeaux', 'Bordeaux & or rose', '#3A1621', '#CC8F80'],
  ['corail', 'Ardoise & corail', '#1F2933', '#E4674D'],
  ['prune', 'Prune & ambre', '#2A1B3D', '#DBA036'],
  ['classique', 'Classique bleu', '#161A22', '#23408E'],
  ['halloween', 'Halloween', '#1B1026', '#F5821F'],
  ['noel', 'Noël', '#0F3B2E', '#C22F39'],
];
const KEYS = { palette: 'zt-palette', layout: 'zt-layout', theme: 'theme' };

const root = document.documentElement;
const menu = document.getElementById('lookMenu');
const pals = document.getElementById('lookPals');

function save(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function sync() {
  pals.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === root.dataset.palette)));
  menu.querySelectorAll('#lookLayout button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === root.dataset.layout)));
  menu.querySelectorAll('#lookTheme button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === root.dataset.theme)));
}

// Applique un réglage reçu d'une autre fenêtre (événement storage).
export function applyLookFromStorage(key, value) {
  if (!value) return false;
  if (key === KEYS.palette) root.dataset.palette = value;
  else if (key === KEYS.layout) root.dataset.layout = value;
  else if (key === KEYS.theme) root.dataset.theme = value;
  else return false;
  if (menu.matches(':popover-open')) sync();
  return true;
}

export function openLookMenu(anchor) {
  sync();
  openMenu(menu, { anchor });
}

export function initLook() {
  pals.innerHTML = PALETTES.map(([id, name, dark, acc]) =>
    `<button type="button" data-v="${id}"><span class="sw"><i style="background:${dark}"></i><i style="background:${acc}"></i></span>${name}</button>`).join('');
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    const group = b.closest('#lookPals, #lookLayout, #lookTheme').id;
    if (group === 'lookPals') { root.dataset.palette = b.dataset.v; save(KEYS.palette, b.dataset.v); }
    else if (group === 'lookLayout') { root.dataset.layout = b.dataset.v; save(KEYS.layout, b.dataset.v); }
    else { root.dataset.theme = b.dataset.v; save(KEYS.theme, b.dataset.v); }
    sync();
  });
}
