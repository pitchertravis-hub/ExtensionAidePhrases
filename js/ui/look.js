// Menu Apparence, en deux onglets :
// - Couleurs : palette, couleurs Perso, bandeau en dégradé, disposition et mode ;
// - Affichage : taille du texte, densité, coins, police, motif de fond, colonne des rubriques.
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
  ['fuchsia', 'Fuchsia pop', '#5A1646', '#FF5FAE'],
  ['pharmacie', 'Pharmacie', '#0B4D2C', '#2BB673'],
  ['neon', 'Néon rétro 80', '#1A0B33', '#FF3CAC'],
  ['minimal', 'Minimal noir & blanc', '#111111', '#FFFFFF'],
  ['terminal', 'Terminal', '#050A06', '#8CFFA8'],
  ['brutal', 'Brutal', '#000000', '#FFE600'],
];
// [groupe, [[id, nom affiché]]] : les id correspondent à css/affichage.css et css/fonts.css.
const FONTS = [
  ['Sans empattement', [['manrope', 'Manrope'], ['system', 'Système'], ['dmsans', 'DM Sans'], ['outfit', 'Outfit']]],
  ['Très lisibles', [['atkinson', 'Atkinson Hyperlegible'], ['lexend', 'Lexend']]],
  ['Arrondies', [['nunito', 'Nunito'], ['quicksand', 'Quicksand'], ['fredoka', 'Fredoka'], ['comicneue', 'Comic Neue']]],
  ['Avec empattements', [['lora', 'Lora'], ['merriweather', 'Merriweather']]],
  ['Écrites à la main', [['patrickhand', 'Patrick Hand'], ['kalam', 'Kalam']]],
  ['Machine à écrire et code', [['courierprime', 'Courier Prime'], ['jetbrainsmono', 'JetBrains Mono'], ['ibmplexmono', 'IBM Plex Mono']]],
];
const KEYS = { palette: 'zt-palette', layout: 'zt-layout', theme: 'theme', perso: 'zt-perso', affichage: 'zt-affichage' };

const root = document.documentElement;
const menu = document.getElementById('lookMenu');
const pals = document.getElementById('lookPals');
const persoRail = document.getElementById('persoRail');
const persoAccent = document.getElementById('persoAccent');
const gradOn = document.getElementById('gradOn');
const gradColor = document.getElementById('gradColor');

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

// [id, nom] des motifs de fond (css/affichage.css).
const PATTERNS = [['none', 'Aucun'], ['dots', 'Points'], ['polka', 'Pois'], ['lines', 'Rayures'], ['ruled', 'Lignes'], ['grid', 'Carreaux'],
  ['cross', 'Croix'], ['diamonds', 'Losanges'], ['waves', 'Vagues'], ['zigzag', 'Zigzag'], ['stars', 'Étoiles'], ['bubbles', 'Bulles']];
const persoBox = document.getElementById('persoBox');
const sideRange = document.getElementById('sideRange');
const sideVal = document.getElementById('sideVal');

// Couleurs de la palette « Perso » : calculées par theme.js (tpApplyPerso).
function showPerso(cfg) {
  persoRail.value = cfg.rail.toLowerCase();
  persoAccent.value = cfg.accent.toLowerCase();
  const pv = pals.querySelector('[data-v="perso"] .pv');
  if (pv) { pv.style.setProperty('--pv-rail', cfg.rail); pv.style.setProperty('--pv-acc', cfg.accent); }
}

// Réglages d'affichage : appliqués par theme.js (tpApplyAffichage), qui renvoie les valeurs retenues.
let aff = window.tpApplyAffichage(read(KEYS.affichage));
let gradLast = aff.grad || '#5a2a6a';
export function setAffichage(patch) {
  aff = window.tpApplyAffichage(JSON.stringify({ ...aff, ...patch }));
  save(KEYS.affichage, JSON.stringify(aff));
  if (menu.matches(':popover-open')) sync();
}

