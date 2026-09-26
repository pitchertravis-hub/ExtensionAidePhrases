// Onglet Phrases : rubrique ouverte, favoris ou résultats de recherche.
// Un clic sur une carte copie la phrase ; modifier est une action à part.
import { store } from '../store.js';
import { state, render, rubriques, onRender, copyText, icon, setSort } from '../state.js';
import { stats } from '../core/stats.js';
import { fieldsOf, fillText } from '../core/fields.js';
import { htmlToText, escapeHtml } from '../core/text.js';
import { showPhrase, editablePhrase, foldText } from '../ui/phrase-text.js';
import { showToast } from '../ui/toast.js';
import { searchId, openPath } from './navigation-id.js';
import { setList, addRubrique } from './sidebar.js';

const $ = (id) => document.getElementById(id);
const listEl = $('phList');
const titleEl = $('mTitle');
const subEl = $('mSub');
const sortBox = $('sortBox');

let items = [];            // [{ l, r, p }] affichés, dans l'ordre
let lastValues = {};       // dernières valeurs saisies dans les champs
let sortable = null;
const foldCache = new Map();

const htmlOf = (it) => store.rubriques(it.l)[it.r]?.phrases[it.p] ?? '';
const same = (a, b) => a && b && a.l === b.l && a.r === b.r && a.p === b.p;

function folded(html) {
  let f = foldCache.get(html);
  if (f === undefined) {
    f = foldText(htmlToText(html));
    if (foldCache.size > 5000) foldCache.clear();
    foldCache.set(html, f);
  }
  return f;
}

function queryFold() {
  return foldText(state.q.trim());
}

// ---------- Ce qui est affiché ----------
function collect() {
  const q = queryFold();
  items = [];
  if (q) {
    for (const l of store.listNames()) {
      store.rubriques(l).forEach((r, ri) => {
        const nameHit = foldText(r.name).includes(q);
        r.phrases.forEach((p, pi) => { if (nameHit || folded(p).includes(q)) items.push({ l, r: ri, p: pi }); });
      });
    }
    // Liste en cours d'abord, favoris puis plus utilisées.
    items.sort((a, b) => (b.l === state.list) - (a.l === state.list)
      || stats.isFav(htmlOf(b)) - stats.isFav(htmlOf(a))
      || stats.count(htmlOf(b)) - stats.count(htmlOf(a)));
  } else if (state.mode === 'fav') {
    rubriques().forEach((r, ri) => r.phrases.forEach((p, pi) => { if (stats.isFav(p)) items.push({ l: state.list, r: ri, p: pi }); }));
  } else {
    const r = rubriques()[state.rub];
    if (r) r.phrases.forEach((_, pi) => items.push({ l: state.list, r: state.rub, p: pi }));
    if (state.sort === 'used') {
      items.sort((a, b) => stats.isFav(htmlOf(b)) - stats.isFav(htmlOf(a)) || stats.count(htmlOf(b)) - stats.count(htmlOf(a)) || a.p - b.p);
    }
  }
  if (state.sel >= items.length) state.sel = Math.max(0, items.length - 1);
}

function canReorder() {
  return !state.q.trim() && state.mode === 'rub' && state.sort === 'order' && !state.edit;
}

function renderHead(q) {
  const rub = rubriques()[state.rub];
  if (q) {
    titleEl.textContent = `Résultats pour « ${state.q.trim()} »`;
    subEl.textContent = `${items.length} phrase(s) dans toutes les listes`;
  } else if (state.mode === 'fav') {
    titleEl.textContent = 'Favoris';
    subEl.textContent = `${state.list} · ${items.length} phrase(s) épinglée(s) avec l'étoile`;
  } else {
    titleEl.textContent = rub ? rub.name : state.list ? 'Aucune rubrique' : 'Bienvenue';
    subEl.textContent = rub ? `${state.list} · ${items.length} phrase(s)` : state.list ? 'Créez une rubrique avec le bouton + Rubrique.' : 'Créez une liste avec le bouton ⋯ ou importez vos phrases (Réglages).';
  }
  sortBox.style.visibility = !q && state.mode === 'rub' && rub ? 'visible' : 'hidden';
  sortBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === state.sort));
}

