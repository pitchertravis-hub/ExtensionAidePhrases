// Champs à remplir dans les phrases : {Nom}, {Dossier}…
// {date}, {heure}, {jour} et {date+N} se remplissent seuls.
const pad = (n) => String(n).padStart(2, '0');

function autoValue(name) {
  const n = name.trim().toLowerCase();
  const now = new Date();
  if (n === 'date') return now.toLocaleDateString('fr-FR');
  if (n === 'heure') return `${pad(now.getHours())} h ${pad(now.getMinutes())}`;
  if (n === 'jour') return now.toLocaleDateString('fr-FR', { weekday: 'long' });
  const m = n.match(/^date\s*([+-])\s*(\d{1,3})$/);
  if (m) {
    const d = new Date(now);
    d.setDate(d.getDate() + (m[1] === '+' ? 1 : -1) * Number(m[2]));
    return d.toLocaleDateString('fr-FR');
  }
  return null;
}

export const FIELD_RE = /\{([^{}\n]{1,40})\}/g;

export function isAutoField(name) {
  return autoValue(name) !== null;
}

// Champs que l'utilisateur doit saisir (sans doublon, dans l'ordre).
export function fieldsOf(text) {
  const out = [];
  for (const m of text.matchAll(FIELD_RE)) {
    const name = m[1].trim();
    if (name && !isAutoField(name) && !out.includes(name)) out.push(name);
  }
  return out;
}

export function fillText(text, values = {}) {
  return text.replace(FIELD_RE, (whole, raw) => {
    const name = raw.trim();
    const auto = autoValue(name);
    if (auto !== null) return auto;
    const v = values[name];
    return v ? v : whole;
  });
}
