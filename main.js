// --- Configuration & Global State ---
const gridSize = 4; 
const totalCells = gridSize * gridSize;
let playerPosition = 0;
let currentLevel = 0;
let levels = [];
let currentLevelQuestions = [];
let allQuestions = []; // Store all loaded questions
let currentQuestionIndex = -1;
let assets = 1600;       // Money / savings earned
let liabilities = 0;  // Debt or penalties
let netWorth = 0;     // Calculated automatically
let selectedAnswer = null;
let questionAnswered = false;
let currentQuestionData = null;
let pendingQuestionCell = null;
let gameLocked = false;
let questionsAnswered = []; // Track which questions have been seen

const board = document.getElementById('board');
const diceImg = document.getElementById('dice-img');
const resultText = document.getElementById('roll-result');
const rollButton = document.querySelector('button[onclick="roll()"]');

// --- 1. Grid Generation ---
function createBoard() {
    if (!board) return;
    board.innerHTML = "";
    
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    for (let r = gridSize - 1; r >= 0; r--) {
        for (let c = 0; c < gridSize; c++) {
            const block = document.createElement('div');
            block.classList.add('block');
            
            let cellValue;
            if (r % 2 === 0) {
                cellValue = (r * gridSize) + (c + 1);
            } else {
                cellValue = (r * gridSize) + (gridSize - c);
            }

            block.id = `cell-${cellValue}`;
            
            block.onclick = () => handleCellClick(cellValue);
            
            if (cellValue === 1) {
                block.innerHTML = `<span class="num">1</span>&nbsp;<span class="label">START</span>`;
                block.classList.add('start-node');
            } else if (cellValue === totalCells) {
                block.innerHTML = `<span class="num">${totalCells}</span>&nbsp;<span class="label">END</span>`;
                block.classList.add('end-node');
            } else {
                block.innerText = cellValue;
            }

            board.appendChild(block);
        }
    }
}

// --- 2. Cell Click Handler ---
function handleCellClick(cellValue) {
    if (pendingQuestionCell === cellValue && !questionAnswered && currentQuestionData) {
        showQuestionModal(currentQuestionData);
    } else if (gameLocked) {
        resultText.innerText = "⚠️ Please answer the current question first!";
    }
}

// --- 3. Dice & Movement Logic ---
function roll() {
    if (gameLocked) {
        resultText.innerText = "❌ Please answer the question first!";
        return;
    }
    
    const val = Math.floor(Math.random() * 6) + 1;
    
    diceImg.src = `assets/dice${val}.png`;
    resultText.innerText = `You rolled a ${val}!`;
    
    movePlayer(val);
    
    diceImg.animate([
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(180deg) scale(1.2)' },
        { transform: 'rotate(360deg) scale(1)' }
    ], { duration: 300, easing: 'ease-out' });
}

function movePlayer(steps) {
    if (playerPosition > 0) {
        const oldCell = document.getElementById(`cell-${playerPosition}`);
        if (oldCell) oldCell.classList.remove('player-here');
    }

    playerPosition += steps;

    if (playerPosition >= totalCells) {
        playerPosition = totalCells;
        updateCellVisuals(playerPosition);
        
        // Level complete!
        setTimeout(() => {
            if (currentLevel < levels.length - 1) {
                showLevelCompleteModal();
            } else {
                showGameCompleteModal();
            }
        }, 400);
    } else {
        updateCellVisuals(playerPosition);
    }
}

function updateCellVisuals(pos) {
    const currentCell = document.getElementById(`cell-${pos}`);
    if (currentCell) {
        currentCell.classList.add('player-here', 'visited');
        
        if (pos > 1) {
            const questionData = currentLevelQuestions[pos - 2];
            if (questionData) {
                currentQuestionIndex = pos - 2;
                currentQuestionData = questionData;
                pendingQuestionCell = pos;
                
                gameLocked = true;
                rollButton.style.opacity = '0.5';
                rollButton.style.cursor = 'not-allowed';
                resultText.innerText = "❓ Answer the question to continue!";
                
                showQuestionModal(questionData);
            }
        }
    }
}

