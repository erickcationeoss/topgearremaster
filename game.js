class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 13;
        this.cellSize = this.canvas.width / this.gridSize;
        
        // Game state
        this.gameRunning = false;
        this.level = 1;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        
        // Game elements
        this.player = null;
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        this.powerUps = [];
        this.particles = [];
        
        // Controls
        this.keys = {};
        this.moveDirection = { x: 0, y: 0 };
        
        // Audio
        this.sounds = {
            explosion: document.getElementById('explosionSound'),
            placeBomb: document.getElementById('placeBombSound')
        };
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupUI();
        this.resetGame();
        
        // Preload sounds
        this.sounds.explosion.volume = 0.3;
        this.sounds.placeBomb.volume = 0.5;
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                if (this.gameRunning) this.placeBomb();
                e.preventDefault();
            } else {
                this.keys[e.key.toLowerCase()] = true;
                this.updateMoveDirection();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.updateMoveDirection();
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.gameRunning) this.startGame();
        });
    }
    
    updateMoveDirection() {
        this.moveDirection.x = 0;
        this.moveDirection.y = 0;
        
        if (this.keys['arrowright'] || this.keys['d']) this.moveDirection.x = 1;
        if (this.keys['arrowleft'] || this.keys['a']) this.moveDirection.x = -1;
        if (this.keys['arrowdown'] || this.keys['s']) this.moveDirection.y = 1;
        if (this.keys['arrowup'] || this.keys['w']) this.moveDirection.y = -1;
        
        // Normalize diagonal movement
        if (this.moveDirection.x !== 0 && this.moveDirection.y !== 0) {
            this.moveDirection.x *= 0.7071; // 1/sqrt(2)
            this.moveDirection.y *= 0.7071;
        }
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
            direction: 0 // 0: right, 1: down, 2: left, 3: up
        };
        
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        this.powerUps = [];
        this.particles = [];
        
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
        
        cancelAnimationFrame(this.animationId);
    }
    
    levelComplete() {
        this.player.score += 500;
        this.level++;
        
        document.getElementById('levelComplete').classList.remove('hidden');
        document.getElementById('bonus-points').textContent = `+500 BONUS`;
        
        setTimeout(() => {
            document.getElementById('levelComplete').classList.add('hidden');
            this.resetGame();
            this.generateLevel();
            this.spawnEnemies(3 + this.level);
            this.updateUI();
        }, 2000);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('bombs').textContent = `${this.player.bombs}/${this.player.maxBombs}`;
        document.getElementById('lives').textContent = '♥'.repeat(this.player.lives);
    }
    
    generateLevel() {
        // Clear existing walls
        this.walls = [];
        this.breakableWalls = [];
        
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
        
        // Ensure at least one path to enemies
        this.ensurePathToEnemies();
    }
    
    ensurePathToEnemies() {
        // Simple algorithm to ensure there's always a path
        // Remove some breakable walls near the center
        const center = Math.floor(this.gridSize / 2);
        for (let y = center - 2; y <= center + 2; y++) {
            for (let x = center - 2; x <= center + 2; x++) {
                const idx = this.breakableWalls.findIndex(w => w.x === x && w.y === y);
                if (idx !== -1) {
                    this.breakableWalls.splice(idx, 1);
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
                moveTimer: 0,
                animationTimer: 0
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
            timer: 180, // 3 seconds at 60fps
            range: this.player.bombRange,
            animationTimer: 0
        });
        
        this.sounds.placeBomb.currentTime = 0;
        this.sounds.placeBomb.play().catch(e => console.log("Audio error:", e));
    }
    
    updatePlayer() {
        if (this.player.invincible > 0) {
            this.player.invincible -= this.deltaTime;
        }
        
        const speed = this.player.speed * this.deltaTime;
        let newX = this.player.x;
        let newY = this.player.y;
        
        // Movement based on current direction
        newX += this.moveDirection.x * speed;
        newY += this.moveDirection.y * speed;
        
        // Update direction for animation
        if (this.moveDirection.x > 0) this.player.direction = 0;
        if (this.moveDirection.y > 0) this.player.direction = 1;
        if (this.moveDirection.x < 0) this.player.direction = 2;
        if (this.moveDirection.y < 0) this.player.direction = 3;
        
        // Collision detection with walls
        const playerSize = this.cellSize * 0.35;
        const playerLeft = (newX + 0.5) * this.cellSize - playerSize;
        const playerRight = (newX + 0.5) * this.cellSize + playerSize;
        const playerTop = (newY + 0.5) * this.cellSize - playerSize;
        const playerBottom = (newY + 0.5) * this.cellSize + playerSize;
        
        // Check collision with each wall
        let canMoveX = true;
        let canMoveY = true;
        
        // Check all walls (including breakable ones for collision)
        const allWalls = [...this.walls, ...this.breakableWalls];
        
        for (const wall of allWalls) {
            const wallLeft = wall.x * this.cellSize;
            const wallRight = (wall.x + 1) * this.cellSize;
            const wallTop = wall.y * this.cellSize;
            const wallBottom = (wall.y + 1) * this.cellSize;
            
            // Check if player rectangle intersects with wall rectangle
            if (playerRight > wallLeft && playerLeft < wallRight &&
                playerBottom > wallTop && playerTop < wallBottom) {
                
                // Calculate overlap in each direction
                const overlapLeft = playerRight - wallLeft;
                const overlapRight = wallRight - playerLeft;
                const overlapTop = playerBottom - wallTop;
                const overlapBottom = wallBottom - playerTop;
                
                // Find the smallest overlap (this is the direction to push out)
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if (minOverlap === overlapLeft) {
                    newX = wall.x - 0.5 - (playerSize / this.cellSize);
                    canMoveX = false;
                } else if (minOverlap === overlapRight) {
                    newX = wall.x + 1.5 + (playerSize / this.cellSize) - 1;
                    canMoveX = false;
                } else if (minOverlap === overlapTop) {
                    newY = wall.y - 0.5 - (playerSize / this.cellSize);
                    canMoveY = false;
                } else if (minOverlap === overlapBottom) {
                    newY = wall.y + 1.5 + (playerSize / this.cellSize) - 1;
                    canMoveY = false;
                }
            }
        }
        
        // Check bombs (can't walk through bombs unless you're the one who placed them)
        for (const bomb of this.bombs) {
            if (bomb.x === Math.round(this.player.x) && bomb.y === Math.round(this.player.y)) {
                continue; // Allow to move away from bomb you're standing on
            }
            
            const bombLeft = bomb.x * this.cellSize;
            const bombRight = (bomb.x + 1) * this.cellSize;
            const bombTop = bomb.y * this.cellSize;
            const bombBottom = (bomb.y + 1) * this.cellSize;
            
            if (playerRight > bombLeft && playerLeft < bombRight &&
                playerBottom > bombTop && playerTop < bombBottom) {
                
                // Similar collision response as with walls
                const overlapLeft = playerRight - bombLeft;
                const overlapRight = bombRight - playerLeft;
                const overlapTop = playerBottom - bombTop;
                const overlapBottom = bombBottom - playerTop;
                
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if (minOverlap === overlapLeft) {
                    newX = bomb.x - 0.5 - (playerSize / this.cellSize);
                    canMoveX = false;
                } else if (minOverlap === overlapRight) {
                    newX = bomb.x + 1.5 + (playerSize / this.cellSize) - 1;
                    canMoveX = false;
                } else if (minOverlap === overlapTop) {
                    newY = bomb.y - 0.5 - (playerSize / this.cellSize);
                    canMoveY = false;
                } else if (minOverlap === overlapBottom) {
                    newY = bomb.y + 1.5 + (playerSize / this.cellSize) - 1;
                    canMoveY = false;
                }
            }
        }
        
        // Apply movement
        if (canMoveX) {
            this.player.x = Math.max(0.5, Math.min(this.gridSize - 1.5, newX));
        }
        if (canMoveY) {
            this.player.y = Math.max(0.5, Math.min(this.gridSize - 1.5, newY));
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
        
        // Create hit effect particles
        this.createParticles(this.player.x, this.player.y, 10, '#FF0000');
        
        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }
    
    updateBombs() {
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.timer -= this.deltaTime * 60;
            bomb.animationTimer += this.deltaTime;
            
            if (bomb.timer <= 0) {
                this.explodeBomb(bomb);
                this.bombs.splice(i, 1);
            }
        }
    }
    
    explodeBomb(bomb) {
        this.createExplosion(bomb.x, bomb.y);
        
        // Create explosion particles
        this.createParticles(bomb.x + 0.5, bomb.y + 0.5, 20, '#FF5722');
        
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
                    if (Math.random() < 0.2) this.spawnPowerUp(nx, ny);
                    this.createParticles(nx + 0.5, ny + 0.5, 15, '#8B4513');
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
        
        this.sounds.explosion.currentTime = 0;
        this.sounds.explosion.play().catch(e => console.log("Audio error:", e));
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
                this.createParticles(x + 0.5, y + 0.5, 15, '#F44336');
                this.updateUI();
            }
        }
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x * this.cellSize,
                y: y * this.cellSize,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: Math.random() * 3 + 2,
                color,
                life: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    spawnPowerUp(x, y) {
        const types = ['bomb', 'range', 'speed', 'life'];
        const weights = [0.4, 0.3, 0.2, 0.1]; // Higher chance for bomb, lower for life
        
        let random = Math.random();
        let selectedType = 'bomb';
        let cumulativeWeight = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                selectedType = types[i];
                break;
            }
        }
        
        this.powerUps.push({
            x,
            y,
            type: selectedType,
            animationTimer: 0
        });
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.animationTimer += this.deltaTime;
            
            if (Math.round(this.player.x) === p.x && Math.round(this.player.y) === p.y) {
                this.collectPowerUp(p);
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    collectPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'bomb': 
                this.player.maxBombs = Math.min(this.player.maxBombs + 1, 5); 
                break;
            case 'range': 
                this.player.bombRange = Math.min(this.player.bombRange + 1, 5); 
                break;
            case 'speed': 
                this.player.speed = Math.min(this.player.speed + 0.5, 5); 
                break;
            case 'life':
                this.player.lives = Math.min(this.player.lives + 1, 5);
                break;
        }
        this.player.score += 50;
        this.createParticles(powerUp.x + 0.5, powerUp.y + 0.5, 10, '#FFD700');
        this.updateUI();
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.animationTimer += this.deltaTime;
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
            
            // Enemy collision with walls
            const enemySize = this.cellSize * 0.35;
            const enemyLeft = (newX + 0.5) * this.cellSize - enemySize;
            const enemyRight = (newX + 0.5) * this.cellSize + enemySize;
            const enemyTop = (newY + 0.5) * this.cellSize - enemySize;
            const enemyBottom = (newY + 0.5) * this.cellSize + enemySize;
            
            let canMove = true;
            
            // Check all walls (including breakable ones for collision)
            const allWalls = [...this.walls, ...this.breakableWalls];
            
            for (const wall of allWalls) {
                const wallLeft = wall.x * this.cellSize;
                const wallRight = (wall.x + 1) * this.cellSize;
                const wallTop = wall.y * this.cellSize;
                const wallBottom = (wall.y + 1) * this.cellSize;
                
                if (enemyRight > wallLeft && enemyLeft < wallRight &&
                    enemyBottom > wallTop && enemyTop < wallBottom) {
                    canMove = false;
                    break;
                }
            }
            
            if (canMove) {
                enemy.x = Math.max(0.5, Math.min(this.gridSize - 1.5, newX));
                enemy.y = Math.max(0.5, Math.min(this.gridSize - 1.5, newY));
            } else {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 30;
            }
            
            // Check collision with player
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
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * this.deltaTime;
            p.y += p.vy * this.deltaTime;
            p.life -= this.deltaTime;
            p.vy += 50 * this.deltaTime; // Gravity
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
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
        this.drawPowerUps();
        this.drawBombs();
        this.drawExplosions();
        this.drawParticles();
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
            
            // Add some texture to walls
            this.ctx.fillStyle = '#444';
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x * this.cellSize, wall.y * this.cellSize);
            this.ctx.lineTo((wall.x + 1) * this.cellSize, (wall.y + 1) * this.cellSize);
            this.ctx.lineTo(wall.x * this.cellSize, (wall.y + 1) * this.cellSize);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#666';
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x * this.cellSize, wall.y * this.cellSize);
            this.ctx.lineTo((wall.x + 1) * this.cellSize, wall.y * this.cellSize);
            this.ctx.lineTo((wall.x + 1) * this.cellSize, (wall.y + 1) * this.cellSize);
            this.ctx.fill();
        });
    }
    
    drawBreakableWalls() {
        this.breakableWalls.forEach(wall => {
            // Wood texture
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(
                wall.x * this.cellSize + 1,
                wall.y * this.cellSize + 1,
                this.cellSize - 2,
                this.cellSize - 2
            );
            
            // Wood grain
            this.ctx.strokeStyle = '#A0522D';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const y = wall.y * this.cellSize + 2 + i * (this.cellSize - 4) / 3;
                this.ctx.beginPath();
                this.ctx.moveTo(wall.x * this.cellSize + 2, y);
                this.ctx.lineTo((wall.x + 1) * this.cellSize - 2, y);
                this.ctx.stroke();
            }
            
            // Nails
            this.ctx.fillStyle = '#777';
            const nailPositions = [
                [0.25, 0.25], [0.75, 0.25], 
                [0.25, 0.75], [0.75, 0.75]
            ];
            
            nailPositions.forEach(pos => {
                this.ctx.beginPath();
                this.ctx.arc(
                    wall.x * this.cellSize + pos[0] * this.cellSize,
                    wall.y * this.cellSize + pos[1] * this.cellSize,
                    2, 0, Math.PI * 2
                );
                this.ctx.fill();
            });
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach(p => {
            const centerX = (p.x + 0.5) * this.cellSize;
            const centerY = (p.y + 0.5) * this.cellSize + Math.sin(p.animationTimer * 5) * 5;
            const pulse = 0.8 + Math.sin(p.animationTimer * 10) * 0.2;
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(pulse, pulse);
            this.ctx.translate(-centerX, -centerY);
            
            // Different colors for different power-ups
            switch (p.type) {
                case 'bomb':
                    this.ctx.fillStyle = '#FF5722';
                    break;
                case 'range':
                    this.ctx.fillStyle = '#4CAF50';
                    break;
                case 'speed':
                    this.ctx.fillStyle = '#2196F3';
                    break;
                case 'life':
                    this.ctx.fillStyle = '#FF5252';
                    break;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // White border
            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Icon
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = `bold ${this.cellSize * 0.25}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            switch (p.type) {
                case 'bomb':
                    this.ctx.fillText('💣', centerX, centerY);
                    break;
                case 'range':
                    this.ctx.fillText('↔', centerX, centerY);
                    break;
                case 'speed':
                    this.ctx.fillText('⚡', centerX, centerY);
                    break;
                case 'life':
                    this.ctx.fillText('❤', centerX, centerY);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawBombs() {
        this.bombs.forEach(b => {
            const centerX = (b.x + 0.5) * this.cellSize;
            const centerY = (b.y + 0.5) * this.cellSize;
            const pulse = 1 + Math.sin(b.animationTimer * 10) * 0.05;
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(pulse, pulse);
            this.ctx.translate(-centerX, -centerY);
            
            // Bomb body
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bomb highlight
            this.ctx.fillStyle = '#444';
            this.ctx.beginPath();
            this.ctx.arc(
                centerX - this.cellSize * 0.15, 
                centerY - this.cellSize * 0.15, 
                this.cellSize * 0.1, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Fuse
            this.ctx.strokeStyle = '#795548';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + this.cellSize * 0.2, centerY - this.cellSize * 0.2);
            this.ctx.lineTo(centerX + this.cellSize * 0.4, centerY - this.cellSize * 0.4);
            this.ctx.stroke();
            
            // Fuse fire
            const fireSize = this.cellSize * 0.15 * (1 + Math.sin(b.animationTimer * 20) * 0.3);
            const gradient = this.ctx.createRadialGradient(
                centerX + this.cellSize * 0.4, 
                centerY - this.cellSize * 0.4, 
                0,
                centerX + this.cellSize * 0.4, 
                centerY - this.cellSize * 0.4, 
                fireSize
            );
            gradient.addColorStop(0, '#FFEB3B');
            gradient.addColorStop(0.5, '#FF9800');
            gradient.addColorStop(1, '#FF5722');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(
                centerX + this.cellSize * 0.4, 
                centerY - this.cellSize * 0.4, 
                fireSize, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Timer
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = `bold ${this.cellSize * 0.25}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(Math.ceil(b.timer / 60), centerX, centerY);
            
            this.ctx.restore();
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(e => {
            const centerX = (e.x + 0.5) * this.cellSize;
            const centerY = (e.y + 0.5) * this.cellSize;
            const size = Math.min(e.size, 1) * this.cellSize * 0.8;
            const alpha = e.timer / 30;
            
            // Core
            const coreGradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, size * 0.6
            );
            coreGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
            coreGradient.addColorStop(1, `rgba(255, 200, 0, ${alpha})`);
            
            this.ctx.fillStyle = coreGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Outer
            const outerGradient = this.ctx.createRadialGradient(
                centerX, centerY, size * 0.4,
                centerX, centerY, size
            );
            outerGradient.addColorStop(0, `rgba(255, 150, 0, ${alpha * 0.7})`);
            outerGradient.addColorStop(1, `rgba(255, 50, 0, ${alpha * 0.3})`);
            
            this.ctx.fillStyle = outerGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Spikes
            this.ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.8})`;
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const spikeLength = size * (1 + Math.sin(e.timer * 0.2) * 0.5;
                
                this.ctx.beginPath();
                this.ctx.moveTo(
                    centerX + Math.cos(angle) * size * 0.6,
                    centerY + Math.sin(angle) * size * 0.6
                );
                this.ctx.lineTo(
                    centerX + Math.cos(angle) * (size + spikeLength),
                    centerY + Math.sin(angle) * (size + spikeLength)
                );
                this.ctx.stroke();
            }
        });
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const centerX = (enemy.x + 0.5) * this.cellSize;
            const centerY = (enemy.y + 0.5) * this.cellSize;
            const floatOffset = Math.sin(enemy.animationTimer * 5) * 3;
            
            // Body
            const bodyGradient = this.ctx.createRadialGradient(
                centerX, centerY + floatOffset, 0,
                centerX, centerY + floatOffset, this.cellSize * 0.35
            );
            bodyGradient.addColorStop(0, '#FF5252');
            bodyGradient.addColorStop(1, '#D32F2F');
            
            this.ctx.fillStyle = bodyGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY + floatOffset, this.cellSize * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes
            this.ctx.fillStyle = '#000';
            const blink = Math.sin(enemy.animationTimer * 5) > 0.7 ? 0 : 1;
            
            if (blink) {
                this.ctx.beginPath();
                this.ctx.arc(
                    centerX - this.cellSize * 0.15, 
                    centerY - this.cellSize * 0.1 + floatOffset, 
                    this.cellSize * 0.08, 
                    0, 
                    Math.PI * 2
                );
                this.ctx.arc(
                    centerX + this.cellSize * 0.15, 
                    centerY - this.cellSize * 0.1 + floatOffset, 
                    this.cellSize * 0.08, 
                    0, 
                    Math.PI * 2
                );
                this.ctx.fill();
            } else {
                this.ctx.fillRect(
                    centerX - this.cellSize * 0.18,
                    centerY - this.cellSize * 0.12 + floatOffset,
                    this.cellSize * 0.36,
                    this.cellSize * 0.05
                );
            }
            
            // Mouth
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(
                centerX, 
                centerY + this.cellSize * 0.1 + floatOffset, 
                this.cellSize * 0.15, 
                0.1 * Math.PI, 
                0.9 * Math.PI
            );
            this.ctx.stroke();
            
            // Teeth
            this.ctx.fillStyle = '#FFF';
            for (let i = 0; i < 4; i++) {
                const toothX = centerX - this.cellSize * 0.12 + i * this.cellSize * 0.08;
                this.ctx.beginPath();
                this.ctx.moveTo(toothX, centerY + this.cellSize * 0.1 + floatOffset);
                this.ctx.lineTo(toothX + this.cellSize * 0.04, centerY + this.cellSize * 0.2 + floatOffset);
                this.ctx.lineTo(toothX + this.cellSize * 0.08, centerY + this.cellSize * 0.1 + floatOffset);
                this.ctx.fill();
            }
        });
    }
    
    drawPlayer() {
        const centerX = (this.player.x + 0.5) * this.cellSize;
        const centerY = (this.player.y + 0.5) * this.cellSize;
        const isMoving = this.moveDirection.x !== 0 || this.moveDirection.y !== 0;
        const bounce = isMoving ? Math.sin(performance.now() * 0.01) * 3 : 0;
        
        if (this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Body
        const bodyGradient = this.ctx.createRadialGradient(
            centerX, centerY + bounce, 0,
            centerX, centerY + bounce, this.cellSize * 0.35
        );
        bodyGradient.addColorStop(0, '#2196F3');
        bodyGradient.addColorStop(1, '#0D47A1');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + bounce, this.cellSize * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Face
        this.ctx.fillStyle = '#BBDEFB';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - this.cellSize * 0.1 + bounce, this.cellSize * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000';
        const blink = isMoving ? Math.sin(performance.now() * 0.01) > 0.7 ? 0 : 1 : 1;
        
        if (blink) {
            // Draw eyes based on direction
            const eyeOffsetX = this.cellSize * 0.08;
            const eyeOffsetY = this.cellSize * 0.12;
            
            // Left eye
            this.ctx.beginPath();
            if (this.player.direction === 2) { // Looking left
                this.ctx.ellipse(
                    centerX - eyeOffsetX * 0.7, 
                    centerY - eyeOffsetY + bounce, 
                    this.cellSize * 0.05 * 1.3, 
                    this.cellSize * 0.05, 
                    0, 0, Math.PI * 2
                );
            } else if (this.player.direction === 0) { // Looking right
                this.ctx.ellipse(
                    centerX - eyeOffsetX * 0.7, 
                    centerY - eyeOffsetY + bounce, 
                    this.cellSize * 0.05, 
                    this.cellSize * 0.05 * 1.3, 
                    0, 0, Math.PI * 2
                );
            } else {
                this.ctx.arc(
                    centerX - eyeOffsetX, 
                    centerY - eyeOffsetY + bounce, 
                    this.cellSize * 0.05, 
                    0, 
                    Math.PI * 2
                );
            }
            
            // Right eye
            if (this.player.direction === 2) { // Looking left
                this.ctx.ellipse(
                    centerX + eyeOffsetX * 0.7, 
                    centerY - eyeOffsetY + bounce, 
                    this.cellSize * 0.05 * 1.3, 
                    this.cellSize * 0.05, 
                    0, 0, Math.PI * 2
                );
            } else if (this.player.direction === 0) { // Looking right
                this.ctx.ellipse(
                    centerX + eyeOffsetX * 0.7, 
                    centerY - eyeOffsetY + bounce, 
                    this.cellSize * 0.05, 
                    this.cellSize * 0.05 * 1.3, 
                    0, 0, Math.PI * 2
                );
            } else {
                this.ctx.arc(
                    centerX + eyeOffsetX, 
                    centerY - eyeOffsetY + bounce, 
                    this.cellSize * 0.05, 
                    0, 
                    Math.PI * 2
                );
            }
            this.ctx.fill();
            
            // Pupils
            this.ctx.fillStyle = '#FFF';
            const pupilOffset = this.cellSize * 0.02;
            let pupilX1 = centerX - eyeOffsetX;
            let pupilY1 = centerY - eyeOffsetY + bounce;
            let pupilX2 = centerX + eyeOffsetX;
            let pupilY2 = centerY - eyeOffsetY + bounce;
            
            if (this.player.direction === 2) { // Left
                pupilX1 -= pupilOffset;
                pupilX2 -= pupilOffset;
            } else if (this.player.direction === 0) { // Right
                pupilX1 += pupilOffset;
                pupilX2 += pupilOffset;
            } else if (this.player.direction === 3) { // Up
                pupilY1 -= pupilOffset;
                pupilY2 -= pupilOffset;
            } else if (this.player.direction === 1) { // Down
                pupilY1 += pupilOffset;
                pupilY2 += pupilOffset;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(pupilX1, pupilY1, this.cellSize * 0.02, 0, Math.PI * 2);
            this.ctx.arc(pupilX2, pupilY2, this.cellSize * 0.02, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(
                centerX - this.cellSize * 0.1,
                centerY - this.cellSize * 0.1 + bounce,
                this.cellSize * 0.2,
                this.cellSize * 0.03
            );
        }
        
        // Mouth - changes based on direction
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        if (this.player.direction === 0) { // Right
            this.ctx.arc(
                centerX + this.cellSize * 0.05, 
                centerY + bounce, 
                this.cellSize * 0.1, 
                1.2 * Math.PI, 
                1.8 * Math.PI
            );
        } else if (this.player.direction === 2) { // Left
            this.ctx.arc(
                centerX - this.cellSize * 0.05, 
                centerY + bounce, 
                this.cellSize * 0.1, 
                0.2 * Math.PI, 
                0.8 * Math.PI
            );
        } else if (this.player.direction === 3) { // Up
            this.ctx.arc(
                centerX, 
                centerY - this.cellSize * 0.05 + bounce, 
                this.cellSize * 0.1, 
                0.7 * Math.PI, 
                1.3 * Math.PI
            );
        } else { // Down or default
            this.ctx.arc(
                centerX, 
                centerY + this.cellSize * 0.05 + bounce, 
                this.cellSize * 0.1, 
                1.7 * Math.PI, 
                0.3 * Math.PI
            );
        }
        
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
            this.updatePowerUps();
            this.updateParticles();
            this.checkWinCondition();
            this.draw();
        }
        
        this.animationId = requestAnimationFrame(t => this.gameLoop(t));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
});