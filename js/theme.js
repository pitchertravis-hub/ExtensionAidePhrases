// Avant l'affichage : apparence (évite un flash) et format (fenêtre ou panneau latéral).
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'dark' : 'light';
  var palette = null, layout = null, perso = null, affichage = null;
  try { palette = localStorage.getItem('zt-palette'); layout = localStorage.getItem('zt-layout'); perso = localStorage.getItem('zt-perso'); affichage = localStorage.getItem('zt-affichage'); } catch (e) {}
  root.dataset.palette = palette || 'or';
  root.dataset.layout = layout || 'band';
  window.tpApplyPerso(perso);
  window.tpApplyAffichage(affichage);
  try {
    if (chrome.extension.getViews({ type: 'popup' }).indexOf(window) !== -1) root.classList.add('is-popup');
  } catch (e) {}
})();

// Palette « Perso » : deux couleurs choisies (bandeau, accent), tout le reste en est déduit,
// en clair et en sombre. Appelée ici au démarrage et par le menu Apparence (js/ui/look.js).
function tpApplyPerso(json) {
  var cfg = { rail: '#22304A', accent: '#E0822F' };
  try { if (json) { var c = JSON.parse(json); if (/^#[0-9a-f]{6}$/i.test(c.rail)) cfg.rail = c.rail; if (/^#[0-9a-f]{6}$/i.test(c.accent)) cfg.accent = c.accent; } } catch (e) {}

  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function hsl(hx) {
    var c = rgb(hx).map(function (v) { return v / 255; });
    var mx = Math.max.apply(null, c), mn = Math.min.apply(null, c), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))); };
    return hex([f(0), f(8), f(4)]);
  }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function lum(hx) {
    var c = rgb(hx).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  // Éclaircit ou fonce la couleur jusqu'au contraste voulu sur le fond donné.
  function readable(hx, bg, min, step) {
    var c = hsl(hx), out = hx;
    for (var i = 0; i < 40 && contrast(out, bg) < min; i++) { c[2] = Math.max(0, Math.min(1, c[2] + step)); out = fromHsl(c[0], c[1], c[2]); }
    return out;
  }
  function rgba(hx, a) { var c = rgb(hx); return 'rgba(' + c.join(', ') + ', ' + a + ')'; }

  // Le bandeau reste sombre : son texte est toujours clair.
  var r = hsl(cfg.rail), rail = r[2] > .24 ? fromHsl(r[0], r[1], .24) : cfg.rail;
  var h = r[0], s = r[1];
  var n = function (sat, l) { return fromHsl(h, Math.min(s, sat), l); };

  var accL = readable(cfg.accent, '#FFFFFF', 3.6, -.03);
  var surfD = n(.3, .1);
  var accD = readable(cfg.accent, surfD, 5, .03);
  var bright = readable(cfg.accent, rail, 5.5, .03);
  var a = hsl(accL), gradTop = fromHsl(a[0], a[1], Math.min(.85, a[2] + .1));
  var brandOn = contrast('#FFFFFF', accL) >= 3.2 ? '#FFFFFF' : mix(rail, '#000000', .4);

  var light = {
    bg: mix('#F7F7F8', rail, .035), surface: '#FFFFFF', sunken: mix('#F1F1F3', rail, .05),
    ink: n(.35, .1), 'ink-2': n(.2, .27), muted: n(.12, .5), line: mix('#E6E6E9', rail, .06), 'line-strong': mix('#D4D4D9', rail, .08),
    accent: accL, 'accent-soft': mix('#FFFFFF', accL, .12), gold: accL, 'gold-soft': mix('#FFFFFF', accL, .12),
    'brand-grad': 'linear-gradient(135deg, ' + gradTop + ', ' + accL + ')', 'brand-on': brandOn, 'brand-tp': accL, 'brand-bright': bright,
    rail: rail, 'rail-hi': rgba(bright, .16)
  };
  var darkV = {
    bg: n(.3, .07), surface: surfD, sunken: n(.3, .13),
    ink: n(.15, .92), 'ink-2': n(.12, .8), muted: n(.1, .6), line: n(.2, .16), 'line-strong': n(.2, .21),
    accent: accD, 'accent-soft': mix(surfD, accD, .18), gold: accD, 'gold-soft': mix(surfD, accD, .18), 'brand-tp': accD,
    rail: fromHsl(h, s, Math.min(hsl(rail)[2], .08) * .8)
  };
  var decl = function (o) { return Object.keys(o).map(function (k) { return '--' + k + ': ' + o[k] + ';'; }).join(' '); };

  var el = document.getElementById('persoStyle');
  if (!el) { el = document.createElement('style'); el.id = 'persoStyle'; document.head.appendChild(el); }
  // html[…] l'emporte sur le :root commun de palettes.css, chargé après.
  el.textContent = 'html[data-palette="perso"] { ' + decl(light) + ' }\n' +
    'html[data-palette="perso"][data-theme="dark"] { ' + decl(darkV) + ' }';
  return cfg;
}

// Réglages d'affichage (css/affichage.css) : un attribut sur <html> par réglage, absent = d'origine.
// Appelée ici au démarrage et par le menu Apparence (js/ui/look.js).
function tpApplyAffichage(json) {
  var TP_AFFICHAGE = { size: 'm', dens: 'normal', corners: 'normal', font: 'manrope', pattern: 'none', grad: '', side: 'show', sideW: 200 };
  var cfg = {}, k;
  for (k in TP_AFFICHAGE) cfg[k] = TP_AFFICHAGE[k];
  try { if (json) { var c = JSON.parse(json); for (k in cfg) if (c[k] != null && typeof c[k] === typeof cfg[k]) cfg[k] = c[k]; } } catch (e) {}
  var root = document.documentElement;
  ['size', 'dens', 'corners', 'font', 'pattern', 'side'].forEach(function (key) {
    if (cfg[key] === TP_AFFICHAGE[key]) delete root.dataset[key]; else root.dataset[key] = cfg[key];
  });
  if (/^#[0-9a-f]{6}$/i.test(cfg.grad)) { root.dataset.grad = ''; root.style.setProperty('--rail2', cfg.grad); }
  else { cfg.grad = ''; delete root.dataset.grad; root.style.removeProperty('--rail2'); }
  cfg.sideW = Math.max(150, Math.min(320, Math.round(cfg.sideW) || 200));
  root.style.setProperty('--side-w', cfg.sideW + 'px');
  return cfg;
}
