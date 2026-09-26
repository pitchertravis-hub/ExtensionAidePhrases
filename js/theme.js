// Avant l'affichage : apparence (évite un flash) et format (fenêtre ou panneau latéral).
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'dark' : 'light';
  var palette = null, layout = null;
  try { palette = localStorage.getItem('zt-palette'); layout = localStorage.getItem('zt-layout'); } catch (e) {}
  root.dataset.palette = palette || 'or';
  root.dataset.layout = layout || 'band';
  try {
    if (chrome.extension.getViews({ type: 'popup' }).indexOf(window) !== -1) root.classList.add('is-popup');
  } catch (e) {}
})();
