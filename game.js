class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 13;
        this.cellSize = this.canvas.width / this.gridSize;
        
        // Otimização: Pré-calcular posições
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // Game state
        this.gameRunning = false;
        this.level = 1;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        
        // Game elements
        this.resetGame();
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Audio
        this.sounds = {
            explosion: document.getElementById('explosionSound'),
            placeBomb: document.getElementById('placeBombSound')
        };
        
        // Otimização: Pré-carregar assets
        this.preloadAssets();
    }
    
    preloadAssets() {
        // Configuração de áudio para melhor performance
        this.sounds.explosion.volume = 0.3;
        this.sounds.placeBomb.volume = 0.5;
        this.sounds.explosion.load();
        this.sounds.placeBomb.load();
    }
    
    setupControls() {
        // Controles mais responsivos
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ') {
                if (this.gameRunning) this.placeBomb();
                e.preventDefault();
            } else if (['arrowright', 'arrowleft', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
                this.keys[key] = true;
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['arrowright', 'arrowleft', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
                this.keys[key] = false;
                e.preventDefault();
            }
        });
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
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
            direction: 0,
            moving: false
        };
        
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        this.powerUps = [];
        
        this.generateLevel();
        this.spawnEnemies(3 + Math.floor(this.level * 0.5));
        
        this.updateUI();
    }
    
    generateLevel() {
        // Limpar paredes existentes
        this.walls = [];
        this.breakableWalls = [];
        
        // Paredes externas
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (x === 0 || y === 0 || x === this.gridSize - 1 || y === this.gridSize - 1) {
                    this.walls.push({x, y});
                }
            }
        }
        
        // Padrão de paredes fixas
        for (let y = 2; y < this.gridSize - 2; y += 2) {
            for (let x = 2; x < this.gridSize - 2; x += 2) {
                this.walls.push({x, y});
            }
        }
        
        // Paredes destrutíveis com caminho garantido
        const safePaths = [
            {x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 2}, // Área inicial do jogador
            {x: this.gridSize - 2, y: this.gridSize - 2}, // Área dos inimigos
            {x: Math.floor(this.gridSize/2), y: Math.floor(this.gridSize/2)} // Centro
        ];
        
        for (let y = 1; y < this.gridSize - 1; y++) {
            for (let x = 1; x < this.gridSize - 1; x++) {
                // Não colocar paredes em áreas seguras ou onde já existem paredes
                if (!this.isWall(x, y) && 
                    !safePaths.some(p => p.x === x && p.y === y) &&
                    !this.isPlayerStartArea(x, y) && 
                    Math.random() < 0.45) {
                    this.breakableWalls.push({x, y});
                }
            }
        }
    }
    
    isPlayerStartArea(x, y) {
        return (x === 1 && y === 1) || (x === 2 && y === 1) || (x === 1 && y === 2);
    }
    
    spawnEnemies(count) {
        const enemyPositions = [
            {x: this.gridSize - 2, y: this.gridSize - 2},
            {x: this.gridSize - 2, y: 1},
            {x: 1, y: this.gridSize - 2},
            {x: Math.floor(this.gridSize/2), y: Math.floor(this.gridSize/2)}
        ];
        
        for (let i = 0; i < count; i++) {
            const pos = enemyPositions[i % enemyPositions.length];
            let x = pos.x;
            let y = pos.y;
            
            // Se a posição estiver ocupada, encontrar uma próxima disponível
            if (this.isOccupied(x, y)) {
                let found = false;
                for (let r = 1; r < this.gridSize/2 && !found; r++) {
                    for (let dir = 0; dir < 4 && !found; dir++) {
                        const nx = x + [1, -1, 0, 0][dir] * r;
                        const ny = y + [0, 0, 1, -1][dir] * r;
                        if (nx > 0 && nx < this.gridSize - 1 && ny > 0 && ny < this.gridSize - 1 && !this.isOccupied(nx, ny)) {
                            x = nx;
                            y = ny;
                            found = true;
                        }
                    }
                }
            }
            
            if (!this.isOccupied(x, y)) {
                this.enemies.push({
                    x,
                    y,
                    speed: 0.5 + Math.random() * 0.5,
                    direction: Math.floor(Math.random() * 4),
                    moveTimer: Math.random() * 60,
                    animationTimer: 0
                });
            }
        }
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
        }, 2000);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('bombs').textContent = `${this.player.bombs}/${this.player.maxBombs}`;
        document.getElementById('lives').textContent = '♥'.repeat(this.player.lives);
    }
    
    isOccupied(x, y) {
        return this.isWall(x, y) || this.isBreakableWall(x, y) || 
               this.isBomb(x, y) || 
               (Math.round(this.player.x) === x && Math.round(this.player.y) === y) || 
               this.enemies.some(e => Math.round(e.x) === x && Math.round(e.y) === y);
    }
    
    isWall(x, y) {
        return this.walls.some(w => w.x === Math.floor(x) && w.y === Math.floor(y));
    }
    
    isBreakableWall(x, y) {
        return this.breakableWalls.some(w => w.x === Math.floor(x) && w.y === Math.floor(y));
    }
    
    isBomb(x, y) {
        return this.bombs.some(b => b.x === Math.floor(x) && b.y === Math.floor(y));
    }
    
    placeBomb() {
        if (this.bombs.length >= this.player.maxBombs) return;
        
        const x = Math.floor(this.player.x);
        const y = Math.floor(this.player.y);
        
        if (this.isBomb(x, y)) return;
        
        this.bombs.push({
            x,
            y,
            timer: 180,
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
        
        // Movimento mais fluido com aceleração
        if (this.keys['arrowright'] || this.keys['d']) {
            newX += speed;
            this.player.direction = 0;
            this.player.moving = true;
        } 
        else if (this.keys['arrowleft'] || this.keys['a']) {
            newX -= speed;
            this.player.direction = 2;
            this.player.moving = true;
        } 
        else if (this.keys['arrowdown'] || this.keys['s']) {
            newY += speed;
            this.player.direction = 1;
            this.player.moving = true;
        } 
        else if (this.keys['arrowup'] || this.keys['w']) {
            newY -= speed;
            this.player.direction = 3;
            this.player.moving = true;
        } else {
            this.player.moving = false;
        }
        
        // Verificação de colisão otimizada
        const canMoveHorizontally = !this.isWall(newX, this.player.y) && !this.isBreakableWall(newX, this.player.y);
        const canMoveVertically = !this.isWall(this.player.x, newY) && !this.isBreakableWall(this.player.x, newY);
        
        // Movimento mais suave ao passar entre células
        if (canMoveHorizontally) {
            this.player.x = Math.max(0.5, Math.min(this.gridSize - 1.5, newX));
        }
        
        if (canMoveVertically) {
            this.player.y = Math.max(0.5, Math.min(this.gridSize - 1.5, newY));
        }
        
        // Verificar se está em uma explosão
        if (this.player.invincible <= 0 && 
            this.explosions.some(e => 
                Math.floor(e.x) === Math.floor(this.player.x) && 
                Math.floor(e.y) === Math.floor(this.player.y))) {
            this.playerHit();
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
            bomb.animationTimer += this.deltaTime;
            
            if (bomb.timer <= 0) {
                this.explodeBomb(bomb);
                this.bombs.splice(i, 1);
            }
        }
    }
    
    explodeBomb(bomb) {
        this.createExplosion(bomb.x, bomb.y);
        
        // Explodir em 4 direções
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
                
                // Verificar paredes destrutíveis
                const wallIdx = this.breakableWalls.findIndex(w => w.x === nx && w.y === ny);
                if (wallIdx !== -1) {
                    this.breakableWalls.splice(wallIdx, 1);
                    this.player.score += 10;
                    
                    // 20% de chance de dropar power-up
                    if (Math.random() < 0.2) {
                        this.spawnPowerUp(nx, ny);
                    }
                    break;
                }
                
                // Reação em cadeia com outras bombas
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
        
        // Verificar se atingiu o jogador
        if (Math.floor(this.player.x) === x && Math.floor(this.player.y) === y && this.player.invincible <= 0) {
            this.playerHit();
        }
        
        // Verificar se atingiu inimigos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (Math.floor(this.enemies[i].x) === x && Math.floor(this.enemies[i].y) === y) {
                this.enemies.splice(i, 1);
                this.player.score += 100;
                this.updateUI();
            }
        }
    }
    
    spawnPowerUp(x, y) {
        const types = ['bomb', 'range', 'speed'];
        this.powerUps.push({
            x,
            y,
            type: types[Math.floor(Math.random() * types.length)],
            animationTimer: 0
        });
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.animationTimer += this.deltaTime;
            
            if (Math.floor(this.player.x) === p.x && Math.floor(this.player.y) === p.y) {
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
        }
        this.player.score += 50;
        this.updateUI();
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.animationTimer += this.deltaTime;
            enemy.moveTimer -= this.deltaTime * 60;
            
            // Mudar direção aleatoriamente
            if (enemy.moveTimer <= 0) {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 60 + Math.random() * 60;
            }
            
            const speed = enemy.speed * this.deltaTime;
            let newX = enemy.x;
            let newY = enemy.y;
            
            // Mover na direção atual
            switch (enemy.direction) {
                case 0: newX += speed; break; // direita
                case 1: newY += speed; break; // baixo
                case 2: newX -= speed; break; // esquerda
                case 3: newY -= speed; break; // cima
            }
            
            // Verificação de colisão simplificada
            const canMove = !this.isWall(newX, newY) && !this.isBreakableWall(newX, newY) && !this.isBomb(Math.floor(newX), Math.floor(newY));
            
            if (canMove) {
                enemy.x = Math.max(0.5, Math.min(this.gridSize - 1.5, newX));
                enemy.y = Math.max(0.5, Math.min(this.gridSize - 1.5, newY));
            } else {
                enemy.direction = Math.floor(Math.random() * 4);
                enemy.moveTimer = 30;
            }
            
            // Verificar colisão com jogador
            if (Math.floor(enemy.x) === Math.floor(this.player.x) && 
                Math.floor(enemy.y) === Math.floor(this.player.y) &&
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
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawBackground();
        this.drawBreakableWalls();
        this.drawPowerUps();
        this.drawBombs();
        this.drawExplosions();
        this.drawEnemies();
        this.drawPlayer();
    }
    
    drawBackground() {
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Grade
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvasHeight);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvasWidth, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Paredes indestrutíveis
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
    
    drawPowerUps() {
        this.powerUps.forEach(p => {
            const centerX = (p.x + 0.5) * this.cellSize;
            const centerY = (p.y + 0.5) * this.cellSize + Math.sin(p.animationTimer * 5) * 5;
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000';
            this.ctx.font = `bold ${this.cellSize * 0.3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.type[0].toUpperCase(), centerX, centerY);
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
            
            // Bomba
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pavio
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
            
            // Núcleo da explosão
            this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Anel externo
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
            const floatOffset = Math.sin(enemy.animationTimer * 5) * 3;
            
            // Corpo
            this.ctx.fillStyle = '#F44336';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY + floatOffset, this.cellSize * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Olhos
            this.ctx.fillStyle = '#000';
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
            
            // Boca
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
        });
    }
    
    drawPlayer() {
        const centerX = (this.player.x + 0.5) * this.cellSize;
        const centerY = (this.player.y + 0.5) * this.cellSize;
        const bounce = this.player.moving ? Math.sin(performance.now() * 0.01) * 3 : 0;
        
        // Efeito de invencibilidade
        if (this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Corpo
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + bounce, this.cellSize * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cabeça
        this.ctx.fillStyle = '#BBDEFB';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - this.cellSize * 0.1 + bounce, this.cellSize * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Olhos (piscando quando se move)
        this.ctx.fillStyle = '#000';
        const blink = this.player.moving ? Math.floor(performance.now() / 100) % 10 < 3 ? 0 : 1 : 1;
        
        if (blink) {
            this.ctx.beginPath();
            this.ctx.arc(
                centerX - this.cellSize * 0.08, 
                centerY - this.cellSize * 0.12 + bounce, 
                this.cellSize * 0.05, 
                0, 
                Math.PI * 2
            );
            this.ctx.arc(
                centerX + this.cellSize * 0.08, 
                centerY - this.cellSize * 0.12 + bounce, 
                this.cellSize * 0.05, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
        } else {
            this.ctx.fillRect(
                centerX - this.cellSize * 0.1,
                centerY - this.cellSize * 0.1 + bounce,
                this.cellSize * 0.2,
                this.cellSize * 0.03
            );
        }
        
        // Boca (sorriso)
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            centerX, 
            centerY + bounce, 
            this.cellSize * 0.1, 
            0.2 * Math.PI, 
            0.8 * Math.PI
        );
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    gameLoop(time) {
        this.deltaTime = Math.min((time - this.lastTime) / 1000, 0.1); // Limitar deltaTime para evitar bugs
        this.lastTime = time;
        
        if (this.gameRunning) {
            this.updatePlayer();
            this.updateEnemies();
            this.updateBombs();
            this.updateExplosions();
            this.updatePowerUps();
            this.checkWinCondition();
            this.draw();
        }
        
        this.animationId = requestAnimationFrame(t => this.gameLoop(t));
    }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
});