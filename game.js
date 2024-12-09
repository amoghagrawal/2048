class Grid {
    constructor(gridElement) {
        this.cells = [];
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            gridElement.append(cell);
            this.cells.push(cell);
        }
    }
}

class Tile {
    constructor(gridElement, value = Math.random() > 0.5 ? 2 : 4) {
        this.tile = document.createElement("div");
        this.tile.classList.add("tile");
        this.setValue(value);
        gridElement.append(this.tile);
    }

    setValue(value) {
        this.value = value;
        this.tile.textContent = value;
        this.tile.setAttribute('data-value', value);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.tile.style.setProperty('transform', `translate(${x * (106.25 + 15) + 15}px, ${y * (106.25 + 15) + 15}px)`);
    }

    remove() {
        this.tile.remove();
    }
}

class Game {
    constructor(boardElement, scoreElement) {
        this.boardElement = boardElement;
        this.scoreElement = scoreElement;
        this.grid = new Grid(boardElement);
        this.score = 0;
        this.tiles = [];
        this.setupNewGame();
    }

    setupNewGame() {
        this.addNewTile();
        this.addNewTile();
    }

    addNewTile() {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return;
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const newTile = new Tile(this.boardElement);
        newTile.setPosition(randomCell % 4, Math.floor(randomCell / 4));
        this.tiles.push(newTile);
    }

    getEmptyCells() {
        const occupiedPositions = this.tiles.map(tile => tile.y * 4 + tile.x);
        return Array.from(Array(16).keys()).filter(i => !occupiedPositions.includes(i));
    }

    moveTiles(direction) {
        const positions = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                switch(direction) {
                    case "ArrowUp": positions.push({x: j, y: i}); break;
                    case "ArrowDown": positions.push({x: j, y: 3-i}); break;
                    case "ArrowLeft": positions.push({x: i, y: j}); break;
                    case "ArrowRight": positions.push({x: 3-i, y: j}); break;
                }
            }
        }

        let moved = false;
        positions.forEach(pos => {
            const tile = this.tiles.find(t => t.x === pos.x && t.y === pos.y);
            if (!tile) return;

            let newX = pos.x;
            let newY = pos.y;
            let merged = false;

            while (true) {
                let nextX = newX;
                let nextY = newY;

                switch(direction) {
                    case "ArrowUp": nextY--; break;
                    case "ArrowDown": nextY++; break;
                    case "ArrowLeft": nextX--; break;
                    case "ArrowRight": nextX++; break;
                }

                if (nextX < 0 || nextX > 3 || nextY < 0 || nextY > 3) break;

                const nextTile = this.tiles.find(t => t.x === nextX && t.y === nextY);
                if (!nextTile) {
                    newX = nextX;
                    newY = nextY;
                    moved = true;
                } else if (!merged && nextTile.value === tile.value) {
                    this.score += tile.value * 2;
                    this.scoreElement.textContent = this.score;
                    nextTile.setValue(tile.value * 2);
                    this.tiles = this.tiles.filter(t => t !== tile);
                    tile.remove();
                    moved = true;
                    break;
                } else {
                    break;
                }
            }

            if (tile && (newX !== pos.x || newY !== pos.y)) {
                tile.setPosition(newX, newY);
            }
        });

        if (moved) {
            this.addNewTile();
        }

        if (checkGameOver(this)) {
            showGameOver(this === playerGame ? 'single' : null);
        }
    }
}

let playerGame, botGame, timerInterval, botInterval;

function startSinglePlayer() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('header').style.display = 'flex';
    document.getElementById('botContainer').style.display = 'none';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('resetButton').style.display = 'block';
    
    playerGame = new Game(document.getElementById("playerBoard"), document.getElementById("playerScore"));
    setupControls();
}

function startVsBot() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('header').style.display = 'flex';
    document.getElementById('botContainer').style.display = 'block';
    document.getElementById('timer').style.display = 'block';
    document.getElementById('resetButton').style.display = 'none';
    
    playerGame = new Game(document.getElementById("playerBoard"), document.getElementById("playerScore"));
    botGame = new Game(document.getElementById("botBoard"), document.getElementById("botScore"));
    
    setupControls();
    startTimer();
    startBot();
}

function goToMenu() {
    clearInterval(timerInterval);
    clearInterval(botInterval);
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('header').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('timer').textContent = '60';
    document.getElementById('resetButton').style.display = 'block';
    resetGame();
}

