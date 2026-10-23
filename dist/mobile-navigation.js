/** Native dialog navigation: one menu on phones/tablets; no changes to assessment state. */
export function bindMobileNavigation({ onHelp } = {}) {
  const toggle = document.getElementById('menu-toggle');
  const dialog = document.getElementById('mobile-menu');
  const compact = matchMedia('(max-width: 1023px)');
  let restoreFocus = true, previousOverflow = '';
  const close = (restore = true) => {
    if (!dialog.open) return;
    restoreFocus = restore;
    document.documentElement.style.overflow = previousOverflow;
    toggle.setAttribute('aria-expanded', 'false');
    dialog.close();
  };
  toggle.addEventListener('click', () => {
    if (!compact.matches || dialog.open) return;
    restoreFocus = true;
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    document.getElementById('menu-close').focus();
  });
  document.getElementById('menu-close').addEventListener('click', () => close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('a[href],button,summary,[tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length && !el.disabled);
    const first = items[0], last = items.at(-1);
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus && toggle.getClientRects().length) toggle.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target.closest('a[href^="#"]')) {
      if (event.defaultPrevented) return;
      close(false);
      queueMicrotask(() => document.getElementById('main').focus({ preventScroll: true }));
    } else if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    }
  });
  document.getElementById('mobile-help').addEventListener('click', () => {
    close();
    onHelp?.();
  });
  compact.addEventListener('change', () => {
    if (!compact.matches && dialog.open) {
      close(false);
      document.querySelector('.brand').focus({ preventScroll: true });
    }
  });
  return {
    sync({ mode, section, sectionsHTML, saved }) {
      const labels = { start: 'Teacher intake', handoff: 'Your handoff', questions: 'Vendor responses', analyst: 'District analyst review', review: 'Review & export', about: 'Source & attribution', changes: 'Changelog' };
      const label = labels[mode] || labels.start;
      document.getElementById('mobile-location').textContent = mode === 'questions' && section ? label + ' · ' + section : label;
      for (const a of dialog.querySelectorAll('a[data-menu-page]')) {
        if (a.dataset.menuPage === mode) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
      const sections = document.getElementById('mobile-sections');
      if (sections.innerHTML !== sectionsHTML) sections.innerHTML = sectionsHTML;
      document.getElementById('mobile-save-status').textContent = saved;
    },
    close,
  };
}
