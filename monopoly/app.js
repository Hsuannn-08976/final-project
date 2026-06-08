/**
 * 地產大亨 (Monopoly) - 遊戲核心邏輯 (ES6+)
 */

// 1. Web Audio API 音效合成器
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(frequency, type, duration, gainStart = 0.1, delay = 0) {
        if (this.isMuted) return;
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        setTimeout(() => {
            try {
                const osc = this.ctx.createOscillator();
                const gainNode = this.ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

                gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

                osc.connect(gainNode);
                gainNode.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {
                console.error("音效播放失敗:", e);
            }
        }, delay * 1000);
    }

    playStep() {
        // 短促的木魚聲 (行走)
        this.playTone(300, 'triangle', 0.1, 0.2);
    }

    playDice() {
        // 骰子滾動聲，連續幾個隨機短音
        for (let i = 0; i < 6; i++) {
            const freq = 400 + Math.random() * 600;
            this.playTone(freq, 'sine', 0.08, 0.08, i * 0.06);
        }
    }

    playBuy() {
        // 購買成功的輕快上升音
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, index) => {
            this.playTone(freq, 'sine', 0.25, 0.15, index * 0.08);
        });
    }

    playRent() {
        // 付租金的下降沈重音
        const notes = [392.00, 311.13, 261.63]; // G4, Eb4, C4
        notes.forEach((freq, index) => {
            this.playTone(freq, 'sawtooth', 0.3, 0.1, index * 0.1);
        });
    }

    playCard() {
        // 抽卡片滑音
        this.playTone(600, 'sine', 0.4, 0.1);
        setTimeout(() => {
            this.playTone(900, 'sine', 0.3, 0.1);
        }, 100);
    }

    playJail() {
        // 入獄警報聲
        this.playTone(150, 'sawtooth', 0.3, 0.15);
        this.playTone(100, 'sawtooth', 0.4, 0.15, 0.2);
    }

    playWin() {
        // 勝利音樂
        const melody = [523.25, 587.33, 659.25, 523.25, 659.25, 523.25, 783.99];
        melody.forEach((freq, index) => {
            this.playTone(freq, 'sine', 0.4, 0.15, index * 0.15);
        });
    }

    playLose() {
        // 失敗音樂
        const melody = [293.66, 277.18, 261.63, 220.00];
        melody.forEach((freq, index) => {
            this.playTone(freq, 'sawtooth', 0.5, 0.12, index * 0.25);
        });
    }
}

const synth = new SoundSynth();

