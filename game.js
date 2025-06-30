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
        
        // Physics settings
        this.player = {
            x: 1,
            y: 1,
            radius: 0.35,
            bombs: 1,
            maxBombs: 3,
            bombRange: 2,
            speed: 3,
            lives: 3,
            score: 0,
            invincible: 0,
            direction: 0,
            color: '#00f2ff'
        };
        
        // Game elements
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        
        // Controls
        this.keys = {};
        
        // Neon colors
        this.colors = {
            background: '#0a0a1a',
            grid: 'rgba(0, 242, 255, 0.1)',
            wall: '#6b00ff',
            breakable: '#ff00c3',
            bomb: '#ff3d00',
            explosion: '#ffeb3b',
            enemy: '#ff0055',
            neonGlow: 'rgba(0, 242, 255, 0.7)'
        };
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupUI();
        this.resetGame();
    }
    
    setupControls() {
        // Remove old event listeners to prevent duplicates
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        this.handleKeyDown = (e) => {
            if (e.key === ' ') {
                if (this.gameRunning) this.placeBomb();
                e.preventDefault();
            } else {
                this.keys[e.key.toLowerCase()] = true;
            }
        };
        
        this.handleKeyUp = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };
        
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        const startBtn = document.getElementById('startBtn');
        startBtn.removeEventListener('click', this.startGame);
        startBtn.addEventListener('click', () => this.startGame());
    }
    
    startGame() {
        if (this.gameRunning) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.resetGame();
        this.gameRunning = true;
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(time) {
        // Calculate delta time safely
        this.deltaTime = Math.min((time - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = time;
        
        if (this.gameRunning) {
            this.update();
            this.render();
        }
        
        // Use arrow function to maintain 'this' context
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update() {
        this.updatePlayer();
        this.updateBombs();
        this.updateExplosions();
        this.updateEnemies();
        this.checkWinCondition();
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
            
            if (canMoveX) this.player.x = Math.max(this.player.radius, Math.min(this.gridSize - 1 - this.player.radius, newX));
            if (canMoveY) this.player.y = Math.max(this.player.radius, Math.min(this.gridSize - 1 - this.player.radius, newY));
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
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawBreakableWalls();
        this.drawBombs();
        this.drawExplosions();
        this.drawEnemies();
        this.drawPlayer();
    }
    
    // ... (mantenha os outros métodos como generateLevel, isOccupied, placeBomb, etc)

    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    cleanUp() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Initialize game safely
window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
    
    // Clean up when page is hidden to prevent memory leaks
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.cleanUp();
        }
    });
});