function sync() {
  menu.querySelectorAll('#lookPals button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === root.dataset.palette)));
  menu.querySelectorAll('[data-g] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === root.dataset[b.parentElement.dataset.g])));
  menu.querySelectorAll('[data-a] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === aff[b.parentElement.dataset.a])));
  persoBox.hidden = root.dataset.palette !== 'perso';
  gradOn.checked = !!aff.grad;
  gradColor.value = aff.grad || gradLast;
  gradColor.disabled = !aff.grad;
  sideRange.value = aff.sideW;
  sideVal.textContent = aff.sideW + ' px';
}

// Applique un réglage reçu d'une autre fenêtre (événement storage).
export function applyLookFromStorage(key, value) {
  if (!value) return false;
  if (key === KEYS.palette) root.dataset.palette = value;
  else if (key === KEYS.layout) root.dataset.layout = value;
  else if (key === KEYS.theme) root.dataset.theme = value;
  else if (key === KEYS.perso) showPerso(window.tpApplyPerso(value));
  else if (key === KEYS.affichage) aff = window.tpApplyAffichage(value);
  else return false;
  if (menu.matches(':popover-open')) sync();
  return true;
}

export function openLookMenu(anchor) {
  sync();
  openMenu(menu, { anchor });
}

function showTab(id) {
  menu.querySelectorAll('#lookTabs button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.t === id));
    document.getElementById(b.dataset.t).hidden = b.dataset.t !== id;
  });
}

export function initLook() {
  pals.innerHTML = PALETTES.map(([id, name, dark, acc]) =>
    `<button type="button" class="tile" data-v="${id}" title="${name}"><span class="pv" style="--pv-rail:${dark};--pv-acc:${acc}"><i></i></span><span class="nm">${name}</span></button>`).join('') +
    '<button type="button" class="tile" data-v="perso" title="Mes couleurs"><span class="pv"><i></i></span><span class="nm">Perso</span></button>';
  // Chaque nom est écrit dans sa police : data-font sur le bouton lui donne son --font (css/affichage.css).
  document.getElementById('lookFonts').innerHTML = FONTS.map(([grp, list]) => `<div class="grp">${grp}</div>` +
    list.map(([id, name]) => `<button type="button" data-v="${id}" data-font="${id}">${name}</button>`).join('')).join('');
  // Chaque vignette montre son motif : data-pattern sur l'aperçu lui donne son --pat.
  document.getElementById('lookPats').innerHTML = PATTERNS.map(([id, name]) =>
    `<button type="button" class="tile" data-v="${id}"><span class="pv" data-pattern="${id}"></span><span class="nm">${name}</span></button>`).join('');
  showPerso(window.tpApplyPerso(read(KEYS.perso)));

  // Changer une couleur passe directement en « Perso » et s'applique en direct.
  const onPick = () => {
    const json = JSON.stringify({ rail: persoRail.value, accent: persoAccent.value });
    save(KEYS.perso, json);
    showPerso(window.tpApplyPerso(json));
    if (root.dataset.palette !== 'perso') { root.dataset.palette = 'perso'; save(KEYS.palette, 'perso'); sync(); }
  };
  persoRail.addEventListener('input', onPick);
  persoAccent.addEventListener('input', onPick);
  gradOn.addEventListener('change', () => setAffichage({ grad: gradOn.checked ? gradLast : '' }));
  gradColor.addEventListener('input', () => { gradLast = gradColor.value; if (aff.grad) setAffichage({ grad: gradLast }); });
  // Largeur : appliquée en direct pendant le glissé, enregistrée au lâcher.
  sideRange.addEventListener('input', () => { root.style.setProperty('--side-w', sideRange.value + 'px'); sideVal.textContent = sideRange.value + ' px'; });
  sideRange.addEventListener('change', () => setAffichage({ sideW: +sideRange.value }));

  menu.addEventListener('click', (e) => {
    const tab = e.target.closest('#lookTabs button');
    if (tab) { showTab(tab.dataset.t); return; }
    if (e.target.closest('#sideReset')) { setAffichage({ sideW: 200 }); return; }
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    const box = b.parentElement;
    if (box === pals) { root.dataset.palette = b.dataset.v; save(KEYS.palette, b.dataset.v); }
    else if (box.dataset.g === 'layout') { root.dataset.layout = b.dataset.v; save(KEYS.layout, b.dataset.v); }
    else if (box.dataset.g === 'theme') { root.dataset.theme = b.dataset.v; save(KEYS.theme, b.dataset.v); }
    else if (box.dataset.a) { setAffichage({ [box.dataset.a]: b.dataset.v }); }
    sync();
  });
  initSideGrip();
  initSideAuto();
}

// Bord droit de la colonne des rubriques : glisser pour changer sa largeur, double-clic pour revenir à 200 px.
function initSideGrip() {
  const grip = document.getElementById('sideGrip');
  const side = grip.parentElement;
  grip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const left = side.getBoundingClientRect().left;
    let w = aff.sideW;
    grip.setPointerCapture(e.pointerId);
    grip.classList.add('drag');
    root.classList.add('resizing');
    const move = (ev) => {
      w = Math.max(150, Math.min(320, Math.round(ev.clientX - left)));
      root.style.setProperty('--side-w', w + 'px');
    };
    const end = () => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', end);
      grip.removeEventListener('pointercancel', end);
      grip.classList.remove('drag');
      root.classList.remove('resizing');
      setAffichage({ sideW: w });
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  });
  grip.addEventListener('dblclick', () => setAffichage({ sideW: 200 }));
}

