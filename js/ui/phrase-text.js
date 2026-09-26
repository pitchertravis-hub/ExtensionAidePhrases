// Affichage d'une phrase : liens cliquables, champs {…} en pastille,
// texte recherché surligné (sans tenir compte des accents ni des majuscules).
import { linkify, unlinkify } from '../core/text.js';
import { FIELD_RE } from '../core/fields.js';

// Minuscules sans accents, en gardant la correspondance avec le texte d'origine.
export function fold(text) {
  let out = '';
  const map = [];
  for (let i = 0; i < text.length; i++) {
    const f = text[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (const ch of f) { out += ch; map.push(i); }
  }
  return { out, map };
}

export function foldText(text) {
  return fold(text).out;
}

function ranges(text, query) {
  const list = [];
  for (const m of text.matchAll(FIELD_RE)) list.push({ start: m.index, end: m.index + m[0].length, type: 'fld' });
  if (query) {
    const { out, map } = fold(text);
    let i = out.indexOf(query);
    while (i !== -1) {
      const start = map[i];
      const end = map[i + query.length - 1] + 1;
      if (!list.some((r) => start < r.end && end > r.start)) list.push({ start, end, type: 'mark' });
      i = out.indexOf(query, i + query.length);
    }
  }
  return list.sort((a, b) => a.start - b.start);
}

function decorate(root, query) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('a') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue;
    const rs = ranges(text, query);
    if (!rs.length) continue;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const r of rs) {
      frag.append(text.slice(last, r.start));
      const el = document.createElement(r.type === 'fld' ? 'span' : 'mark');
      if (r.type === 'fld') el.className = 'fld';
      el.textContent = r.type === 'fld' ? text.slice(r.start + 1, r.end - 1) : text.slice(r.start, r.end);
      frag.append(el);
      last = r.end;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

// Affiche la phrase dans `el`. `query` doit déjà être passée par foldText.
export function showPhrase(el, html, query = '') {
  el.innerHTML = html;
  unlinkify(el); // répare les liens mal enregistrés par la v2.5
  linkify(el);
  decorate(el, query);
}

// Prépare la phrase pour la modification (texte brut des liens, pas de pastilles).
export function editablePhrase(el, html) {
  el.innerHTML = html;
  unlinkify(el);
}
