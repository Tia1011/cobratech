// --- Configuration & Global State ---
const gridSize = 4; 
const totalCells = gridSize * gridSize;
let playerPosition = 0;
let level1Questions = [];
let currentQuestionIndex = -1;
let assets = 1600;       // Money / savings earned
let liabilities = 0;  // Debt or penalties
let netWorth = 0;     // Calculated automatically
let selectedAnswer = null;
let questionAnswered = false;
let currentQuestionData = null;
let pendingQuestionCell = null; // Track which cell the question belongs to
let gameLocked = false; // Lock the game when question is pending

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
            
            // Add click handler to reopen question
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
    // If there's a pending question for this cell and it hasn't been answered
    if (pendingQuestionCell === cellValue && !questionAnswered && currentQuestionData) {
        // Reopen the question modal
        showQuestionModal(currentQuestionData);
    } else if (gameLocked) {
        // If game is locked but clicking wrong cell, show message
        alert("Please answer the current question first!");
    }
}

// --- 3. Dice & Movement Logic ---
function roll() {
    // Check if game is locked due to pending question
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
    // Remove highlight from current cell
    if (playerPosition > 0) {
        const oldCell = document.getElementById(`cell-${playerPosition}`);
        if (oldCell) oldCell.classList.remove('player-here');
    }

    playerPosition += steps;

    if (playerPosition >= totalCells) {
        playerPosition = totalCells;
        updateCellVisuals(playerPosition);
        setTimeout(() => {
            alert(`Congratulations! You've reached the END!\n\nFinal Score: ${assets}/${totalCells-1}`);
            resetGame();
        }, 400);
    } else {
        updateCellVisuals(playerPosition);
    }
}

function updateCellVisuals(pos) {
    const currentCell = document.getElementById(`cell-${pos}`);
    if (currentCell) {
        currentCell.classList.add('player-here', 'visited');
        
        // Show the question associated with this cell (skip START cell)
        if (pos > 1) {
            const questionData = level1Questions[pos - 2]; // Adjust index because START is position 1
            if (questionData) {
                currentQuestionIndex = pos - 2;
                currentQuestionData = questionData;
                pendingQuestionCell = pos;
                
                // Lock the game and show question
                gameLocked = true;
                rollButton.style.opacity = '0.5';
                rollButton.style.cursor = 'not-allowed';
                resultText.innerText = "❓ Answer the question to continue!";
                
                showQuestionModal(questionData);
            }
        }
    }
}

// --- 4. Modal and Question Display ---
function createModal() {
    // Check if modal already exists
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
    
    // Add score display if it doesn't exist
    if (!document.querySelector('.score-display')) {
        const scoreHTML = `
            <div class="score-display">
                Assets: $<span id="assetValue">1600</span> |
                Liabilities: $<span id="liabilityValue">0</span> |
                Net Worth: $<span id="netWorthValue">0</span>
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
    
    // Reset state for new question (but preserve questionAnswered status)
    selectedAnswer = null;
    
    // If question was already answered, show the next button instead
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
    
    // Set content
    categorySpan.textContent = q.Category;
    questionDiv.textContent = q.Question;
    
    // Create options
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
        
        // If question was already answered, show the correct answer highlighting
        if (questionAnswered) {
            btn.disabled = true;
            if (opt.letter === q.CorrectAnswer) {
                btn.style.backgroundColor = 'rgba(40, 167, 69, 0.3)';
                btn.style.borderColor = '#28a745';
            }
        }
        
        optionsDiv.appendChild(btn);
    });
    
    // Show modal
    modal.style.display = 'block';
    
    // Event listeners
    submitBtn.onclick = () => submitAnswer(q);
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        // Keep game locked if question not answered
        if (!questionAnswered) {
            resultText.innerText = "⚠️ You must answer the question to continue!";
        }
    };
    
    nextBtn.onclick = () => {
        modal.style.display = 'none';
        // Unlock the game since question is answered
        gameLocked = false;
        questionAnswered = false; // Reset for next question
        currentQuestionData = null;
        pendingQuestionCell = null;
        rollButton.style.opacity = '1';
        rollButton.style.cursor = 'pointer';
        resultText.innerText = "Roll the dice!";
    };
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            if (!questionAnswered) {
                // Don't close if question not answered
                resultText.innerText = "⚠️ You must answer the question first!";
                return;
            }
            modal.style.display = 'none';
        }
    };
}

function selectOption(letter, event) {
    if (questionAnswered) return;
    
    // Remove selected class from all options
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked option
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
    
    // Highlight correct/incorrect answers
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
    
    // Show feedback
    if (isCorrect) {
        // Correct answer: gain assets
        let earned = 100; // or vary based on difficulty
        assets += earned;
        feedbackDiv.textContent = `✅ Correct! You earned $${earned} in assets.`;
    } else {
        // Wrong answer: incur liability
        let penalty = 100; // or vary based on difficulty
        liabilities += penalty;
        feedbackDiv.textContent = `❌ Wrong! You incurred $${penalty} in liabilities. Correct answer: ${q.CorrectAnswer}`;
    }

    // Update net worth display
    updateFinanceDisplay();
    
    feedbackDiv.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';
    closeBtn.style.display = 'none';
    
    // Mark the cell as answered (optional visual indicator)
    if (pendingQuestionCell) {
        const cell = document.getElementById(`cell-${pendingQuestionCell}`);
        if (cell) {
            cell.style.borderColor = '#28a745';
            cell.style.borderWidth = '3px';
        }
    }
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

function getLevel1Questions(allQuestions) {
    const categories = {
        "Asset/Liability": [],
        "Investments": [],
        "Budgeting": [],
        "Debt Management": []
    };

    allQuestions.forEach(q => {
        const cat = q.Category ? q.Category.trim() : "";
        if (categories[cat]) {
            categories[cat].push(q);
        }
    });

    let levelQuestions = [];
    for (let category in categories) {
        const randomFour = shuffle([...categories[category]]).slice(0, 4);
        levelQuestions.push(...randomFour);
    }

    return shuffle(levelQuestions);
}

function resetGame() {
    document.querySelectorAll('.block').forEach(b => {
        b.classList.remove('player-here', 'visited');
        b.style.borderColor = '';
        b.style.borderWidth = '';
    });
    playerPosition = 0;
    assets = 1600;
    liabilities = 0;
    netWorth = 0;
    updateFinanceDisplay();
    resultText.innerText = "Roll to start";
    questionAnswered = false;
    gameLocked = false;
    currentQuestionData = null;
    pendingQuestionCell = null;
    rollButton.style.opacity = '1';
    rollButton.style.cursor = 'pointer';
}

// --- 6. Initialization ---
async function initGame() {
    try {
        const questions = await loadCSV("data.csv");
        level1Questions = getLevel1Questions(questions);
        console.log("Questions Loaded:", level1Questions);
        createBoard();
        createModal(); // Create modal on init
    } catch (err) {
        console.error("Failed to load CSV. Make sure data.csv exists.", err);
        createBoard();
        createModal();
    }
}

function updateFinanceDisplay() {
    netWorth = assets - liabilities;
    document.getElementById('assetValue').textContent = assets;
    document.getElementById('liabilityValue').textContent = liabilities;
    document.getElementById('netWorthValue').textContent = netWorth;
}

// Start the game
initGame();