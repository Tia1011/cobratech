const board = document.getElementById('board');
const diceImg = document.getElementById('dice-img');
const resultText = document.getElementById('roll-result');

// Create 16 cells for a 4x4 grid
function createBoard() {
    board.innerHTML = ""; // Clear existing
    for (let i = 1; i <= 16; i++) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.id = `cell-${i}`;
        block.innerText = i;
        board.appendChild(block);
    }
}

function roll() {
    // Generate 1-6
    const val = Math.floor(Math.random() * 6) + 1;
    
    // Update Image
    diceImg.src = `assets/dice${val}.png`;
    
    // Update Text
    resultText.innerText = `You rolled a ${val}!`;
    
    // Quick animation effect
    diceImg.animate([
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(180deg) scale(1.2)' },
        { transform: 'rotate(360deg) scale(1)' }
    ], {
        duration: 300,
        easing: 'ease-out'
    });
}

async function loadCSV(filePath) {
  const response = await fetch(filePath);
  const text = await response.text();

  const rows = text.trim().split("\n");
  const headers = rows[0].split(",");

  const data = rows.slice(1).map(row => {
    const values = row.split(",");
    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    return obj;
  });

  return data;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function getLevel1Questions(allQuestions) {

  const categories = {
    "Asset/Liability": [],
    "Investments": [],
    "Budgeting": [],
    "Debt Management": []
  };

  // group by category
  allQuestions.forEach(q => {
    categories[q.Category].push(q);
  });

  let levelQuestions = [];

  for (let category in categories) {
    const randomFour = shuffle(categories[category]).slice(0, 4);
    levelQuestions.push(...randomFour);
  }

  return shuffle(levelQuestions); // shuffle final 16
}

async function initGame() {

  const questions = await loadCSV("data.csv");

  const level1 = getLevel1Questions(questions);
    console.log("ahsdgjsd");
  console.log(level1); // 16 random questions
  createBoard();
}

initGame();
// Start the board