// 2. 40 個格子定義
const BOARD_CELLS = [
    { id: 0, name: "起點 GO", type: "start", icon: "🏁", color: "", price: 0, rent: 0, desc: "起點。每次經過可領取 $2,000。" },
    { id: 1, name: "南京東路", type: "land", icon: "🏢", color: "#8b5cf6", group: 1, price: 600, rent: 50, desc: "台北市精華路段" },
    { id: 2, name: "機會", type: "chance", icon: "🍀", color: "", price: 0, rent: 0, desc: "命運由天，機會靠己" },
    { id: 3, name: "南京西路", type: "land", icon: "🏢", color: "#8b5cf6", group: 1, price: 600, rent: 50, desc: "台北市精華路段" },
    { id: 4, name: "個人所得稅", type: "bank", icon: "💸", color: "", price: 0, rent: 2000, desc: "向銀行繳納所得稅 $2,000。" },
    { id: 5, name: "台北車站", type: "company", icon: "🚇", color: "#64748b", group: "rail", price: 2000, rent: 200, desc: "縱貫鐵路樞紐。若擁有多個車站，過路費會加倍！" },
    { id: 6, name: "民生東路", type: "land", icon: "🏠", color: "#06b6d4", group: 2, price: 1000, rent: 80, desc: "幽靜的住宅區地段" },
    { id: 7, name: "命運", type: "destiny", icon: "🎁", color: "", price: 0, rent: 0, desc: "不可預知的奇妙命運" },
    { id: 8, name: "民生西路", type: "land", icon: "🏠", color: "#06b6d4", group: 2, price: 1000, rent: 80, desc: "幽靜的住宅區地段" },
    { id: 9, name: "新生南路", type: "land", icon: "🏠", color: "#06b6d4", group: 2, price: 1200, rent: 100, desc: "綠意盎然的大學城區域" },
    { id: 10, name: "監獄/探訪", type: "jail", icon: "⚖️", color: "", price: 0, rent: 0, desc: "監獄。被關者暫停行動，路過者僅為探訪。" },
    { id: 11, name: "中山北路", type: "land", icon: "🏢", color: "#ec4899", group: 3, price: 1400, rent: 120, desc: "林蔭大道的浪漫景致" },
    { id: 12, name: "電力公司", type: "company", icon: "⚡", color: "#d97706", group: "utility", price: 1500, rent: 150, desc: "公共事業。路過需付電費。" },
    { id: 13, name: "中山南路", type: "land", icon: "🏢", color: "#ec4899", group: 3, price: 1400, rent: 120, desc: "林蔭大道的浪漫景致" },
    { id: 14, name: "羅斯福路", type: "land", icon: "🏢", color: "#ec4899", group: 3, price: 1600, rent: 140, desc: "繁華的商業文教樞紐" },
    { id: 15, name: "台中車站", type: "company", icon: "🚇", color: "#64748b", group: "rail", price: 2000, rent: 200, desc: "中部鐵路樞紐。若擁有多個車站，過路費會加倍！" },
    { id: 16, name: "中華路", type: "land", icon: "🛍️", color: "#f97316", group: 4, price: 1800, rent: 160, desc: "流行時尚的西門商圈" },
    { id: 17, name: "機會", type: "chance", icon: "🍀", color: "", price: 0, rent: 0, desc: "命運由天，機會靠己" },
    { id: 18, name: "重慶南路", type: "land", icon: "📚", color: "#f97316", group: 4, price: 1800, rent: 160, desc: "書香濃郁的書店街" },
    { id: 19, name: "重慶北路", type: "land", icon: "🏢", color: "#f97316", group: 4, price: 2000, rent: 180, desc: "極富歷史氣息的老商區" },
    { id: 20, name: "免費停車", type: "parking", icon: "🅿️", color: "", price: 0, rent: 0, desc: "免費停車。享受小幸運，獲得退稅獎金 $500！" },
    { id: 21, name: "和平東路", type: "land", icon: "🏠", color: "#ef4444", group: 5, price: 2200, rent: 200, desc: "文教氣息濃厚的大學街區" },
    { id: 22, name: "命運", type: "destiny", icon: "🎁", color: "", price: 0, rent: 0, desc: "不可預知的奇妙命運" },
    { id: 23, name: "和平西路", type: "land", icon: "🏠", color: "#ef4444", group: 5, price: 2200, rent: 200, desc: "文教氣息濃厚的大學街區" },
    { id: 24, name: "復興南路", type: "land", icon: "🍲", color: "#ef4444", group: 5, price: 2400, rent: 220, desc: "清粥小菜與宵夜美食街" },
    { id: 25, name: "高雄車站", type: "company", icon: "🚇", color: "#64748b", group: "rail", price: 2000, rent: 200, desc: "南部鐵路樞紐。若擁有多個車站，過路費會加倍！" },
    { id: 26, name: "敦化南路", type: "land", icon: "🏢", color: "#eab308", group: 6, price: 2600, rent: 240, desc: "金融大樓林立的黃金大道" },
    { id: 27, name: "敦化北路", type: "land", icon: "🌳", color: "#eab308", group: 6, price: 2600, rent: 240, desc: "綠意夾道的迎賓大道" },
    { id: 28, name: "自來水廠", type: "company", icon: "💧", color: "#d97706", group: "utility", price: 1500, rent: 150, desc: "公共事業。路過需付水費。" },
    { id: 29, name: "建國南路", type: "land", icon: "🚗", color: "#eab308", group: 6, price: 2800, rent: 260, desc: "高架橋旁的建國花市地段" },
    { id: 30, name: "即刻入獄", type: "gotojail", icon: "🚨", color: "", price: 0, rent: 0, desc: "被發現違法，立即送往左下角的監獄！" },
    { id: 31, name: "忠孝東路", type: "land", icon: "💎", color: "#10b981", group: 7, price: 3000, rent: 280, desc: "頂級百貨與黃金商圈" },
    { id: 32, name: "忠孝西路", type: "land", icon: "🏢", color: "#10b981", group: 7, price: 3000, rent: 280, desc: "北門古蹟與交通匯聚處" },
    { id: 33, name: "機會", type: "chance", icon: "🍀", color: "", price: 0, rent: 0, desc: "命運由天，機會靠己" },
    { id: 34, name: "仁愛路", type: "land", icon: "🌳", color: "#10b981", group: 7, price: 3200, rent: 320, desc: "豪宅林立的林蔭大道" },
    { id: 35, name: "花蓮車站", type: "company", icon: "🚇", color: "#64748b", group: "rail", price: 2000, rent: 200, desc: "東部觀光鐵路門戶。車站若擁有多個，過路費會加倍！" },
    { id: 36, name: "命運", type: "destiny", icon: "🎁", color: "", price: 0, rent: 0, desc: "不可預知的奇妙命運" },
    { id: 37, name: "信義路", type: "land", icon: "🗼", color: "#2563eb", group: 8, price: 3500, rent: 380, desc: "台北101與頂級豪宅路段" },
    { id: 38, name: "奢侈稅", type: "bank", icon: "💸", color: "", price: 0, rent: 1000, desc: "向銀行繳納奢侈稅 $1,000。" },
    { id: 39, name: "椰林大道", type: "land", icon: "🎓", color: "#2563eb", group: 8, price: 4000, rent: 450, desc: "最高學府台大的精神大道" }
];

// 3. 機會與命運卡片池
const CHANCE_CARDS = [
    { title: "統一發票中獎", desc: "恭喜你！發票中獎獲得獎金 $2,000。", value: 2000, action: "money" },
    { title: "超速罰單", desc: "超速被開罰單，向銀行支付罰款 $500。", value: -500, action: "money" },
    { title: "免費停車驚喜", desc: "前進到免費停車格，並獲得驚喜獎金 $500。", value: 20, action: "move_to" },
    { title: "逃漏稅罰款", desc: "被指控逃漏稅，向銀行罰款 $1,500。", value: -1500, action: "money" },
    { title: "股票大漲", desc: "理財有方！股票投資大漲，獲利 $1,200。", value: 1200, action: "money" },
    { title: "前進起點", desc: "搭乘特快車，直接前進至起點 GO (獲得 $2,000)。", value: 0, action: "move_to" },
    { title: "立即入獄", desc: "因非法交易被查獲，直接關進監獄。經過起點不給錢。", value: 10, action: "go_to_jail" },
    { title: "釋放免罪卡", desc: "獲得一張免罪卡，可從監獄中免費釋放（已自動儲存）。", value: 0, action: "free_card" }
];

