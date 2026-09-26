// Vue 2 · Phrases d'une rubrique.
import { store } from '../store.js';
import { show, onLeave, copyToClipboard, icon } from '../app.js';
import { htmlToText, linkify, unlinkify, normalizeText } from '../core/text.js';
import { showToast, hideToast } from '../ui/toast.js';

const $ = (id) => document.getElementById(id);
const listEl = $('phraseList');
const titleEl = $('rubriqueTitle');
const countEl = $('phCount');
const listNameEl = $('phListName');
const filterEl = $('phraseFilter');
const emptyEl = $('phEmpty');

// Rubrique ouverte, repérée par son index (et non plus par son nom :
// deux rubriques du même nom ne se mélangent plus).
let current = { list: '', index: -1 };
let sortable = null;
let onChange = () => {};

function rubrique() {
  return store.rubriques(current.list)[current.index];
}

function updateCount() {
  const n = rubrique()?.phrases.length ?? 0;
  countEl.textContent = n === 1 ? '1 phrase' : `${n} phrases`;
}

function renumber() {
  listEl.querySelectorAll('.ph').forEach((ph, i) => {
    ph.dataset.index = i;
    ph.querySelector('.idx span').textContent = String(i + 1).padStart(2, '0');
  });
}

function phraseCard(html, i) {
  const ph = document.createElement('div');
  ph.className = 'ph';
  ph.dataset.index = i;
  ph.innerHTML = `
    <span class="idx" title="Glisser pour déplacer"><span></span>${icon('grip')}</span>
    <div class="txt" contenteditable="true" spellcheck="true"></div>
    <div class="acts">
      <button class="copy" type="button">${icon('copy')}Copier</button>
      <button class="ibtn del" type="button" title="Supprimer la phrase">${icon('trash')}</button>
    </div>`;
  const txt = ph.querySelector('.txt');
  txt.innerHTML = html;
  // Répare les liens mal imbriqués enregistrés par la v2.5, puis refait les liens.
  unlinkify(txt);
  linkify(txt);
  return ph;
}

function render() {
  const r = rubrique();
  listEl.textContent = '';
  if (!r) return;
  r.phrases.forEach((html, i) => listEl.append(phraseCard(html, i)));
  renumber();
  updateCount();
  applyFilter();
}

function applyFilter() {
  const q = normalizeText(filterEl.value);
  let visible = 0;
  listEl.querySelectorAll('.ph').forEach((ph) => {
    const match = !q || normalizeText(ph.querySelector('.txt').textContent).includes(q);
    ph.hidden = !match;
    if (match) visible++;
  });
  sortable?.option('disabled', !!q);
  const total = rubrique()?.phrases.length ?? 0;
  emptyEl.hidden = visible > 0;
  emptyEl.textContent = total ? 'Aucune phrase ne correspond au filtre.' : 'Aucune phrase pour le moment.';
}

function savePhrase(ph) {
  const r = rubrique();
  const clone = ph.querySelector('.txt').cloneNode(true);
  r.phrases[Number(ph.dataset.index)] = unlinkify(clone).innerHTML;
  store.save();
}

function addPhrase() {
  const r = rubrique();
  if (!r) return;
  filterEl.value = '';
  r.phrases.push('');
  store.save();
  render();
  onChange();
  const last = listEl.lastElementChild;
  last?.scrollIntoView({ block: 'nearest' });
  last?.querySelector('.txt').focus();
}

function deletePhrase(ph) {
  const r = rubrique();
  const index = Number(ph.dataset.index);
  const [removed] = r.phrases.splice(index, 1);
  store.save();
  render();
  onChange();
  const at = { ...current };
  showToast('Phrase supprimée.', {
    actionLabel: 'Annuler',
    onClick: () => {
      const target = store.rubriques(at.list)[at.index];
      if (!target) return;
      target.phrases.splice(Math.min(index, target.phrases.length), 0, removed);
      store.save();
      if (current.list === at.list && current.index === at.index) render();
      onChange();
    },
  });
}

// Retire les phrases laissées vides en quittant la vue.
function dropEmpty() {
  const r = rubrique();
  if (!r) return;
  const before = r.phrases.length;
  r.phrases = r.phrases.filter((p) => htmlToText(p) !== '' || /<img/i.test(p));
  if (r.phrases.length !== before) {
    store.save();
    onChange();
  }
}

export function openPhrases(listName, index) {
  current = { list: listName, index };
  const r = rubrique();
  if (!r) return;
  titleEl.textContent = r.name;
  listNameEl.textContent = listName;
  filterEl.value = '';
  hideToast();
  render();
  show('phrases');
  listEl.scrollTop = 0;
}

export function initPhrases({ onDataChange }) {
  onChange = onDataChange;

  $('backBtn').addEventListener('click', () => show('rubriques'));
  $('addPhraseBtn').addEventListener('click', addPhrase);
  $('addPhraseBtn2').addEventListener('click', addPhrase);
  filterEl.addEventListener('input', applyFilter);
  onLeave('phrases', () => { dropEmpty(); hideToast(); });

  listEl.addEventListener('input', (e) => {
    const ph = e.target.closest('.ph');
    if (ph) savePhrase(ph);
  });

  // Coller en texte brut.
  listEl.addEventListener('paste', (e) => {
    if (!e.target.closest('.txt')) return;
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    document.execCommand('insertText', false, text);
  });

  listEl.addEventListener('click', async (e) => {
    const link = e.target.closest('.txt a');
    if (link) {
      e.preventDefault();
      window.open(link.href, '_blank', 'noopener');
      return;
    }
    const ph = e.target.closest('.ph');
    if (!ph) return;
    if (e.target.closest('.del')) {
      deletePhrase(ph);
    } else if (e.target.closest('.copy')) {
      const btn = e.target.closest('.copy');
      const text = htmlToText(rubrique().phrases[Number(ph.dataset.index)]);
      const ok = await copyToClipboard(text);
      btn.classList.toggle('done', ok);
      btn.innerHTML = ok ? `${icon('check')}Copié` : `${icon('copy')}Échec`;
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.classList.remove('done');
        btn.innerHTML = `${icon('copy')}Copier`;
      }, 1500);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('view-phrases').hidden && !e.target.closest('.txt') && !document.querySelector('dialog[open]')) {
      show('rubriques');
    }
  });

  if (window.Sortable) {
    sortable = new Sortable(listEl, {
      animation: 150,
      handle: '.idx',
      draggable: '.ph',
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        const phrases = rubrique().phrases;
        const [moved] = phrases.splice(evt.oldIndex, 1);
        phrases.splice(evt.newIndex, 0, moved);
        store.save();
        renumber();
      },
    });
  }
}