function chipsHtml(q) {
  let h = '';
  const rubHits = [];
  for (const l of store.listNames()) {
    store.rubriques(l).forEach((r, ri) => { if (foldText(r.name).includes(q)) rubHits.push({ l, ri, name: r.name }); });
  }
  if (rubHits.length) {
    h += `<div class="group cap">Rubriques</div><div class="chips">${rubHits.slice(0, 8)
      .map((x) => `<button class="chip" type="button" data-jl="${escapeHtml(x.l)}" data-jr="${x.ri}"><span>${escapeHtml(x.l)}</span>${escapeHtml(x.name)}</button>`).join('')}</div>`;
  }
  const ids = searchId(q);
  if (ids.length) {
    h += `<div class="group cap">Menus ID</div><div class="chips">${ids
      .map((m) => `<button class="chip" type="button" data-idp="${m.path.join('|')}"><span>${m.path.filter(Boolean).join('›')}</span>${escapeHtml(m.label)}</button>`).join('')}</div>`;
  }
  if (h) h += '<div class="group cap">Phrases</div>';
  return h;
}

function card(it, i, q) {
  const html = htmlOf(it);
  const text = htmlToText(html);
  const editing = same(state.edit, it);
  const filling = same(state.fill, it);
  const fav = stats.isFav(html);
  const used = stats.count(html);
  const fields = fieldsOf(text);

  const el = document.createElement('div');
  el.className = 'ph' + (i === state.sel ? ' sel' : '') + (editing ? ' editing' : '') + (fav ? ' is-fav' : '');
  el.dataset.i = i;
  el.innerHTML = `
    ${canReorder() ? `<span class="grip" title="Glisser pour déplacer">${icon('grip')}</span>` : ''}
    <div class="body"><div class="txt"></div></div>
    ${editing ? '' : `<div class="acts">
      <button class="ibtn star${fav ? ' on' : ''}" type="button" data-a="fav" title="Favori (F)">${icon('star')}</button>
      <button class="ibtn" type="button" data-a="edit" title="Modifier (E)">${icon('pen')}</button>
      <button class="ibtn" type="button" data-a="del" title="Supprimer">${icon('trash')}</button>
    </div><span class="hint">Cliquer pour copier</span>`}`;
  const body = el.querySelector('.body');
  const txt = el.querySelector('.txt');

  if (editing) {
    editablePhrase(txt, html);
    txt.contentEditable = 'true';
    txt.spellcheck = true;
    body.insertAdjacentHTML('beforeend', `<div class="edit-acts"><small>{Nom} = champ à remplir · {date}, {heure}, {jour} se remplissent seuls · Ctrl+Entrée pour enregistrer</small><span><button class="btn" type="button" data-a="cancel">Annuler</button><button class="btn solid" type="button" data-a="save">Enregistrer</button></span></div>`);
  } else {
    showPhrase(txt, html, q);
    const meta = [];
    if (q || state.mode === 'fav') meta.push(`<span class="rb">${escapeHtml(`${it.l} › ${store.rubriques(it.l)[it.r].name}`)}</span>`);
    if (used) meta.push(`<span>${icon('clock')} copiée ${used}×</span>`);
    if (fields.length) meta.push(`<span>${fields.length} champ(s) à remplir</span>`);
    body.insertAdjacentHTML('beforeend', `<div class="meta">${meta.join('')}</div>`);
  }

  if (filling) {
    const form = document.createElement('div');
    form.className = 'fill';
    form.innerHTML = fields.map((f) => `<label><span></span><input data-f=""></label>`).join('')
      + `<div class="go"><small>Entrée pour copier · Échap pour annuler</small><button class="btn solid" type="button" data-a="dofill">${icon('copy')}Copier</button></div>`;
    form.querySelectorAll('label').forEach((label, j) => {
      label.querySelector('span').textContent = fields[j];
      const input = label.querySelector('input');
      input.dataset.f = fields[j];
      input.value = lastValues[fields[j]] ?? '';
    });
    body.append(form);
  }
  return el;
}