const DESTINY_CARDS = [
    { title: "生病住院", desc: "感冒住院治療，支付醫藥費 $800。", value: -800, action: "money" },
    { title: "生日快樂", desc: "今天是你生日！向電腦收取生日禮金 $500。", value: 500, action: "collect_from_opp" },
    { title: "撿到錢包", desc: "拾金不昧，將錢包送至警局獲得失主答謝金 $1,000。", value: 1000, action: "money" },
    { title: "修繕房屋", desc: "為名下財產做年度維修，向銀行支付維修費 $1,000。", value: -1000, action: "money" },
    { title: "銀行發放利息", desc: "銀行定存到期，獲得利息回饋 $600。", value: 600, action: "money" },
    { title: "出國旅遊", desc: "前往日本度假旅遊，向銀行支付旅費 $1,200。", value: -1200, action: "money" },
    { title: "前進黃金路段", desc: "前進到信義路（若經過起點可額外領取 $2,000）。", value: 37, action: "move_to" },
    { title: "幫助流浪動物", desc: "發揮愛心，捐款 $300 給流浪動物之家。", value: -300, action: "money" }
];

// 4. 遊戲狀態
const gameState = {
    players: [
        {
            id: 0,
            name: "玩家 (你)",
            money: 15000,
            position: 0,
            isJailed: false,
            jailTurns: 0,
            color: "red",
            assets: [],
            hasGetOutCard: false
        },
        {
            id: 1,
            name: "電腦 (AI)",
            money: 15000,
            position: 0,
            isJailed: false,
            jailTurns: 0,
            color: "blue",
            assets: [],
            hasGetOutCard: false
        }
    ],
    currentPlayerIndex: 0,
    isGameOver: false,
    isMoving: false,
    ownerMap: {} // key: cellId, value: playerId
};

// 5. 初始化與 DOM 元素
document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    initTokens();
    setupEventListeners();
    updateUI();
});

// 計算 11x11 Grid 座標
function getGridPosition(index) {
    if (index === 0) return { row: 11, col: 11 };
    if (index === 10) return { row: 11, col: 1 };
    if (index === 20) return { row: 1, col: 1 };
    if (index === 30) return { row: 1, col: 11 };
    
    if (index > 0 && index < 10) {
        return { row: 11, col: 11 - index };
    } else if (index > 10 && index < 20) {
        return { row: 11 - (index - 10), col: 1 };
    } else if (index > 20 && index < 30) {
        return { row: 1, col: 1 + (index - 20) };
    } else if (index > 30 && index < 40) {
        return { row: 1 + (index - 30), col: 11 };
    }
}

// 動態渲染棋盤格子
function initBoard() {
    const boardEl = document.getElementById('monopolyBoard');
    
    BOARD_CELLS.forEach(cell => {
        const cellEl = document.createElement('div');
        const pos = getGridPosition(cell.id);
        
        cellEl.className = `cell cell-${cell.id}`;
        cellEl.style.gridRow = pos.row;
        cellEl.style.gridColumn = pos.col;
        
        // 判斷是否為角落
        const isCorner = [0, 10, 20, 30].includes(cell.id);
        if (isCorner) {
            cellEl.classList.add('cell-corner');
        } else {
            // 判斷格子在哪個方向，以便決定顏色條的位置
            if (pos.row === 11) cellEl.classList.add('cell-bottom');
            else if (pos.row === 1) cellEl.classList.add('cell-top');
            else if (pos.col === 1) cellEl.classList.add('cell-left');
            else if (pos.col === 11) cellEl.classList.add('cell-right');
        }

        // 渲染內部結構
        let htmlContent = '';
        
        // 顏色條 (非角落且為土地)
        if (!isCorner && cell.type === 'land') {
            htmlContent += `<div class="cell-color-bar" style="background-color: ${cell.color}"></div>`;
        }

        // 名字
        htmlContent += `<div class="cell-name">${cell.name}</div>`;
        
        // 圖示
        if (cell.icon) {
            htmlContent += `<div class="cell-icon">${cell.icon}</div>`;
        }
        
        // 價格
        if (cell.price > 0) {
            htmlContent += `<div class="cell-price">$${cell.price}</div>`;
        }
        
        cellEl.innerHTML = htmlContent;
        
        // 點擊格子彈出說明
        cellEl.addEventListener('click', () => {
            showCellInfo(cell);
        });

        boardEl.appendChild(cellEl);
    });
}

// 動態初始化棋子
function initTokens() {
    const boardEl = document.getElementById('monopolyBoard');
    
    gameState.players.forEach(player => {
        const token = document.createElement('div');
        token.id = `token${player.id}`;
        token.className = `token token-player${player.id}`;
        boardEl.appendChild(token);
    });
    
    // 延遲更新以確保 DOM layout 已經完成
    setTimeout(updateTokenPositions, 100);
}

