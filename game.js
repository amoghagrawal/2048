class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.gridElement = document.getElementById('grid');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('gameOver');
        this.gameContainer = document.getElementById('gameContainer');
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
    }

    resetGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.gameOverElement.style.display = 'none';
        this.gameContainer.classList.remove('game-over-blur');
        this.init();
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.8 ? 2 : 4; // Changed from 0.9 to 0.8
        }
    }

    updateDisplay() {
        const tiles = this.gridElement.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.dataset.value = this.grid[i][j];
                    tile.textContent = this.grid[i][j];
                    tile.style.left = (j * 115 + 15) + 'px';
                    tile.style.top = (i * 115 + 15) + 'px';
                    this.gridElement.appendChild(tile);
                }
            }
        }

        this.scoreElement.textContent = this.score;

        if (this.gameOver) {
            this.gameOverElement.style.display = 'flex';
            this.gameContainer.classList.add('game-over-blur');
        } else {
            this.gameOverElement.style.display = 'none';
            this.gameContainer.classList.remove('game-over-blur');
        }
    }

    move(direction) {
        if (this.gameOver) return;

        const prevGrid = JSON.stringify(this.grid);
        
        switch(direction) {
            case 'left': this.moveLeft(); break;
            case 'right': this.moveRight(); break;
            case 'up': this.moveUp(); break;
            case 'down': this.moveDown(); break;
        }

        if (prevGrid !== JSON.stringify(this.grid)) {
            this.addNewTile();
            if (!this.canMove()) {
                this.gameOver = true;
            }
        }

        this.updateDisplay();
    }

    moveLeft() {
        for (let i = 0; i < 4; i++) {
            let row = this.grid[i].filter(x => x !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                }
            }
            while (row.length < 4) row.push(0);
            this.grid[i] = row;
        }
    }

    moveRight() {
        for (let i = 0; i < 4; i++) {
            let row = this.grid[i].filter(x => x !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    row.unshift(0);
                }
            }
            while (row.length < 4) row.unshift(0);
            this.grid[i] = row;
        }
    }

    moveUp() {
        for (let j = 0; j < 4; j++) {
            let col = this.grid.map(row => row[j]).filter(x => x !== 0);
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    this.score += col[i];
                    col.splice(i + 1, 1);
                }
            }
            while (col.length < 4) col.push(0);
            for (let i = 0; i < 4; i++) {
                this.grid[i][j] = col[i];
            }
        }
    }

    moveDown() {
        for (let j = 0; j < 4; j++) {
            let col = this.grid.map(row => row[j]).filter(x => x !== 0);
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    col[i] *= 2;
                    this.score += col[i];
                    col.splice(i - 1, 1);
                    col.unshift(0);
                }
            }
            while (col.length < 4) col.unshift(0);
            for (let i = 0; i < 4; i++) {
                this.grid[i][j] = col[i];
            }
        }
    }

    canMove() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return true;
            }
        }

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if ((j < 3 && current === this.grid[i][j + 1]) ||
                    (i < 3 && current === this.grid[i + 1][j])) {
                    return true;
                }
            }
        }

        return false;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': this.move('left'); break;
                case 'ArrowRight': this.move('right'); break;
                case 'ArrowUp': this.move('up'); break;
                case 'ArrowDown': this.move('down'); break;
            }
        });

        let mouseStartX, mouseStartY;
        let isDragging = false;
        
        this.gridElement.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            isDragging = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const mouseEndX = e.clientX;
            const mouseEndY = e.clientY;
            
            const dx = mouseEndX - mouseStartX;
            const dy = mouseEndY - mouseStartY;
            
            const minDragDistance = 70; // Changed from 50 to 70
            
            if (Math.abs(dx) > minDragDistance || Math.abs(dy) > minDragDistance) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.move(dx > 0 ? 'right' : 'left');
                } else {
                    this.move(dy > 0 ? 'down' : 'up');
                }
                isDragging = false;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        let touchStartX, touchStartY;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 10) {
                if (absDx > absDy) {
                    this.move(dx > 0 ? 'right' : 'left');
                } else {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            }
        });
    }
}

const game = new Game2048();