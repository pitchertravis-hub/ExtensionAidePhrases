// Outils texte : recherche approchée, conversion HTML ↔ texte, liens.

// Minuscules, sans accents ni ponctuation ni espaces.
export function normalizeText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Vrai si les lettres de `input` apparaissent dans l'ordre dans `target`.
export function fuzzyMatch(input, target) {
  let pos = 0;
  for (const ch of input) {
    pos = target.indexOf(ch, pos);
    if (pos === -1) return false;
    pos++;
  }
  return true;
}

export function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Score de ressemblance entre 0 et 1 (1 = contenu tel quel).
export function similarity(spoken, label) {
  const a = normalizeText(spoken);
  const b = normalizeText(label);
  if (!a || !b) return 0;
  if (b.includes(a) || a.includes(b)) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const BLOCK = /^(DIV|P|LI|UL|OL|H[1-6]|BLOCKQUOTE|PRE|TR)$/;

// Texte à coller : garde les retours à la ligne et les lignes vides.
export function htmlToText(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  let out = '';
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.nodeValue.replace(/ /g, ' ');
      } else if (child.nodeName === 'BR') {
        out += '\n';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const block = BLOCK.test(child.nodeName);
        if (block && out && !out.endsWith('\n')) out += '\n';
        walk(child);
        if (block && !out.endsWith('\n')) out += '\n';
      }
    }
  };
  walk(doc.body);
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Texte brut (CSV importé) → HTML de phrase.
export function textToHtml(text) {
  return escapeHtml(String(text).replace(/\r\n?/g, '\n')).replace(/\n/g, '<br>');
}

const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;

// Transforme les adresses du texte en liens cliquables (hors liens existants).
export function linkify(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('a') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue;
    URL_RE.lastIndex = 0;
    if (!URL_RE.test(text)) continue;
    const frag = document.createDocumentFragment();
    let last = 0;
    URL_RE.lastIndex = 0;
    for (const m of text.matchAll(URL_RE)) {
      frag.append(text.slice(last, m.index));
      const a = document.createElement('a');
      a.href = m[0];
      a.textContent = m[0];
      a.target = '_blank';
      a.rel = 'noopener';
      frag.append(a);
      last = m.index + m[0].length;
    }
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

// HTML à enregistrer : sans les liens ajoutés à l'affichage.
export function unlinkify(root) {
  for (const a of root.querySelectorAll('a')) a.replaceWith(...a.childNodes);
  return root;
}
