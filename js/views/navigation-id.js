// Vue 3 · Navigation ID : construit la phrase « chemin à suivre » dans le logiciel ID.
import { MODULES } from '../data/id-menus.js';
import { store, DEFAULT_INTRO } from '../store.js';
import { show, copyToClipboard, icon } from '../app.js';
import { normalizeText, escapeHtml } from '../core/text.js';
import { askText } from '../ui/dialog.js';

const $ = (id) => document.getElementById(id);
const moduleSel = $('module');
const optionSel = $('option');
const subSel = $('subOption');
const searchEl = $('navSearch');
const resultsEl = $('navResults');
const resultEl = $('navResult');
const statusEl = $('navStatus');

const nameOf = (opt) => (typeof opt === 'string' ? opt : opt.name);

function fill(sel, entries, placeholder) {
  sel.textContent = '';
  sel.append(new Option(placeholder, ''));
  for (const [key, label] of entries) sel.append(new Option(`${key} · ${label}`, key));
}

function sortKeys(keys) {
  return keys.sort((a, b) => {
    const alphaA = /^[a-z]+$/i.test(a);
    const alphaB = /^[a-z]+$/i.test(b);
    if (alphaA !== alphaB) return alphaA ? -1 : 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

function updateOptions() {
  const mod = MODULES[moduleSel.value];
  fill(optionSel, mod ? Object.entries(mod.options).map(([k, o]) => [k, nameOf(o)]) : [], 'Choisir une option');
  updateSubOptions();
}

function updateSubOptions() {
  const opt = MODULES[moduleSel.value]?.options[optionSel.value];
  const subs = opt && typeof opt === 'object' ? opt.sub_options : null;
  fill(subSel, subs ? sortKeys(Object.keys(subs)).map((k) => [k, subs[k]]) : [], 'Choisir une sous-option');
  update();
}

function steps() {
  const mod = MODULES[moduleSel.value];
  const opt = mod?.options[optionSel.value];
  const sub = opt?.sub_options?.[subSel.value];
  const path = [];
  if (mod) path.push([moduleSel.value, mod.name]);
  if (opt) path.push([optionSel.value, nameOf(opt)]);
  if (sub) path.push([subSel.value, sub]);
  return { mod, opt, path };
}

function sentence(path) {
  return [store.intro, '• Menu ID', ...path.map(([k, n]) => `• ${k}: ${n}`)].join('\n');
}

async function copyResult() {
  const { path } = steps();
  const ok = await copyToClipboard(sentence(path));
  statusEl.parentElement.classList.toggle('err', !ok);
  statusEl.innerHTML = ok ? `${icon('check')} Copié` : 'Copie impossible';
}

// Met à jour les étapes et, dès qu'une option est choisie, copie la phrase.
function update() {
  const { mod, opt, path } = steps();
  $('stepModule').classList.toggle('set', !!mod);
  $('stepOption').hidden = !mod;
  $('stepOption').classList.toggle('set', !!opt);
  $('stepSub').hidden = !(opt && typeof opt === 'object' && opt.sub_options);
  $('stepSub').classList.toggle('set', !!subSel.value);

  resultEl.hidden = !opt;
  if (!opt) return;
  $('navIntro').textContent = store.intro;
  const ol = $('navPath');
  ol.innerHTML = '<li><span>•</span>Menu ID</li>';
  for (const [k, n] of path) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(k)}</span>`;
    li.append(n);
    ol.append(li);
  }
  copyResult();
}

// ---------- Recherche ----------
const INDEX = [];
for (const [mk, mod] of Object.entries(MODULES)) {
  for (const [ok, opt] of Object.entries(mod.options)) {
    const subs = typeof opt === 'object' ? opt.sub_options : null;
    INDEX.push({ label: nameOf(opt), path: `${mk} ${mod.name} › ${ok}`, mk, ok, sk: '', subs: !!subs });
    if (subs) {
      for (const [sk, sub] of Object.entries(subs)) {
        INDEX.push({ label: sub, path: `${mk} ${mod.name} › ${ok} ${nameOf(opt)} › ${sk}`, mk, ok, sk });
      }
    }
  }
}

let matches = [];
let active = 0;

function highlight(label, query) {
  const i = label.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i < 0) return escapeHtml(label);
  return escapeHtml(label.slice(0, i)) + `<mark>${escapeHtml(label.slice(i, i + query.length))}</mark>` + escapeHtml(label.slice(i + query.length));
}

function renderResults() {
  const raw = searchEl.value.trim();
  const q = normalizeText(raw);
  resultsEl.hidden = !q;
  if (!q) return;
  matches = INDEX.filter((e) => normalizeText(e.label).includes(q) || normalizeText(`${e.sk || e.ok}${e.label}`) === q).slice(0, 40);
  active = 0;
  resultsEl.textContent = '';
  if (!matches.length) {
    resultsEl.innerHTML = '<li class="none">Aucun menu trouvé.</li>';
    return;
  }
  matches.forEach((m, i) => {
    const li = document.createElement('li');
    li.role = 'option';
    li.dataset.i = i;
    li.classList.toggle('on', i === 0);
    li.innerHTML = `<b>${highlight(m.label, raw)}</b><small>${escapeHtml(m.path)}</small>`;
    resultsEl.append(li);
  });
}

function pick(m) {
  searchEl.value = '';
  resultsEl.hidden = true;
  moduleSel.value = m.mk;
  updateOptions();
  optionSel.value = m.ok;
  updateSubOptions();
  if (m.sk) {
    subSel.value = m.sk;
    update();
  }
}

export function initNavigation() {
  fill(moduleSel, Object.entries(MODULES).map(([k, m]) => [k, m.name]), 'Choisir un module');
  updateOptions();

  moduleSel.addEventListener('change', updateOptions);
  optionSel.addEventListener('change', updateSubOptions);
  subSel.addEventListener('change', update);
  $('navCopy').addEventListener('click', copyResult);
  $('backBtn2').addEventListener('click', () => show('rubriques'));

  searchEl.addEventListener('input', renderResults);
  searchEl.addEventListener('keydown', (e) => {
    if (resultsEl.hidden || !matches.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      resultsEl.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i === active));
      resultsEl.children[active]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      searchEl.value = '';
      resultsEl.hidden = true;
    }
  });
  resultsEl.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) pick(matches[Number(li.dataset.i)]);
  });

  $('changeIntroBtn').addEventListener('click', async () => {
    const text = await askText("Phrase d'introduction", store.intro, {
      message: `Texte placé avant le chemin. Par défaut : « ${DEFAULT_INTRO} »`,
    });
    if (!text) return;
    store.intro = text;
    update();
  });
}
