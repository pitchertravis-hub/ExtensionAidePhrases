// Onglet Navigation ID : trois colonnes cliquables.
import { MODULES } from '../data/id-menus.js';
import { store, DEFAULT_INTRO } from '../store.js';
import { state, onRender, copyText, icon } from '../state.js';
import { escapeHtml } from '../core/text.js';
import { foldText } from '../ui/phrase-text.js';
import { askText } from '../ui/dialog.js';
import { showToast } from '../ui/toast.js';

const box = document.getElementById('idBox');
let path = ['', '', '']; // module, option, sous-option
let copied = null; // true / false après une copie

const nameOf = (opt) => (typeof opt === 'string' ? opt : opt.name);
const subsOf = (opt) => (opt && typeof opt === 'object' ? opt.sub_options : null);

function sortKeys(keys) {
  return keys.sort((a, b) => {
    const alphaA = /^[a-z]+$/i.test(a);
    const alphaB = /^[a-z]+$/i.test(b);
    if (alphaA !== alphaB) return alphaA ? -1 : 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

function resolve(p) {
  const mod = MODULES[p[0]];
  const opt = mod?.options[p[1]];
  const sub = subsOf(opt)?.[p[2]];
  return { mod, opt, sub };
}

function lines(p) {
  const { mod, opt, sub } = resolve(p);
  const out = ['• Menu ID'];
  if (mod) out.push(`• ${p[0]}: ${mod.name}`);
  if (opt) out.push(`• ${p[1]}: ${nameOf(opt)}`);
  if (sub) out.push(`• ${p[2]}: ${sub}`);
  return out;
}

function sentence(p) {
  return [store.intro, ...lines(p)].join('\n');
}

async function copyPath() {
  copied = await copyText(sentence(path));
  renderId();
  showToast(copied ? 'Chemin copié' : 'Copie impossible');
}

// Choisit un chemin complet (depuis la recherche) et le copie.
export function openPath(p) {
  path = [p[0] || '', p[1] || '', p[2] || ''];
  if (resolve(path).opt) copyPath();
  else renderId();
}

// Recherche dans les options et sous-options (pour la barre du haut).
export function searchId(query, limit = 6) {
  const out = [];
  if (!query) return out;
  for (const [mk, mod] of Object.entries(MODULES)) {
    for (const [ok, opt] of Object.entries(mod.options)) {
      if (foldText(nameOf(opt)).includes(query)) out.push({ path: [mk, ok, ''], label: nameOf(opt) });
      const subs = subsOf(opt);
      if (subs) {
        for (const [sk, sub] of Object.entries(subs)) {
          if (foldText(sub).includes(query)) out.push({ path: [mk, ok, sk], label: sub });
        }
      }
    }
  }
  return out.slice(0, limit);
}

function column(title, level, entries, current, emptyText) {
  const items = entries.length
    ? `<ul>${entries.map(([k, label, more]) => `<li><button type="button" data-l="${level}" data-k="${escapeHtml(k)}" aria-current="${current === k}"><span>${escapeHtml(k)}</span>${escapeHtml(label)}${more ? ' ›' : ''}</button></li>`).join('')}</ul>`
    : `<div class="none">${emptyText}</div>`;
  return `<div class="col"><h4>${title}</h4>${items}</div>`;
}

function renderId() {
  if (state.tab !== 'id') return;
  const { mod, opt } = resolve(path);
  const subs = subsOf(opt);
  let h = '';
  h += '<div class="cols">';
  h += column('1 · Module', 0, Object.entries(MODULES).map(([k, m]) => [k, m.name]), path[0], '');
  h += column('2 · Option', 1, mod ? Object.entries(mod.options).map(([k, o]) => [k, nameOf(o), !!subsOf(o)]) : [], path[1], 'Choisissez un module.');
  h += column('3 · Sous-option', 2, subs ? sortKeys(Object.keys(subs)).map((k) => [k, subs[k]]) : [], path[2], opt ? 'Pas de sous-option.' : '—');
  h += '</div>';
  if (opt) {
    h += `<div class="ticket"><p></p><ol>${lines(path)
      .map((l) => {
        const m = l.match(/^• (\S+): (.*)$/);
        return m ? `<li><span>${escapeHtml(m[1])}</span>${escapeHtml(m[2])}</li>` : '<li><span>•</span>Menu ID</li>';
      })
      .join('')}</ol><footer class="${copied === false ? 'err' : ''}"><span>${copied === false ? 'Copie impossible' : copied ? `${icon('check')} Copié` : ''}</span>
      <button class="btn" type="button" data-act="copy">${icon('copy')}Recopier</button></footer></div>`;
  }
  box.innerHTML = h;
  const intro = box.querySelector('.ticket p');
  if (intro) intro.textContent = store.intro;
}

export function initNavigation() {
  onRender(renderId);

  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-l]');
    if (b) {
      const level = Number(b.dataset.l);
      const next = [...path];
      next[level] = b.dataset.k;
      for (let j = level + 1; j < 3; j++) next[j] = '';
      path = next;
      copied = null;
      // Comme avant : la phrase est copiée dès qu'une option est choisie.
      if (level > 0) copyPath();
      else renderId();
      return;
    }
    if (e.target.closest('[data-act="copy"]')) copyPath();
  });

  document.getElementById('introBtn').addEventListener('click', async () => {
    const text = await askText("Phrase d'introduction", store.intro, {
      message: `Texte placé avant le chemin. Par défaut : « ${DEFAULT_INTRO} »`,
    });
    if (!text) return;
    store.intro = text;
    renderId();
  });
}
