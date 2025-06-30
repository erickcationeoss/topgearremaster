class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 13;
        this.cellSize = this.canvas.width / this.gridSize;
        
        this.gameActive = false;
        this.level = 1;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        
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
        
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        
        this.keys = {};
        this.colors = {
            background: '#0a0a1a',
            grid: 'rgba(0, 242, 255, 0.1)',
            wall: '#6b00ff',
            breakable: '#ff00c3',
            bomb: '#ff3d00',
            explosion: '#ffeb3b',
            enemy: '#ff0055'
        };

        this.init();
    }

    init() {
        this.setupControls();
        this.setupUI();
        this.resetGame();
    }

    setupControls() {
        const handleKeyDown = (e) => {
            if (e.key === ' ') {
                if (this.gameActive) this.placeBomb();
                e.preventDefault();
            } else {
                this.keys[e.key.toLowerCase()] = true;
            }
        };

        const handleKeyUp = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', () => {
            if (!this.gameActive) this.startGame();
        });

        // Cleanup function
        this.cleanupControls = () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }

    setupUI() {
        this.updateUI();
    }

    resetGame() {
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
        
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        
        this.generateLevel();
        this.spawnEnemies(3);
    }

    startGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.resetGame();
        this.gameActive = true;
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        const now = performance.now();
        this.deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        if (this.gameActive) {
            this.update();
            this.render();
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
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

        // Collision detection
        const gridX = Math.round(newX);
        const gridY = Math.round(newY);
        const currentGridX = Math.round(this.player.x);
        const currentGridY = Math.round(this.player.y);

        // Allow moving away from bombs
        const standingOnBomb = this.isBomb(currentGridX, currentGridY);
        
        if (standingOnBomb || !this.isBomb(gridX, gridY)) {
            if (!this.isWall(gridX, gridY)) {
                this.player.x = Math.max(this.player.radius, Math.min(this.gridSize - 1 - this.player.radius, newX));
                this.player.y = Math.max(this.player.radius, Math.min(this.gridSize - 1 - this.player.radius, newY));
            }
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

    // ... (outros métodos como placeBomb, explodeBomb, playerHit, etc.)

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = this.colors.grid;
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

        // Draw walls
        this.ctx.fillStyle = this.colors.wall;
        this.walls.forEach(wall => {
            this.ctx.fillRect(
                wall.x * this.cellSize, 
                wall.y * this.cellSize, 
                this.cellSize, 
                this.cellSize
            );
        });

        // Draw player
        const centerX = (this.player.x + 0.5) * this.cellSize;
        const centerY = (this.player.y + 0.5) * this.cellSize;
        const radius = this.player.radius * this.cellSize;
        
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.cleanupControls();
    }

    gameOver() {
        this.gameActive = false;
        document.getElementById('finalScore').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        this.cleanup();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new BombermanGame('gameCanvas');
    
    // Cleanup when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.cleanup();
        }
    });
});