function renderPh() {
  if (state.tab !== 'ph') return;
  const draft = listEl.querySelector('.ph.editing .txt')?.innerHTML;
  collect();
  const q = queryFold();
  renderHead(q);

  listEl.textContent = '';
  if (q) listEl.insertAdjacentHTML('beforeend', chipsHtml(q));
  items.forEach((it, i) => listEl.append(card(it, i, q)));
  if (!items.length) {
    const msg = q ? 'Aucune phrase ne contient ce texte.'
      : state.mode === 'fav' ? 'Aucun favori. Cliquez l’étoile d’une phrase pour l’épingler ici.'
      : rubriques()[state.rub] ? 'Aucune phrase dans cette rubrique.' : '';
    if (msg) listEl.insertAdjacentHTML('beforeend', `<div class="empty">${msg}</div>`);
  }
  sortable?.option('disabled', !canReorder());

  const editTxt = listEl.querySelector('.ph.editing .txt');
  if (editTxt) {
    if (draft !== undefined) editTxt.innerHTML = draft;
    if (document.activeElement !== editTxt) {
      editTxt.focus();
      const range = document.createRange();
      range.selectNodeContents(editTxt);
      range.collapse(false);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
  }
  listEl.querySelector('.fill input')?.focus();
}

// ---------- Actions ----------
function flash(i) {
  const el = listEl.querySelector(`.ph[data-i="${i}"]`);
  if (!el) return;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 700);
}

export async function copyItem(i, values) {
  const it = items[i];
  if (!it || state.edit) return;
  const html = htmlOf(it);
  const text = htmlToText(html);
  if (fieldsOf(text).length && !values) {
    state.fill = { ...it };
    state.sel = i;
    renderPh();
    return;
  }
  const out = fillText(text, values);
  const ok = await copyText(out);
  if (values) Object.assign(lastValues, values);
  state.fill = null;
  state.sel = i;
  if (ok) stats.bump(html);
  render();
  flash(i);
  showToast(ok ? `Copié · ${out.replace(/\s+/g, ' ').slice(0, 60)}${out.length > 60 ? '…' : ''}` : 'Copie impossible : cliquez dans la fenêtre puis réessayez.');
}

function readFill(el) {
  const v = {};
  el.querySelectorAll('.fill input').forEach((x) => { v[x.dataset.f] = x.value.trim(); });
  return v;
}

export function editItem(i) {
  const it = items[i];
  if (!it) return;
  state.fill = null;
  state.edit = { ...it };
  state.sel = i;
  renderPh();
}

function saveEdit() {
  const el = listEl.querySelector('.ph.editing .txt');
  const e = state.edit;
  if (!el || !e) return;
  const rub = store.rubriques(e.l)[e.r];
  const old = rub.phrases[e.p];
  const html = el.innerHTML;
  state.edit = null;
  if (!htmlToText(html) && !/<img/i.test(html)) {
    rub.phrases.splice(e.p, 1);
    store.save();
    render();
    if (!e.isNew) showToast('Phrase vide supprimée.');
    return;
  }
  rub.phrases[e.p] = html;
  stats.rekey(old, html);
  store.save();
  render();
  showToast(e.isNew ? 'Phrase ajoutée' : 'Modifications enregistrées');
}

function cancelEdit() {
  const e = state.edit;
  state.edit = null;
  if (e?.isNew) {
    store.rubriques(e.l)[e.r].phrases.splice(e.p, 1);
    store.save();
  }
  render();
}

export function toggleFavItem(i) {
  const it = items[i];
  if (!it) return;
  const on = stats.toggleFav(htmlOf(it));
  state.sel = i;
  render();
  showToast(on ? 'Ajoutée aux favoris' : 'Retirée des favoris');
}