function createModal() {
    if (document.getElementById('questionModal')) {
        return document.getElementById('questionModal');
    }
    
    const modalHTML = `
        <div id="questionModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Financial Literacy Question</h2>
                    <span class="category-badge" id="modalCategory"></span>
                </div>
                <div class="question-text" id="modalQuestion"></div>
                <div class="options-container" id="modalOptions"></div>
                <div id="feedbackMessage" class="feedback-message" style="display: none;"></div>
                <div class="modal-footer">
                    <button class="modal-btn submit-btn" id="submitAnswer" disabled>Submit Answer</button>
                    <button class="modal-btn close-btn" id="closeModal">Close</button>
                    <button class="modal-btn next-btn" id="nextQuestion" style="display: none;">Next</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Compact score display
    if (!document.querySelector('.score-display')) {
        const scoreHTML = `
            <div class="score-display">
                <span class="level-badge">Lvl <span id="levelDisplay">1</span>/5</span>
                <span class="stat">Assets💰 $<span id="assetValue">1600</span></span>
                <span class="stat">Liabilities💳 $<span id="liabilityValue">0</span></span>
                <span class="stat">Networth📊 $<span id="netWorthValue">1600</span></span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', scoreHTML);
    }
    
    return document.getElementById('questionModal');
}

function showQuestionModal(q) {
    const modal = createModal();
    const categorySpan = document.getElementById('modalCategory');
    const questionDiv = document.getElementById('modalQuestion');
    const optionsDiv = document.getElementById('modalOptions');
    const submitBtn = document.getElementById('submitAnswer');
    const closeBtn = document.getElementById('closeModal');
    const nextBtn = document.getElementById('nextQuestion');
    const feedbackDiv = document.getElementById('feedbackMessage');
    
    selectedAnswer = null;
    
    if (questionAnswered) {
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        closeBtn.style.display = 'none';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        closeBtn.style.display = 'block';
    }
    
    feedbackDiv.style.display = 'none';
    feedbackDiv.className = 'feedback-message';
    
    categorySpan.textContent = q.Category;
    questionDiv.textContent = q.Question;
    
    const options = [
        { letter: 'A', text: q.OptionA },
        { letter: 'B', text: q.OptionB },
        { letter: 'C', text: q.OptionC },
        { letter: 'D', text: q.OptionD }
    ];
    
    optionsDiv.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-prefix">${opt.letter}.</span> ${opt.text}`;
        btn.onclick = (e) => selectOption(opt.letter, e);
        
        if (questionAnswered) {
            btn.disabled = true;
            if (opt.letter === q.CorrectAnswer) {
                btn.style.backgroundColor = 'rgba(40, 167, 69, 0.3)';
                btn.style.borderColor = '#28a745';
            }
        }
        
        optionsDiv.appendChild(btn);
    });
    
    modal.style.display = 'block';
    
    submitBtn.onclick = () => submitAnswer(q);
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        if (!questionAnswered) {
            resultText.innerText = "⚠️ You must answer the question to continue!";
        }
    };
    
    nextBtn.onclick = () => {
        modal.style.display = 'none';
        gameLocked = false;
        questionAnswered = false;
        currentQuestionData = null;
        pendingQuestionCell = null;
        rollButton.style.opacity = '1';
        rollButton.style.cursor = 'pointer';
        resultText.innerText = "Roll the dice!";
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            if (!questionAnswered) {
                resultText.innerText = "⚠️ You must answer the question first!";
                return;
            }
            modal.style.display = 'none';
        }
    };
}

function selectOption(letter, event) {
    if (questionAnswered) return;
    
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    selectedAnswer = letter;
    document.getElementById('submitAnswer').disabled = false;
}

