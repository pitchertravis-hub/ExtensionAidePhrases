// Navigation entre les trois vues. Chaque vue garde sa largeur d'origine :
// Rubriques 160 px, Phrases 775 px, Navigation ID 310 px.
const views = {
  rubriques: document.getElementById('view-rubriques'),
  phrases: document.getElementById('view-phrases'),
  nav: document.getElementById('view-nav'),
};
const leaveHandlers = {};

export let currentView = 'rubriques';

export function onLeave(name, fn) {
  leaveHandlers[name] = fn;
}

export function show(name) {
  if (name !== currentView) leaveHandlers[currentView]?.();
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
  currentView = name;
  window.scrollTo(0, 0);
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Copie impossible', e);
    return false;
  }
}

export function icon(name) {
  return `<svg class="ico"><use href="#i-${name}"/></svg>`;
}
