// Favoris et nombre de copies. Stockés à part pour ne
// pas changer le format des listes (exports et anciennes versions intacts).
import { htmlToText } from './text.js';

const KEYS = { favs: 'zt-favs', used: 'zt-used' };

// Les chemins ID récents ne sont plus affichés : on efface l'ancienne sauvegarde.
try { localStorage.removeItem('zt-id-recent'); } catch {}

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// Identifiant d'une phrase d'après son texte : il ne change pas quand on la déplace.
export function phraseId(html) {
  const text = htmlToText(html).replace(/\s+/g, ' ').trim();
  let h = 5381;
  for (const ch of text) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0;
  return h.toString(36) + '.' + text.length.toString(36);
}

export const stats = {
  favs: read(KEYS.favs, {}),
  used: read(KEYS.used, {}),

  reload() {
    this.favs = read(KEYS.favs, {});
    this.used = read(KEYS.used, {});
  },

  isFav(html) {
    return !!this.favs[phraseId(html)];
  },
  toggleFav(html) {
    const id = phraseId(html);
    if (this.favs[id]) delete this.favs[id];
    else this.favs[id] = 1;
    write(KEYS.favs, this.favs);
    return !!this.favs[id];
  },

  count(html) {
    return this.used[phraseId(html)] || 0;
  },
  bump(html) {
    const id = phraseId(html);
    this.used[id] = (this.used[id] || 0) + 1;
    write(KEYS.used, this.used);
  },

  // Après modification d'une phrase : garde son favori et son compteur.
  rekey(oldHtml, newHtml) {
    const a = phraseId(oldHtml);
    const b = phraseId(newHtml);
    if (a === b) return;
    if (this.favs[a]) { this.favs[b] = 1; delete this.favs[a]; write(KEYS.favs, this.favs); }
    if (this.used[a]) { this.used[b] = (this.used[b] || 0) + this.used[a]; delete this.used[a]; write(KEYS.used, this.used); }
  },
};
