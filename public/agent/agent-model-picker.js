'use strict';

// Shared by full settings and the compact model switcher. Remote IDs stay text.
window.AgentModelPicker = {
  mount(root, { getConfig, onSelect }) {
    const t = window.AgentI18n.t, AG = window.AgentConfig.AG;
    root.innerHTML = `<div class="ag-model-search"><input id="cfgModelSearch" type="search" autocomplete="off" spellcheck="false" maxlength="256" aria-label="${t('models_search')}" placeholder="${t('models_search')}"><button type="button" class="ag-btn" id="cfgClearSearch">${t('models_clear_search')}</button></div>
      <div class="ag-model-meta"><span id="cfgModelCount" role="status" aria-live="polite"></span><span id="cfgModelFetchedAt"></span></div>
      <div id="cfgRemoteModel" class="ag-model-options" aria-label="${t('models_library')}"></div>
      <div id="cfgModelEmpty" class="ag-model-empty"><p></p><button type="button" class="ag-btn" id="cfgUseSearch">${t('models_use_search')}</button></div>
      <div class="ag-model-pages"><button type="button" class="ag-btn" id="cfgModelPrev">${t('models_previous')}</button><span id="cfgModelPage"></span><button type="button" class="ag-btn" id="cfgModelNext">${t('models_next')}</button></div>
      <p class="ag-hint" id="cfgModelSourceHint"></p>`;
    const field = id => root.querySelector('#' + id);
    let catalog = { models: [], recent: [], fetchedAt: 0 }, page = 0;
    const pageSize = 30;
    function render() {
      const cfg = getConfig(), remote = AG.modelIds(catalog.models), recent = AG.modelIds(catalog.recent, 12);
      const presets = remote.length ? [] : AG.modelIds(window.AgentAdapters.getAdapter(cfg.adapter)?.models);
      const ids = [...new Set([...AG.modelIds([cfg.model]), ...recent, ...remote, ...presets])];
      const query = field('cfgModelSearch').value.trim().toLowerCase();
      const matches = ids.filter(id => id.toLowerCase().includes(query));
      const total = Math.max(1, Math.ceil(matches.length / pageSize)); page = Math.min(page, total - 1);
      const fragment = document.createDocumentFragment();
      for (const id of matches.slice(page * pageSize, (page + 1) * pageSize)) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'ag-model-option'; button.dataset.modelId = id;
        button.setAttribute('aria-pressed', String(id === cfg.model)); button.setAttribute('aria-label', id); button.title = id;
        const name = document.createElement('span'); name.className = 'ag-model-name'; name.textContent = id;
        const badge = document.createElement('span'); badge.className = 'ag-model-source';
        badge.textContent = t(id === cfg.model ? 'models_current' : recent.includes(id) ? 'models_recent' : remote.includes(id) ? 'models_api' : 'models_example');
        button.append(name, badge); button.onclick = () => { onSelect(id); render(); field('cfgRemoteModel').querySelectorAll('button').forEach(item => { if (item.dataset.modelId === id) item.focus({ preventScroll: true }); }); };
        fragment.append(button);
      }
      field('cfgRemoteModel').replaceChildren(fragment); field('cfgRemoteModel').hidden = !matches.length;
      field('cfgModelEmpty').hidden = !!matches.length;
      field('cfgModelEmpty').querySelector('p').textContent = t(query ? 'models_no_match' : 'models_empty');
      field('cfgUseSearch').hidden = !AG.modelIds([field('cfgModelSearch').value]).length;
      field('cfgClearSearch').hidden = !query;
      field('cfgModelCount').textContent = t('models_count').replace('{count}', matches.length);
      field('cfgModelPage').textContent = t('models_page').replace('{page}', page + 1).replace('{total}', total);
      field('cfgModelPrev').disabled = page === 0; field('cfgModelNext').disabled = page + 1 >= total;
      root.querySelector('.ag-model-pages').hidden = total <= 1;
      field('cfgModelSourceHint').textContent = t(remote.length ? 'models_saved_hint' : 'models_example_hint');
      const fetched = Number(catalog.fetchedAt);
      field('cfgModelFetchedAt').textContent = fetched > 0 && Number.isFinite(fetched) && fetched <= Date.now() ? t('models_fetched_at') + ' ' + new Date(fetched).toLocaleString(window.AgentI18n.lang() === 'en' ? 'en-US' : 'zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    }
    field('cfgModelSearch').addEventListener('input', () => { page = 0; render(); });
    field('cfgClearSearch').onclick = () => { field('cfgModelSearch').value = ''; page = 0; render(); field('cfgModelSearch').focus(); };
    field('cfgUseSearch').onclick = () => { onSelect(field('cfgModelSearch').value.trim()); render(); };
    field('cfgModelPrev').onclick = () => { page--; render(); field('cfgRemoteModel').scrollTop = 0; };
    field('cfgModelNext').onclick = () => { page++; render(); field('cfgRemoteModel').scrollTop = 0; };
    return {
      setCatalog(value, resetSearch = false) { catalog = value; page = 0; if (resetSearch) field('cfgModelSearch').value = ''; render(); },
      updateSelection() { render(); },
      focus() { field('cfgModelSearch').focus(); },
    };
  },
};