// 根據所有者與玩家位置更新棋子絕對定位
function updateTokenPositions() {
    const boardEl = document.getElementById('monopolyBoard');
    if (!boardEl) return;
    
    const positions = {};
    
    gameState.players.forEach((player, index) => {
        const pos = player.position;
        if (!positions[pos]) {
            positions[pos] = [];
        }
        positions[pos].push(index);
    });

    const tokenSize = 18;

    Object.keys(positions).forEach(posStr => {
        const pos = parseInt(posStr);
        const playerIndices = positions[pos];
        const cellEl = document.querySelector(`.cell-${pos}`);
        if (!cellEl) return;
        
        const cellLeft = cellEl.offsetLeft;
        const cellTop = cellEl.offsetTop;
        const cellWidth = cellEl.offsetWidth;
        const cellHeight = cellEl.offsetHeight;
        
        if (playerIndices.length === 1) {
            const pIdx = playerIndices[0];
            const tokenEl = document.getElementById(`token${pIdx}`);
            if (tokenEl) {
                tokenEl.style.left = `${cellLeft + cellWidth/2 - tokenSize/2}px`;
                tokenEl.style.top = `${cellTop + cellHeight/2 - tokenSize/2}px`;
            }
        } else if (playerIndices.length === 2) {
            const p0 = playerIndices[0];
            const p1 = playerIndices[1];
            const t0 = document.getElementById(`token${p0}`);
            const t1 = document.getElementById(`token${p1}`);
            
            if (t0 && t1) {
                // 微調兩個棋子的位置，防止完全重疊
                t0.style.left = `${cellLeft + cellWidth/3 - tokenSize/2}px`;
                t0.style.top = `${cellTop + cellHeight/3 - tokenSize/2}px`;
                
                t1.style.left = `${cellLeft + (cellWidth * 2/3) - tokenSize/2}px`;
                t1.style.top = `${cellTop + (cellHeight * 2/3) - tokenSize/2}px`;
            }
        }
    });
}

// 響應式：視窗重設大小重新定位棋子
window.addEventListener('resize', updateTokenPositions);

// 6. 事件綁定
function setupEventListeners() {
    const rollBtn = document.getElementById('rollBtn');
    const resetBtn = document.getElementById('resetBtn');
    const muteBtn = document.getElementById('muteBtn');
    
    rollBtn.addEventListener('click', () => {
        synth.init(); // 使用者互動時初始化音效
        if (gameState.currentPlayerIndex === 0 && !gameState.isMoving && !gameState.isGameOver) {
            playTurn();
        }
    });

    resetBtn.addEventListener('click', () => {
        resetGame();
    });

    muteBtn.addEventListener('click', () => {
        synth.isMuted = !synth.isMuted;
        muteBtn.innerText = synth.isMuted ? '❌' : '🔊';
        addLogEntry(`音效已${synth.isMuted ? '關閉' : '開啟'}`, 'system');
    });

    // 土地購買視窗按鈕
    document.getElementById('confirmBuyBtn').addEventListener('click', () => {
        purchaseCurrentCell(gameState.currentPlayerIndex);
        closeModal('buyModal');
        endTurn();
    });

    document.getElementById('cancelBuyBtn').addEventListener('click', () => {
        addLogEntry(`${gameState.players[0].name} 放棄購買 ${BOARD_CELLS[gameState.players[0].position].name}。`, 'player0');
        closeModal('buyModal');
        endTurn();
    });

    // 卡片關閉按鈕
    document.getElementById('closeFlipModalBtn').addEventListener('click', () => {
        closeFlipModal();
    });

    // 遊戲結束重玩按鈕
    document.getElementById('gameOverRestartBtn').addEventListener('click', () => {
        closeModal('gameOverModal');
        resetGame();
    });
}

// 7. 遊戲運作邏輯
async function playTurn() {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    // 如果坐牢中
    if (player.isJailed) {
        player.jailTurns++;
        addLogEntry(`${player.name} 目前正在坐牢中 (第 ${player.jailTurns} 回合)。`, player.id === 0 ? 'player0' : 'player1');
        
        // 坐牢的解脫方式
        if (player.hasGetOutCard) {
            player.hasGetOutCard = false;
            player.isJailed = false;
            player.jailTurns = 0;
            addLogEntry(`${player.name} 使用了「免罪卡」重獲自由！`, player.id === 0 ? 'player0' : 'player1');
        } else if (player.money >= 500) {
            player.money -= 500;
            player.isJailed = false;
            player.jailTurns = 0;
            addLogEntry(`${player.name} 支付了 $500 保釋金出獄！`, player.id === 0 ? 'player0' : 'player1');
            updateUI();
        } else {
            addLogEntry(`${player.name} 資金不足支付保釋金，且沒有免罪卡，本回合無法行動。`, player.id === 0 ? 'player0' : 'player1');
            if (player.jailTurns >= 3) {
                player.isJailed = false;
                player.jailTurns = 0;
                addLogEntry(`${player.name} 已坐牢滿 3 回合，被無條件釋放！`, player.id === 0 ? 'player0' : 'player1');
            } else {
                endTurn();
                return;
            }
        }
    }

    gameState.isMoving = true;
    document.getElementById('rollBtn').disabled = true;

    // 擲骰子
    const diceVal = Math.floor(Math.random() * 6) + 1;
    addLogEntry(`${player.name} 擲骰子中...`, 'system');
    
    // 撥放骰子音效與動畫
    synth.playDice();
    await animateDice(diceVal);
    addLogEntry(`${player.name} 擲出了 ${diceVal} 點！`, player.id === 0 ? 'player0' : 'player1');

    // 行走動畫 (一格一格跳躍)
    const oldPos = player.position;
    const newPos = (oldPos + diceVal) % 40;

    for (let i = 1; i <= diceVal; i++) {
        player.position = (oldPos + i) % 40;
        
        // 經過起點 GO 獎勵
        if (player.position === 0 && i !== diceVal) {
            player.money += 2000;
            addLogEntry(`${player.name} 經過起點！領取經過獎金 $2,000！`, 'system');
            synth.playTone(523.25, 'sine', 0.2, 0.1); // GO 叮一聲
            updateUI();
        }
        
        synth.playStep();
        updateTokenPositions();
        await sleep(250);
    }

    // 停下來，觸發當前格子的事件
    handleCellLanding(player.position);
}

