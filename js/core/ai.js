// IA intégrée à Chrome (Prompt API, modèle local) : corriger ou reformuler un texte.
// Rien n'est envoyé sur Internet. Sans l'API ou sans machine compatible, l'interface IA reste cachée.
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
  // Correction et ton professionnel, pour l'onglet Rédiger.
  pro: `Tu réécris des messages pour un usage professionnel en français (clients, partenaires, collègues).
Corrige toutes les fautes et reformule le texte dans un ton professionnel, courtois et clair, avec vouvoiement.
Commence par une formule de salutation adaptée et termine par une formule de politesse courte, comme « Cordialement, ».
Garde tout le sens et toutes les informations du texte, n'invente aucun fait, aucune date, aucun nom.
Reste concis : pas de phrases inutiles. Fais des paragraphes courts, et une liste à tirets si le texte énumère plusieurs éléments.
${KEEP}`,
};

const URL_RE = /https?:\/\/\S+/g;
const sessions = {};

// 'available', 'downloadable', 'downloading' ou 'unavailable'.
export async function aiStatus() {
  if (!('LanguageModel' in self)) return 'unavailable';
  try {
    return await LanguageModel.availability(LANG);
  } catch {
    return 'unavailable';
  }
}

async function session(kind, onProgress) {
  if (sessions[kind]) return sessions[kind];
  const opts = {
    ...LANG,
    initialPrompts: [{ role: 'system', content: PROMPTS[kind] }],
    monitor(m) { m.addEventListener('downloadprogress', (e) => onProgress?.(e.loaded)); },
  };
  // Correction : réponse la plus sûre possible (réglage réservé aux extensions).
  if (kind === 'fix') {
    try {
      sessions[kind] = await LanguageModel.create({ ...opts, temperature: 0, topK: 1 });
      return sessions[kind];
    } catch { /* réglage refusé : valeurs par défaut */ }
  }
  sessions[kind] = await LanguageModel.create(opts);
  return sessions[kind];
}

async function ask(kind, text, onProgress) {
  const s = await (await session(kind, onProgress)).clone();
  try {
    let out = (await s.prompt(text)).trim().replace(/^```\w*\n?|\n?```$/g, '').trim();
    if (/^["«“]/.test(out) && !/^["«“]/.test(text)) out = out.replace(/^["«“]\s*|\s*["»”]$/g, '');
    return out;
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

// Texte corrigé et rendu professionnel. `ok` est faux si l'IA a touché aux champs ou aux liens.
export async function rewriteText(text, onProgress) {
  const out = await ask('pro', text.trim(), onProgress);
  return { text: out, ok: !!out && sameKept(text, out) };
}
