class TopGearGame {
    constructor() {
        this.setupDOM();
        this.initGame();
        this.setupControls();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    setupDOM() {
        this.dom = {
            game: document.getElementById('game-container'),
            playerCar: document.getElementById('player-car'),
            opponents: document.getElementById('opponents-container'),
            particles: document.getElementById('particles-container'),
            road: document.getElementById('road'),
            ui: {
                speed: document.getElementById('speed-value'),
                needle: document.getElementById('speed-needle'),
                boost: document.getElementById('boost-level'),
                lap: document.getElementById('lap-counter'),
                time: document.getElementById('time-counter'),
                position: document.getElementById('position-indicator'),
                startScreen: document.getElementById('start-screen'),
                resultsScreen: document.getElementById('results-screen'),
                finalTime: document.getElementById('final-time'),
                restartBtn: document.getElementById('restart-button'),
                easyBtn: document.getElementById('easy-btn'),
                mediumBtn: document.getElementById('medium-btn'),
                hardBtn: document.getElementById('hard-btn')
            }
        };
    }

    initGame() {
        this.state = {
            started: false,
            racing: false,
            finished: false,
            time: 0,
            lastFrame: 0,
            delta: 0,
            difficulty: 'medium' // padrão: médio
        };

        this.player = {
            x: 0, // posição lateral (0 = centro)
            speed: 0, maxSpeed: 300,
            accel: 0.5, rotation: 0,
            boost: 100, turbo: false,
            lap: 0, position: 1,
            z: 0 // posição na pista (profundidade)
        };

        this.race = {
            laps: 1, maxLaps: 3,
            distance: 0, startTime: 0,
            roadOffset: 0
        };

        this.opponents = [];
        this.createOpponents(3);
        this.updateDifficulty();
    }

    createOpponents(count) {
        this.dom.opponents.innerHTML = '';
        this.opponents = [];
        
        const baseSpeeds = {
            easy: [80, 90, 100],
            medium: [120, 135, 150],
            hard: [160, 180, 200]
        };
        
        for (let i = 0; i < count; i++) {
            const opp = document.createElement('div');
            opp.className = 'vehicle opponent-car';
            this.dom.opponents.appendChild(opp);
            
            this.opponents.push({
                element: opp,
                x: (i - 1) * 100, // posição lateral
                z: -500 - (i * 300), // posição na pista
                speed: baseSpeeds[this.state.difficulty][i],
                lane: i - 1,
                lap: 0,
                position: i + 1
            });
        }
    }

    updateDifficulty() {
        const colors = {
            easy: '#00aa00',
            medium: '#ffcc00',
            hard: '#ff0000'
        };
        
        [this.dom.ui.easyBtn, this.dom.ui.mediumBtn, this.dom.ui.hardBtn].forEach(btn => {
            btn.style.background = 'rgba(0,0,0,0.5)';
            btn.style.borderColor = 'var(--accent)';
        });
        
        const activeBtn = this.dom.ui[`${this.state.difficulty}Btn`];
        activeBtn.style.background = colors[this.state.difficulty];
        activeBtn.style.borderColor = colors[this.state.difficulty];
        
        this.createOpponents(3);
    }

    setupControls() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.handleStart();
            if (e.key === 'ArrowUp') this.keys.up = true;
            if (e.key === 'ArrowDown') this.keys.down = true;
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
            if (e.key === 'Shift' && this.state.racing) this.activateTurbo();
        });

        document.addEventListener('keyup', e => {
            if (e.key === 'ArrowUp') this.keys.up = false;
            if (e.key === 'ArrowDown') this.keys.down = false;
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === 'Shift') this.deactivateTurbo();
        });

        this.dom.ui.restartBtn.addEventListener('click', () => this.restartGame());
        this.dom.ui.easyBtn.addEventListener('click', () => {
            this.state.difficulty = 'easy';
            this.updateDifficulty();
        });
        this.dom.ui.mediumBtn.addEventListener('click', () => {
            this.state.difficulty = 'medium';
            this.updateDifficulty();
        });
        this.dom.ui.hardBtn.addEventListener('click', () => {
            this.state.difficulty = 'hard';
            this.updateDifficulty();
        });
    }

    handleStart() {
        if (!this.state.started) {
            this.state.started = true;
            this.dom.ui.startScreen.style.opacity = '0';
            setTimeout(() => {
                this.dom.ui.startScreen.style.display = 'none';
                this.startRace();
            }, 500);
        } else if (this.state.finished) {
            this.restartGame();
        }
    }

    startRace() {
        this.state.racing = true;
        this.race.startTime = performance.now();
        this.race.distance = 0;
        this.player.lap = 0;
        this.player.position = 1;
        this.player.z = 0;
        this.dom.ui.lap.textContent = '1';
    }

    finishRace() {
        this.state.racing = false;
        this.state.finished = true;
        this.dom.ui.finalTime.textContent = this.formatTime(this.state.time - this.race.startTime);
        setTimeout(() => {
            this.dom.ui.resultsScreen.style.opacity = '1';
            this.dom.ui.resultsScreen.style.pointerEvents = 'auto';
        }, 1000);
    }

    restartGame() {
        this.initGame();
        this.dom.ui.resultsScreen.style.opacity = '0';
        this.dom.ui.resultsScreen.style.pointerEvents = 'none';
        this.dom.ui.startScreen.style.display = 'flex';
        setTimeout(() => this.dom.ui.startScreen.style.opacity = '1', 50);
    }

    activateTurbo() {
        if (this.player.boost > 0) {
            this.player.turbo = true;
            this.dom.playerCar.classList.add('turbo-effect');
        }
    }

    deactivateTurbo() {
        this.player.turbo = false;
        this.dom.playerCar.classList.remove('turbo-effect');
    }

    updatePlayer(delta) {
        // Controles de aceleração
        if (this.keys.up) {
            this.player.speed += this.player.accel * delta;
        } else if (this.keys.down) {
            this.player.speed -= this.player.accel * 1.5 * delta;
        } else {
            this.player.speed *= 0.98;
        }

        // Turbo
        if (this.player.turbo && this.player.boost > 0) {
            this.player.speed += this.player.accel * 1.5 * delta;
            this.player.boost -= 0.3 * delta;
        } else if (this.player.boost < 100) {
            this.player.boost += 0.1 * delta;
        }

        // Limita velocidade
        const maxSpeed = this.player.turbo ? this.player.maxSpeed * 1.3 : this.player.maxSpeed;
        this.player.speed = Math.max(0, Math.min(maxSpeed, this.player.speed));

        // Controles de direção
        if (this.player.speed > 10) {
            if (this.keys.left) this.player.x -= 1 * delta;
            if (this.keys.right) this.player.x += 1 * delta;
        }

        // Limita movimento lateral
        this.player.x = Math.max(-150, Math.min(150, this.player.x));

        // Movimento na pista
        this.player.z += this.player.speed * delta / 20;
    }

    updateOpponents(delta) {
        this.opponents.forEach(opp => {
            // Movimento dos oponentes
            opp.z += opp.speed * delta / 20;
            
            // Volta à posição inicial quando sai da tela
            if (opp.z > 1000) {
                opp.z = -2000 - Math.random() * 1000;
                opp.lap++;
            }
            
            // Mudança de faixa ocasional
            if (Math.random() < 0.001) {
                opp.lane = Math.floor(Math.random() * 3) - 1; // -1, 0 ou 1
            }
            
            // Suaviza movimento lateral
            const targetX = opp.lane * 100;
            opp.x += (targetX - opp.x) * 0.02 * delta;
        });
    }

    updatePositions() {
        const allCars = [
            { id: -1, z: this.player.z, lap: this.player.lap },
            ...this.opponents.map((o, i) => ({ id: i, z: o.z, lap: o.lap }))
        ].sort((a, b) => (b.lap - a.lap) || (b.z - a.z));

        allCars.forEach((car, i) => {
            if (car.id === -1) {
                this.player.position = i + 1;
                this.dom.ui.position.textContent = `${i + 1}º`;
            } else {
                this.opponents[car.id].position = i + 1;
            }
        });
    }

    updateRace() {
        // Atualiza progresso da volta
        const lapLength = 5000;
        const newLap = Math.floor(this.player.z / lapLength) + 1;
        
        if (newLap > this.player.lap) {
            this.player.lap = newLap;
            this.dom.ui.lap.textContent = newLap;
            if (newLap > this.race.maxLaps) this.finishRace();
        }
    }

    render() {
        // Renderiza a pista (efeito de perspectiva)
        const roadBaseY = 300;
        const scale = 1000 / (1000 + this.player.z);
        this.dom.road.style.transform = `rotateX(60deg) translateZ(${this.player.z}px)`;
        
        // Renderiza o jogador (sempre no mesmo lugar)
        this.dom.playerCar.style.transform = `translateX(${this.player.x}px)`;
        
        // Renderiza os oponentes
        this.opponents.forEach(opp => {
            const oppScale = 1000 / (1000 + opp.z - this.player.z);
            const oppX = 400 + opp.x - this.player.x;
            const oppY = 500 - (opp.z - this.player.z) * 0.2;
            
            opp.element.style.transform = `
                translateX(${oppX}px)
                translateY(${oppY}px)
                scale(${oppScale})
            `;
            opp.element.style.zIndex = Math.floor(1000 - opp.z);
            opp.element.style.opacity = oppScale > 0 ? 1 : 0;
        });
    }

    updateUI() {
        this.dom.ui.speed.textContent = Math.floor(this.player.speed);
        this.dom.ui.needle.style.transform = `translateX(-50%) rotate(${(this.player.speed / this.player.maxSpeed) * 270 - 135}deg)`;
        this.dom.ui.boost.style.transform = `scaleX(${this.player.boost / 100})`;
        
        if (this.state.racing) {
            this.state.time = performance.now();
            this.dom.ui.time.textContent = this.formatTime(this.state.time - this.race.startTime);
        }
    }

    formatTime(ms) {
        const date = new Date(ms);
        return `${date.getUTCMinutes().toString().padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}.${Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0')}`;
    }

    gameLoop(now) {
        this.state.delta = now - this.state.lastFrame;
        this.state.lastFrame = now;
        
        if (this.state.racing) {
            this.updatePlayer(this.state.delta);
            this.updateOpponents(this.state.delta);
            this.updateRace();
            this.updatePositions();
            this.render();
        }
        
        this.updateUI();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

window.addEventListener('load', () => new TopGearGame());