// 骰子 3D 旋轉動畫
function animateDice(value) {
    return new Promise(resolve => {
        const dice = document.getElementById('dice');
        
        // 隨機旋轉多圈
        const randX = Math.floor(Math.random() * 3) * 360 + 720;
        const randY = Math.floor(Math.random() * 3) * 360 + 1080;
        
        // 對應各點數的基本旋轉角度
        const angles = {
            1: { x: 360, y: 360 },
            2: { x: 360, y: 270 },
            3: { x: 270, y: 360 },
            4: { x: 90,  y: 360 },
            5: { x: 360, y: 90 },
            6: { x: 180, y: 360 }
        };

        const target = angles[value];
        const finalX = randX + target.x;
        const finalY = randY + target.y;

        dice.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;

        // 動畫持續 1.5 秒
        setTimeout(() => {
            // 固定角度，避免之後累計無限旋轉
            dice.style.transition = 'none';
            dice.className = 'dice';
            
            // 這裡必須重設為對應的 show-N 樣式以利之後的轉換
            const anglesStatic = {
                1: 'show-1',
                2: 'show-2',
                3: 'show-3',
                4: 'show-4',
                5: 'show-5',
                6: 'show-6'
            };
            
            dice.style.transform = '';
            dice.classList.add(anglesStatic[value]);
            
            // 恢復 transition
            setTimeout(() => {
                dice.style.transition = 'transform 1.5s cubic-bezier(0.2, 0.8, 0.3, 1.1)';
            }, 50);

            resolve();
        }, 1500);
    });
}

// 8. 格子著陸事件處理
function handleCellLanding(cellId) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const cell = BOARD_CELLS[cellId];
    
    addLogEntry(`${player.name} 抵達了 【${cell.name}】。`, player.id === 0 ? 'player0' : 'player1');
    
    // 如果是起點 GO
    if (cell.type === 'start') {
        player.money += 2000;
        addLogEntry(`${player.name} 剛好停在起點！領取獎金 $2,000！`, 'system');
        synth.playTone(523.25, 'sine', 0.4, 0.15);
        updateUI();
        endTurn();
        return;
    }
    
    // 銀行所得稅/奢侈稅
    if (cell.type === 'bank') {
        const tax = cell.rent;
        player.money -= tax;
        addLogEntry(`${player.name} 向銀行繳納了 ${cell.name} $${tax}。`, player.id === 0 ? 'player0' : 'player1');
        synth.playRent();
        updateUI();
        
        if (checkBankruptcy(player)) {
            handleBankruptcy(player);
        } else {
            endTurn();
        }
        return;
    }

    // 免費停車 (退稅小紅包)
    if (cell.type === 'parking') {
        player.money += 500;
        addLogEntry(`${player.name} 享受免費停車，獲得退稅紅包 $500！`, 'system');
        synth.playTone(659.25, 'sine', 0.3, 0.1);
        updateUI();
        endTurn();
        return;
    }

    // 即刻入獄
    if (cell.type === 'gotojail') {
        player.isJailed = true;
        player.position = 10; // 傳送到監獄
        player.jailTurns = 0;
        addLogEntry(`🚨 ${player.name} 被指控違法，即刻送入監獄！`, 'system');
        synth.playJail();
        updateTokenPositions();
        updateUI();
        endTurn();
        return;
    }

    // 僅僅路過監獄
    if (cell.type === 'jail') {
        addLogEntry(`${player.name} 只是路過監獄，向裡面的囚犯揮了揮手。`, 'system');
        endTurn();
        return;
    }

    // 機會與命運
    if (cell.type === 'chance' || cell.type === 'destiny') {
        triggerCardDraw(cell.type);
        return;
    }

    // 可購買的土地、鐵路、公司
    if (['land', 'company'].includes(cell.type)) {
        const ownerId = gameState.ownerMap[cellId];
        
        if (ownerId === undefined) {
            // 未被購買，可選擇購買
            if (player.id === 0) {
                // 玩家本人：彈窗提示
                showBuyModal(cell);
            } else {
                // 電腦 AI：策略判斷
                // 若買完後資金大於 $1,200，就買
                if (player.money - cell.price >= 1200) {
                    purchaseCurrentCell(1);
                } else {
                    addLogEntry(`${player.name} 資金考量，決定放棄購買 ${cell.name}。`, 'player1');
                }
                endTurn();
            }
        } else if (ownerId === player.id) {
            // 走到自己的土地：無事
            addLogEntry(`${player.name} 巡視自己的產業 ${cell.name}，感覺很滿意。`, player.id === 0 ? 'player0' : 'player1');
            endTurn();
        } else {
            // 走到對方的土地：付租金
            payRentToOwner(player, ownerId, cell);
        }
    }
}

