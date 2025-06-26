class TopGearGame {
    constructor() {
        // Configuração inicial
        this.lastTime = 0;
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
        this.then = performance.now();
        
        // Elementos DOM
        this.gameContainer = document.getElementById('game-container');
        this.playerCar = document.getElementById('player-car');
        this.opponentsContainer = document.getElementById('opponents-container');
        this.track = document.getElementById('track');
        this.startScreen = document.getElementById('start-screen');
        this.speedNeedle = document.getElementById('speed-needle');
        this.speedValue = document.getElementById('speed-value');
        this.lapCounter = document.getElementById('lap-counter');
        this.particlesContainer = document.getElementById('particles-container');
        
        // Estado do jogo
        this.player = {
            x: 370,
            y: 540,
            speed: 0,
            maxSpeed: 400,
            acceleration: 0.8,
            rotation: 0,
            boost: 100,
            isBoosting: false,
            lastParticleTime: 0
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
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Enter': 
                    if (!this.race.started) {
                        this.startRace();
                    }
                    break;
                case 'ArrowUp': this.keys.up = true; break;
                case 'ArrowDown': this.keys.down = true; break;
                case 'ArrowLeft': this.keys.left = true; break;
                case 'ArrowRight': this.keys.right = true; break;
                case 'Shift': this.keys.shift = true; break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.keys.up = false; break;
                case 'ArrowDown': this.keys.down = false; break;
                case 'ArrowLeft': this.keys.left = false; break;
                case 'ArrowRight': this.keys.right = false; break;
                case 'Shift': this.keys.shift = false; break;
            }
        });
        
        // Controles touch para mobile
        document.addEventListener('touchstart', (e) => {
            const touchX = e.touches[0].clientX;
            const screenWidth = window.innerWidth;
            
            if (touchX < screenWidth / 2) {
                this.keys.left = true;
            } else {
                this.keys.right = true;
            }
        });
        
        document.addEventListener('touchend', () => {
            this.keys.left = false;
            this.keys.right = false;
        });
    }
    
    createOpponents(count) {
        for (let i = 0; i < count; i++) {
            const opponent = document.createElement('div');
            opponent.className = 'vehicle opponent-car';
            opponent.style.bottom = `${150 + (i * 120)}px`;
            opponent.style.left = `${300 + (i * 80)}px`;
            this.opponentsContainer.appendChild(opponent);
            
            this.opponents.push({
                element: opponent,
                x: 300 + (i * 80),
                y: 150 + (i * 120),
                speed: 120 + (i * 20),
                lane: Math.floor(Math.random() * 3),
                lastLaneChange: 0
            });
        }
    }
    
    startRace() {
        this.race.started = true;
        this.race.startTime = performance.now();
        this.startScreen.style.opacity = '0';
        setTimeout(() => {
            this.startScreen.style.display = 'none';
        }, 500);
    }
    
    update(deltaTime) {
        if (!this.race.started) return;
        
        // Movimento do jogador
        this.updatePlayer(deltaTime);
        
        // Atualiza oponentes
        this.updateOpponents(deltaTime);
        
        // Verifica voltas
        this.checkLaps();
        
        // Efeitos visuais
        this.updateEffects();
    }
    
    updatePlayer(deltaTime) {
        // Aceleração
        if (this.keys.up) {
            this.player.speed = Math.min(
                this.player.speed + this.player.acceleration * (deltaTime / 16), 
                this.player.maxSpeed * (this.player.isBoosting ? 1.3 : 1)
            );
        } else {
            this.player.speed = Math.max(
                this.player.speed - this.player.acceleration * 0.5 * (deltaTime / 16), 
                0
            );
        }
        
        // Freio
        if (this.keys.down) {
            this.player.speed = Math.max(
                this.player.speed - this.player.acceleration * 1.5 * (deltaTime / 16), 
                0
            );
        }
        
        // Direção
        if (this.keys.left) {
            this.player.x -= (3 + (this.player.speed / 50)) * (deltaTime / 16);
        }
        if (this.keys.right) {
            this.player.x += (3 + (this.player.speed / 50)) * (deltaTime / 16);
        }
        
        // Turbo
        this.player.isBoosting = this.keys.shift && this.player.boost > 0;
        if (this.player.isBoosting) {
            this.player.boost = Math.max(this.player.boost - 0.5 * (deltaTime / 16), 0);
            this.createBoostParticles();
        } else if (this.player.boost < 100) {
            this.player.boost = Math.min(this.player.boost + 0.1 * (deltaTime / 16), 100);
        }
        
        // Limites da pista
        this.player.x = Math.max(100, Math.min(640, this.player.x));
    }
    
    updateOpponents(deltaTime) {
        const now = performance.now();
        
        this.opponents.forEach(opponent => {
            // Muda de faixa aleatoriamente
            if (now - opponent.lastLaneChange > 2000 && Math.random() < 0.005 * (deltaTime / 16)) {
                opponent.lane = Math.floor(Math.random() * 3);
                opponent.lastLaneChange = now;
            }
            
            const targetX = 200 + (opponent.lane * 150);
            opponent.x += (targetX - opponent.x) * 0.02 * (deltaTime / 16);
            
            // Movimento baseado na velocidade do jogador
            opponent.y -= (this.player.speed - opponent.speed) * 0.1 * (deltaTime / 16);
            
            // Reposiciona quando sai da tela
            if (opponent.y < -100) {
                opponent.y = 700;
                opponent.x = 200 + (Math.random() * 300);
            }
            
            opponent.element.style.left = `${opponent.x}px`;
            opponent.element.style.bottom = `${opponent.y}px`;
        });
    }
    
    checkLaps() {
        this.race.distance += this.player.speed * 0.02;
        
        if (this.race.distance > 10000) {
            this.race.distance = 0;
            this.race.laps++;
            this.lapCounter.textContent = this.race.laps;
            
            if (this.race.laps > this.race.maxLaps) {
                this.finishRace();
            }
        }
    }
    
    updateEffects() {
        // Efeito de tremer em alta velocidade
        if (this.player.speed > 300 && !this.gameContainer.classList.contains('speed-effect')) {
            this.gameContainer.classList.add('speed-effect');
        } else if (this.player.speed <= 300 && this.gameContainer.classList.contains('speed-effect')) {
            this.gameContainer.classList.remove('speed-effect');
        }
        
        // Partículas de velocidade
        if (this.player.speed > 200) {
            this.createSpeedParticles();
        }
    }
    
    createSpeedParticles() {
        const now = performance.now();
        if (now - this.player.lastParticleTime < 50) return;
        this.player.lastParticleTime = now;
        
        const intensity = Math.min((this.player.speed - 200) / 200, 1);
        const particleCount = Math.floor(2 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(
                this.player.x + (Math.random() * 80 - 40),
                550 + (Math.random() * 40 - 20),
                `hsl(${40 + Math.random() * 20}, 100%, 60%)`,
                3 + Math.random() * 4,
                80 + Math.random() * 50
            );
        }
    }
    
    createBoostParticles() {
        const now = performance.now();
        if (now - this.player.lastParticleTime < 30) return;
        this.player.lastParticleTime = now;
        
        for (let i = 0; i < 2; i++) {
            this.createParticle(
                this.player.x + (Math.random() * 60 - 30),
                530 + (Math.random() * 20),
                this.player.isBoosting ? '#00A2FF' : '#FFD700',
                6 + Math.random() * 4,
                120 + Math.random() * 80
            );
        }
    }
    
    createParticle(x, y, color, size, distance) {
        const particle = document.createElement('div');
        particle.className = color === '#00A2FF' ? 'boost-particle' : 'particle';
        particle.style.left = `${x}px`;
        particle.style.bottom = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        this.particlesContainer.appendChild(particle);
        
        const duration = 300 + Math.random() * 400;
        
        const animation = particle.animate([
            { transform: 'translateY(0) scale(1)', opacity: 0.8 },
            { transform: `translateY(${distance}px) scale(0.1)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        animation.onfinish = () => particle.remove();
    }
    
    render() {
        // Atualiza posição do jogador
        this.playerCar.style.left = `${this.player.x}px`;
        
        // Atualiza velocímetro
        const maxSpeed = this.player.isBoosting ? this.player.maxSpeed * 1.3 : this.player.maxSpeed;
        const speedAngle = (this.player.speed / maxSpeed) * 270 - 135;
        this.speedNeedle.style.transform = `translateX(-50%) rotate(${speedAngle}deg)`;
        this.speedValue.textContent = Math.round(this.player.speed);
        
        // Efeito visual do turbo
        if (this.player.isBoosting) {
            this.playerCar.style.boxShadow = '0 0 25px rgba(0, 162, 255, 0.8)';
        } else {
            this.playerCar.style.boxShadow = '0 0 15px rgba(0, 162, 255, 0.5)';
        }
    }
    
    finishRace() {
        this.race.started = false;
        setTimeout(() => {
            this.startScreen.style.display = 'flex';
            setTimeout(() => {
                this.startScreen.style.opacity = '1';
            }, 10);
            this.player.speed = 0;
            this.race.laps = 1;
            this.lapCounter.textContent = '1';
            this.gameContainer.classList.remove('speed-effect');
        }, 3000);
    }
    
    gameLoop(timestamp) {
        requestAnimationFrame((t) => this.gameLoop(t));
        
        // Controle de FPS
        const now = timestamp;
        const elapsed = now - this.then;
        
        if (elapsed > this.fpsInterval) {
            this.then = now - (elapsed % this.fpsInterval);
            
            const deltaTime = elapsed;
            this.update(deltaTime);
            this.render();
        }
    }
}

// Inicia o jogo quando a página carrega
window.addEventListener('load', () => {
    new TopGearGame();
});