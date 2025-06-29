class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 13;
        this.cellSize = this.canvas.width / this.gridSize;
        
        this.gameRunning = false;
        this.level = 1;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.player = null;
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        
        this.keys = {};
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupUI();
        this.resetGame();
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                if (this.gameRunning) this.placeBomb();
                e.preventDefault();
            } else {
                this.keys[e.key.toLowerCase()] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.gameRunning) this.startGame();
        });
    }
    
    setupUI() {
        this.updateUI();
    }
    
    resetGame() {
        this.player = {
            x: 1,
            y: 1,
            bombs: 1,
            maxBombs: 3,
            bombRange: 2,
            speed: 3,
            lives: 3,
            score: 0,
            invincible: 0,
            direction: 0
        };
        
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        
        this.generateLevel();
        this.spawnEnemies(3);
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.resetGame();
        this.gameRunning = true;
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
    }
    
    levelComplete() {
        this.player.score += 500;
        this.level++;
        
        document.getElementById('levelComplete').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('levelComplete').classList.add('hidden');
            this.resetGame();
            this.updateUI();
        }, 2000);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('bombs').textContent = `${this.player.bombs}/${this.player.maxBombs}`;
        document.getElementById('lives').textContent = '♥'.repeat(this.player.lives);
    }
    
    generateLevel() {
        // Border walls
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (x === 0 || y === 0 || x === this.gridSize - 1 || y === this.gridSize - 1) {
                    this.walls.push({x, y});
                }
            }
        }
        
        // Fixed pattern walls
        for (let y = 2; y < this.gridSize - 2; y += 2) {
            for (let x = 2; x < this.gridSize - 2; x += 2) {
                this.walls.push({x, y});
            }
        }
        
        // Breakable walls
        for (let y = 1; y < this.gridSize - 1; y++) {
            for (let x = 1; x < this.gridSize - 1; x++) {
                if (!this.isWall(x, y) && !this.isPlayerStartArea(x, y) && Math.random() < 0.5) {
                    this.breakableWalls.push({x, y});
                }
            }
        }
    }
    
    isPlayerStartArea(x, y) {
        return (x === 1 && y === 1) || (x === 2 && y === 1) || (x === 1 && y === 2);
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
    
    isOccupied(x, y) {
        return this.isWall(x, y) || this.isBreakableWall(x, y) || 
               this.isBomb(x, y) || 
               (Math.round(this.player.x) === x && Math.round(this.player.y) === y) || 
               this.enemies.some(e => Math.round(e.x) === x && Math.round(e.y) === y);
    }
    
    isWall(x, y) {
        return this.walls.some(w => w.x === x && w.y === y);
    }
    
    isBreakableWall(x, y) {
        return this.breakableWalls.some(w => w.x === x && w.y === y);
    }
    
    isBomb(x, y) {
        return this.bombs.some(b => b.x === x && b.y === y);
    }
    
    placeBomb() {
        if (this.bombs.length >= this.player.maxBombs) return;
        
        const x = Math.round(this.player.x);
        const y = Math.round(this.player.y);
        
        if (this.isBomb(x, y)) return;
        
        this.bombs.push({
            x,
            y,
            timer: 180,
            range: this.player.bombRange
        });
    }
    
    updatePlayer() {
        if (this.player.invincible > 0) {
            this.player.invincible -= this.deltaTime;
        }
        
        const speed = this.player.speed * this.deltaTime;
        let newX = this.player.x;
        let newY = this.player.y;
        
        // Movement input
        if (this.keys['arrowright'] || this.keys['d']) {
            newX += speed;
            this.player.direction = 0;
        }
        if (this.keys['arrowleft'] || this.keys['a']) {
            newX -= speed;
            this.player.direction = 2;
        }
        if (this.keys['arrowdown'] || this.keys['s']) {
            newY += speed;
            this.player.direction = 1;
        }
        if (this.keys['arrowup'] || this.keys['w']) {
            newY -= speed;
            this.player.direction = 3;
        }
        
        // Collision checks
        const playerGridX = Math.round(this.player.x);
        const playerGridY = Math.round(this.player.y);
        const newGridX = Math.round(newX);
        const newGridY = Math.round(newY);
        
        // Check if we're moving to a new cell
        const isMovingToNewCell = (playerGridX !== newGridX) || (playerGridY !== newGridY);
        
        // Special case: allow moving away from bomb you just placed
        const standingOnBomb = this.isBomb(playerGridX, playerGridY);
        
        if (standingOnBomb && isMovingToNewCell) {
            // Allow movement away from bomb
            this.player.x = newX;
            this.player.y = newY;
        } else {
            // Normal collision checks
            const canMoveX = !isMovingToNewCell || 
                           (!this.isWall(newGridX, playerGridY) && 
                            !this.isBomb(newGridX, playerGridY));
            
            const canMoveY = !isMovingToNewCell || 
                           (!this.isWall(playerGridX, newGridY) && 
                            !this.isBomb(playerGridX, newGridY));
            
            if (canMoveX) this.player.x = Math.max(0.5, Math.min(this.gridSize - 1.5, newX));
            if (canMoveY) this.player.y = Math.max(0.5, Math.min(this.gridSize - 1.5, newY));
        }
        
        // Check explosions
        if (this.player.invincible <= 0) {
            const px = Math.round(this.player.x);
            const py = Math.round(this.player.y);
            if (this.explosions.some(e => e.x === px && e.y === py)) {
                this.playerHit();
            }
        }
    }
    
    playerHit() {
        this.player.lives--;
        this.player.invincible = 2;
        this.updateUI();
        
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }
    
    updateBombs() {
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.timer -= this.deltaTime * 60;
            
            if (bomb.timer <= 0) {
                this.explodeBomb(bomb);
                this.bombs.splice(i, 1);
            }
        }
    }
    
    explodeBomb(bomb) {
        this.createExplosion(bomb.x, bomb.y);
        
        // Explode in 4 directions
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
            {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        
        directions.forEach(dir => {
            for (let r = 1; r <= bomb.range; r++) {
                const nx = bomb.x + dir.dx * r;
                const ny = bomb.y + dir.dy * r;
                
                if (this.isWall(nx, ny)) break;
                
                this.createExplosion(nx, ny);
                
                // Check breakable walls
                const wallIdx = this.breakableWalls.findIndex(w => w.x === nx && w.y === ny);
                if (wallIdx !== -1) {
                    this.breakableWalls.splice(wallIdx, 1);
                    this.player.score += 10;
                    break;
                }
                
                // Chain reaction
                const bombIdx = this.bombs.findIndex(b => b.x === nx && b.y === ny);
                if (bombIdx !== -1) {
                    this.explodeBomb(this.bombs[bombIdx]);
                    this.bombs.splice(bombIdx, 1);
                }
            }
        });
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x,
            y,
            timer: 30,
            size: 0
        });
        
        // Check player
        if (Math.round(this.player.x) === x && Math.round(this.player.y) === y && this.player.invincible <= 0) {
            this.playerHit();
        }
        
        // Check enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (Math.round(this.enemies[i].x) === x && Math.round(this.enemies[i].y) === y) {
                this.enemies.splice(i, 1);
                this.player.score += 100;
                this.updateUI();
            }
        }
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.moveTimer -= this.deltaTime * 60;
            
            if (enemy.moveTimer <= 0) {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 60 + Math.random() * 60;
            }
            
            const speed = enemy.speed * this.deltaTime;
            let newX = enemy.x;
            let newY = enemy.y;
            
            switch (enemy.direction) {
                case 0: newX += speed; break;
                case 1: newY += speed; break;
                case 2: newX -= speed; break;
                case 3: newY -= speed; break;
            }
            
            const gridX = Math.round(newX);
            const gridY = Math.round(newY);
            
            if (!this.isWall(gridX, gridY) && !this.isBreakableWall(gridX, gridY) && !this.isBomb(gridX, gridY)) {
                enemy.x = newX;
                enemy.y = newY;
            } else {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 30;
            }
            
            enemy.x = Math.max(0.5, Math.min(this.gridSize - 1.5, enemy.x));
            enemy.y = Math.max(0.5, Math.min(this.gridSize - 1.5, enemy.y));
            
            if (Math.round(enemy.x) === Math.round(this.player.x) && 
                Math.round(enemy.y) === Math.round(this.player.y) &&
                this.player.invincible <= 0) {
                this.playerHit();
            }
        });
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            e.timer -= this.deltaTime * 60;
            e.size += this.deltaTime * 2;
            
            if (e.timer <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    checkWinCondition() {
        if (this.enemies.length === 0) {
            this.levelComplete();
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawBreakableWalls();
        this.drawBombs();
        this.drawExplosions();
        this.drawEnemies();
        this.drawPlayer();
    }
    
    drawBackground() {
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Walls
        this.ctx.fillStyle = '#555';
        this.walls.forEach(wall => {
            this.ctx.fillRect(
                wall.x * this.cellSize, 
                wall.y * this.cellSize, 
                this.cellSize, 
                this.cellSize
            );
        });
    }
    
    drawBreakableWalls() {
        this.ctx.fillStyle = '#8B4513';
        this.breakableWalls.forEach(wall => {
            this.ctx.fillRect(
                wall.x * this.cellSize + 1,
                wall.y * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
        });
    }
    
    drawBombs() {
        this.bombs.forEach(bomb => {
            const centerX = (bomb.x + 0.5) * this.cellSize;
            const centerY = (bomb.y + 0.5) * this.cellSize;
            
            // Bomb body
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fuse
            this.ctx.fillStyle = '#FF5722';
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 3, centerY - this.cellSize * 0.3);
            this.ctx.lineTo(centerX + 3, centerY - this.cellSize * 0.3);
            this.ctx.lineTo(centerX, centerY - this.cellSize * 0.5);
            this.ctx.fill();
            
            // Timer
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = `bold ${this.cellSize * 0.25}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(Math.ceil(bomb.timer / 60), centerX, centerY);
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(e => {
            const centerX = (e.x + 0.5) * this.cellSize;
            const centerY = (e.y + 0.5) * this.cellSize;
            const size = Math.min(e.size, 1) * this.cellSize * 0.8;
            const alpha = e.timer / 30;
            
            // Core
            this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Outer
            this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const centerX = (enemy.x + 0.5) * this.cellSize;
            const centerY = (enemy.y + 0.5) * this.cellSize;
            
            // Body
            this.ctx.fillStyle = '#F44336';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(
                centerX - this.cellSize * 0.15, 
                centerY - this.cellSize * 0.1, 
                this.cellSize * 0.08, 
                0, 
                Math.PI * 2
            );
            this.ctx.arc(
                centerX + this.cellSize * 0.15, 
                centerY - this.cellSize * 0.1, 
                this.cellSize * 0.08, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Mouth
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(
                centerX, 
                centerY + this.cellSize * 0.1, 
                this.cellSize * 0.15, 
                0.1 * Math.PI, 
                0.9 * Math.PI
            );
            this.ctx.stroke();
        });
    }
    
    drawPlayer() {
        const centerX = (this.player.x + 0.5) * this.cellSize;
        const centerY = (this.player.y + 0.5) * this.cellSize;
        
        if (this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Body
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.cellSize * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Face
        this.ctx.fillStyle = '#BBDEFB';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - this.cellSize * 0.1, this.cellSize * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000';
        const isMoving = this.keys['arrowright'] || this.keys['arrowleft'] || 
                        this.keys['arrowup'] || this.keys['arrowdown'] ||
                        this.keys['a'] || this.keys['d'] || 
                        this.keys['w'] || this.keys['s'];
        const blink = isMoving ? Math.sin(performance.now() * 0.01) > 0.7 ? 0 : 1 : 1;
        
        if (blink) {
            this.ctx.beginPath();
            this.ctx.arc(
                centerX - this.cellSize * 0.08, 
                centerY - this.cellSize * 0.12, 
                this.cellSize * 0.05, 
                0, 
                Math.PI * 2
            );
            this.ctx.arc(
                centerX + this.cellSize * 0.08, 
                centerY - this.cellSize * 0.12, 
                this.cellSize * 0.05, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
        } else {
            this.ctx.fillRect(
                centerX - this.cellSize * 0.1,
                centerY - this.cellSize * 0.1,
                this.cellSize * 0.2,
                this.cellSize * 0.03
            );
        }
        
        // Mouth
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            centerX, 
            centerY, 
            this.cellSize * 0.1, 
            0.2 * Math.PI, 
            0.8 * Math.PI
        );
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    gameLoop(time) {
        this.deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        if (this.gameRunning) {
            this.updatePlayer();
            this.updateEnemies();
            this.updateBombs();
            this.updateExplosions();
            this.checkWinCondition();
            this.draw();
        }
        
        requestAnimationFrame(t => this.gameLoop(t));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
});