function submitAnswer(q) {
    if (!selectedAnswer || questionAnswered) return;
    
    questionAnswered = true;
    const isCorrect = selectedAnswer === q.CorrectAnswer;
    const feedbackDiv = document.getElementById('feedbackMessage');
    const submitBtn = document.getElementById('submitAnswer');
    const nextBtn = document.getElementById('nextQuestion');
    const closeBtn = document.getElementById('closeModal');
    const options = document.querySelectorAll('.option-btn');
    
    options.forEach(btn => {
        btn.disabled = true;
        const letter = btn.querySelector('.option-prefix').textContent.replace('.', '');
        if (letter === q.CorrectAnswer) {
            btn.style.backgroundColor = 'rgba(40, 167, 69, 0.3)';
            btn.style.borderColor = '#28a745';
        } else if (letter === selectedAnswer && !isCorrect) {
            btn.style.backgroundColor = 'rgba(220, 53, 69, 0.3)';
            btn.style.borderColor = '#dc3545';
        }
    });
    
    if (isCorrect) {
        let earned = 100;
        assets += earned;
        feedbackDiv.textContent = `✅ Correct! You earned $${earned} in assets.`;
        questionsAnswered.push(q.Question);
    } else {
        let penalty = 100;
        liabilities += penalty;
        feedbackDiv.textContent = `❌ Wrong! You incurred $${penalty} in liabilities. Correct answer: ${q.CorrectAnswer}`;
        
        // Wrong answer - move back 1 space
        setTimeout(() => {
            playerPosition = Math.max(1, playerPosition - 1);
            updateCellVisuals(playerPosition);
        }, 1500);
    }
    
    // Mark the cell with the result color (GREEN for correct, RED for wrong)
    if (pendingQuestionCell) {
        markCellColor(pendingQuestionCell, isCorrect);
    }
    
    updateFinanceDisplay();
    feedbackDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';
    closeBtn.style.display = 'none';
}
// --- Level Progression Functions ---
function createLevels(questions, numLevels) {
    const categorized = {
        "Asset/Liability": [],
        "Investments": [],
        "Budgeting": [],
        "Debt Management": []
    };
    
    questions.forEach(q => {
        const cat = q.Category ? q.Category.trim() : "";
        if (categorized[cat]) {
            categorized[cat].push(q);
        }
    });
    
    let levels = [];
    for (let level = 0; level < numLevels; level++) {
        let levelQuestions = [];
        for (let category in categorized) {
            const startIdx = level * 4;
            const endIdx = startIdx + 4;
            const catQuestions = categorized[category].slice(startIdx, endIdx);
            
            if (catQuestions.length > 0) {
                levelQuestions.push(...catQuestions);
            } else {
                // If we run out of questions, loop back to beginning
                const remainingNeeded = 4;
                const loopedQuestions = categorized[category].slice(0, remainingNeeded);
                levelQuestions.push(...loopedQuestions);
            }
        }
        levels.push(shuffle(levelQuestions));
    }
    return levels;
}

function showLevelCompleteModal() {
    const modal = document.getElementById('levelCompleteModal') || createLevelCompleteModal();
    
    const levelScore = assets - (1600 + (questionsAnswered.length * 100)); // Rough calculation
    
    document.getElementById('levelScore').textContent = levelScore;
    document.getElementById('totalAssets').textContent = assets;
    document.getElementById('totalLiabilities').textContent = liabilities;
    document.getElementById('totalNetWorth').textContent = assets - liabilities;
    document.getElementById('currentLevelDisplay').textContent = currentLevel + 1;
    
    modal.style.display = 'block';
}

