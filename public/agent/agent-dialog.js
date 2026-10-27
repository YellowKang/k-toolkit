'use strict';

// One active modal: retain focus even when its backdrop receives a pointer click.
window.AgentDialog = {
  trap(overlay, box, onClose) {
    const previous = document.activeElement;
    const visible = () => [...box.querySelectorAll('button,input,textarea,select,summary,a[href],[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    box.tabIndex = -1;
    const focus = () => (visible()[0] || box).focus();
    const keydown = event => {
      if (!overlay.isConnected) return;
      if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopImmediatePropagation(); onClose(); }
      if (event.key === 'Tab') {
        const items = visible(), first = items[0] || box, last = items.at(-1) || box;
        if (!box.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      }
    };
    const focusin = event => { if (overlay.isConnected && !box.contains(event.target)) focus(); };
    const pointer = event => { if (event.target === overlay) { event.preventDefault(); if (!box.contains(document.activeElement)) focus(); } };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', focusin, true);
    overlay.addEventListener('pointerdown', pointer);
    return () => {
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', focusin, true);
      overlay.removeEventListener('pointerdown', pointer);
      if (previous?.isConnected) previous.focus();
    };
  },
};
