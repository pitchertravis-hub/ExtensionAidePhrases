// CSV lisible par Excel (séparateur « ; », UTF-8 avec BOM).
export const CSV_HEADER = ['Liste', 'Rubrique', 'Ordre', 'Phrase'];

function cell(value) {
  const s = String(value ?? '');
  return /[";\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows) {
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

// Lit un CSV séparé par « ; », « , » ou tabulation (détecté sur la 1re ligne).
export function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const counts = [';', ',', '\t'].map((d) => [d, firstLine.split(d).length]);
  const sep = counts.sort((a, b) => b[1] - a[1])[0][0];

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') {
      quoted = true;
    } else if (c === sep) {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}
