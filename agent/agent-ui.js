'use strict';
const AG_CSS = `
/* FAB styles are in agent-loader.js (injected early) */
#agentPanel {
position: fixed;
z-index: 9999;
display: flex;
flex-direction: column;
border-radius: var(--ag-radius,16px);
background: var(--ag-bg,rgba(18,18,30,0.82));
backdrop-filter: var(--ag-blur,blur(24px));
-webkit-backdrop-filter: var(--ag-blur,blur(24px));
border: 1px solid var(--ag-border,rgba(255,255,255,0.12));
box-shadow: var(--ag-shadow,0 8px 32px rgba(0,0,0,0.4));
color: var(--ag-text,#e2e8f0);
font-family: var(--ag-font,inherit);
overflow: hidden;
transition: width 0.2s, height 0.2s;
}
#agentPanel[data-position="right"] { right: 20px; bottom: 140px; }
#agentPanel[data-position="left"]  { left: 20px;  bottom: 140px; }
#agentPanel[data-size="normal"]  { width: 380px; height: 600px; }
#agentPanel[data-size="large"]   { width: 480px; height: 720px; }
#agentPanel[data-size="compact"] { width: 320px; height: 480px; }
.ag-header {
display: flex;
align-items: center;
justify-content: space-between;
padding: 12px 16px;
border-bottom: 1px solid var(--ag-border,rgba(255,255,255,0.12));
flex-shrink: 0;
}
.ag-header-title { font-weight: 600; font-size: 15px; }
.ag-header-actions { display: flex; gap: 4px; }
.ag-btn {
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.12));
color: var(--ag-text,#e2e8f0);
border-radius: 8px;
padding: 4px 10px;
cursor: pointer;
font-size: 13px;
transition: background 0.15s;
}
.ag-btn:hover { background: var(--ag-accent,#6366f1); color: var(--ag-accent-text,#fff); }
.ag-btn-icon { padding: 4px 8px; }
.ag-messages {
flex: 1;
overflow-y: auto;
padding: 12px;
display: flex;
flex-direction: column;
gap: 10px;
scroll-behavior: smooth;
}
.ag-messages::-webkit-scrollbar { width: 4px; }
.ag-messages::-webkit-scrollbar-thumb { background: var(--ag-border,rgba(255,255,255,0.12)); border-radius: 2px; }
.ag-bubble {
max-width: 85%;
padding: 9px 13px;
border-radius: 12px;
font-size: 14px;
line-height: 1.5;
word-break: break-word;
}
.ag-bubble.user {
align-self: flex-end;
background: var(--ag-accent,#6366f1);
color: var(--ag-accent-text,#fff);
border-bottom-right-radius: 4px;
}
.ag-bubble.assistant {
align-self: flex-start;
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.08));
border-bottom-left-radius: 4px;
}
.ag-bubble.error {
align-self: flex-start;
background: rgba(239,68,68,0.15);
border: 1px solid rgba(239,68,68,0.4);
color: #fca5a5;
border-radius: 10px;
}
.ag-thinking {
align-self: flex-start;
display: flex;
align-items: center;
gap: 6px;
padding: 8px 12px;
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.08));
border-radius: 12px;
font-size: 13px;
color: var(--ag-text2,#94a3b8);
}
.ag-skill-tag {
align-self: flex-start;
display: inline-flex;
align-items: center;
gap: 4px;
padding: 3px 10px;
background: rgba(99,102,241,0.15);
border: 1px solid rgba(99,102,241,0.3);
border-radius: 20px;
font-size: 11px;
color: var(--ag-accent,#6366f1);
margin-bottom: 4px;
}
.ag-hint-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.ag-chip {
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.15));
border-radius: 14px;
color: var(--ag-text,#e2e8f0);
font-size: 11px;
padding: 3px 10px;
cursor: pointer;
transition: background 0.15s;
font-family: var(--ag-font,inherit);
}
.ag-chip:hover { background: var(--ag-accent,#6366f1); color: #fff; border-color: var(--ag-accent,#6366f1); }
.ag-auto-hint { opacity: 0.88; border-left: 2px solid var(--ag-accent,#6366f1); }
.ag-thinking-dots { display: flex; gap: 3px; }
.ag-thinking-dots span {
width: 6px; height: 6px;
background: var(--ag-accent,#6366f1);
border-radius: 50%;
animation: agPulse 1.2s infinite;
}
.ag-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.ag-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes agPulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
.ag-card {
align-self: flex-start;
width: 100%;
max-width: 100%;
background: var(--ag-bg2,rgba(255,255,255,0.04));
border: 1px solid var(--ag-border,rgba(255,255,255,0.1));
border-radius: 10px;
overflow: hidden;
font-size: 13px;
}
.ag-card-header {
display: flex;
align-items: center;
gap: 8px;
padding: 8px 12px;
color: var(--ag-text2,#94a3b8);
}
.ag-card-icon { font-size: 14px; }
.ag-card-name { font-weight: 500; color: var(--ag-text,#e2e8f0); }
.ag-card-params { color: var(--ag-text2,#94a3b8); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex:1; }
.ag-card-body { padding: 4px 12px 10px; }
.ag-card-display { color: var(--ag-text,#e2e8f0); margin-bottom: 6px; }
.ag-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ag-card-detail { display: none; margin-top: 6px; }
.ag-card-detail.open { display: block; }
.ag-card-detail pre {
background: rgba(0,0,0,0.3);
border-radius: 6px;
padding: 8px;
font-size: 11px;
overflow-x: auto;
color: var(--ag-text,#e2e8f0);
max-height: 180px;
overflow-y: auto;
white-space: pre-wrap;
word-break: break-all;
}
.ag-spin { animation: agSpin 1s linear infinite; display: inline-block; }
@keyframes agSpin { to { transform: rotate(360deg); } }
.ag-footer {
padding: 10px 12px;
border-top: 1px solid var(--ag-border,rgba(255,255,255,0.12));
display: flex;
gap: 8px;
align-items: flex-end;
flex-shrink: 0;
}
#agInput {
flex: 1;
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.12));
border-radius: 10px;
color: var(--ag-text,#e2e8f0);
font-family: var(--ag-font,inherit);
font-size: 14px;
padding: 8px 12px;
resize: none;
outline: none;
min-height: 38px;
max-height: 120px;
}
#agInput::placeholder { color: var(--ag-text2,#94a3b8); }
#agInput:focus { border-color: var(--ag-accent,#6366f1); }
#agSendBtn {
width: 36px; height: 36px;
border-radius: 50%;
border: none;
background: var(--ag-accent,#6366f1);
color: var(--ag-accent-text,#fff);
font-size: 16px;
cursor: pointer;
flex-shrink: 0;
transition: background 0.15s, transform 0.1s;
display: flex;
align-items: center;
justify-content: center;
}
.ag-cmd-suggest {
position: absolute;
bottom: 70px;
left: 12px;
right: 12px;
background: var(--ag-bg,rgba(18,18,30,0.96));
border: 1px solid var(--ag-border,rgba(255,255,255,0.12));
border-radius: 10px;
overflow: hidden;
z-index: 10001;
box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.ag-sug-item {
display: flex;
align-items: center;
gap: 8px;
padding: 8px 12px;
cursor: pointer;
transition: background 0.1s;
}
.ag-sug-item:hover, .ag-sug-item.active { background: var(--ag-bg2,rgba(255,255,255,0.08)); }
.ag-sug-cmd { font-family: monospace; font-size: 12px; color: var(--ag-accent,#6366f1); min-width: 80px; }
.ag-sug-desc { font-size: 12px; color: var(--ag-text2,#94a3b8); }
#agSendBtn:hover { background: #7c3aed; transform: scale(1.05); }
#agSendBtn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
/* Config modal */
#agConfigModal {
position: fixed;
inset: 0;
z-index: 10000;
background: rgba(0,0,0,0.55);
display: flex;
align-items: center;
justify-content: center;
animation: ag-rp-fadein 0.15s;
}
.ag-config-box {
background: rgba(15,23,42,0.97);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 18px;
padding: 0;
width: 400px;
max-height: 88vh;
overflow-y: auto;
color: var(--ag-text,#e2e8f0);
font-family: var(--ag-font,inherit);
box-shadow: 0 24px 80px rgba(0,0,0,0.6);
animation: ag-rp-slideup 0.2s ease-out;
}
.ag-config-box::-webkit-scrollbar { width: 4px; }
.ag-config-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
.ag-config-header {
padding: 20px 24px 16px;
border-bottom: 1px solid rgba(255,255,255,0.06);
display: flex;
align-items: center;
justify-content: space-between;
}
.ag-config-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.ag-config-header .ag-config-close {
background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;
padding: 4px 8px; border-radius: 6px; transition: all 0.15s;
}
.ag-config-header .ag-config-close:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }
.ag-config-section { padding: 16px 24px 0; }
.ag-config-section-title {
font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
color: var(--ag-accent,#6366f1); margin-bottom: 12px;
display: flex; align-items: center; gap: 6px;
}
.ag-config-section-title::after {
content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06);
}
.ag-config-row { margin-bottom: 14px; }
.ag-config-label { font-size: 12px; color: var(--ag-text2,#94a3b8); margin-bottom: 5px; display: flex; align-items: center; gap: 4px; }
.ag-config-row input, .ag-config-row select {
width: 100%; box-sizing: border-box;
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 8px;
color: var(--ag-text,#e2e8f0);
padding: 8px 12px;
font-size: 13px;
outline: none;
transition: border-color 0.15s;
}
.ag-config-row input:focus, .ag-config-row select:focus { border-color: var(--ag-accent,#6366f1); }
.ag-config-row select option { background: #1e1e2e; }
.ag-adapter-btns, .ag-pos-btns, .ag-size-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.ag-opt-btn {
padding: 6px 14px;
border-radius: 8px;
border: 1px solid rgba(255,255,255,0.1);
background: rgba(255,255,255,0.04);
color: var(--ag-text,#e2e8f0);
font-size: 12px;
cursor: pointer;
transition: all 0.15s;
}
.ag-opt-btn:hover { background: rgba(255,255,255,0.08); }
.ag-opt-btn.active { background: var(--ag-accent,#6366f1); color: var(--ag-accent-text,#fff); border-color: var(--ag-accent,#6366f1); }
/* Skin buttons with color dot preview */
.ag-skin-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.ag-skin-btn {
display: flex; align-items: center; gap: 6px;
padding: 6px 12px; border-radius: 8px;
border: 1px solid rgba(255,255,255,0.1);
background: rgba(255,255,255,0.04);
color: var(--ag-text,#e2e8f0);
font-size: 12px; cursor: pointer;
transition: all 0.15s;
}
.ag-skin-btn:hover { background: rgba(255,255,255,0.08); }
.ag-skin-btn.active { border-color: var(--ag-accent,#6366f1); background: rgba(99,102,241,0.15); }
.ag-skin-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; }
.ag-range { width: 100%; accent-color: var(--ag-accent,#6366f1); margin-top: 2px; }
.ag-config-footer {
display: flex; gap: 8px; padding: 16px 24px;
border-top: 1px solid rgba(255,255,255,0.06);
justify-content: flex-end;
}
.ag-config-footer .ag-btn { padding: 6px 18px; font-size: 13px; }
.ag-key-wrap { position: relative; }
.ag-key-wrap input { padding-right: 36px; }
.ag-eye-btn {
position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
background: none; border: none; color: var(--ag-text2,#94a3b8); cursor: pointer; font-size: 14px;
}
.ag-hint { font-size: 11px; color: var(--ag-text2,#94a3b8); margin-top: 4px; }
/* Color picker row */
.ag-color-row { display: flex; gap: 8px; align-items: center; }
.ag-color-row input[type="color"] { width: 40px; height: 32px; border: none; background: none; cursor: pointer; padding: 0; border-radius: 6px; }
/* Shortcut display in config */
.ag-shortcuts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.ag-shortcut-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; font-size: 12px; }
.ag-shortcut-key { font-family: 'SF Mono', monospace; font-size: 11px; color: var(--ag-accent,#6366f1); background: rgba(99,102,241,0.12); padding: 2px 6px; border-radius: 4px; }
/* Markdown basics in assistant bubble */
.ag-bubble.assistant code {
background: rgba(0,0,0,0.3);
padding: 1px 4px;
border-radius: 3px;
font-family: monospace;
font-size: 12px;
}
.ag-bubble.assistant strong { color: #fff; }
/* Enhanced tool cards with status colors */
.ag-card.success { border-color: rgba(34,197,94,0.3); }
.ag-card.success .ag-card-header { background: rgba(34,197,94,0.08); }
.ag-card.error { border-color: rgba(239,68,68,0.3); }
.ag-card.error .ag-card-header { background: rgba(239,68,68,0.08); }
.ag-card-status { font-size: 11px; color: var(--ag-text2,#94a3b8); margin-left: auto; white-space: nowrap; }
.ag-card-status.ok { color: #22c55e; }
.ag-card-status.fail { color: #ef4444; }
/* Thinking animation with action name */
.ag-thinking-label { font-size: 12px; }
.ag-thinking-timer { font-size: 11px; color: var(--ag-accent,#6366f1); font-variant-numeric: tabular-nums; margin-left: 4px; }
/* Message timestamps */
.ag-bubble-time { font-size: 10px; opacity: 0.5; margin-top: 4px; display: block; text-align: right; }
.ag-bubble.user .ag-bubble-time { text-align: right; }
.ag-bubble.assistant .ag-bubble-time { text-align: left; }
/* Stop button */
#agStopBtn {
display: none;
width: 36px; height: 36px;
border-radius: 50%;
border: 2px solid #ef4444;
background: rgba(239,68,68,0.15);
color: #ef4444;
font-size: 14px;
cursor: pointer;
flex-shrink: 0;
transition: background 0.15s;
}
#agStopBtn:hover { background: rgba(239,68,68,0.3); }
#agStopBtn.visible { display: flex; align-items: center; justify-content: center; }
/* Enhanced markdown in assistant bubbles */
.ag-bubble.assistant pre {
background: rgba(0,0,0,0.35);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 6px;
padding: 10px;
font-family: 'SF Mono', 'Fira Code', monospace;
font-size: 12px;
overflow-x: auto;
margin: 6px 0;
line-height: 1.4;
}
.ag-bubble.assistant pre code {
background: none;
padding: 0;
font-size: inherit;
}
.ag-bubble.assistant ul, .ag-bubble.assistant ol {
padding-left: 20px;
margin: 4px 0;
}
.ag-bubble.assistant li { margin-bottom: 2px; }
.ag-bubble.assistant a {
color: var(--ag-accent,#6366f1);
text-decoration: underline;
text-decoration-color: rgba(99,102,241,0.4);
}
.ag-bubble.assistant h1,.ag-bubble.assistant h2,.ag-bubble.assistant h3 {
font-size: 14px;
font-weight: 600;
margin: 8px 0 4px;
color: #fff;
}
.ag-bubble.assistant blockquote {
border-left: 3px solid var(--ag-accent,#6366f1);
margin: 6px 0;
padding: 4px 10px;
opacity: 0.85;
}
.ag-bubble.assistant table {
border-collapse: collapse;
font-size: 12px;
margin: 6px 0;
width: 100%;
}
.ag-bubble.assistant th, .ag-bubble.assistant td {
border: 1px solid rgba(255,255,255,0.12);
padding: 4px 8px;
text-align: left;
}
.ag-bubble.assistant th {
background: rgba(255,255,255,0.06);
font-weight: 600;
}
/* Inline copy button for bubbles */
.ag-bubble-copy {
position: absolute;
top: 6px;
right: 6px;
background: rgba(0,0,0,0.4);
border: 1px solid rgba(255,255,255,0.15);
color: var(--ag-text2,#94a3b8);
border-radius: 4px;
padding: 2px 6px;
font-size: 10px;
cursor: pointer;
opacity: 0;
transition: opacity 0.15s;
}
.ag-bubble:hover .ag-bubble-copy { opacity: 1; }
.ag-bubble { position: relative; }
/* Card animation */
.ag-card { animation: agSlideIn 0.2s ease-out; }
@keyframes agSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
/* Welcome enhancement */
.ag-welcome-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ag-welcome-chip {
background: rgba(99,102,241,0.1);
border: 1px solid rgba(99,102,241,0.25);
border-radius: 16px;
padding: 4px 12px;
font-size: 12px;
color: var(--ag-accent,#6366f1);
cursor: pointer;
transition: all 0.15s;
}
.ag-welcome-chip:hover { background: var(--ag-accent,#6366f1); color: #fff; }
/* ── Mini dialog (chat style) ─────────────────────────────────── */
#agMiniOverlay {
position: fixed;
inset: 0;
z-index: 10200;
background: rgba(0,0,0,0.45);
display: flex;
align-items: flex-start;
justify-content: center;
padding-top: min(18vh, 140px);
animation: ag-rp-fadein 0.15s;
}
#agMiniBox {
width: min(480px, 92vw);
background: rgba(15,23,42,0.96);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid rgba(99,102,241,0.25);
border-radius: 16px;
box-shadow: 0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.08) inset;
overflow: hidden;
animation: ag-rp-slideup 0.2s ease-out;
display: flex;
flex-direction: column;
max-height: min(520px, 70vh);
}
/* Mini header */
.ag-mini-header {
display: flex;
align-items: center;
justify-content: space-between;
padding: 10px 16px;
border-bottom: 1px solid rgba(255,255,255,0.08);
flex-shrink: 0;
}
.ag-mini-header-title {
font-size: 13px;
font-weight: 600;
color: var(--ag-text,#e2e8f0);
}
.ag-mini-header-actions { display: flex; gap: 4px; }
.ag-mini-hdr-btn {
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.1);
color: var(--ag-text2,#94a3b8);
border-radius: 6px;
width: 26px; height: 26px;
font-size: 13px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: background 0.15s, color 0.15s;
}
.ag-mini-hdr-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
/* Mini messages area */
#agMiniMessages {
flex: 1;
overflow-y: auto;
padding: 10px 14px;
display: flex;
flex-direction: column;
gap: 8px;
scroll-behavior: smooth;
min-height: 60px;
}
#agMiniMessages::-webkit-scrollbar { width: 3px; }
#agMiniMessages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
/* Mini bubbles — compact version of full-panel bubbles */
.ag-mini-bubble {
max-width: 88%;
padding: 7px 11px;
border-radius: 10px;
font-size: 13px;
line-height: 1.5;
word-break: break-word;
animation: agSlideIn 0.15s ease-out;
}
.ag-mini-bubble.user {
align-self: flex-end;
background: var(--ag-accent,#6366f1);
color: var(--ag-accent-text,#fff);
border-bottom-right-radius: 3px;
}
.ag-mini-bubble.assistant {
align-self: flex-start;
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.08));
color: var(--ag-text,#e2e8f0);
border-bottom-left-radius: 3px;
}
.ag-mini-bubble.assistant code {
background: rgba(0,0,0,0.3);
padding: 1px 4px;
border-radius: 3px;
font-family: 'SF Mono', monospace;
font-size: 12px;
}
.ag-mini-bubble.assistant pre {
background: rgba(0,0,0,0.35);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 6px;
padding: 8px;
font-family: 'SF Mono', monospace;
font-size: 11px;
overflow-x: auto;
margin: 4px 0;
}
.ag-mini-bubble.assistant pre code { background: none; padding: 0; font-size: inherit; }
.ag-mini-bubble.assistant strong { color: #fff; }
.ag-mini-bubble.error {
align-self: flex-start;
background: rgba(239,68,68,0.12);
border: 1px solid rgba(239,68,68,0.35);
color: #fca5a5;
border-radius: 10px;
}
.ag-mini-bubble.thinking {
align-self: flex-start;
display: flex;
align-items: center;
gap: 6px;
background: var(--ag-bg2,rgba(255,255,255,0.06));
border: 1px solid var(--ag-border,rgba(255,255,255,0.08));
color: var(--ag-text2,#94a3b8);
font-size: 12px;
}
/* Mini welcome */
.ag-mini-welcome {
text-align: center;
padding: 8px 0 4px;
color: var(--ag-text2,#94a3b8);
font-size: 13px;
}
.ag-mini-welcome-text { display: block; margin-bottom: 8px; }
.ag-mini-chips { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; }
.ag-mini-chip {
background: rgba(99,102,241,0.1);
border: 1px solid rgba(99,102,241,0.25);
border-radius: 14px;
padding: 3px 10px;
font-size: 11px;
color: var(--ag-accent,#6366f1);
cursor: pointer;
transition: all 0.15s;
}
.ag-mini-chip:hover { background: var(--ag-accent,#6366f1); color: #fff; }
/* Mini input row */
.ag-mini-input-row {
display: flex;
align-items: center;
gap: 8px;
padding: 10px 14px;
border-top: 1px solid rgba(255,255,255,0.08);
flex-shrink: 0;
}
#agMiniInput {
flex: 1;
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 10px;
color: #f1f5f9;
font-size: 14px;
padding: 9px 14px;
outline: none;
font-family: inherit;
transition: border-color 0.15s;
}
#agMiniInput::placeholder { color: #64748b; }
#agMiniInput:focus { border-color: var(--ag-accent,#6366f1); }
#agMiniSendBtn {
width: 34px; height: 34px;
border-radius: 50%;
border: none;
background: var(--ag-accent,#6366f1);
color: var(--ag-accent-text,#fff);
font-size: 16px;
cursor: pointer;
flex-shrink: 0;
display: flex;
align-items: center;
justify-content: center;
transition: background 0.15s, transform 0.1s;
}
#agMiniSendBtn:hover { background: #7c3aed; transform: scale(1.05); }
#agMiniSendBtn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
/* Mini footer */
.ag-mini-footer {
padding: 6px 14px;
border-top: 1px solid rgba(255,255,255,0.06);
display: flex;
justify-content: center;
align-items: center;
font-size: 11px;
color: #64748b;
flex-shrink: 0;
}
.ag-mini-keys { display: flex; gap: 10px; }
.ag-mini-key {
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.1);
border-radius: 4px;
padding: 1px 6px;
font-family: inherit;
font-size: 10px;
color: #94a3b8;
}
@media (max-width: 639px) {
#agentPanel {
left: 0 !important; right: 0 !important;
bottom: 0 !important;
width: 100% !important;
height: 70vh !important;
border-radius: var(--ag-radius,16px) var(--ag-radius,16px) 0 0 !important;
}
}
`;
function injectCSS() {
if (document.getElementById('ag-styles')) return;
const s = document.createElement('style');
s.id = 'ag-styles';
s.textContent = AG_CSS;
document.head.appendChild(s);
}
function mdToHtml(text) {
let html = text;
html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
return '<pre><code class="lang-' + (lang||'text') + '">' + code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</code></pre>';
});
html = html.replace(/`([^`]+)`/g, (_, code) => '<code>' + code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</code>');
// Escape remaining HTML (but not our tags)
const parts = html.split(/(<\/?(?:pre|code|strong|em|a|ul|ol|li|h[1-3]|blockquote|table|thead|tbody|tr|th|td|br)[^>]*>)/);
html = parts.map((p, i) => i % 2 === 0 ? p.replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/<(?!\/?(?:pre|code|strong|em|a|ul|ol|li|h[1-3]|blockquote|table|thead|tbody|tr|th|td|br))/g, '&lt;') : p).join('');
// Headers (### > ## > #)
html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
// Bold & italic
html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
// Links (reject javascript: and data: schemes to prevent XSS)
html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
if (/^\s*(?:javascript|data|vbscript):/i.test(url)) return text;
return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>';
});
// Blockquotes
html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
// Unordered lists
html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (_, list) => {
const items = list.trim().split('\n').map(l => '<li>' + l.replace(/^- /, '') + '</li>').join('');
return '<ul>' + items + '</ul>';
});
// Ordered lists
html = html.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (_, list) => {
const items = list.trim().split('\n').map(l => '<li>' + l.replace(/^\d+\. /, '') + '</li>').join('');
return '<ol>' + items + '</ol>';
});
// Line breaks (but not inside pre/code)
html = html.replace(/\n/g, '<br>');
// Clean up br inside block elements
html = html.replace(/<br>(<\/?(?:pre|ul|ol|li|h[1-3]|blockquote|table))/g, '$1');
html = html.replace(/(<\/(?:pre|ul|ol|li|h[1-3]|blockquote|table)>)<br>/g, '$1');
return html;
}
function scrollBottom() {
const el = document.getElementById('agMessages');
if (el) el.scrollTop = el.scrollHeight;
}
// ── State (shared with agent-ui-part2.js via window) ────────────
// Using var instead of let so they are accessible across script files
// (let/const at top-level in 'use strict' non-module scripts are script-scoped, not global)
var _session = null;
var _thinkingEl = null;
var _cardMap = {}; // tc.id => card element
var _busy = false;
// ── Panel builder ───────────────────────────────────────────────
function buildPanel() {
const { AG, SKINS, applySkin } = window.AgentConfig;
const cfg = AG.load();
let panel = document.getElementById('agentPanel');
if (panel) { panel.style.display = 'flex'; return; }
panel = document.createElement('div');
panel.id = 'agentPanel';
panel.setAttribute('data-skin', cfg.skin);
panel.setAttribute('data-position', cfg.position);
panel.setAttribute('data-size', cfg.size);
panel.style.display = 'flex';
panel.innerHTML = [
'<div class="ag-header">',
'  <div class="ag-header-title">&#129302; K Assistant</div>',
'  <div class="ag-header-actions">',
'    <button class="ag-btn ag-btn-icon" id="agConfigBtn" title="\u8bbe\u7f6e">&#9881;&#65039;</button>',
'    <button class="ag-btn ag-btn-icon" id="agClearBtn" title="\u6e05\u7a7a">&#128465;</button>',
'    <button class="ag-btn ag-btn-icon" id="agCloseBtn" title="\u5173\u95ed">&#10005;</button>',
'  </div>',
'</div>',
'<div class="ag-messages" id="agMessages"></div>',
'<div class="ag-footer">',
'  <textarea id="agInput" rows="1" placeholder="\u95ee\u6211\u4efb\u4f55\u4e8b... Enter \u53d1\u9001"></textarea>',
'  <button id="agStopBtn" title="\u505c\u6b62\u751f\u6210">&#9724;</button>',
'  <button id="agSendBtn">&#8593;</button>',
'</div>',
].join('');
document.body.appendChild(panel);
// Welcome message
const welcomeEl = document.createElement('div');
welcomeEl.className = 'ag-bubble assistant';
const isEn = (window._i18n?.lang || 'zh') === 'en';
const kbdMod = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';
welcomeEl.innerHTML = (isEn
? `👋 Hi! How can I help?<br><span style="font-size:11px;opacity:0.5">${kbdMod}+J quick ask · Alt+A full panel</span>`
: `👋 你好！有什么可以帮你的？<br><span style="font-size:11px;opacity:0.5">${kbdMod}+J 快速提问 · Alt+A 完整面板</span>`) +
'<div class="ag-welcome-chips">' +
[
isEn ? ['Generate UUID', '生成 UUID'] : ['生成 UUID', '生成 UUID'],
isEn ? ['Hash text', '帮我哈希'] : ['帮我算哈希', '帮我算哈希'],
isEn ? ['Format JSON', '格式化 JSON'] : ['格式化 JSON', '格式化 JSON'],
isEn ? ['Convert time', '时间戳转换'] : ['时间戳转换', '时间戳转换'],
isEn ? ['Base64 encode', 'Base64 编码'] : ['Base64 编码', 'Base64 编码'],
isEn ? ['Generate password', '生成密码'] : ['生成密码', '生成密码'],
].map(([label, msg]) => `<span class="ag-welcome-chip" onclick="window._agChipSend && window._agChipSend(this,'${msg}')">${label}</span>`).join('') +
'</div>';
document.getElementById('agMessages').appendChild(welcomeEl);
// Apply skin variables
applySkin(cfg.skin);
// ── Drag to move ────────────────────────────────────────────
(function initDrag() {
const header = panel.querySelector('.ag-header');
let dragging = false, ox = 0, oy = 0;
header.style.cursor = 'grab';
header.addEventListener('mousedown', e => {
if (e.target.closest('button')) return;
dragging = true;
const r = panel.getBoundingClientRect();
ox = e.clientX - r.left;
oy = e.clientY - r.top;
header.style.cursor = 'grabbing';
e.preventDefault();
});
document.addEventListener('mousemove', e => {
if (!dragging) return;
let x = e.clientX - ox, y = e.clientY - oy;
x = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  x));
y = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, y));
panel.style.right  = 'auto';
panel.style.bottom = 'auto';
panel.style.left   = x + 'px';
panel.style.top    = y + 'px';
});
document.addEventListener('mouseup', () => {
dragging = false;
header.style.cursor = 'grab';
});
})();
// Wire close / clear / config
document.getElementById('agCloseBtn').onclick = () => { panel.style.display = 'none'; };
document.getElementById('agClearBtn').onclick = () => {
if (_session) _session.clearHistory();
document.getElementById('agMessages').innerHTML = '';
_cardMap = {};
};
document.getElementById('agConfigBtn').onclick = () => openConfig();
const input   = document.getElementById('agInput');
const sendBtn = document.getElementById('agSendBtn');
input.addEventListener('keydown', e => {
// 补全浮层键盘导航
const sug = document.getElementById('agCmdSuggest');
if (sug) {
const items = sug.querySelectorAll('.ag-sug-item');
if (e.key === 'ArrowDown') { e.preventDefault(); _sugIdx = Math.min(_sugIdx+1, items.length-1); _sugHighlight(items); return; }
if (e.key === 'ArrowUp')   { e.preventDefault(); _sugIdx = Math.max(_sugIdx-1, 0); _sugHighlight(items); return; }
if (e.key === 'Tab' || (e.key === 'Enter' && _sugIdx >= 0)) {
e.preventDefault();
const active = sug.querySelector('.ag-sug-item.active');
if (active) { input.value = '/' + active.dataset.cmd + ' '; _hideSuggest(); return; }
}
if (e.key === 'Escape') { _hideSuggest(); return; }
}
if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); _hideSuggest(); doSend(); }
});
input.addEventListener('input', () => {
input.style.height = 'auto';
input.style.height = Math.min(input.scrollHeight, 120) + 'px';
// 斜杠命令补全
const val = input.value;
if (val.startsWith('/') && !val.includes(' ') && window.CmdParser) {
const sugs = window.CmdParser.getSuggestions(val);
_showSuggest(sugs, input);
} else {
_hideSuggest();
}
});
sendBtn.onclick = doSend;
const stopBtn = document.getElementById('agStopBtn');
if (stopBtn) stopBtn.onclick = () => {
if (_session) _session.abort();
setBusy(false);
stopBtn.classList.remove('visible');
};
}
// Exported entry points for agent-loader
var _sugIdx = -1;
function _sugHighlight(items) {
items.forEach((el,i) => el.classList.toggle('active', i === _sugIdx));
}
function _hideSuggest() {
const el = document.getElementById('agCmdSuggest');
if (el) el.remove();
_sugIdx = -1;
}
function _showSuggest(sugs, input) {
_hideSuggest();
if (!sugs.length) return;
const box = document.createElement('div');
box.id = 'agCmdSuggest';
box.className = 'ag-cmd-suggest';
sugs.slice(0,8).forEach((s,i) => {
const item = document.createElement('div');
item.className = 'ag-sug-item';
item.dataset.cmd = s.cmd;
item.innerHTML = '<span class="ag-sug-cmd">/'+s.cmd+'</span><span class="ag-sug-desc">'+s.desc+'</span>';
item.addEventListener('mousedown', e => { e.preventDefault(); input.value='/'+s.cmd+' '; _hideSuggest(); input.focus(); });
box.appendChild(item);
});
const panel = document.getElementById('agentPanel');
if (panel) panel.appendChild(box);
}
window._agInjectCSS  = injectCSS;
window._agBuildPanel = buildPanel;
window._agMdToHtml   = mdToHtml;
// Chip quick-send: clicking a hint chip fills and sends the input
window._agChipSend = function(btn, text) {
const input = document.getElementById('agInput');
if (!input) return;
input.value = text;
input.style.height = 'auto';
input.style.height = Math.min(input.scrollHeight, 120) + 'px';
// Trigger send via part2
window._agDoSend && window._agDoSend();
};