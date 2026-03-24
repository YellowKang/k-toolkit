window.renderSlugGen = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">Slug 生成器</div>
<input class="tool-input" id="sgInput" placeholder="输入标题或文本（支持中文、英文、数字）..." oninput="doSlugGen()" style="margin-bottom:12px">
<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">
<span style="font-size:12px;color:var(--text-muted)">分隔符：</span>
<button class="btn btn-secondary" id="sgSep-" onclick="setSgSep('-')">横线 -</button>
<button class="btn btn-secondary" id="sgSep_" onclick="setSgSep('_')">下划线 _</button>
<button class="btn btn-secondary" id="sgSepd" onclick="setSgSep('.')">点 .</button>
</div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<span class="panel-label" style="margin:0">生成结果</span>
<button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('sgResult').textContent).then(()=>showToast('已复制'))">复制</button>
</div>
<div class="result-box" id="sgResult" style="min-height:40px;word-break:break-all"></div>
</div>`;
window._sgSep = '-';
setSgSep('-');
};
const _PINYIN = {你:'ni',好:'hao',世:'shi',界:'jie',中:'zhong',国:'guo',人:'ren',大:'da',小:'xiao',上:'shang',下:'xia',的:'de',是:'shi',在:'zai',有:'you',这:'zhe',我:'wo',他:'ta',她:'ta',它:'ta',们:'men',了:'le',着:'zhe',过:'guo',来:'lai',去:'qu',不:'bu',也:'ye',都:'dou',和:'he',与:'yu',或:'huo',年:'nian',月:'yue',日:'ri',时:'shi',分:'fen',秒:'miao',天:'tian',地:'di',山:'shan',水:'shui',火:'huo',风:'feng',云:'yun',雨:'yu',花:'hua',草:'cao',树:'shu',鸟:'niao',鱼:'yu',马:'ma',牛:'niu',羊:'yang',猫:'mao',狗:'gou',家:'jia',门:'men',窗:'chuang',路:'lu',车:'che',船:'chuan',飞:'fei',机:'ji',电:'dian',话:'hua',网:'wang',书:'shu',文:'wen',字:'zi',学:'xue',校:'xiao',生:'sheng',老:'lao',师:'shi',友:'you',爱:'ai',心:'xin',手:'shou',眼:'yan',口:'kou',耳:'er',头:'tou',身:'shen',脚:'jiao',力:'li',美:'mei',好:'hao',坏:'huai',新:'xin',旧:'jiu',长:'chang',短:'duan',高:'gao',低:'di',多:'duo',少:'shao',快:'kuai',慢:'man',热:'re',冷:'leng',红:'hong',绿:'lv',蓝:'lan',白:'bai',黑:'hei',黄:'huang',工:'gong',作:'zuo',用:'yong',开:'kai',关:'guan',进:'jin',出:'chu',看:'kan',听:'ting',说:'shuo',读:'du',写:'xie',走:'zou',跑:'pao',吃:'chi',喝:'he',睡:'shui',起:'qi',做:'zuo',想:'xiang',知:'zhi',明:'ming',白:'bai',清:'qing',真:'zhen',假:'jia',对:'dui',错:'cuo',好:'hao',坏:'huai'};
function _toPinyin(str) {
return str.split('').map(c => _PINYIN[c] || (c.charCodeAt(0) > 127 ? '' : c)).join('');
}
function setSgSep(sep) {
window._sgSep = sep;
const ids = [['sgSep-','-'],['sgSep_','_'],['sgSepd','.']];
ids.forEach(([id,s]) => {
const btn = document.getElementById(id);
if (btn) btn.style.borderColor = s === sep ? 'var(--accent)' : 'var(--glass-border)';
});
doSlugGen();
}
function doSlugGen() {
const input = (document.getElementById('sgInput') || {}).value || '';
const sep = window._sgSep || '-';
const escaped = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pinyin = _toPinyin(input);
const result = pinyin
.toLowerCase()
.replace(/[^\x00-\x7F]/g, '')
.replace(/[^a-z0-9]+/g, sep)
.replace(new RegExp('^' + escaped + '+|' + escaped + '+$', 'g'), '');
const el = document.getElementById('sgResult');
if (el) el.textContent = result;
}