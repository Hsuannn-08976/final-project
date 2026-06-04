// DOM Elements
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const todayChoiceText = document.getElementById('todayChoiceText');
const sourceBadge = document.getElementById('sourceBadge');
const customNoteDisplay = document.getElementById('customNoteDisplay');
const customNoteText = document.getElementById('customNoteText');
const lastUpdatedText = document.getElementById('lastUpdatedText');
const addFoodForm = document.getElementById('addFoodForm');
const newFoodNameInput = document.getElementById('newFoodName');
const foodList = document.getElementById('foodList');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const pointer = document.querySelector('.wheel-pointer');
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');

// State Variables
let currentAngle = 0; // in radians
let isSpinning = false;
let lastSliceIndex = -1;

// Confetti System Variables
let confettiParticles = [];
let confettiAnimationId = null;

// Default Food Options
const DEFAULT_FOODS = ['拉麵', '火鍋', '壽司', '咖哩飯', '義大利麵', '漢堡'];

// ----------------------------------------------------
// Data & LocalStorage Management
// ----------------------------------------------------

// Get food options from localStorage or return defaults
function getFoodOptions() {
    const stored = localStorage.getItem('foodOptions');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing foodOptions, using defaults', e);
        }
    }
    // Save defaults to storage
    localStorage.setItem('foodOptions', JSON.stringify(DEFAULT_FOODS));
    return [...DEFAULT_FOODS];
}

// Save food options to localStorage
function saveFoodOptions(options) {
    localStorage.setItem('foodOptions', JSON.stringify(options));
}

// Load meal history
function getHistory() {
    return JSON.parse(localStorage.getItem('mealHistory') || '[]');
}

// Save meal history
function saveHistory(history) {
    localStorage.setItem('mealHistory', JSON.stringify(history));
}

// Save or Update choice for today
function saveTodayChoice(choice, isAuto = false) {
    const todayStr = getTodayDateString();
    let history = getHistory();
    
    const todayIndex = history.findIndex(item => item.date === todayStr);
    const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    
    const entry = {
        date: todayStr,
        choice: choice,
        type: isAuto ? '自動選擇' : '手動選擇',
        time: timeStr
    };

    if (todayIndex !== -1) {
        history[todayIndex] = entry; // Update
    } else {
        history.unshift(entry); // Add to beginning
    }

    saveHistory(history);
    updateUI();
}

// Get today's choice if exists
function getTodayChoice() {
    const todayStr = getTodayDateString();
    const history = getHistory();
    return history.find(item => item.date === todayStr) || null;
}

// Get formatted date string (YYYY-MM-DD)
function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// Wheel Rendering & Color Algorithms
// ----------------------------------------------------

// Generate a vibrant color from the HSL color wheel
function getSliceColor(index, total) {
    // Distribute angles evenly
    const hue = Math.floor((index * 360) / total);
    // 80% saturation and 52% lightness creates premium neon glass-like colors
    return `hsl(${hue}, 80%, 52%)`;
}

