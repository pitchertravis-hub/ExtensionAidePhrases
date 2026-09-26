// IA intégrée à Chrome (Prompt API, modèle local) : corriger ou reformuler un texte.
// Rien n'est envoyé sur Internet. Sans l'API ou sans machine compatible, l'onglet Rédiger explique pourquoi.
import { FIELD_RE } from './fields.js';
import { MODULES } from '../data/id-menus.js';

// Noms exacts des modules et options du logiciel ID, pour que l'IA les écrive correctement.
const ID_NAMES = [...new Set(Object.values(MODULES).flatMap((m) => [
  m.name, ...Object.values(m.options).map((o) => (typeof o === 'string' ? o : o.name)),
]))].join(', ');

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
  pro: `Tu améliores des messages courts écrits par un technicien du support du logiciel ID (tchat, consignes, réponses aux clients).
Réponds toujours en français.
Ton travail : corriger toutes les fautes ET reformuler les phrases pour qu'elles soient fluides, claires et professionnelles.
Le texte ne doit pas être seulement corrigé : réécris vraiment les phrases.
Règles :
- Au vouvoiement, avec des tournures directes : « Accédez à », « Cliquez sur », « Vous pourrez », « N'oubliez pas de ».
- Évite les répétitions (« puis… puis… », « il faut… il faut… ») et les phrases trop longues : coupe-les en phrases courtes.
- Garde le même sens et toutes les étapes, dans le même ordre. N'ajoute aucune information, n'en retire aucune.
- Garde exactement les noms du logiciel : modules, menus, écrans, boutons, touches (F4, Entrée…). Ne les découpe pas et ne les renomme pas.
- Noms officiels des menus du logiciel ID : ${ID_NAMES}. Si le texte parle d'un de ces menus, même avec une faute, écris son nom officiel.
- Longueur proche du texte d'origine. Pas de liste ni de paragraphes en plus.
- N'ajoute ni « Bonjour » ni « Cordialement » ni aucune formule de politesse si le texte n'en contient pas. S'il en contient, garde-les.
- Évite les formules lourdes comme « veuillez procéder à » ou « afin de ».
${KEEP}`,
};

// Exemples montrés à l'IA avant chaque texte : ce qu'on attend exactement.
const EXAMPLES = {
  pro: [
    ['pouvez vous allez dans le module suivi de factrue puis de renseigner le numero de facture puis fin validé\nIl suffit ensuite de cliquer sur la facture de faire f4 saisie manuel d\'un rejet',
      'Rendez-vous dans le module Suivi Factures, saisissez le numéro de facture, puis validez.\nCliquez ensuite sur la facture et appuyez sur F4 pour faire la saisie manuelle du rejet.'],
    ['Il faut accéder à la fiche patient puis de clique sur le menu burger en haut à gauche puis de cliquer sur info commercial vous aurez la posibilité de cocher le relevé d\'opération et n\'oubliez de selection un profil d\'édtion puis de sauvegarder',
      'Accédez à la fiche patient, puis cliquez sur le menu burger en haut à gauche et choisissez Info Commercial. Vous pourrez y cocher le relevé d\'opérations. N\'oubliez pas de sélectionner un profil d\'édition avant de sauvegarder.'],
    ['bonjour, je regarde sa et je reviens vers vous des que possible merci de patienter',
      'Bonjour, je vérifie cela et je reviens vers vous dès que possible. Merci de votre patience.'],
  ],
};

const URL_RE = /https?:\/\/\S+/g;
const sessions = {};
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

async function session(kind, onProgress) {
  if (sessions[kind]) return sessions[kind];
  const opts = {
    ...lang,
    initialPrompts: [
      { role: 'system', content: PROMPTS[kind] },
      ...(EXAMPLES[kind] ?? []).flatMap(([q, a]) => [{ role: 'user', content: q }, { role: 'assistant', content: a }]),
    ],
    monitor(m) { m.addEventListener('downloadprogress', (e) => onProgress?.(e.loaded)); },
  };
  // Correction : aucune fantaisie. Reformulation : un peu de liberté, sans s'éloigner du texte
  // (réglage réservé aux extensions).
  const params = kind === 'fix' ? { temperature: 0, topK: 1 } : { temperature: 0.5, topK: 3 };
  try {
    sessions[kind] = await LanguageModel.create({ ...opts, ...params });
    return sessions[kind];
  } catch { /* réglage refusé : valeurs par défaut */ }
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
