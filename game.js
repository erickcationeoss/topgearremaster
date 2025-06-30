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
        this.animationFrameId = null;
        
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
        this.particles = [];
        
        this.keys = {};
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
    
    // ... (mantenha os métodos setupUI, resetGame, startGame, gameOver, levelComplete, updateUI)
    
    generateLevel() {
        this.walls = [];
        this.breakableWalls = [];
        
        // Border walls with neon effect
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (x === 0 || y === 0 || x === this.gridSize - 1 || y === this.gridSize - 1) {
                    this.walls.push({
                        x, 
                        y,
                        color: this.colors.wall,
                        glow: true
                    });
                }
            }
        }
        
        // Fixed pattern walls with neon effect
        for (let y = 2; y < this.gridSize - 2; y += 2) {
            for (let x = 2; x < this.gridSize - 2; x += 2) {
                this.walls.push({
                    x, 
                    y,
                    color: this.colors.wall,
                    glow: true
                });
            }
        }
        
        // Breakable walls with different neon color
        for (let y = 1; y < this.gridSize - 1; y++) {
            for (let x = 1; x < this.gridSize - 1; x++) {
                if (!this.isWall(x, y) && !this.isPlayerStartArea(x, y) && Math.random() < 0.5) {
                    this.breakableWalls.push({
                        x, 
                        y,
                        color: this.colors.breakable,
                        glow: true
                    });
                }
            }
        }
    }
    
    // FÍSICA APLICADA AQUI - Método updatePlayer revisado
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
        
        // Verificação de colisão com física
        const nextGridX = Math.round(newX);
        const nextGridY = Math.round(newY);
        const currentGridX = Math.round(this.player.x);
        const currentGridY = Math.round(this.player.y);
        
        // Verifica se está tentando sair de uma bomba
        const standingOnBomb = this.isBomb(currentGridX, currentGridY);
        
        // Física de movimento
        if (standingOnBomb || !this.isBomb(nextGridX, nextGridY)) {
            // Verifica colisão com paredes
            if (!this.isWall(nextGridX, nextGridY)) {
                // Verifica se está mudando de célula
                if (nextGridX !== currentGridX || nextGridY !== currentGridY) {
                    // Verifica se a nova célula está livre
                    if (!this.isWall(nextGridX, nextGridY) && 
                        !this.isBomb(nextGridX, nextGridY)) {
                        this.player.x = newX;
                        this.player.y = newY;
                    } else {
                        // Desliza ao longo da parede/bomba
                        if (!this.isWall(nextGridX, currentGridY) && 
                            !this.isBomb(nextGridX, currentGridY)) {
                            this.player.x = newX;
                        }
                        if (!this.isWall(currentGridX, nextGridY) && 
                            !this.isBomb(currentGridX, nextGridY)) {
                            this.player.y = newY;
                        }
                    }
                } else {
                    // Movimento dentro da mesma célula
                    this.player.x = newX;
                    this.player.y = newY;
                }
            }
        }
        
        // Limita os movimentos aos limites do mapa
        this.player.x = Math.max(this.player.radius, Math.min(this.gridSize - 1 - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.gridSize - 1 - this.player.radius, this.player.y));
        
        // Verifica explosões
        if (this.player.invincible <= 0) {
            const px = Math.round(this.player.x);
            const py = Math.round(this.player.y);
            if (this.explosions.some(e => e.x === px && e.y === py)) {
                this.playerHit();
            }
        }
    }
    
    // EFEITOS NEON - Método drawBackground revisado
    drawBackground() {
        // Fundo escuro
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grade neon
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
        
        // Paredes com efeito neon
        this.walls.forEach(wall => {
            this.drawNeonBlock(
                wall.x * this.cellSize, 
                wall.y * this.cellSize, 
                this.cellSize, 
                this.cellSize, 
                wall.color || this.colors.wall,
                wall.glow
            );
        });
    }
    
    // Método para desenhar blocos com efeito neon
    drawNeonBlock(x, y, width, height, color, glow = true) {
        // Sombra/brilho
        if (glow) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
        }
        
        // Bloco principal
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // Resetar sombra
        this.ctx.shadowBlur = 0;
        
        // Detalhes internos
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
    }
    
    // ... (mantenha os outros métodos draw atualizados com estilo neon)
    
    drawPlayer() {
        const centerX = (this.player.x + 0.5) * this.cellSize;
        const centerY = (this.player.y + 0.5) * this.cellSize;
        const radius = this.player.radius * this.cellSize;
        
        if (this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Efeito neon no jogador
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 20;
        
        // Corpo
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Resetar sombra
        this.ctx.shadowBlur = 0;
        
        // Detalhes do rosto
        const eyeOffsetX = radius * 0.4;
        const eyeOffsetY = radius * 0.3;
        
        // Olhos
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(centerX - eyeOffsetX, centerY - eyeOffsetY, radius * 0.15, 0, Math.PI * 2);
        this.ctx.arc(centerX + eyeOffsetX, centerY - eyeOffsetY, radius * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Boca
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + radius * 0.2, radius * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    // ... (mantenha os outros métodos necessários)
}

window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
});