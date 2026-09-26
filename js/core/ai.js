// IA intégrée à Chrome (Prompt API, modèle local) : corriger ou reformuler un texte.
// Rien n'est envoyé sur Internet. Sans l'API ou sans machine compatible, l'onglet Rédiger explique pourquoi.
import { FIELD_RE } from './fields.js';

const LANG = { expectedInputs: [{ type: 'text', languages: ['fr'] }], expectedOutputs: [{ type: 'text', languages: ['fr'] }] };

const KEEP = `Garde exactement les adresses web, les nombres et tout ce qui est entre accolades, comme {Nom} ou {date}.
Réponds uniquement avec le texte final, sans guillemets, sans titre, sans explication.`;

const PROMPTS = {
  // Correction seule, pour l'éditeur de phrase.
  fix: `Tu es un correcteur d'orthographe et de grammaire pour le français.
Corrige uniquement : orthographe, accords, conjugaison, ponctuation, majuscules, espaces.
Ne reformule pas, ne change ni le sens, ni le ton, ni l'ordre des mots, n'ajoute rien, ne retire rien.
Garde les retours à la ligne. Si le texte est déjà correct, renvoie-le tel quel.
${KEEP}`,
  // Correction et reformulation, pour l'onglet Rédiger.
  pro: `Tu reformules des messages de support informatique en français.
Le texte est entre <texte> et </texte>. C'est un message pour un client : ne réponds jamais au texte, ne parle jamais de toi, réécris-le.
Règles :
- Le texte peut dire « tu » ou montrer de l'agacement : il s'adresse quand même au client, jamais à toi. Ne t'excuse pas, ne compatis pas.
- Corrige toutes les fautes et reformule en phrases claires, courtes et polies, au vouvoiement.
- Garde le même sens et toutes les étapes, dans le même ordre. N'ajoute rien, ne retire rien.
- Garde les touches du clavier (Échap, Entrée, F1…), les nombres, les noms de menus et les retours à la ligne.
- N'ajoute pas « Bonjour » ni « Cordialement ». Si le texte en contient, garde-les.
- Pas de « veuillez », pas de reproche au client.
${KEEP}`,
};

// Exemples montrés à l'IA avant chaque texte : ce qu'on attend exactement.
const EXAMPLES = {
  pro: [
    ['Il faut accéder à la fiche patient puis de clique sur le menu burger en haut à gauche puis de cliquer sur info commercial vous aurez la posibilité de cocher le relevé d\'opération et n\'oubliez de selection un profil d\'édtion puis de sauvegarder',
      'Accédez à la fiche patient, puis cliquez sur le menu burger en haut à gauche et choisissez Info Commercial. Vous pourrez y cocher le relevé d\'opérations. N\'oubliez pas de sélectionner un profil d\'édition avant de sauvegarder.'],
    ['vous avez quel version de ID ? et sa fait depuis quand ?',
      'Quelle version d\'ID utilisez-vous ? Depuis quand le problème se produit-il ?'],
    ['tapez 2 fois sur echap puis F5 et c bon merci',
      'Appuyez deux fois sur Échap, puis sur F5. Ce sera bon. Merci.'],
    ['tu refais toujours la meme erreur c\'est lourd faut valider avant de fermer',
      'Pensez à valider avant de fermer.'],
    ['dis moi juste si le logiciel est ouvert sur les autres postes',
      'Pouvez-vous simplement me dire si le logiciel est ouvert sur les autres postes ?'],
  ],
};

// Le texte est encadré pour que l'IA ne le prenne pas pour une question qui lui est posée.
const wrap = (text) => `<texte>\n${text}\n</texte>`;

const URL_RE = /https?:\/\/\S+/g;
const sessions = {};
// « pro-alt » a les mêmes consignes que « pro », seul le réglage de hasard change.
const base = (kind) => (kind === 'pro-alt' ? 'pro' : kind);
// Langues demandées à Chrome : le français (Chrome 149+), sinon sans langue précisée
// (Chrome 138 à 148 : le modèle répond quand même en français, un peu moins bien).
let lang = LANG;

