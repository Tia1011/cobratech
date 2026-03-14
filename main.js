const board = document.getElementById('board');
const diceImg = document.getElementById('dice-img');
const resultText = document.getElementById('roll-result');

// Create the 9x9 grid (81 cells)
function createBoard() {
    for (let i = 1; i <= 81; i++) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.id = `cell-${i}`;
        block.innerText = i;
        board.appendChild(block);
    }
}

// Roll function
function roll() {
    // 1. Generate random number
    const val = Math.floor(Math.random() * 6) + 1;
    
    // 2. Update Image (Assumes your assets are named dice1.png, etc.)
    diceImg.src = `assets/dice${val}.png`;
    
    // 3. Update Text
    resultText.innerText = `You rolled a ${val}!`;

    // Optional: Add a "pop" animation to the dice
    diceImg.style.transform = 'scale(1.2) rotate(10deg)';
    setTimeout(() => {
        diceImg.style.transform = 'scale(1) rotate(0deg)';
    }, 150);
}

// Initialize board on load
createBoard();