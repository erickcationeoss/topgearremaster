class Game {
    constructor() {
        this.gameContainer = document.getElementById('game-container');
        this.playerCar = document.getElementById('player-car');
        this.opponentsContainer = document.getElementById('opponents');
        this.track = document.getElementById('track');
        this.startScreen = document.getElementById('start-screen');
        this.speedNeedle = document.getElementById('speed-needle');
        this.speedValue = document.getElementById('speed-value');
        this.lapCounter = document.getElementById('lap-counter');
        this.boostFill = document.getElementById('boost-fill');
        
        this.player = {
            x: 400,
            speed: 0,
            maxSpeed: 400,
            acceleration: 0.7,
            rotation: 0,
            boost: 100,
            isBoosting: false
        };
        
        this.opponents = [];
        this.race = {
            started: false,
            startTime: 0,
            laps: 1,
            maxLaps: 3,
            distance: 0
        };
        
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shift: false,
            enter: false
        };
        
        this.setupControls();
        this.createOpponents(5);
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.keys.enter = true;
            if (e.key === 'ArrowUp') this.keys.up = true;
            if (e.key === 'ArrowDown') this.keys.down = true;
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === 'Shift') this.keys.shift = true;
            
            if (this.keys.enter && !this.race.started) {
                this.startRace();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.keys.enter = false;
            if (e.key === 'ArrowUp') this.keys.up = false;
            if (e.key === 'ArrowDown') this.keys.down = false;
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === 'Shift') this.keys.shift = false;
        });
    }
    
    createOpponents(count) {
        for (let i = 0; i < count; i++) {
            const opponent = document.createElement('div');
            opponent.className = 'opponent-car';
            opponent.style.bottom = `${150 + (i * 120)}px`;
            opponent.style.left = `${300 + (i * 80)}px`;
            this.opponentsContainer.appendChild(opponent);
            
            this.opponents.push({
                element: opponent,
                x: 300 + (i * 80),
                y: 150 + (i * 120),
                speed: 120 + (i * 20),
                lane: Math.floor(Math.random() * 3)
            });
        }
    }
    
    startRace() {
        this.race.started = true;
        this.race.startTime = Date.now();
        this.startScreen.style.display = 'none';
    }
    
    update() {
        if (!this.race.started) return;
        
        // Controles do jogador
        if (this.keys.up) {
            this.player.speed = Math.min(this.player.speed + this.player.acceleration, this.player.maxSpeed);
        } else {
            this.player.speed = Math.max(this.player.speed - this.player.acceleration * 0.5, 0);
        }
        
        if (this.keys.down) {
            this.player.speed = Math.max(this.player.speed - this.player.acceleration * 1.5, 0);
        }
        
        if (this.keys.left) {
            this.player.x -= 3 + (this.player.speed / 50);
        }
        
        if (this.keys.right) {
            this.player.x += 3 + (this.player.speed / 50);
        }
        
        // Turbo
        this.player.isBoosting = this.keys.shift && this.player.boost > 0;
        if (this.player.isBoosting) {
            this.player.speed = Math.min(this.player.speed + 1.5, this.player.maxSpeed * 1.3);
            this.player.boost = Math.max(this.player.boost - 1, 0);
        } else if (this.player.boost < 100) {
            this.player.boost = Math.min(this.player.boost + 0.2, 100);
        }
        
        // Limites da pista
        this.player.x = Math.max(150, Math.min(650, this.player.x));
        
        // Atualiza oponentes
        this.updateOpponents();
        
        // Atualiza distância
        this.race.distance += this.player.speed / 60;
        
        // Verifica voltas
        if (this.race.distance > 10000) {
            this.race.distance = 0;
            this.race.laps++;
            this.lapCounter.textContent = this.race.laps;
            
            if (this.race.laps > this.race.maxLaps) {
                this.finishRace();
            }
        }
        
        // Efeitos de velocidade
        this.handleSpeedEffects();
    }
    
    updateOpponents() {
        this.opponents.forEach(opponent => {
            // Muda de faixa aleatoriamente
            if (Math.random() < 0.01) {
                opponent.lane = Math.floor(Math.random() * 3);
            }
            
            const targetX = 250 + (opponent.lane * 150);
            opponent.x += (targetX - opponent.x) * 0.05;
            
            // Movimento para frente baseado na velocidade do jogador
            opponent.y -= (this.player.speed - opponent.speed) / 10;
            
            // Se sair da tela, reposiciona no topo
            if (opponent.y < -100) {
                opponent.y = 700;
            }
            
            opponent.element.style.left = `${opponent.x}px`;
            opponent.element.style.bottom = `${opponent.y}px`;
        });
    }
    
    handleSpeedEffects() {
        // Efeito de tremer na alta velocidade
        if (this.player.speed > 300 && !this.gameContainer.classList.contains('speed-effect')) {
            this.gameContainer.classList.add('speed-effect');
        } else if (this.player.speed <= 300 && this.gameContainer.classList.contains('speed-effect')) {
            this.gameContainer.classList.remove('speed-effect');
        }
        
        // Cria partículas quando em alta velocidade
        if (this.player.speed > 200) {
            const intensity = Math.min((this.player.speed - 200) / 100, 1);
            createParticles(this.player.x, 550, intensity);
        }
    }
    
    render() {
        this.playerCar.style.left = `${this.player.x}px`;
        
        // Atualiza velocímetro
        const maxSpeed = this.player.isBoosting ? this.player.maxSpeed * 1.3 : this.player.maxSpeed;
        const speedAngle = (this.player.speed / maxSpeed) * 270 - 135;
        this.speedNeedle.style.transform = `translateX(-50%) rotate(${speedAngle}deg)`;
        this.speedValue.textContent = Math.round(this.player.speed);
        
        // Atualiza barra de turbo
        this.boostFill.style.width = `${this.player.boost}%`;
        this.boostFill.style.background = this.player.boost < 20 ? '#FF0000' : '#FFD700';
        
        // Efeito visual de turbo
        if (this.player.isBoosting) {
            this.playerCar.style.boxShadow = `0 0 25px rgba(0, 162, 255, 0.8)`;
        } else {
            this.playerCar.style.boxShadow = `0 0 15px rgba(0, 162, 255, 0.5)`;
        }
    }
    
    finishRace() {
        this.race.started = false;
        setTimeout(() => {
            this.startScreen.style.display = 'flex';
            this.player.speed = 0;
            this.race.laps = 1;
            this.lapCounter.textContent = '1';
            this.gameContainer.classList.remove('speed-effect');
        }, 3000);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicia o jogo quando a página carregar
window.addEventListener('load', () => {
    new Game();
});