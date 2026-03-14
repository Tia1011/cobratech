function roll(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
const rollDice6 = () => rollDice(1, 6);
print (rollDice6);

function createBoard(){
    const matrixArray = createMatrix(n);
    const board = document.querySelector('.main-board')
    let str = "";
    matrixArray.map(row => {
        str += `
            <div class="row">`
        row.map(block => {
            str += `
                    <div 
                      class="block ${block === 1 ? 'active' : ''} " data-value=${block}>
                      ${block}
                    </div>
                `
            })   
        str += `</div>`
    })
    board.innerHTML = str;
}