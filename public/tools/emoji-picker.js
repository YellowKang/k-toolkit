const _emojiDict = {
  zh: {
    frequent: '常用', smileys: '表情', gestures: '手势', animals: '动物', food: '食物', symbols: '符号',
    search_ph: '搜索 emoji...', selected: '已选：', copy: '复制', copied: '已复制', copied_emoji: e => '已复制 ' + e,
  },
  en: {
    frequent: 'Frequent', smileys: 'Smileys', gestures: 'Gestures', animals: 'Animals', food: 'Food', symbols: 'Symbols',
    search_ph: 'Search emoji...', selected: 'Selected: ', copy: 'Copy', copied: 'Copied', copied_emoji: e => 'Copied ' + e,
  },
};

window.renderEmojiPicker = function(el) {
  const T = makeToolI18n(_emojiDict);
  const groups = [
    {label:T('frequent'), emojis:'😀😂🤣😍🥰😎🤔😅🙏👍❤️🔥✨💯🎉🎊🎁🎂🎈🎤🎵🎶🎮🎲🏆🥇🎯'},
    {label:T('smileys'), emojis:'😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵💫🤯🤠🥳🥸😎🤓🧐😕😟🙁😮😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈'},
    {label:T('gestures'), emojis:'👋🤚🖐️✋🖖🤙👌🤌🤏✌️🤞🤟🤘🤙👈👉👆🖕👇☝️👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦾🦿🦵🦶👂🦻👃'},
    {label:T('animals'), emojis:'🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🪲🦟🦗🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🦦🦥🦫🦧🦣🐘🦛🦏🐪🐫🦒🦘🦬🐃🐂🐄🫎'},
    {label:T('food'), emojis:'🍎🍊🍋🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🥑🍆🥦🥬🥒🌶️🫑🧄🧅🥔🌽🍠🫘🥐🥖🫓🥨🥯🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🌭🍔🍟🍕🫔🌮🌯🥙🧆🥚🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍘🍥🥮🍢🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜🍯🧃🥤🧋'},
    {label:T('symbols'), emojis:'❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉️✡️🔯🕎☯️☦️🛐⛎♈♉♊♋♌♍♎♏♐♑♒♓🆔⚛️🉑☣️☢️⚠️🚸🔞🔱🔰♻️✅❎🌐💠Ⓜ️🌀💤🏧🚾♿🅿️🈳🈹🛗🈂️🈷️🈶🉐🈵🈴🈼🈺🈚🈲🈸🅰️🅱️🆎🆑🆒🆓🆕🆖🅾️🆗🅾️🆘🆙🆚🈁🆚'},
  ];
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="tool-input" id="epSearch" placeholder="${T('search_ph')}" oninput="epFilter()" style="flex:1">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="epTabs">
        ${groups.map((g,i) => `<button class="btn btn-secondary" onclick="epTab(${i})" id="epTab${i}" style="font-size:12px">${g.label}</button>`).join('')}
      </div>
      <div id="epGrid" style="display:flex;flex-wrap:wrap;gap:4px;min-height:120px"></div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-muted)">${T('selected')}<span id="epSelected" style="font-size:20px"></span></span>
        <button class="btn btn-primary" onclick="epCopy()">${T('copy')}</button>
      </div>
    </div>`;
  window._epGroups = groups;
  window._epCur = 0;
  epTab(0);
};

function epTab(i) {
  window._epCur = i;
  document.getElementById('epSearch').value = '';
  const groups = window._epGroups;
  groups.forEach((_,j) => {
    const b = document.getElementById('epTab'+j);
    if (b) b.style.borderColor = j===i ? 'var(--accent)' : 'var(--glass-border)';
  });
  epRender([...groups[i].emojis].filter(c => c.trim()));
}

function epFilter() {
  const q = (document.getElementById('epSearch').value || '').trim();
  if (!q) { epTab(window._epCur); return; }
  // 优先按分类名过滤
  const matchedGroups = window._epGroups.filter(g => g.label.toLowerCase().includes(q.toLowerCase()));
  if (matchedGroups.length) {
    const all = matchedGroups.flatMap(g => [...g.emojis].filter(c => c.trim()));
    epRender([...new Set(all)]);
    return;
  }
  // 无匹配分类则展示全量
  const all = window._epGroups.flatMap(g => [...g.emojis].filter(c => c.trim()));
  epRender([...new Set(all)]);
}

function epRender(emojis) {
  const grid = document.getElementById('epGrid');
  if (!grid) return;
  grid.innerHTML = emojis.map(e =>
    `<button onclick="epSelect('${e}')" style="font-size:24px;padding:6px;background:rgba(255,255,255,0.04);border:1px solid transparent;border-radius:8px;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">${e}</button>`
  ).join('');
}

function epSelect(e) {
  const el = document.getElementById('epSelected');
  if (el) el.textContent = e;
  navigator.clipboard.writeText(e).then(() => showToast(makeToolI18n(_emojiDict)('copied_emoji', e)));
}

function epCopy() {
  const el = document.getElementById('epSelected');
  if (!el || !el.textContent) return;
  navigator.clipboard.writeText(el.textContent).then(() => showToast(makeToolI18n(_emojiDict)('copied')));
}