// 購買土地
function purchaseCurrentCell(playerId) {
    const player = gameState.players[playerId];
    const cellId = player.position;
    const cell = BOARD_CELLS[cellId];
    
    player.money -= cell.price;
    player.assets.push(cellId);
    gameState.ownerMap[cellId] = playerId;

    // 棋盤格標記擁有權 (CSS box-shadow)
    const cellEl = document.querySelector(`.cell-${cellId}`);
    cellEl.classList.add(`owned-player${playerId}`);

    addLogEntry(`🏠 ${player.name} 以 $${cell.price} 購買了 【${cell.name}】！`, playerId === 0 ? 'player0' : 'player1');
    synth.playBuy();
    updateUI();
}

// 付租金
function payRentToOwner(visitor, ownerId, cell) {
    const owner = gameState.players[ownerId];
    let finalRent = cell.rent;

    // 大富翁規則：如果擁有同一個 group 的全部土地，租金加倍
    const sameGroupCells = BOARD_CELLS.filter(c => c.group && c.group === cell.group);
    const ownerOwnsAll = sameGroupCells.every(c => gameState.ownerMap[c.id] === ownerId);

    if (ownerOwnsAll && cell.type === 'land') {
        finalRent *= 2;
        addLogEntry(`📢 獨佔加成！${owner.name} 擁有該色系的所有土地，租金加倍！`, 'system');
    } else if (cell.type === 'company' && cell.group === 'rail') {
        // 鐵路公司：每多擁有一座鐵路，租金加倍 ($200, $400, $800, $1600)
        const ownedRails = sameGroupCells.filter(c => gameState.ownerMap[c.id] === ownerId).length;
        finalRent = cell.rent * Math.pow(2, ownedRails - 1);
    }

    visitor.money -= finalRent;
    owner.money += finalRent;

    addLogEntry(`💸 ${visitor.name} 向 ${owner.name} 支付過路費 $${finalRent}。`, visitor.id === 0 ? 'player0' : 'player1');
    synth.playRent();
    updateUI();

    if (checkBankruptcy(visitor)) {
        handleBankruptcy(visitor);
    } else {
        endTurn();
    }
}

// 9. 機會與命運卡片抽卡動畫
let currentDrawnCard = null;
let currentCardTypeStr = '';

function triggerCardDraw(type) {
    synth.playCard();
    currentCardTypeStr = type;
    
    const cardPool = type === 'chance' ? CHANCE_CARDS : DESTINY_CARDS;
    const card = cardPool[Math.floor(Math.random() * cardPool.length)];
    currentDrawnCard = card;

    // 設定卡片正面資訊
    const frontView = document.getElementById('cardFrontView');
    const backTitle = document.getElementById('cardBackTitle');
    const frontHeader = document.getElementById('cardFrontHeader');
    const descEl = document.getElementById('cardDescription');
    const valEl = document.getElementById('cardValueEffect');

    if (type === 'chance') {
        backTitle.innerText = "機會 CHANCE";
        frontHeader.innerText = "CHANCE 機會";
        frontHeader.style.background = "linear-gradient(135deg, #f97316, #ff6b81)";
        frontHeader.style.color = "white";
        frontHeader.style.webkitBackgroundClip = "initial";
        frontHeader.style.webkitTextFillColor = "initial";
    } else {
        backTitle.innerText = "命運 DESTINY";
        frontHeader.innerText = "DESTINY 命運";
        frontHeader.style.background = "linear-gradient(135deg, #10b981, #2ed573)";
        frontHeader.style.color = "white";
    }

    descEl.innerText = card.desc;
    
    // 設定效果數值顯示
    if (card.action === 'money') {
        valEl.innerText = card.value > 0 ? `+$${card.value}` : `-$${Math.abs(card.value)}`;
        valEl.style.color = card.value > 0 ? "var(--accent-green)" : "var(--accent-red)";
    } else if (card.action === 'collect_from_opp') {
        valEl.innerText = `+$${card.value}`;
        valEl.style.color = "var(--accent-green)";
    } else if (card.action === 'move_to') {
        const destCell = BOARD_CELLS[card.value];
        valEl.innerText = `前往: ${destCell.name}`;
        valEl.style.color = "var(--accent-blue)";
    } else if (card.action === 'go_to_jail') {
        valEl.innerText = "🚨 坐牢";
        valEl.style.color = "var(--accent-red)";
    } else if (card.action === 'free_card') {
        valEl.innerText = "🎫 免罪卡";
        valEl.style.color = "var(--accent-gold)";
    }

    // 彈出 overlays
    const overlay = document.getElementById('modalOverlay');
    const flipModal = document.getElementById('flipModal');
    const inner = document.getElementById('cardFlipInner');

    overlay.classList.add('active');
    flipModal.style.display = 'block';
    
    // 1秒後自動翻轉
    setTimeout(() => {
        inner.classList.add('card-flipped');
    }, 1000);
}

