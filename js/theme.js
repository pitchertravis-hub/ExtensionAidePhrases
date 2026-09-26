// Avant l'affichage : thème (évite un flash clair) et format (fenêtre ou panneau latéral).
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'dark' : 'light';
  try {
    if (chrome.extension.getViews({ type: 'popup' }).indexOf(window) !== -1) root.classList.add('is-popup');
  } catch (e) {}
})();
