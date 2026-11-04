const _mockTl = makeToolI18n({
  zh: {
    title: 'Mock 数据生成', add_field: '+ 添加字段', remove: '删除', field_name: '字段名',
    fields_mode: '按字段生成', schema_mode: '按 Schema 生成', schema_label: 'JSON Schema（Draft-07）', seed: '随机种子', optional: '尽量包含可选字段', count_schema: '样本条数（1–100）', sample: '填入示例', cancel: '取消', cancelled: '已取消', working: '正在生成并校验…',
    schema_help: '支持嵌套对象、数组、枚举、常用约束、非循环本地引用、anyOf/oneOf 和常见 format；pattern、allOf、条件及远程引用等规则会明确报错。',
    types_note: 'JSON 输出为样本数组，每条已通过原 Schema 校验。TypeScript 仅描述原 Schema 的结构，不代替运行时校验。',
    generated: (n,seed) => `已生成并校验 ${n} 条 · 种子 ${seed}`, preview_note: '仅预览前 64,000 字符；复制和下载包含完整内容。', send_json: '带入 JSON 工具', output_kind: '查看结果',
    field_type: '类型', count: '生成条数', generate: '生成数据', clear: '清空',
    output_format: '输出格式', result_title: '生成结果', copy: '复制', download: '下载',
    t_name: '姓名', t_phone: '手机', t_email: '邮箱', t_address: '地址', t_date: '日期',
    t_uuid: 'UUID', t_ip: 'IP', t_url: 'URL', t_company: '公司名', t_number: '数字',
    table_name: '表名', sql_table: 'mock_data',
  },
  en: {
    title: 'Mock Data Generator', add_field: '+ Add Field', remove: 'Remove', field_name: 'Field Name',
    fields_mode: 'Generate by fields', schema_mode: 'Generate from schema', schema_label: 'JSON Schema (Draft-07)', seed: 'Random seed', optional: 'Include optional fields when possible', count_schema: 'Sample count (1–100)', sample: 'Load sample', cancel: 'Cancel', cancelled: 'Cancelled', working: 'Generating and validating…',
    schema_help: 'Supports nested objects, arrays, enums, common constraints, non-recursive local refs, anyOf/oneOf and common formats. Rules such as pattern, allOf, conditions and remote refs report an explicit error.',
    types_note: 'JSON output is an array of samples, each validated against the original schema. TypeScript describes the schema structure only; it does not replace runtime validation.',
    generated: (n,seed) => `Generated and validated ${n} samples · seed ${seed}`, preview_note: 'Preview limited to 64,000 characters; copy and download include all content.', send_json: 'Open in JSON tool', output_kind: 'View result',
    field_type: 'Type', count: 'Count', generate: 'Generate', clear: 'Clear',
    output_format: 'Output Format', result_title: 'Result', copy: 'Copy', download: 'Download',
    t_name: 'Name', t_phone: 'Phone', t_email: 'Email', t_address: 'Address', t_date: 'Date',
    t_uuid: 'UUID', t_ip: 'IP', t_url: 'URL', t_company: 'Company', t_number: 'Number',
    table_name: 'Table Name', sql_table: 'mock_data',
  }
});

const _mockData = {
  zh: {
    surnames: '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'.split(''),
    givens: '伟芳秀英敏静丽强磊洋勇艳娜军杰娟涛明超秀华建平刚文辉力斌玲桂兰萍'.split(''),
    cities: ['北京市朝阳区','上海市浦东新区','广州市天河区','深圳市南山区','杭州市西湖区','成都市武侯区','武汉市洪山区','南京市鼓楼区'],
    roads: ['建国路','中山大道','人民路','解放路','科技路','学院路','文化路','和平路'],
    companies: ['腾讯科技','阿里巴巴','字节跳动','华为技术','百度在线','京东集团','美团点评','网易公司','小米科技','滴滴出行'],
  },
  en: {
    firsts: ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Elizabeth','David','Sarah','Richard','Karen','Joseph','Nancy','Thomas','Lisa','Charles','Betty'],
    lasts: ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark'],
    cities: ['New York, NY','Los Angeles, CA','Chicago, IL','Houston, TX','Phoenix, AZ','San Francisco, CA','Seattle, WA','Denver, CO'],
    roads: ['Main St','Oak Ave','Elm St','Pine Rd','Maple Dr','Cedar Ln','Broadway','Park Ave'],
    companies: ['Acme Corp','Globex Inc','Initech','Umbrella Co','Stark Industries','Wayne Enterprises','Cyberdyne Systems','Soylent Corp','Wonka Industries','Aperture Science'],
  }
};