function createLevelCompleteModal() {
    const modalHTML = `
        <div id="levelCompleteModal" class="modal">
            <div class="modal-content" style="max-width: 500px; text-align: center;">
                <div class="modal-header" style="justify-content: center;">
                    <h2>Level <span id="currentLevelDisplay">1</span> Complete! 🎉</h2>
                </div>
                <div style="padding: 30px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🏆</div>
                    <h3 style="color: #ffca28; font-size: 1.8rem; margin-bottom: 20px;">Level Results</h3>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; margin: 20px 0;">
                        <p style="font-size: 1.2rem; margin: 10px 0;">Level Score: <span id="levelScore" style="color: #ffca28; font-weight: bold;">0</span></p>
                        <p style="font-size: 1.2rem; margin: 10px 0;">Total Assets: $<span id="totalAssets">1600</span></p>
                        <p style="font-size: 1.2rem; margin: 10px 0;">Total Liabilities: $<span id="totalLiabilities">0</span></p>
                        <p style="font-size: 1.2rem; margin: 10px 0;">Net Worth: $<span id="totalNetWorth">1600</span></p>
                    </div>
                    
                    <p style="color: #98fb98; font-size: 1.1rem;">Ready for the next level?</p>
                </div>
                <div class="modal-footer" style="justify-content: center;">
                    <button class="modal-btn next-btn" id="nextLevelBtn">Next Level →</button>
                    <button class="modal-btn close-btn" id="restartGameBtn">Restart Game</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('nextLevelBtn').onclick = startNextLevel;
    document.getElementById('restartGameBtn').onclick = () => {
        resetGame();
        document.getElementById('levelCompleteModal').style.display = 'none';
    };
    
    return document.getElementById('levelCompleteModal');
}

function showGameCompleteModal() {
    const modal = document.getElementById('levelCompleteModal');
    const header = modal.querySelector('.modal-header h2');
    const content = modal.querySelector('div[style*="padding: 30px"]');
    
    header.textContent = "GAME COMPLETE! 🏆";
    content.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: 20px;">👑</div>
        <h3 style="color: #ffca28; font-size: 2rem; margin-bottom: 20px;">Finance Master!</h3>
        
        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 15px; margin: 20px 0;">
            <p style="font-size: 1.3rem; margin: 10px 0;">Final Assets: $<span style="color: #ffca28;">${assets}</span></p>
            <p style="font-size: 1.3rem; margin: 10px 0;">Final Liabilities: $<span style="color: #ff6b6b;">${liabilities}</span></p>
            <p style="font-size: 1.5rem; margin: 15px 0;">Final Net Worth: $<span style="color: #98fb98;">${assets - liabilities}</span></p>
            <p style="font-size: 1.1rem; margin-top: 20px;">Questions Answered: ${questionsAnswered.length}</p>
        </div>
        
        <p style="color: #98fb98; font-size: 1.2rem;">Congratulations! You're a Finance Expert! 🎉</p>
    `;
    
    const footer = modal.querySelector('.modal-footer');
    footer.innerHTML = `
        <button class="modal-btn next-btn" id="playAgainBtn">Play Again</button>
    `;
    
    document.getElementById('playAgainBtn').onclick = () => {
        resetGame();
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
}

function startNextLevel() {
    currentLevel++;
    playerPosition = 0;
    currentLevelQuestions = levels[currentLevel];
    questionAnswered = false;
    
    // Reset board visuals but KEEP the color-coded cells
    document.querySelectorAll('.block').forEach(b => {
        b.classList.remove('player-here');
        // Don't remove 'correct-answer', 'wrong-answer', or 'visited' classes
        // This preserves the colors from previous levels
    });
    
    // Update level display
    document.getElementById('levelDisplay').textContent = currentLevel + 1;
    
    // Hide modal
    document.getElementById('levelCompleteModal').style.display = 'none';
    
    // Update message
    resultText.innerText = `Level ${currentLevel + 1} - Roll to start!`;
    
    // Make sure game is unlocked
    gameLocked = false;
    rollButton.style.opacity = '1';
    rollButton.style.cursor = 'pointer';
}
// --- 5. CSV & Data Logic ---
async function loadCSV(filePath) {
    const response = await fetch(filePath);
    const text = await response.text();

    const rows = text.trim().split(/\r?\n/);
    const headers = rows[0].split(",").map(h => h.trim());

    return rows.slice(1).map(row => {
        const values = row.split(",");
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : "";
        });
        return obj;
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function resetGame() {
    document.querySelectorAll('.block').forEach(b => {
        b.classList.remove('player-here', 'visited', 'correct-answer', 'wrong-answer');
        b.style.borderColor = '';
        b.style.borderWidth = '';
    });
    
    playerPosition = 0;
    currentLevel = 0;
    assets = 1600;
    liabilities = 0;
    questionsAnswered = [];
    currentLevelQuestions = levels[0];
    
    updateFinanceDisplay();
    document.getElementById('levelDisplay').textContent = '1';
    resultText.innerText = "Roll to start";
    questionAnswered = false;
    gameLocked = false;
    currentQuestionData = null;
    pendingQuestionCell = null;
    rollButton.style.opacity = '1';
    rollButton.style.cursor = 'pointer';
}

function updateFinanceDisplay() {
    netWorth = assets - liabilities;
    document.getElementById('assetValue').textContent = assets;
    document.getElementById('liabilityValue').textContent = liabilities;
    document.getElementById('netWorthValue').textContent = netWorth;
}
function markCellColor(cellValue, isCorrect) {
    const cell = document.getElementById(`cell-${cellValue}`);
    if (cell) {
        // Remove any existing result classes
        cell.classList.remove('correct-answer', 'wrong-answer');
        // Add the appropriate class
        cell.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
        // Keep the visited class
        cell.classList.add('visited');
    }
}
// --- 6. Initialization ---
async function initGame() {
    try {
        allQuestions = await loadCSV("data.csv");
        levels = createLevels(allQuestions, 5);
        currentLevelQuestions = levels[0];
        console.log("Levels Created:", levels.length, "Total Questions:", levels.flat().length);
        createBoard();
        createModal();
    } catch (err) {
        console.error("Failed to load CSV. Make sure data.csv exists.", err);
        createBoard();
        createModal();
    }
}

// Start the game
initGame();