function resetGame() {
    const playerBoard = document.getElementById("playerBoard");
    const botBoard = document.getElementById("botBoard");
    playerBoard.innerHTML = '';
    botBoard.innerHTML = '';
    document.getElementById("playerScore").textContent = '0';
    document.getElementById("botScore").textContent = '0';
}

function resetCurrentGame() {
    if (playerGame) {
        const playerBoard = document.getElementById("playerBoard");
        playerBoard.innerHTML = '';
        document.getElementById("playerScore").textContent = '0';
        playerGame = new Game(playerBoard, document.getElementById("playerScore"));
    }
    
    if (botGame) {
        const botBoard = document.getElementById("botBoard");
        botBoard.innerHTML = '';
        document.getElementById("botScore").textContent = '0';
        botGame = new Game(botBoard, document.getElementById("botScore"));
    }
}

function playAgain() {
    document.getElementById('gameOver').style.display = 'none';
    resetCurrentGame();
    if (document.getElementById('botContainer').style.display === 'block') {
        startTimer();
        startBot();
    }
}

function checkGameOver(game) {
    if (game.getEmptyCells().length !== 0) return false;
    
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const currentTile = game.tiles.find(t => t.x === x && t.y === y);
            if (!currentTile) continue;
            
            const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                
                if (newX >= 0 && newX < 4 && newY >= 0 && newY < 4) {
                    const adjacentTile = game.tiles.find(t => t.x === newX && t.y === newY);
                    if (adjacentTile && adjacentTile.value === currentTile.value) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function setupControls() {
    const playerBoard = document.getElementById("playerBoard");
    
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let currentX, currentY;
    const MIN_SWIPE = 50;

    function handleStart(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
    }

    function handleMove(e) {
        if (!isDragging) return;
        currentX = e.clientX;
        currentY = e.clientY;
    }

    function handleEnd() {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        if (Math.abs(deltaX) < MIN_SWIPE && Math.abs(deltaY) < MIN_SWIPE) return;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                playerGame.moveTiles("ArrowRight");
            } else {
                playerGame.moveTiles("ArrowLeft");
            }
        } else {
            if (deltaY > 0) {
                playerGame.moveTiles("ArrowDown");
            } else {
                playerGame.moveTiles("ArrowUp");
            }
        }
    }

    playerBoard.addEventListener('mousedown', handleStart);
    playerBoard.addEventListener('mousemove', handleMove);
    playerBoard.addEventListener('mouseup', handleEnd);
    playerBoard.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleStart(touch);
    });
    playerBoard.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch);
    });
    playerBoard.addEventListener('touchend', handleEnd);

    document.addEventListener("keydown", e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            playerGame.moveTiles(e.key);
        }
    });
}

function startTimer() {
    let timeLeft = 60;
    const timer = document.getElementById("timer");
    const gameOver = document.getElementById("gameOver");

    timerInterval = setInterval(() => {
        timeLeft--;
        timer.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            timer.classList.add('warning');
        } else {
            timer.classList.remove('warning');
        }
        
        if (timeLeft <= 0) {
            showGameOver();
        }
    }, 1000);
}

function showGameOver(mode) {
    const gameOver = document.getElementById("gameOver");
    const gameOverTitle = document.getElementById("gameOverTitle");
    const finalScore = document.getElementById("finalScore");
    const playAgainButton = document.getElementById("playAgainButton");
    
    clearInterval(timerInterval);
    clearInterval(botInterval);
    
    gameOver.style.display = "flex";
    
    if (mode === 'single') {
        gameOverTitle.textContent = "Game Over!";
        finalScore.textContent = `Final Score: ${document.getElementById("playerScore").textContent}`;
        playAgainButton.style.display = "block";
    } else {
        const playerScore = parseInt(document.getElementById("playerScore").textContent);
        const botScore = parseInt(document.getElementById("botScore").textContent);
        
        if (playerScore > botScore) {
            gameOverTitle.textContent = "You Win!";
        } else if (botScore > playerScore) {
            gameOverTitle.textContent = "Bot Wins!";
        } else {
            gameOverTitle.textContent = "It's a Tie!";
        }
        finalScore.textContent = `Player: ${playerScore} - Bot: ${botScore}`;
        playAgainButton.style.display = "block";
    }
}

function startBot() {
    const botMoves = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    botInterval = setInterval(() => {
        const randomMove = botMoves[Math.floor(Math.random() * botMoves.length)];
        botGame.moveTiles(randomMove);
    }, 500);
}