// 關閉抽卡視窗並執行效果
async function closeFlipModal() {
    const inner = document.getElementById('cardFlipInner');
    inner.classList.remove('card-flipped');
    
    setTimeout(async () => {
        closeModal('flipModal');
        
        if (currentDrawnCard) {
            await executeCardEffect(currentDrawnCard);
        }
    }, 400); // 等待翻轉回去的動畫
}

// 執行卡片效果
async function executeCardEffect(card) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const optPlayer = gameState.players[1 - gameState.currentPlayerIndex];

    addLogEntry(`🃏 抽到【${card.title}】：${card.desc}`, 'card');

    if (card.action === 'money') {
        player.money += card.value;
        if (card.value < 0) synth.playRent();
        else synth.playTone(523.25, 'sine', 0.25, 0.1);
        updateUI();
        
        if (checkBankruptcy(player)) {
            handleBankruptcy(player);
            return;
        }
    } else if (card.action === 'collect_from_opp') {
        optPlayer.money -= card.value;
        player.money += card.value;
        addLogEntry(`💸 ${optPlayer.name} 給了 ${player.name} $${card.value}。`, 'system');
        updateUI();
        
        if (checkBankruptcy(optPlayer)) {
            handleBankruptcy(optPlayer);
            return;
        }
    } else if (card.action === 'free_card') {
        player.hasGetOutCard = true;
    } else if (card.action === 'go_to_jail') {
        player.isJailed = true;
        player.position = 10;
        player.jailTurns = 0;
        synth.playJail();
        updateTokenPositions();
        updateUI();
    } else if (card.action === 'move_to') {
        // 移動至特定格子
        const destId = card.value;
        const oldPos = player.position;
        
        // 計算移動格數
        let steps = destId - oldPos;
        if (steps < 0) steps += 40; // 跨過起點

        addLogEntry(`${player.name} 開始前往目的地...`, 'system');
        
        for (let i = 1; i <= steps; i++) {
            player.position = (oldPos + i) % 40;
            
            // 途中經過起點
            if (player.position === 0 && i !== steps) {
                player.money += 2000;
                addLogEntry(`${player.name} 經過起點！領取獎金 $2,000！`, 'system');
                synth.playTone(523.25, 'sine', 0.2, 0.1);
                updateUI();
            }
            
            synth.playStep();
            updateTokenPositions();
            await sleep(200);
        }

        // 重新觸發新格子的事件 (防止無窮遞迴，若新格子又是機會/命運，不予重複觸發，僅顯示屬性)
        const targetCell = BOARD_CELLS[player.position];
        if (targetCell.type === 'chance' || targetCell.type === 'destiny') {
            addLogEntry(`${player.name} 停在機會/命運格，但不重複抽取卡片。`, 'system');
            endTurn();
        } else {
            handleCellLanding(player.position);
        }
        return;
    }

    endTurn();
}

// 10. 回合結尾與電腦 AI 回合
function endTurn() {
    if (gameState.isGameOver) return;
    
    // 切換玩家
    gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
    gameState.isMoving = false;
    
    updateUI();

    const activePlayer = gameState.players[gameState.currentPlayerIndex];

    if (gameState.currentPlayerIndex === 0) {
        // 輪到玩家
        document.getElementById('rollBtn').disabled = false;
    } else {
        // 輪到電腦 (AI)
        document.getElementById('rollBtn').disabled = true;
        setTimeout(playAITurn, 1200);
    }
}

// AI 行動邏輯
function playAITurn() {
    if (gameState.isGameOver) return;
    playTurn();
}

// 11. 輔助功能與彈窗控制
function showBuyModal(cell) {
    document.getElementById('modalCardColor').style.backgroundColor = cell.color || '#64748b';
    document.getElementById('modalCardName').innerText = cell.name;
    document.getElementById('modalCardType').innerText = cell.type === 'company' ? '公共事業 / 交通' : '可購買土地';
    document.getElementById('modalCardPrice').innerText = `$${cell.price}`;
    document.getElementById('modalCardRent').innerText = `$${cell.rent}`;

    const overlay = document.getElementById('modalOverlay');
    const buyModal = document.getElementById('buyModal');

    overlay.classList.add('active');
    buyModal.style.display = 'block';
}

function showCellInfo(cell) {
    // 點擊棋盤上的格子，顯示格子資訊
    const ownerId = gameState.ownerMap[cell.id];
    let ownerText = "無";
    if (ownerId !== undefined) {
        ownerText = gameState.players[ownerId].name;
    }
    
    addLogEntry(`🔍 【${cell.name}】資訊：${cell.desc} ${cell.price > 0 ? `(價格: $${cell.price}, 基礎過路費: $${cell.rent})` : ''} 所有人: ${ownerText}`, 'system');
}

function closeModal(modalId) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById(modalId);
    
    overlay.classList.remove('active');
    modal.style.display = 'none';
}

// 檢測破產
function checkBankruptcy(player) {
    return player.money < 0;
}

