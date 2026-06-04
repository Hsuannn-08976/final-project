// State Management
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');

// Filter Buttons
const filterAll = document.getElementById('filter-all');
const filterActive = document.getElementById('filter-active');
const filterCompleted = document.getElementById('filter-completed');

// Count Badges
const countAllBadge = document.getElementById('count-all');
const countActiveBadge = document.getElementById('count-active');
const countCompletedBadge = document.getElementById('count-completed');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  setupEventListeners();
  render();
});

// Load todos from localStorage
function loadTodos() {
  const storedTodos = localStorage.getItem('todos');
  if (storedTodos) {
    try {
      todos = JSON.parse(storedTodos);
    } catch (e) {
      console.error('Failed to parse todos from localStorage', e);
      todos = [];
    }
  }
}

// Save todos to localStorage
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// Setup Event Listeners
function setupEventListeners() {
  // Handle form submission to add new todo
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
      addTodo(text);
      todoInput.value = '';
    }
  });

  // Handle filter clicks
  const filterButtons = [filterAll, filterActive, filterCompleted];
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      // Update state filter and render
      currentFilter = button.dataset.filter;
      render();
    });
  });
}

// Add a new todo item
function addTodo(text) {
  const newTodo = {
    id: Date.now(),
    text: text,
    completed: false
  };
  todos.push(newTodo);
  saveTodos();
  render();
}

// Toggle todo completion status
function toggleTodo(id) {
  todos = todos.map(todo => {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });
  saveTodos();
  render();
}

// Delete a todo item with animations
function deleteTodo(id, itemElement) {
  // Add deleting animation class
  itemElement.classList.add('deleting');
  
  // Wait for animation to finish before removing from DOM and state
  itemElement.addEventListener('animationend', () => {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    render();
  }, { once: true });
}

// Update badges for each filter status
function updateBadges() {
  const totalCount = todos.length;
  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = totalCount - activeCount;

  countAllBadge.textContent = totalCount;
  countActiveBadge.textContent = activeCount;
  countCompletedBadge.textContent = completedCount;
}

// Render the UI based on current state and filter
function render() {
  // Clear list
  todoList.innerHTML = '';
  
  // Update task stats badges
  updateBadges();

  // Filter tasks
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true; // 'all'
  });

  // Toggle empty state visibility
  if (filteredTodos.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
  }

  // Generate and insert HTML elements for filtered tasks
  filteredTodos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    // Content wrapper containing custom checkbox and text
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'todo-content-wrapper';
    contentWrapper.addEventListener('click', () => toggleTodo(todo.id));

    // Custom checkbox structure
    const customCheckbox = document.createElement('div');
    customCheckbox.className = 'custom-checkbox';
    customCheckbox.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    // Text label
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;

    contentWrapper.appendChild(customCheckbox);
    contentWrapper.appendChild(textSpan);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', `刪除 ${todo.text}`);
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering completion toggle
      deleteTodo(todo.id, li);
    });

    // Assemble components
    li.appendChild(contentWrapper);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}
