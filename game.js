class BombermanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 13;
        this.cellSize = this.canvas.width / this.gridSize;
        
        // Controle de estado do jogo
        this.gameRunning = false;
        this.level = 1;
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.animationId = null;
        
        // Configurações do jogador
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
        
        // Elementos do jogo
        this.bombs = [];
        this.explosions = [];
        this.enemies = [];
        this.walls = [];
        this.breakableWalls = [];
        
        // Controles
        this.keys = {};
        
        // Cores neon
        this.colors = {
            background: '#0a0a1a',
            grid: 'rgba(0, 242, 255, 0.1)',
            wall: '#6b00ff',
            breakable: '#ff00c3',
            bomb: '#ff3d00',
            explosion: '#ffeb3b',
            enemy: '#ff0055'
        };
        
        // Bind dos métodos
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupUI();
        this.resetGame();
    }
    
    setupControls() {
        // Remove listeners antigos para evitar duplicação
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Adiciona novos listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        const startBtn = document.getElementById('startBtn');
        startBtn.onclick = () => this.startGame();
    }
    
    handleKeyDown(e) {
        if (e.key === ' ') {
            if (this.gameRunning) this.placeBomb();
            e.preventDefault();
        } else {
            this.keys[e.key.toLowerCase()] = true;
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    startGame() {
        // Garante que não há múltiplas instâncias do game loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.resetGame();
        this.gameRunning = true;
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(currentTime) {
        // Cálculo seguro do deltaTime
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (this.gameRunning) {
            this.update();
            this.render();
        }
        
        this.animationId = requestAnimationFrame(this.gameLoop);
    }
    
    update() {
        this.updatePlayer();
        this.updateBombs();
        this.updateExplosions();
        this.updateEnemies();
        this.checkWinCondition();
    }
    
    updatePlayer() {
        // Implementação da física de movimento (manter a versão anterior)
        // ... (código de updatePlayer da versão anterior)
    }
    
    cleanUp() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.player.score.toString().padStart(5, '0');
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        this.cleanUp();
    }
    
    // ... (manter os outros métodos necessários)
}

// Inicialização segura
window.addEventListener('load', () => {
    const game = new BombermanGame('gameCanvas');
    
    // Limpeza quando a página for ocultada
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.cleanUp();
        }
    });
});