class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 13;
        this.cellSize = this.canvas.width / this.gridSize;
        this.player = {
            x: 1,
            y: 1,
            bombs: 1,
            maxBombs: 3,
            bombRange: 2,
            speed: 1,
            lives: 3,
            score: 0
        };
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        this.gameRunning = false;
        this.keys = {};
        this.lastTime = 0;
        this.animationId = null;
        
        this.initControls();
        this.initStartButton();
    }
    
    initControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Space to place bomb
            if (e.key === ' ' && this.gameRunning) {
                this.placeBomb();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    initStartButton() {
        const startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', () => {
            this.startGame();
            startBtn.classList.add('hidden');
        });
    }
    
    startGame() {
        this.player = {
            x: 1,
            y: 1,
            bombs: 1,
            maxBombs: 3,
            bombRange: 2,
            speed: 1,
            lives: 3,
            score: 0
        };
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        this.gameRunning = true;
        
        this.generateLevel();
        this.spawnEnemies(3);
        
        document.getElementById('gameOver').classList.add('hidden');
        this.updateUI();
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    generateLevel() {
        // Generate unbreakable walls
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (x === 0 || y === 0 || x === this.gridSize - 1 || y === this.gridSize - 1 || 
                    (x % 2 === 0 && y % 2 === 0)) {
                    this.walls.push({x, y});
                }
            }
        }
        
        // Generate breakable walls
        for (let y = 1; y < this.gridSize - 1; y++) {
            for (let x = 1; x < this.gridSize - 1; x++) {
                if (!this.isWall(x, y) && !(x === 1 && y === 1) && !(x === 2 && y === 1) && !(x === 1 && y === 2) && 
                    Math.random() < 0.4 && !this.isWall(x, y)) {
                    this.breakableWalls.push({x, y});
                }
            }
        }
    }
    
    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
                y = Math.floor(Math.random() * (this.gridSize - 4)) + 2;
            } while (this.isOccupied(x, y));
            
            this.enemies.push({
                x,
                y,
                speed: 0.5 + Math.random() * 0.5,
                direction: Math.floor(Math.random() * 4),
                moveTimer: 0
            });
        }
    }
    
    isWall(x, y) {
        return this.walls.some(wall => wall.x === x && wall.y === y);
    }
    
    isBreakableWall(x, y) {
        return this.breakableWalls.some(wall => wall.x === x && wall.y === y);
    }
    
    isBomb(x, y) {
        return this.bombs.some(bomb => bomb.x === x && bomb.y === y);
    }
    
    isOccupied(x, y) {
        return this.isWall(x, y) || this.isBreakableWall(x, y) || this.isBomb(x, y) || 
               (this.player.x === x && this.player.y === y) || 
               this.enemies.some(enemy => enemy.x === x && enemy.y === y);
    }
    
    placeBomb() {
        if (this.bombs.length >= this.player.maxBombs) return;
        
        const x = Math.round(this.player.x);
        const y = Math.round(this.player.y);
        
        if (this.isBomb(x, y)) return;
        
        this.bombs.push({
            x,
            y,
            timer: 180, // 3 seconds at 60fps
            range: this.player.bombRange
        });
    }
    
    updateBombs(deltaTime) {
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            this.bombs[i].timer -= deltaTime * 60;
            
            if (this.bombs[i].timer <= 0) {
                this.explodeBomb(this.bombs[i]);
                this.bombs.splice(i, 1);
            }
        }
    }
    
    explodeBomb(bomb) {
        const {x, y, range} = bomb;
        this.explosions.push({x, y, timer: 30});
        
        // Explode in all 4 directions
        for (let dir = 0; dir < 4; dir++) {
            for (let r = 1; r <= range; r++) {
                let nx = x, ny = y;
                
                switch (dir) {
                    case 0: nx = x + r; break; // right
                    case 1: nx = x - r; break; // left
                    case 2: ny = y + r; break; // down
                    case 3: ny = y - r; break; // up
                }
                
                // Stop explosion if hit unbreakable wall
                if (this.isWall(nx, ny)) break;
                
                this.explosions.push({x: nx, y: ny, timer: 30});
                
                // Check if hit breakable wall
                const wallIndex = this.breakableWalls.findIndex(w => w.x === nx && w.y === ny);
                if (wallIndex !== -1) {
                    this.breakableWalls.splice(wallIndex, 1);
                    this.player.score += 10;
                    break; // Stop explosion after breaking wall
                }
                
                // Check if hit player
                if (Math.round(this.player.x) === nx && Math.round(this.player.y) === ny) {
                    this.playerHit();
                }
                
                // Check if hit enemy
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    if (Math.round(this.enemies[i].x) === nx && Math.round(this.enemies[i].y) === ny) {
                        this.enemies.splice(i, 1);
                        this.player.score += 100;
                    }
                }
            }
        }
    }
    
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].timer -= deltaTime * 60;
            if (this.explosions[i].timer <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    playerHit() {
        this.player.lives--;
        this.updateUI();
        
        if (this.player.lives <= 0) {
            this.gameOver();
        } else {
            // Reset player position
            this.player.x = 1;
            this.player.y = 1;
        }
    }
    
    updatePlayer(deltaTime) {
        const speed = this.player.speed * deltaTime;
        let newX = this.player.x;
        let newY = this.player.y;
        
        if (this.keys['ArrowUp'] || this.keys['w']) {
            newY -= speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            newY += speed;
        }
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            newX -= speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            newX += speed;
        }
        
        // Check collision with walls
        if (!this.isWall(Math.floor(newX), Math.floor(this.player.y)) && 
            !this.isWall(Math.ceil(newX), Math.floor(this.player.y)) &&
            !this.isBomb(Math.round(newX), Math.round(this.player.y))) {
            this.player.x = newX;
        }
        
        if (!this.isWall(Math.floor(this.player.x), Math.floor(newY)) && 
            !this.isWall(Math.floor(this.player.x), Math.ceil(newY)) &&
            !this.isBomb(Math.round(this.player.x), Math.round(newY))) {
            this.player.y = newY;
        }
        
        // Check if player is in explosion
        const playerX = Math.round(this.player.x);
        const playerY = Math.round(this.player.y);
        if (this.explosions.some(exp => exp.x === playerX && exp.y === playerY)) {
            this.playerHit();
        }
    }
    
    updateEnemies(deltaTime) {
        for (let enemy of this.enemies) {
            enemy.moveTimer -= deltaTime * 60;
            
            if (enemy.moveTimer <= 0) {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 60 + Math.random() * 60;
            }
            
            const speed = enemy.speed * deltaTime;
            let newX = enemy.x;
            let newY = enemy.y;
            
            switch (enemy.direction) {
                case 0: newX += speed; break; // right
                case 1: newX -= speed; break; // left
                case 2: newY += speed; break; // down
                case 3: newY -= speed; break; // up
            }
            
            // Simple collision detection
            const gridX = Math.round(newX);
            const gridY = Math.round(newY);
            
            if (!this.isWall(gridX, gridY) && !this.isBreakableWall(gridX, gridY) && !this.isBomb(gridX, gridY)) {
                enemy.x = newX;
                enemy.y = newY;
            } else {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 30;
            }
            
            // Check if enemy hit player
            if (Math.round(enemy.x) === Math.round(this.player.x) && 
                Math.round(enemy.y) === Math.round(this.player.y)) {
                this.playerHit();
            }
            
            // Check if enemy is in explosion
            if (this.explosions.some(exp => exp.x === Math.round(enemy.x) && exp.y === Math.round(enemy.y))) {
                const index = this.enemies.indexOf(enemy);
                if (index !== -1) {
                    this.enemies.splice(index, 1);
                    this.player.score += 100;
                    this.updateUI();
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.player.score;
        document.getElementById('bombs').textContent = `${this.player.bombs}/${this.player.maxBombs}`;
        document.getElementById('lives').textContent = this.player.lives;
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        cancelAnimationFrame(this.animationId);
    }
    
    checkWinCondition() {
        if (this.enemies.length === 0) {
            this.player.score += 500;
            this.updateUI();
            setTimeout(() => {
                this.spawnEnemies(3 + Math.floor(this.player.score / 1000));
                this.player.bombs = Math.min(this.player.bombs + 1, this.player.maxBombs);
                this.player.bombRange = Math.min(this.player.bombRange + 1, 5);
            }, 1000);
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw unbreakable walls
        this.ctx.fillStyle = '#555';
        for (const wall of this.walls) {
            this.ctx.fillRect(
                wall.x * this.cellSize, 
                wall.y * this.cellSize, 
                this.cellSize, 
                this.cellSize
            );
        }
        
        // Draw breakable walls
        this.ctx.fillStyle = '#8B4513';
        for (const wall of this.breakableWalls) {
            this.ctx.fillRect(
                wall.x * this.cellSize, 
                wall.y * this.cellSize, 
                this.cellSize, 
                this.cellSize
            );
        }
        
        // Draw bombs
        this.ctx.fillStyle = '#000';
        for (const bomb of this.bombs) {
            this.ctx.beginPath();
            this.ctx.arc(
                (bomb.x + 0.5) * this.cellSize,
                (bomb.y + 0.5) * this.cellSize,
                this.cellSize * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Bomb timer
            this.ctx.fillStyle = '#F00';
            this.ctx.font = `${this.cellSize * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                Math.ceil(bomb.timer / 60),
                (bomb.x + 0.5) * this.cellSize,
                (bomb.y + 0.5) * this.cellSize
            );
            this.ctx.fillStyle = '#000';
        }
        
        // Draw explosions
        for (const exp of this.explosions) {
            const alpha = exp.timer / 30;
            this.ctx.fillStyle = `rgba(255, ${Math.floor(100 + 155 * alpha)}, 0, ${alpha})`;
            this.ctx.fillRect(
                exp.x * this.cellSize, 
                exp.y * this.cellSize, 
                this.cellSize, 
                this.cellSize
            );
        }
        
        // Draw enemies
        this.ctx.fillStyle = '#F00';
        for (const enemy of this.enemies) {
            this.ctx.beginPath();
            this.ctx.arc(
                (enemy.x + 0.5) * this.cellSize,
                (enemy.y + 0.5) * this.cellSize,
                this.cellSize * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Draw player
        this.ctx.fillStyle = '#00F';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.player.x + 0.5) * this.cellSize,
            (this.player.y + 0.5) * this.cellSize,
            this.cellSize * 0.4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    gameLoop(time) {
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        if (this.gameRunning) {
            this.updatePlayer(deltaTime);
            this.updateEnemies(deltaTime);
            this.updateBombs(deltaTime);
            this.updateExplosions(deltaTime);
            this.checkWinCondition();
            this.draw();
        }
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
});