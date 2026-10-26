(function () {
  let draft = null;
  function mount(el, mode) {
    const get = id => el.querySelector('#' + id);
    function capture() {
      if (mode === 'http') {
        draft = { method: get('htMethod').value, url: get('htUrl').value, headers: get('htHeaders').value, body: get('htBody').value, bodyType: draft?.bodyType || 'raw' };
      } else {
        const headers = [...el.querySelectorAll('.cg-header-row')].map(row => {
          const [key, value] = row.querySelectorAll('input'); return key.value.trim() ? key.value.trim() + ': ' + value.value : '';
        }).filter(Boolean).join('\n');
        const bodyType = get('cgBodyType').value;
        draft = { method: get('cgMethod').value, url: get('cgUrl').value, headers, body: bodyType === 'none' ? '' : get('cgBody').value, bodyType };
        if (draft.bodyType === 'json' && !/^content-type:/im.test(headers)) draft.headers += (headers ? '\n' : '') + 'Content-Type: application/json';
        if (draft.bodyType === 'form' && !/^content-type:/im.test(headers)) draft.headers += (headers ? '\n' : '') + 'Content-Type: application/x-www-form-urlencoded';
      }
    }
    function restore() {
      if (!draft) return;
      if (mode === 'http') {
        for (const [id, key] of [['htMethod','method'],['htUrl','url'],['htHeaders','headers'],['htBody','body']]) get(id).value = draft[key];
      } else {
        get('cgMethod').value = draft.method; get('cgUrl').value = draft.url;
        get('cgHeaders').replaceChildren();
        for (const line of draft.headers.split('\n').filter(Boolean)) {
          const colon = line.indexOf(':'); if (colon < 1) continue;
          cgAddHeader(); const inputs = get('cgHeaders').lastElementChild.querySelectorAll('input');
          inputs[0].value = line.slice(0, colon).trim(); inputs[1].value = line.slice(colon + 1).trim();
        }
        if (!get('cgHeaders').children.length) cgAddHeader();
        get('cgBodyType').value = draft.body ? (draft.bodyType === 'none' ? 'raw' : draft.bodyType) : 'none';
        cgBodyTypeChange(); get('cgBody').value = draft.body;
      }
    }
    restore();
    el.addEventListener('input', capture); el.addEventListener('change', capture);
    const cleanup = window._activeCleanup;
    window._activeCleanup = () => {
      capture(); cleanup?.(); el.removeEventListener('input', capture); el.removeEventListener('change', capture);
      if (mode === 'http') window._htSession = null;
      else window._cgSession = null;
    };
    return { capture, restore };
  }
  window.RequestSession = { mount, get: () => draft ? { ...draft } : null, set: value => { draft = { ...value }; } };
})();