function deleteItem(i) {
  const it = items[i];
  if (!it) return;
  const rub = store.rubriques(it.l)[it.r];
  const [removed] = rub.phrases.splice(it.p, 1);
  store.save();
  render();
  showToast('Phrase supprimée.', {
    actionLabel: 'Annuler',
    onClick: () => {
      rub.phrases.splice(Math.min(it.p, rub.phrases.length), 0, removed);
      store.save();
      render();
    },
  });
}

export async function addPhrase() {
  if (!rubriques()[state.rub]) {
    await addRubrique();
    if (!rubriques()[state.rub]) return;
  }
  state.q = '';
  $('q').value = '';
  state.mode = 'rub';
  state.tab = 'ph';
  const rub = rubriques()[state.rub];
  rub.phrases.push('');
  state.edit = { l: state.list, r: state.rub, p: rub.phrases.length - 1, isNew: true };
  state.fill = null;
  render();
  listEl.querySelector('.ph.editing')?.scrollIntoView({ block: 'nearest' });
}

// ---------- Clavier ----------
export function moveSel(delta) {
  if (!items.length) return;
  state.sel = Math.max(0, Math.min(items.length - 1, state.sel + delta));
  listEl.querySelectorAll('.ph').forEach((el) => el.classList.toggle('sel', Number(el.dataset.i) === state.sel));
  listEl.querySelector('.ph.sel')?.scrollIntoView({ block: 'nearest' });
}
export const selected = () => state.sel;
export const hasItems = () => items.length > 0;

export function initPhrases() {
  onRender(renderPh);

  $('addPhBtn').addEventListener('click', addPhrase);
  sortBox.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-s]');
    if (!b) return;
    setSort(b.dataset.s);
    state.sel = 0;
    render();
  });

  listEl.addEventListener('click', (e) => {
    const idChip = e.target.closest('[data-idp]');
    if (idChip) {
      state.tab = 'id';
      render();
      openPath(idChip.dataset.idp.split('|'));
      return;
    }
    const rubChip = e.target.closest('[data-jl]');
    if (rubChip) {
      setList(rubChip.dataset.jl);
      state.rub = Number(rubChip.dataset.jr);
      state.q = '';
      $('q').value = '';
      render();
      return;
    }
    const link = e.target.closest('.txt a');
    const el = e.target.closest('.ph');
    if (!el) return;
    const i = Number(el.dataset.i);
    if (link && !el.classList.contains('editing')) {
      e.preventDefault();
      window.open(link.href, '_blank', 'noopener');
      return;
    }
    const act = e.target.closest('[data-a]')?.dataset.a;
    if (act === 'fav') return toggleFavItem(i);
    if (act === 'edit') return editItem(i);
    if (act === 'del') return deleteItem(i);
    if (act === 'save') return saveEdit();
    if (act === 'cancel') return cancelEdit();
    if (act === 'dofill') return copyItem(i, readFill(el));
    if (el.classList.contains('editing') || e.target.closest('.fill')) return;
    copyItem(i);
  });

  listEl.addEventListener('keydown', (e) => {
    const el = e.target.closest('.ph');
    if (!el) return;
    if (e.target.matches('.fill input')) {
      if (e.key === 'Enter') { e.preventDefault(); copyItem(Number(el.dataset.i), readFill(el)); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); state.fill = null; renderPh(); }
      e.stopPropagation();
      return;
    }
    if (e.target.closest('.ph.editing .txt')) {
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEdit(); }
      e.stopPropagation();
    }
  });

  // Coller en texte brut pendant la modification.
  listEl.addEventListener('paste', (e) => {
    if (!e.target.closest('.ph.editing .txt')) return;
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    document.execCommand('insertText', false, text);
  });

  if (window.Sortable) {
    sortable = new Sortable(listEl, {
      animation: 150,
      handle: '.grip',
      draggable: '.ph',
      onEnd(evt) {
        const from = evt.oldDraggableIndex;
        const to = evt.newDraggableIndex;
        if (from === to) return;
        const phrases = rubriques()[state.rub].phrases;
        const [moved] = phrases.splice(from, 1);
        phrases.splice(to, 0, moved);
        store.save();
        state.sel = to;
        render();
      },
    });
  }
}