// 處理破產與結束遊戲
function handleBankruptcy(bankruptPlayer) {
    gameState.isGameOver = true;
    document.getElementById('rollBtn').disabled = true;

    const winner = gameState.players[1 - bankruptPlayer.id];
    
    // 顯示遊戲結束視窗
    const titleEl = document.getElementById('gameOverTitle');
    const bannerEl = document.getElementById('gameOverBanner');
    const descEl = document.getElementById('gameOverDescription');
    
    if (winner.id === 0) {
        // 玩家獲勝
        titleEl.innerText = "大獲全勝！";
        bannerEl.innerText = "🏆 恭喜！你贏了！";
        bannerEl.style.color = "var(--accent-green)";
        descEl.innerText = `${bankruptPlayer.name} 已破產。你成為了最終的房地產巨擘！`;
        synth.playWin();
    } else {
        // 電腦獲勝
        titleEl.innerText = "挑戰失敗";
        bannerEl.innerText = "💀 你破產了！";
        bannerEl.style.color = "var(--accent-red)";
        descEl.innerText = `${winner.name} 奪走了你所有的資產。請點擊按鈕再次挑戰！`;
        synth.playLose();
    }

    const overlay = document.getElementById('modalOverlay');
    const gameOverModal = document.getElementById('gameOverModal');
    
    overlay.classList.add('active');
    gameOverModal.style.display = 'block';
    
    addLogEntry(`🎮 遊戲結束！${winner.name} 贏得了比賽！`, 'system');
}

// 重新開始遊戲
function resetGame() {
    gameState.players[0].money = 15000;
    gameState.players[0].position = 0;
    gameState.players[0].isJailed = false;
    gameState.players[0].jailTurns = 0;
    gameState.players[0].assets = [];
    gameState.players[0].hasGetOutCard = false;

    gameState.players[1].money = 15000;
    gameState.players[1].position = 0;
    gameState.players[1].isJailed = false;
    gameState.players[1].jailTurns = 0;
    gameState.players[1].assets = [];
    gameState.players[1].hasGetOutCard = false;

    gameState.currentPlayerIndex = 0;
    gameState.isGameOver = false;
    gameState.isMoving = false;
    gameState.ownerMap = {};

    // 清除格子的擁有權 class
    BOARD_CELLS.forEach(cell => {
        const cellEl = document.querySelector(`.cell-${cell.id}`);
        if (cellEl) {
            cellEl.classList.remove('owned-player0', 'owned-player1');
        }
    });

    // 清空紀錄
    const logBody = document.getElementById('logBody');
    logBody.innerHTML = '<div class="log-entry system-entry">遊戲已重置。請擲骰子開始新局！</div>';

    document.getElementById('rollBtn').disabled = false;

    // 重設骰子外觀為 1 點
    const dice = document.getElementById('dice');
    dice.className = 'dice show-1';
    dice.style.transform = '';

    updateTokenPositions();
    updateUI();
    synth.playTone(440, 'sine', 0.3, 0.1);
}

// 12. UI 渲染輔助
function updateUI() {
    // 更新資金
    document.getElementById('playerMoney0').innerText = `$${gameState.players[0].money.toLocaleString()}`;
    document.getElementById('playerMoney1').innerText = `$${gameState.players[1].money.toLocaleString()}`;

    // 更新狀態列 active
    const p0Row = document.getElementById('playerStatus0');
    const p1Row = document.getElementById('playerStatus1');
    
    if (gameState.currentPlayerIndex === 0) {
        p0Row.classList.add('active');
        p1Row.classList.remove('active');
        document.getElementById('turnIndicator').innerText = "🔴 輪到你的回合，請擲骰子！";
    } else {
        p0Row.classList.remove('active');
        p1Row.classList.add('active');
        document.getElementById('turnIndicator').innerText = "🔵 輪到電腦的回合，思考中...";
    }

    // 更新資產清單
    renderAssets(0);
    renderAssets(1);
}

// 渲染資產標籤
function renderAssets(playerId) {
    const assetsContainer = document.getElementById(`playerAssets${playerId}`);
    const playerAssets = gameState.players[playerId].assets;

    if (playerAssets.length === 0) {
        assetsContainer.innerHTML = `<span class="no-assets">${playerId === 0 ? '尚未購買任何資產' : '電腦尚未購買任何資產'}</span>`;
        return;
    }

    assetsContainer.innerHTML = '';
    playerAssets.sort((a, b) => a - b).forEach(cellId => {
        const cell = BOARD_CELLS[cellId];
        const badge = document.createElement('span');
        badge.className = 'asset-badge';
        badge.style.backgroundColor = cell.color || '#64748b';
        badge.innerText = `${cell.icon} ${cell.name}`;
        badge.title = `${cell.name} (過路費: $${cell.rent})`;
        
        // 點擊資產顯示資訊
        badge.addEventListener('click', () => {
            showCellInfo(cell);
        });

        assetsContainer.appendChild(badge);
    });
}

// 加入日誌
function addLogEntry(text, type) {
    const logBody = document.getElementById('logBody');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}-entry`;
    entry.innerText = text;
    
    logBody.appendChild(entry);
    
    // 自動滾動到底部
    logBody.scrollTop = logBody.scrollHeight;
}

// 工具函數
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