// Colonne « Repliée » : cachée ; elle s'ouvre quand la souris touche le bord gauche de la fenêtre
// (zone #sideEdge) ou avec le bouton Rubriques, et se replie dès que la souris part (y compris hors
// de la fenêtre), sauf pendant une liste déroulante ou un menu ⋯ ouvert.
function initSideAuto() {
  const side = document.querySelector('.side');
  const edge = document.getElementById('sideEdge');
  const toggle = document.getElementById('sideToggle');
  let inside = false, picking = false, timer = 0;
  const set = (open) => {
    clearTimeout(timer);
    side.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  const later = (open, ms) => { clearTimeout(timer); timer = setTimeout(() => set(open), ms); };
  const maybeClose = () => { if (!inside && !picking) later(false, 250); };
  const over = (el) => el && (side.contains(el) || el === edge || toggle.contains(el));

  edge.addEventListener('pointerenter', () => { inside = true; later(true, 60); });
  side.addEventListener('pointerenter', () => { inside = true; clearTimeout(timer); });
  side.addEventListener('pointerleave', (e) => { if (!over(e.relatedTarget)) { inside = false; maybeClose(); } });
  toggle.addEventListener('click', () => { const open = !side.classList.contains('open'); inside = open; set(open); });
  // Filets de sécurité : souris ailleurs dans la fenêtre, hors de la fenêtre, ou fenêtre quittée.
  document.addEventListener('pointermove', (e) => {
    if (side.classList.contains('open') && !over(e.target)) { inside = false; maybeClose(); }
  });
  document.documentElement.addEventListener('pointerleave', () => { inside = false; maybeClose(); });
  window.addEventListener('blur', () => { inside = false; picking = false; set(false); });
  // Un clic sur une rubrique : on la montre et on replie.
  side.addEventListener('click', (e) => { if (e.target.closest('.nav .item') && root.dataset.side === 'auto') { inside = false; later(false, 150); } });
  side.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('pointerdown', () => { picking = true; });
    sel.addEventListener('change', () => { picking = false; maybeClose(); });
    sel.addEventListener('blur', () => { picking = false; maybeClose(); });
  });
  ['listMenu', 'rubMenu'].forEach((id) => document.getElementById(id)?.addEventListener('toggle', (e) => { if (e.newState === 'closed') maybeClose(); }));
}