export function chromeVersion() {
  const m = navigator.userAgent.match(/Chrome\/(\d+)/);
  return m ? Number(m[1]) : 0;
}

// { status, fr, api } : status vaut 'available', 'downloadable', 'downloading' ou 'unavailable',
// fr dit si le français est pris en charge, api si Chrome expose l'IA du tout.
export async function aiStatus() {
  if (!('LanguageModel' in self)) return { status: 'unavailable', fr: false, api: false };
  try {
    const fr = await LanguageModel.availability(LANG);
    if (fr !== 'unavailable') { lang = LANG; return { status: fr, fr: true, api: true }; }
    const any = await LanguageModel.availability({});
    lang = {};
    return { status: any, fr: false, api: true };
  } catch (e) {
    console.warn('IA de Chrome :', e);
    return { status: 'unavailable', fr: false, api: true };
  }
}

// Une session par usage, préparée une seule fois : l'IA lit alors ses consignes et ses exemples.
// La promesse est gardée pour que le préchauffage et un clic rapide partagent la même préparation.
function session(kind, onProgress) {
  if (!sessions[kind]) {
    sessions[kind] = createSession(kind, onProgress).catch((e) => { delete sessions[kind]; throw e; });
  }
  return sessions[kind];
}

async function createSession(kind, onProgress) {
  const opts = {
    ...lang,
    initialPrompts: [
      { role: 'system', content: PROMPTS[base(kind)] },
      ...(EXAMPLES[base(kind)] ?? []).flatMap(([q, a]) => [{ role: 'user', content: wrap(q) }, { role: 'assistant', content: a }]),
    ],
    monitor(m) { m.addEventListener('downloadprogress', (e) => onProgress?.(e.loaded)); },
  };
  // Correction : aucune fantaisie. Reformulation : un peu de liberté, sans s'éloigner du texte
  // (réglage réservé aux extensions).
  // Correction et première reformulation : toujours la même réponse pour le même texte.
  // « Autre proposition » (pro-alt) : un peu de hasard pour varier.
  const params = kind === 'pro-alt' ? { temperature: 0.8, topK: 8 } : { temperature: 0, topK: 1 };
  try {
    return await LanguageModel.create({ ...opts, ...params });
  } catch { /* réglage refusé : valeurs par défaut */ }
  return LanguageModel.create(opts);
}

// Prépare l'IA pendant que l'utilisateur écrit, pour que Reformuler réponde plus vite.
// Seulement si le modèle est déjà sur l'ordinateur : un téléchargement doit partir d'un clic.
export async function warmUp() {
  try {
    const st = await LanguageModel.availability(lang);
    if (st === 'available') await session('pro');
  } catch { /* le clic sur Reformuler réessaiera */ }
}

const clean = (out, text) => {
  out = out.trim().replace(/^```\w*\n?|\n?```$/g, '').replace(/<\/?texte>/g, '').trim();
  if (/^["«“]/.test(out) && !/^["«“]/.test(text)) out = out.replace(/^["«“]\s*|\s*["»”]$/g, '');
  return out;
};

// `onText` reçoit le texte au fur et à mesure qu'il s'écrit.
async function ask(kind, text, onProgress, onText) {
  const s = await (await session(kind, onProgress)).clone();
  const input = base(kind) === 'pro' ? wrap(text) : text;
  try {
    if (!onText || !s.promptStreaming) return clean(await s.prompt(input), text);
    let out = '';
    for await (const chunk of s.promptStreaming(input)) {
      out += chunk;
      onText(clean(out, text));
    }
    return clean(out, text);
  } finally {
    s.destroy();
  }
}

const keep = (text, re) => (text.match(re) ?? []).sort().join('\n');
const sameKept = (a, b) => keep(a, FIELD_RE) === keep(b, FIELD_RE) && keep(a, URL_RE) === keep(b, URL_RE);