let _mockFields = [];
let _mockFormat = 'json';

function renderMockData(el) {
  _mockFields = [
    { name: 'id', type: 'number' },
    { name: 'name', type: 'name' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'phone' },
  ];
  const T = _mockTl;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div id="mockFieldList"></div>
      <div style="margin-top:10px">
        <button class="btn btn-secondary" onclick="_mockAddField()">${T('add_field')}</button>
      </div>
      <div style="display:flex;gap:12px;align-items:center;margin-top:14px;flex-wrap:wrap">
        <label style="font-size:13px;color:var(--text-muted)">${T('count')}</label>
        <input type="range" id="mockCount" min="1" max="1000" value="10" oninput="document.getElementById('mockCountVal').textContent=this.value" style="flex:1;min-width:120px">
        <span id="mockCountVal" style="font-size:14px;font-weight:600;min-width:36px;text-align:right">10</span>
      </div>
      <div style="display:flex;gap:12px;align-items:center;margin-top:10px;flex-wrap:wrap">
        <label style="font-size:13px;color:var(--text-muted)">${T('output_format')}</label>
        <select id="mockFormat" class="tool-input" style="width:auto" onchange="_mockFormat=this.value">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="sql">SQL INSERT</option>
        </select>
        <span id="mockSqlTableWrap" style="display:none">
          <label style="font-size:12px;color:var(--text-muted)">${T('table_name')}</label>
          <input class="tool-input" id="mockSqlTable" value="mock_data" style="width:120px">
        </span>
      </div>
      <div class="tool-actions" style="margin-top:12px">
        <button class="btn btn-primary" onclick="_mockGenerate()">${T('generate')}</button>
        <button class="btn btn-secondary" onclick="_mockClear()">${T('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="mockResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('result_title')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('mockOutput').textContent,this)">${T('copy')}</button>
          <button class="btn btn-secondary" onclick="_mockDownload()">${T('download')}</button>
        </div>
      </div>
      <pre class="result-box" id="mockOutput" style="max-height:400px;overflow:auto;white-space:pre-wrap"></pre>
    </div>`;
  document.getElementById('mockFormat').addEventListener('change', function() {
    document.getElementById('mockSqlTableWrap').style.display = this.value === 'sql' ? '' : 'none';
  });
  _mockRenderFields();
  _mockMountSchema(el);
}

function _mockRenderFields() {
  _mockInvalidateFields();
  const T = _mockTl;
  const types = ['name','phone','email','address','date','uuid','ip','url','company','number'];
  const c = document.getElementById('mockFieldList');
  c.innerHTML = _mockFields.map((f, i) => `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <input class="tool-input" value="${escHtml(f.name)}" onchange="_mockFields[${i}].name=this.value" placeholder="${T('field_name')}" style="width:120px">
      <select class="tool-input" style="width:auto" onchange="_mockFields[${i}].type=this.value">
        ${types.map(t => `<option value="${t}" ${t===f.type?'selected':''}>${T('t_'+t)}</option>`).join('')}
      </select>
      <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="_mockFields.splice(${i},1);_mockRenderFields()">${T('remove')}</button>
    </div>`).join('');
}

function _mockAddField() {
  _mockFields.push({ name: 'field' + (_mockFields.length + 1), type: 'name' });
  _mockRenderFields();
}

function _mockRand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _mockRandInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function _mockGenValue(type, index) {
  const lang = (typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh');
  const d = lang === 'en' ? _mockData.en : _mockData.zh;
  switch (type) {
    case 'name':
      return lang === 'en'
        ? _mockRand(d.firsts) + ' ' + _mockRand(d.lasts)
        : _mockRand(_mockData.zh.surnames) + _mockRand(_mockData.zh.givens) + (Math.random()>0.5 ? _mockRand(_mockData.zh.givens) : '');
    case 'phone': {
      const pre = _mockRand(['13','15','17','18','19']);
      return pre + String(_mockRandInt(100000000, 999999999));
    }
    case 'email': {
      const names = lang === 'en' ? d.firsts : _mockData.zh.surnames;
      const u = _mockRand(names).toLowerCase() + _mockRandInt(10, 999);
      return u + '@' + _mockRand(['gmail.com','outlook.com','qq.com','163.com','company.com']);
    }
    case 'address':
      return _mockRand(d.cities) + _mockRand(d.roads) + _mockRandInt(1, 999) + (lang === 'en' ? '' : '号');
    case 'date': {
      const y = _mockRandInt(2000, 2025), m = _mockRandInt(1,12), day = _mockRandInt(1,28);
      return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    case 'uuid':
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
      });
    case 'ip':
      return [_mockRandInt(1,254),_mockRandInt(0,255),_mockRandInt(0,255),_mockRandInt(1,254)].join('.');
    case 'url':
      return 'https://' + _mockRand(['example.com','test.org','demo.io','app.dev']) + '/' + _mockRand(['api','page','user','data']) + '/' + _mockRandInt(1,9999);
    case 'company':
      return _mockRand(d.companies);
    case 'number':
      return _mockRandInt(1, index + 1);
    default:
      return '';
  }
}

function _mockGenerate() {
  const count = parseInt(document.getElementById('mockCount').value) || 10;
  const format = document.getElementById('mockFormat').value;
  const rows = [];
  for (let i = 0; i < count; i++) {
    const row = {};
    _mockFields.forEach(f => { row[f.name] = _mockGenValue(f.type, i); });
    rows.push(row);
  }
  let output = '';
  if (format === 'json') {
    output = JSON.stringify(rows, null, 2);
  } else if (format === 'csv') {
    const keys = _mockFields.map(f => f.name);
    const lines = [keys.join(',')];
    rows.forEach(r => lines.push(keys.map(k => {
      const v = String(r[k]);
      return v.includes(',') || v.includes('"') || v.includes('\n') ? '"' + v.replace(/"/g,'""') + '"' : v;
    }).join(',')));
    output = lines.join('\n');
  } else {
    const table = document.getElementById('mockSqlTable').value || 'mock_data';
    const keys = _mockFields.map(f => f.name);
    output = rows.map(r => {
      const vals = keys.map(k => typeof r[k] === 'number' ? r[k] : "'" + String(r[k]).replace(/'/g,"''") + "'");
      return `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${vals.join(', ')});`;
    }).join('\n');
  }
  document.getElementById('mockOutput').textContent = output;
  document.getElementById('mockResultPanel').style.display = '';
}

function _mockDownload() {
  const text = document.getElementById('mockOutput').textContent;
  if (!text) return;
  const fmt = document.getElementById('mockFormat').value;
  const ext = fmt === 'csv' ? 'csv' : fmt === 'sql' ? 'sql' : 'json';
  const mime = fmt === 'csv' ? 'text/csv' : fmt === 'sql' ? 'text/sql' : 'application/json';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = 'mock-data.' + ext;
  a.click();
  URL.revokeObjectURL(a.href);
}

function _mockClear() {
  document.getElementById('mockResultPanel').style.display = 'none';
  document.getElementById('mockOutput').textContent = '';
}

function _mockInvalidateFields() { const panel=document.getElementById('mockResultPanel');if(panel){panel.style.display='none';document.getElementById('mockOutput').textContent='';} }
function _mockMountSchema(el) {
  const T=_mockTl,fields=el.firstElementChild;fields.id='mockFieldControls';
  el.insertAdjacentHTML('afterbegin',`<div class="tool-actions"><button id="mockFieldsMode" class="btn btn-primary" aria-pressed="true">${T('fields_mode')}</button><button id="mockSchemaMode" class="btn btn-secondary" aria-pressed="false">${T('schema_mode')}</button></div>
    <section id="mockSchemaPanel" class="tool-card-panel" hidden>
      <label class="panel-label" for="mockSchemaInput">${T('schema_label')}</label><textarea id="mockSchemaInput" class="tool-textarea" rows="12" spellcheck="false"></textarea>
      <p class="workspace-notice">${T('schema_help')}</p>
      <div class="tool-actions"><label>${T('seed')}<input id="mockSchemaSeed" class="tool-input" value="42" maxlength="128"></label><label>${T('count_schema')}<input id="mockSchemaCount" class="tool-input" type="number" min="1" max="100" value="3"></label><label><input id="mockSchemaOptional" type="checkbox" checked>${T('optional')}</label></div>
      <div class="tool-actions"><button id="mockSchemaGenerate" class="btn btn-primary" data-tool-submit>${T('generate')}</button><button id="mockSchemaCancel" class="btn btn-secondary" hidden>${T('cancel')}</button><button id="mockSchemaSample" class="btn btn-secondary">${T('sample')}</button></div>
      <p id="mockSchemaStatus" role="status" class="workspace-notice"></p>
      <section id="mockSchemaResult" hidden><p class="workspace-notice">${T('types_note')}</p><div class="tool-actions"><label>${T('output_kind')} <select id="mockSchemaView" class="tool-input" style="width:auto"><option value="result">JSON</option><option value="typescript">TypeScript</option></select></label><button id="mockSchemaCopy" class="btn btn-secondary">${T('copy')}</button><button id="mockSchemaDownload" class="btn btn-secondary">${T('download')}</button><button id="mockSchemaHandoff" class="btn btn-secondary">${T('send_json')}</button></div><pre id="mockSchemaOutput" class="result-box" style="max-height:400px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere"></pre><p id="mockSchemaPreviewNote" class="workspace-notice"></p></section>
    </section>`);
  const get=id=>el.querySelector('#'+id),task=ToolRuntime.task();let result=null;
  const busy=value=>{get('mockSchemaGenerate').disabled=value;get('mockSchemaCancel').hidden=!value;};
  const invalidate=()=>{task.invalidate();result=null;busy(false);get('mockSchemaResult').hidden=true;get('mockSchemaOutput').textContent='';get('mockSchemaStatus').textContent='';};
  const selected=()=>result?.[get('mockSchemaView').value]||'';
  const show=()=>{if(!result)return;const text=selected();get('mockSchemaResult').hidden=false;get('mockSchemaOutput').textContent=text.slice(0,64000);get('mockSchemaPreviewNote').textContent=text.length>64000?T('preview_note'):'';};
  const mode=schema=>{invalidate();el.dataset.mockMode=schema?'schema':'fields';fields.hidden=schema;get('mockSchemaPanel').hidden=!schema;get('mockResultPanel').style.display=!schema&&get('mockOutput').textContent?'':'none';for(const [id,active] of [['mockFieldsMode',!schema],['mockSchemaMode',schema]]){get(id).className='btn '+(active?'btn-primary':'btn-secondary');get(id).setAttribute('aria-pressed',String(active));}};
  get('mockFieldsMode').onclick=()=>mode(false);get('mockSchemaMode').onclick=()=>mode(true);
  for(const id of ['mockSchemaInput','mockSchemaSeed','mockSchemaCount','mockSchemaOptional']){get(id).addEventListener('input',invalidate);get(id).addEventListener('change',invalidate);}
  fields.addEventListener('input',_mockInvalidateFields);fields.addEventListener('change',_mockInvalidateFields);
  get('mockSchemaSample').onclick=()=>{invalidate();get('mockSchemaInput').value=JSON.stringify({type:'object',required:['id','state','profile'],additionalProperties:false,properties:{id:{type:'integer',minimum:1,maximum:9999},state:{enum:['active','pending']},profile:{type:'object',required:['email'],properties:{email:{type:'string',format:'email'},verified:{type:'boolean'}},additionalProperties:false},tags:{type:'array',minItems:1,maxItems:3,uniqueItems:true,items:{enum:['api','web','test','data']}}}},null,2);};
  get('mockSchemaSample').onclick();
  get('mockSchemaGenerate').onclick=async()=>{
    invalidate();const run=task.start({root:el}),schema=get('mockSchemaInput').value;
    const options={seed:get('mockSchemaSeed').value,count:Number(get('mockSchemaCount').value),includeOptional:get('mockSchemaOptional').checked,signal:run.signal};
    busy(true);get('mockSchemaStatus').textContent=T('working');
    try{const compute=await ToolCompute.load('schema');if(!run.current())return;const data=await compute.mock(schema,options);if(!run.current())return;result=data;get('mockSchemaStatus').textContent=T('generated',data.count,data.seed);show();}
    catch(error){if(run.owns())get('mockSchemaStatus').textContent=error.name==='AbortError'?T('cancelled'):error.message;}
    finally{if(run.owns())busy(false);run.finish();}
  };
  get('mockSchemaCancel').onclick=()=>{invalidate();get('mockSchemaStatus').textContent=T('cancelled');};
  get('mockSchemaView').onchange=show;
  get('mockSchemaCopy').onclick=()=>{if(result)return copyText(selected(),get('mockSchemaCopy'));};
  get('mockSchemaDownload').onclick=()=>{if(!result)return;const ts=get('mockSchemaView').value==='typescript',url=URL.createObjectURL(new Blob([selected()],{type:ts?'text/plain;charset=utf-8':'application/json'})),a=document.createElement('a');a.href=url;a.download=ts?'mock-record.ts':'mock-samples.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  get('mockSchemaHandoff').onclick=()=>{if(result)return ToolWorkspace.handoff('json',result.result);};
  el._toolOutput=()=>el.dataset.mockMode==='schema'?selected():get('mockOutput').textContent;
  window._activeCleanup=()=>task.dispose();
}
