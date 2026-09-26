// Applique le thème avant l'affichage pour éviter un flash clair en mode sombre.
(function () {
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
