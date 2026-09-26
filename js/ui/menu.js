// Menus en popover : se ferment seuls au clic dehors ou avec Échap.
const MARGIN = 4;

// Ouvre `menu` sous `anchor` (bouton) ou à la position de la souris.
export function openMenu(menu, { anchor, x, y }) {
  if (menu.matches(':popover-open')) menu.hidePopover();
  menu.style.left = '0px';
  menu.style.top = '0px';
  menu.showPopover();
  const w = menu.offsetWidth;
  const h = menu.offsetHeight;
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    x = r.right - w;
    y = r.bottom + MARGIN;
    if (y + h > window.innerHeight - MARGIN) y = r.top - h - MARGIN;
  }
  const maxX = window.innerWidth - w - MARGIN;
  const maxY = window.innerHeight - h - MARGIN;
  menu.style.left = `${Math.max(MARGIN, Math.min(x, maxX))}px`;
  menu.style.top = `${Math.max(MARGIN, Math.min(y, maxY))}px`;
  menu.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}

// Branche les boutons [data-act] du menu sur des actions.
export function bindMenu(menu, handler) {
  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    menu.hidePopover();
    handler(btn.dataset.act);
  });
}
