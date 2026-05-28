/**
 * 極簡美學待辦事項 - 原生 JavaScript 邏輯控制系統 (ES6+)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 狀態管理
  let todos = [];
  let currentFilter = 'all';

  // 2. DOM 元素選取
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const activeCountEl = document.getElementById('active-count');
  const emptyState = document.getElementById('empty-state');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // 3. 初始化載入
  init();

  function init() {
    // 從 localStorage 讀取資料
    const savedTodos = localStorage.getItem('aesthetic-todos');
    if (savedTodos) {
      try {
        todos = JSON.parse(savedTodos);
      } catch (e) {
        console.error('無法解析 localStorage 中的待辦事項資料，已重設為空陣列。', e);
        todos = [];
      }
    }
    
    // 綁定事件監聽器
    todoForm.addEventListener('submit', handleAddTodo);
    setupFilters();
    
    // 首次渲染
    render();
  }

  // 4. 事件處理：新增待辦事項
  function handleAddTodo(e) {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
      id: Date.now().toString(),
      text: text,
      completed: false
    };

    todos.unshift(newTodo); // 新增的事項放到最前面，體驗更佳
    saveToLocalStorage();
    todoInput.value = '';
    render();
  }

  // 5. 事件處理：切換完成狀態
  function handleToggleTodo(id) {
    todos = todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    saveToLocalStorage();
    render();
  }

  // 6. 事件處理：刪除待辦事項（帶有精緻平滑動畫）
  function handleDeleteTodo(id, itemElement) {
    // 新增縮小淡出動畫類別
    itemElement.classList.add('fall-out');
    
    // 等待 CSS 動畫結束後（300ms），再從狀態中移除並重新渲染
    itemElement.addEventListener('animationend', () => {
      todos = todos.filter(todo => todo.id !== id);
      saveToLocalStorage();
      render();
    }, { once: true });
  }

  // 7. 篩選切換設定
  function setupFilters() {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 移除其他 tab 的 active class，並套用到點擊的 tab
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        currentFilter = tab.getAttribute('data-filter');
        render();
      });
    });
  }

  // 8. 儲存至 localStorage
  function saveToLocalStorage() {
    localStorage.setItem('aesthetic-todos', JSON.stringify(todos));
  }

  // 9. 渲染頁面
  function render() {
    // 依當前篩選過濾 todos
    const filteredTodos = todos.filter(todo => {
      if (currentFilter === 'active') return !todo.completed;
      if (currentFilter === 'completed') return todo.completed;
      return true; // 'all'
    });

    // 清空目前顯示的清單
    todoList.innerHTML = '';

    if (filteredTodos.length === 0) {
      // 顯示空狀態
      emptyState.style.display = 'flex';
      todoList.style.display = 'none';
    } else {
      // 隱藏空狀態並建構 DOM
      emptyState.style.display = 'none';
      todoList.style.display = 'flex';

      filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);

        // 建立左側（可點擊區塊）
        const leftDiv = document.createElement('div');
        leftDiv.className = 'todo-item-left';
        
        // 自訂 Checkbox (內嵌精緻勾選 SVG Icon)
        const checkbox = document.createElement('div');
        checkbox.className = 'todo-checkbox';
        checkbox.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        
        // 文字 (使用 textContent 確保防範 XSS)
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.text;

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(textSpan);

        // 點擊左側區塊可直接切換完成狀態
        leftDiv.addEventListener('click', () => handleToggleTodo(todo.id));

        // 建立刪除按鈕 (垃圾桶 SVG Icon)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-delete-btn';
        deleteBtn.setAttribute('aria-label', `刪除待辦事項 ${todo.text}`);
        deleteBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="delete-icon">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        `;

        // 點擊刪除按鈕
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // 阻止氣泡事件觸發 leftDiv 的點擊切換
          handleDeleteTodo(todo.id, li);
        });

        li.appendChild(leftDiv);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
      });
    }

    // 更新未完成的計數
    const activeCount = todos.filter(todo => !todo.completed).length;
    activeCountEl.textContent = activeCount;
  }
});
