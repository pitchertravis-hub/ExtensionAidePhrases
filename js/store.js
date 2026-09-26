// Données de l'extension. Les clés localStorage sont celles de la v2.5 :
// rien à migrer, les listes existantes sont relues telles quelles.
const KEYS = {
  lists: 'listes',
  selected: 'selectedList',
  intro: 'customIntroText',
  lastExport: 'lastExportDate',
};

export const DEFAULT_INTRO = 'Je vous invite à suivre le chemin suivant :';

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { console.error('Sauvegarde impossible', e); }
}

// Accepte l'ancien format { liste: { rubrique: [phrases] } } et le format
// actuel { liste: { rubriques: [{ name, phrases }] } }.
export function normalizeLists(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [listName, list] of Object.entries(raw)) {
    if (!list || typeof list !== 'object') continue;
    const rubriques = Array.isArray(list.rubriques)
      ? list.rubriques
      : Object.entries(list).map(([name, phrases]) => ({ name, phrases }));
    out[listName] = {
      rubriques: rubriques
        .filter((r) => r && typeof r.name === 'string')
        .map((r) => ({
          name: r.name,
          phrases: Array.isArray(r.phrases) ? r.phrases.filter((p) => typeof p === 'string') : [],
        })),
    };
  }
  return out;
}

export const store = {
  lists: {},

  load() {
    try {
      this.lists = normalizeLists(JSON.parse(read(KEYS.lists) || '{}'));
    } catch (e) {
      console.error('Données illisibles', e);
      this.lists = {};
    }
  },
  save() {
    write(KEYS.lists, JSON.stringify(this.lists));
  },

  listNames() {
    return Object.keys(this.lists);
  },
  rubriques(listName) {
    return this.lists[listName]?.rubriques ?? [];
  },

  get selectedList() {
    return read(KEYS.selected) || '';
  },
  set selectedList(name) {
    write(KEYS.selected, name);
  },


  get intro() {
    return read(KEYS.intro) || DEFAULT_INTRO;
  },
  set intro(value) {
    write(KEYS.intro, value);
  },

  get lastExport() {
    const v = read(KEYS.lastExport);
    const d = v ? new Date(v) : null;
    return d && !isNaN(d) ? d : null;
  },
  set lastExport(date) {
    write(KEYS.lastExport, date.toISOString());
  },
};