// Draw the entire wheel on canvas
function drawWheel(angleOffset = 0) {
    const options = getFoodOptions();
    const total = options.length;
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (total === 0) {
        // Draw empty wheel message
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#6e687e';
        ctx.font = '700 20px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('請先在右側加入食物選項', cx, cy);
        return;
    }

    const sliceAngle = (2 * Math.PI) / total;

    // Draw slices
    for (let i = 0; i < total; i++) {
        const start = i * sliceAngle + angleOffset;
        const end = start + sliceAngle;

        // Draw Slice Path
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();

        // Slice Fill
        ctx.fillStyle = getSliceColor(i, total);
        ctx.fill();

        // Draw borders
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Text inside slice
        ctx.save();
        ctx.translate(cx, cy);
        // Rotate to the center of the slice
        const textAngle = start + sliceAngle / 2;
        ctx.rotate(textAngle);

        // Styling the text (font sizes dynamically scale with count to fit labels)
        ctx.fillStyle = '#ffffff';
        const fontSize = total > 10 ? 14 : (total > 7 ? 18 : 22);
        ctx.font = `900 ${fontSize}px "Noto Sans TC", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Add drop shadow for high legibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Truncate long names
        let foodName = options[i];
        if (foodName.length > 6) {
            foodName = foodName.slice(0, 5) + '...';
        }

        ctx.fillText(foodName, r * 0.78, 0);
        ctx.restore();
    }

    // Draw Outer Glowing Rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Draw Inner Center Button background
    ctx.beginPath();
    ctx.arc(cx, cy, 47, 0, 2 * Math.PI);
    ctx.fillStyle = '#181329';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
}

// Get the index of the slice currently pointing to the top (1.5 * Math.PI)
function getSliceAtPointer(angle) {
    const options = getFoodOptions();
    const total = options.length;
    if (total === 0) return 0;
    
    const sliceAngle = (2 * Math.PI) / total;
    const normalized = (1.5 * Math.PI - (angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.floor(normalized / sliceAngle) % total;
}

// Trigger pointer tick animation
function triggerPointerTick() {
    pointer.classList.remove('active-tick');
    void pointer.offsetWidth; // Force reflow
    pointer.classList.add('active-tick');
}

// ----------------------------------------------------
// Food List Manager & UI Updates
// ----------------------------------------------------

// Render options list in management panel
function renderFoodList() {
    const options = getFoodOptions();
    foodList.innerHTML = '';
    
    if (options.length === 0) {
        foodList.innerHTML = '<li class="empty-history" style="padding: 10px 0;">請新增食物</li>';
        return;
    }

    options.forEach((food, index) => {
        const li = document.createElement('li');
        li.className = 'food-item';
        
        li.innerHTML = `
            <span class="food-name">${food}</span>
            <div class="food-actions">
                <button class="food-btn food-select-btn" onclick="selectFoodDirectly(${index})" title="設為今日餐點">💾</button>
                <button class="food-btn food-delete-btn" onclick="deleteFoodOption(${index})" title="刪除此選項">❌</button>
            </div>
        `;
        foodList.appendChild(li);
    });
}

// Manually select a food directly from the list
function selectFoodDirectly(index) {
    if (isSpinning) return;
    
    const options = getFoodOptions();
    const choice = options[index];
    if (!choice) return;

    saveTodayChoice(choice, false);

    // Rotate wheel immediately to point to the selected choice
    const total = options.length;
    const sliceAngle = (2 * Math.PI) / total;
    const sliceMid = index * sliceAngle + sliceAngle / 2;
    const targetRelAngle = (1.5 * Math.PI - sliceMid + 2 * Math.PI) % (2 * Math.PI);
    
    currentAngle = targetRelAngle;
    drawWheel(currentAngle);
}

// Delete food option from list
function deleteFoodOption(index) {
    if (isSpinning) return;
    
    let options = getFoodOptions();
    if (options.length <= 2) {
        alert('轉盤至少需要保留 2 個食物選項喔！');
        return;
    }

    const removed = options.splice(index, 1)[0];
    saveFoodOptions(options);
    renderFoodList();
    
    // Draw wheel with updated options
    drawWheel(currentAngle);

    // If today's choice was the one deleted, we do not clear it, but let's notify or keep it.
    // We keep it in history/today's choice, but rebuild UI.
    updateUI();
}

// Update entire UI state
function updateUI() {
    const todayChoice = getTodayChoice();
    const history = getHistory();

    // 1. Update Today's Choice Display Card
    if (todayChoice) {
        todayChoiceText.textContent = todayChoice.choice;
        todayChoiceText.classList.remove('choice-placeholder');

        sourceBadge.style.display = 'inline-block';
        sourceBadge.textContent = todayChoice.type;
        sourceBadge.className = 'choice-badge ' + (todayChoice.type === '自動選擇' ? 'badge-auto' : 'badge-manual');

        lastUpdatedText.textContent = `更新時間：${todayChoice.time}`;
    } else {
        todayChoiceText.textContent = '尚未選擇';
        todayChoiceText.classList.add('choice-placeholder');
        sourceBadge.style.display = 'none';
        lastUpdatedText.textContent = '更新時間：-';
    }

    // 2. Update History Panel
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<li class="empty-history">暫無歷史紀錄</li>';
        clearHistoryBtn.style.display = 'none';
    } else {
        clearHistoryBtn.style.display = 'block';
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            li.innerHTML = `
                <span class="history-date">${item.date}</span>
                <div class="history-choice-group">
                    <span class="history-meal">${item.choice}</span>
                    <span class="choice-badge ${item.type === '自動選擇' ? 'badge-auto' : 'badge-manual'}" style="font-size: 0.65rem; padding: 2px 6px;">${item.type === '自動選擇' ? '自' : '手'}</span>
                </div>
            `;
            historyList.appendChild(li);
        });
    }
}

// ----------------------------------------------------
// Confetti Celebration Particle Effect
// ----------------------------------------------------

function setupConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

window.addEventListener('resize', setupConfettiCanvas);

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = Math.random() * confettiCanvas.height - confettiCanvas.height;
        this.size = Math.random() * 8 + 6;
        
        // Pick a dynamic HSL color
        const hue = Math.floor(Math.random() * 360);
        this.color = `hsl(${hue}, 85%, 60%)`;
        
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 4;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate((this.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = this.color;
        confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        confettiCtx.restore();
    }
}

function startConfetti() {
    confettiParticles = [];
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
    }
    
    for (let i = 0; i < 150; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
    animateConfetti();
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    let active = false;
    confettiParticles.forEach((particle) => {
        if (particle.y < confettiCanvas.height) {
            particle.update();
            particle.draw();
            active = true;
        }
    });

    if (active) {
        confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

// ----------------------------------------------------
// Spin Physics & Animation
// ----------------------------------------------------

function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
}

// Spin wheel function
function spinWheel(targetIndex = null, isAuto = false) {
    const options = getFoodOptions();
    const total = options.length;
    
    if (total < 2) {
        alert('請先新增至少 2 個食物選項才能旋轉轉盤喔！');
        return;
    }
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    
    const startRotations = 6; 
    const duration = 5000; 
    const startTime = performance.now();
    const startAngleValue = currentAngle % (2 * Math.PI);
    const sliceAngle = (2 * Math.PI) / total;
    
    let finalAngle;
    
    if (targetIndex !== null && targetIndex >= 0 && targetIndex < total) {
        const sliceMid = targetIndex * sliceAngle + sliceAngle / 2;
        const targetRelAngle = (1.5 * Math.PI - sliceMid + 2 * Math.PI) % (2 * Math.PI);
        finalAngle = startAngleValue + (Math.PI * 2 * startRotations) + (targetRelAngle - startAngleValue + 2 * Math.PI) % (2 * Math.PI);
    } else {
        const randomExtra = Math.random() * Math.PI * 2;
        finalAngle = startAngleValue + (Math.PI * 2 * startRotations) + randomExtra;
    }

    lastSliceIndex = getSliceAtPointer(startAngleValue);

    function animateSpin(timestamp) {
        const elapsed = timestamp - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        currentAngle = startAngleValue + (finalAngle - startAngleValue) * easeOutQuint(t);
        drawWheel(currentAngle);

        // Tick detection
        const currentSliceIdx = getSliceAtPointer(currentAngle);
        if (currentSliceIdx !== lastSliceIndex) {
            triggerPointerTick();
            lastSliceIndex = currentSliceIdx;
        }

        if (t < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            
            const finalChoiceIndex = getSliceAtPointer(currentAngle);
            const choiceResult = options[finalChoiceIndex];
            
            saveTodayChoice(choiceResult, isAuto);
            startConfetti();
        }
    }

    requestAnimationFrame(animateSpin);
}

// ----------------------------------------------------
// Initialization & Event Listeners
// ----------------------------------------------------

function init() {
    setupConfettiCanvas();
    renderFoodList();
    drawWheel(0);
    updateUI();

    // Check if daily auto-select is needed
    const todayChoice = getTodayChoice();
    const options = getFoodOptions();
    
    if (!todayChoice && options.length >= 2) {
        // First visit today, trigger auto-spin!
        setTimeout(() => {
            const randomTargetIdx = Math.floor(Math.random() * options.length);
            spinWheel(randomTargetIdx, true);
        }, 1200); // 1.2s delay to let page load completely
    } else if (todayChoice) {
        // Point wheel directly to today's choice
        const todayChoiceIndex = options.indexOf(todayChoice.choice);
        if (todayChoiceIndex !== -1) {
            const sliceAngle = (2 * Math.PI) / options.length;
            const sliceMid = todayChoiceIndex * sliceAngle + sliceAngle / 2;
            const targetRelAngle = (1.5 * Math.PI - sliceMid + 2 * Math.PI) % (2 * Math.PI);
            currentAngle = targetRelAngle;
            drawWheel(currentAngle);
        }
    }
}

// SPIN Button Click
spinBtn.addEventListener('click', () => {
    if (!isSpinning) {
        spinWheel(null, false);
    }
});

// Add Food Form Submit
addFoodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSpinning) return;

    const newFood = newFoodNameInput.value.trim();
    if (!newFood) return;

    let options = getFoodOptions();
    if (options.includes(newFood)) {
        alert('這個食物已經在轉盤中囉！');
        return;
    }

    options.push(newFood);
    saveFoodOptions(options);
    newFoodNameInput.value = '';
    
    renderFoodList();
    drawWheel(currentAngle);
});

// Clear History Button Click
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('確定要清除所有的歷史餐點紀錄嗎？這也會重設您今天的選擇。')) {
        localStorage.removeItem('mealHistory');
        currentAngle = 0;
        drawWheel(0);
        updateUI();
    }
});

// Expose click handler actions to window object for HTML inline onclick
window.selectFoodDirectly = selectFoodDirectly;
window.deleteFoodOption = deleteFoodOption;

// Launch application
window.addEventListener('DOMContentLoaded', init);