// Texte corrigé, ou le texte d'origine si la correction n'est pas sûre
// (champs ou liens touchés, longueur trop changée).
export async function correctText(text, onProgress) {
  const core = text.trim();
  if (!/\p{L}/u.test(core)) return text;
  const out = await ask('fix', core, onProgress);
  const ratio = out.length / core.length;
  if (!out || !sameKept(core, out) || ratio < 0.7 || ratio > 1.4) return text;
  // Garde les espaces du début et de la fin (collés à du texte en gras, un lien…).
  const at = text.indexOf(core);
  return text.slice(0, at) + out + text.slice(at + core.length);
}

// Touches du clavier citées dans un texte, écrites d'une seule façon (« echap », « esc » → echap).
// Entrée, Tab, Maj, Alt et Suppr sont aussi des mots courants (« date d'entrée », « maj » pour mise à jour) :
// ils ne comptent que près d'un verbe de clavier (« appuyez », « tapez », « touche »…) ou d'un « + ».
const KEY_RE = /(?<![\p{L}\d])(f(?:1[0-2]|[1-9])|[ée]chap|esc|entr[ée]e|enter|suppr|tab|ctrl|alt|maj|shift)(?![\p{L}\d])/giu;
const KEY_SAME = { esc: 'echap', enter: 'entree', shift: 'maj' };
const KEY_WORDS = new Set(['entree', 'tab', 'maj', 'alt', 'suppr']);
const KEY_BEFORE = /(?:touche|appuy|tap|press|clavier|\+)[^.!?\n]{0,30}$/i;
function keysOf(text) {
  const keys = [];
  for (const m of text.matchAll(KEY_RE)) {
    let k = m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    k = KEY_SAME[k] ?? k;
    if (KEY_WORDS.has(k)) {
      const before = text.slice(Math.max(0, m.index - 40), m.index);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 3);
      if (!KEY_BEFORE.test(before) && !/^\s*\+/.test(after)) continue;
    }
    keys.push(k);
  }
  return keys;
}

// Ce qui ne va pas dans une reformulation, ou '' si elle paraît sûre.
function problem(before, after) {
  if (!after) return 'L’IA n’a rien renvoyé. Réessayez.';
  const apology = /^(?:je suis d[ée]sol[ée]|je m.excuse|je vous prie de m.excuser|je comprends (?:votre|que|cette))/i;
  if (/mod[èe]le (?:de )?(?:langu|linguisti)|en tant qu.(?:ia|intelligence)|je suis (?:une ia|un programme)/i.test(after)
    || (apology.test(after) && !/d[ée]sol|excus|comprend/i.test(before))) {
    return 'L’IA a répondu au texte au lieu de le reformuler. Réessayez.';
  }
  if (keep(before, FIELD_RE) !== keep(after, FIELD_RE)) return 'Vérifiez les champs {…} : l’IA les a modifiés.';
  if (keep(before, URL_RE) !== keep(after, URL_RE)) return 'Vérifiez les liens : l’IA les a modifiés.';
  const lost = keysOf(before).filter((k) => !keysOf(after).includes(k));
  if (lost.length) return `Vérifiez les touches : ${[...new Set(lost)].join(', ').toUpperCase()} a disparu.`;
  if (/\?\s*$/.test(before) && !after.includes('?')) return 'Vérifiez : la question a disparu.';
  if (before.trim().length > 30 && after.length < before.trim().length * 0.25) {
    return 'Le résultat est bien plus court que votre texte : l’IA a peut-être répondu au lieu de reformuler.';
  }
  return '';
}

// Texte corrigé et rendu professionnel. `why` explique ce qui semble faux, sinon il est vide.
// `variant` : une autre formulation que la réponse habituelle (bouton « Autre proposition »).
export async function rewriteText(text, onProgress, onText, variant = false) {
  const out = await ask(variant ? 'pro-alt' : 'pro', text.trim(), onProgress, onText);
  const why = problem(text, out);
  return { text: out, ok: !why, why };
}
