const _todoDict = {
  zh: { undo: '撤销', deleted: '任务已删除', confirm_clear: n => `确定删除 ${n} 项已完成任务？`, title: 'Todo 清单', input_ph: '添加新任务...', add: '添加', clear_done: '清空已完成', empty: '暂无任务', stats: (n, done) => `共 ${n} 项，已完成 ${done} 项` },
  en: { undo: 'Undo', deleted: 'Task deleted', confirm_clear: n => `Delete ${n} completed tasks?`, title: 'Todo list', input_ph: 'Add a task...', add: 'Add', clear_done: 'Clear completed', empty: 'No tasks yet', stats: (n, done) => `${n} task${n === 1 ? '' : 's'}, ${done} done` },
};

window.renderTodo = function(el) {
  const T = makeToolI18n(_todoDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="tool-input" id="todoInput" placeholder="${T('input_ph')}" style="flex:1" onkeydown="if(event.key==='Enter' && !event.isComposing){event.preventDefault();addTodo()}">
        <button class="btn btn-primary" onclick="addTodo()">${T('add')}</button>
      </div>
      <div id="todoList"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:12px;color:var(--text-muted)">
        <span id="todoStats"></span>
        <button class="btn btn-secondary" onclick="clearDoneTodos()" style="font-size:12px;padding:4px 10px">${T('clear_done')}</button>
      </div>
    </div>`;
  renderTodoList();
};

function _getTodos() {
  try { return JSON.parse(localStorage.getItem('dtb_todo') || '[]'); } catch { return []; }
}
function _saveTodos(arr) {
  try { localStorage.setItem('dtb_todo', JSON.stringify(arr)); } catch {}
}

function renderTodoList() {
  const T = makeToolI18n(_todoDict);
  const todos = _getTodos();
  const list = document.getElementById('todoList');
  if (!list) return;
  if (!todos.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">${T('empty')}</div>`;
  } else {
    list.innerHTML = todos.map((t,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--glass-border)">
        <input type="checkbox" ${t.done?'checked':''} onchange="toggleTodo(${i})" style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">
        <span style="flex:1;font-size:14px;${t.done?'text-decoration:line-through;color:var(--text-muted)':''}">${t.text.replace(/</g,'&lt;')}</span>
        <button onclick="deleteTodo(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;padding:0 4px">×</button>
      </div>`).join('');
  }
  const done = todos.filter(t => t.done).length;
  const stats = document.getElementById('todoStats');
  if (stats) stats.textContent = T('stats', todos.length, done);
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = (input.value || '').trim();
  if (!text) return;
  const todos = _getTodos();
  const id = globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2);
  todos.push({id, text, done: false});
  _saveTodos(todos);
  input.value = '';
  renderTodoList();
}

function toggleTodo(i) {
  const todos = _getTodos();
  if (todos[i]) { todos[i].done = !todos[i].done; _saveTodos(todos); renderTodoList(); }
}

function deleteTodo(i) {
  const todos = _getTodos();
  const [removed] = todos.splice(i, 1);
  if (!removed) return;
  _saveTodos(todos);
  renderTodoList();
  const T = makeToolI18n(_todoDict);
  const notice = showToast(T('deleted'), 'info', 8000);
  const undo = document.createElement('button'); undo.type = 'button'; undo.className = 'btn btn-secondary'; undo.textContent = T('undo');
  undo.onclick = () => {
    const latest = _getTodos();
    if (removed.id == null || !latest.some(item => item.id === removed.id)) { latest.splice(Math.min(i, latest.length), 0, removed); _saveTodos(latest); }
    renderTodoList(); notice.remove();
  };
  notice.appendChild(undo);
}

function clearDoneTodos() {
  const todos = _getTodos(), count = todos.filter(t => t.done).length;
  if (!count || !confirm(makeToolI18n(_todoDict)('confirm_clear', count))) return;
  _saveTodos(todos.filter(t => !t.done));
  renderTodoList();
}
