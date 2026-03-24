window.renderEmojiPicker = function(el) {
const groups = [
{label:'常用', emojis:'😀😂🤣😍🥰😎🤔😅🙏👍❤️🔥✨💯🎉🎊🎁🎂🎈🎤🎵🎶🎮🎲🏆🥇🎯'},
{label:'表情', emojis:'😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵💫🤯🤠🥳🥸😎🤓🧐😕😟🙁😮😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈'},
{label:'手势', emojis:'👋🤚🖐️✋🖖🤙👌🤌🤏✌️🤞🤟🤘🤙👈👉👆🖕👇☝️👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦾🦿🦵🦶👂🦻👃'},
{label:'动物', emojis:'🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🪲🦟🦗🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🦦🦥🦫🦧🦣🐘🦛🦏🐪🐫🦒🦘🦬🐃🐂🐄🫎'},
{label:'食物', emojis:'🍎🍊🍋🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🥑🍆🥦🥬🥒🌶️🫑🧄🧅🥔🌽🍠🫘🥐🥖🫓🥨🥯🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🌭🍔🍟🍕🫔🌮🌯🥙🧆🥚🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍘🍥🥮🍢🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜🍯🧃🥤🧋'},
{label:'符号', emojis:'❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉️✡️🔯🕎☯️☦️🛐⛎♈♉♊♋♌♍♎♏♐♑♒♓🆔⚛️🉑☣️☢️⚠️🚸🔞🔱🔰♻️✅❎🌐💠Ⓜ️🌀💤🏧🚾♿🅿️🈳🈹🛗🈂️🈷️🈶🉐🈵🈴🈼🈺🈚🈲🈸🅰️🅱️🆎🆑🆒🆓🆕🆖🅾️🆗🅾️🆘🆙🆚🈁🆚'},
];
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:8px;margin-bottom:12px">
<input class="tool-input" id="epSearch" placeholder="搜索 emoji..." oninput="epFilter()" style="flex:1">
</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="epTabs">
${groups.map((g,i) => `<button class="btn btn-secondary" onclick="epTab(${i})" id="epTab${i}" style="font-size:12px">${g.label}</button>`).join('')}
</div>
<div id="epGrid" style="display:flex;flex-wrap:wrap;gap:4px;min-height:120px"></div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center">
<span style="font-size:13px;color:var(--text-muted)">已选：<span id="epSelected" style="font-size:20px"></span></span>
<button class="btn btn-primary" onclick="epCopy()">复制</button>
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
const matchedGroups = window._epGroups.filter(g => g.label.includes(q));
if (matchedGroups.length) {
const all = matchedGroups.flatMap(g => [...g.emojis].filter(c => c.trim()));
epRender([...new Set(all)]);
return;
}
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
navigator.clipboard.writeText(e).then(() => showToast('已复制 ' + e));
}
function epCopy() {
const el = document.getElementById('epSelected');
if (!el || !el.textContent) return;
navigator.clipboard.writeText(el.textContent).then(() => showToast('已复制'));
}