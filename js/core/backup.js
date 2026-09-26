// Import, export (JSON et CSV) et sauvegarde automatique hebdomadaire.
import { store, normalizeLists } from '../store.js';
import { toCsv, parseCsv, CSV_HEADER } from './csv.js';
import { htmlToText, textToHtml, normalizeText } from './text.js';

const WEEK_MS = 7 * 24 * 3600 * 1000;

function stamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(date.getDate())}-${p(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJson(filename = 'Phrase.json') {
  download(JSON.stringify(store.lists, null, 2), filename, 'application/json');
}

export function exportCsv() {
  const rows = [CSV_HEADER];
  for (const [listName, list] of Object.entries(store.lists)) {
    for (const r of list.rubriques) {
      if (!r.phrases.length) rows.push([listName, r.name, '', '']);
      r.phrases.forEach((p, i) => rows.push([listName, r.name, i + 1, htmlToText(p)]));
    }
  }
  download(toCsv(rows), `Phrases_${stamp()}.csv`, 'text/csv;charset=utf-8');
}

// Sauvegarde JSON automatique si la dernière date de plus de 7 jours.
// (En v2.5 elle ne se déclenchait jamais.)
export function backupIfDue() {
  if (!Object.keys(store.lists).length) return false;
  const last = store.lastExport;
  if (last && Date.now() - last.getTime() < WEEK_MS) return false;
  exportJson(`Phrases_autosauvegarde_${stamp()}.json`);
  store.lastExport = new Date();
  return true;
}

// Fusionne des listes importées : ajoute les rubriques manquantes et,
// dans les rubriques existantes, les phrases absentes.
export function mergeLists(imported) {
  const stats = { lists: 0, rubriques: 0, phrases: 0 };
  for (const [listName, list] of Object.entries(imported)) {
    if (!store.lists[listName]) {
      store.lists[listName] = { rubriques: [] };
      stats.lists++;
    }
    const target = store.lists[listName].rubriques;
    for (const r of list.rubriques) {
      let existing = target.find((t) => t.name === r.name);
      if (!existing) {
        existing = { name: r.name, phrases: [] };
        target.push(existing);
        stats.rubriques++;
      }
      const known = new Set(existing.phrases.map((p) => normalizeText(htmlToText(p))));
      for (const p of r.phrases) {
        const key = normalizeText(htmlToText(p));
        if (!key || known.has(key)) continue;
        existing.phrases.push(p);
        known.add(key);
        stats.phrases++;
      }
    }
  }
  store.save();
  return stats;
}

function csvToLists(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('Le fichier CSV est vide.');
  const head = rows[0].map((h) => normalizeText(h));
  const col = (name) => head.indexOf(normalizeText(name));
  let [iList, iRub, iOrder, iPhrase] = CSV_HEADER.map(col);
  let body = rows.slice(1);
  if (iList < 0 || iRub < 0 || iPhrase < 0) {
    // Pas d'en-tête reconnu : colonnes Liste ; Rubrique ; Phrase ou Liste ; Rubrique ; Ordre ; Phrase.
    body = rows;
    const width = Math.max(...rows.map((r) => r.length));
    if (width < 3) throw new Error('Colonnes attendues : Liste ; Rubrique ; Phrase.');
    [iList, iRub, iOrder, iPhrase] = width >= 4 ? [0, 1, 2, 3] : [0, 1, -1, 2];
  }
  const grouped = {};
  body.forEach((r, line) => {
    const listName = (r[iList] || '').trim();
    const rubName = (r[iRub] || '').trim();
    if (!listName || !rubName) return;
    const rubs = (grouped[listName] ??= {});
    const items = (rubs[rubName] ??= []);
    const phrase = r[iPhrase] ?? '';
    if (phrase.trim()) items.push({ order: parseFloat(r[iOrder]) || Infinity, line, html: textToHtml(phrase.trim()) });
  });
  const lists = {};
  for (const [listName, rubs] of Object.entries(grouped)) {
    lists[listName] = {
      rubriques: Object.entries(rubs).map(([name, items]) => ({
        name,
        phrases: items.sort((a, b) => a.order - b.order || a.line - b.line).map((i) => i.html),
      })),
    };
  }
  return lists;
}

// Lit un fichier .json (export ZenText) ou .csv et renvoie les listes.
export async function readImportFile(file) {
  const text = await file.text();
  const isJson = /\.json$/i.test(file.name) || /^\s*[{[]/.test(text);
  if (isJson) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("Le fichier JSON n'est pas lisible."); }
    const lists = normalizeLists(data);
    if (!Object.keys(lists).length) throw new Error("Aucune liste trouvée dans ce fichier.");
    return lists;
  }
  return csvToLists(text);
}
