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
            road: document.getElementById('road-effect'),
            layers: {
                far: document.getElementById('far-layer'),
                mid: document.getElementById('mid-layer'),
                near: document.getElementById('near-layer')
            },
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
                restartBtn: document.getElementById('restart-button')
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
            delta: 0
        };

        this.player = {
            x: 370, y: 540,
            speed: 0, maxSpeed: 300,
            accel: 0.5, rotation: 0,
            boost: 100, turbo: false,
            lap: 0, position: 1
        };

        this.race = {
            laps: 1, maxLaps: 3,
            distance: 0, startTime: 0
        };

        this.keys = { up: false, down: false, left: false, right: false };
        this.opponents = [];
        this.createOpponents(3);
    }

    createOpponents(count) {
        for (let i = 0; i < count; i++) {
            const opp = document.createElement('div');
            opp.className = 'vehicle opponent-car';
            opp.innerHTML = '<div class="car-body"><div class="car-window"></div><div class="car-headlight"></div><div class="car-taillight"></div></div>';
            this.dom.opponents.appendChild(opp);
            
            this.opponents.push({
                element: opp,
                x: 200 + (i % 3) * 150,
                y: 150 + i * 200,
                speed: 120 + i * 30,
                lane: i % 3,
                lap: 0,
                position: i + 1
            });
        }
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
        if (this.keys.up) {
            this.player.speed += this.player.accel * delta;
            if (this.player.speed > 50 && Date.now() % 50 < 5) {
                this.createParticle(this.player.x + 30, this.player.y + 100, 3, '#ff0');
            }
        } else if (this.keys.down) {
            this.player.speed -= this.player.accel * 1.5 * delta;
        } else {
            this.player.speed *= 0.98;
        }

        if (this.player.turbo && this.player.boost > 0) {
            this.player.speed += this.player.accel * 1.5 * delta;
            this.player.boost -= 0.3 * delta;
            if (Date.now() % 30 < 5) {
                this.createParticle(this.player.x + 30, this.player.y + 100, 5, '#0af');
            }
        } else if (this.player.boost < 100) {
            this.player.boost += 0.1 * delta;
        }

        const maxSpeed = this.player.turbo ? this.player.maxSpeed * 1.3 : this.player.maxSpeed;
        this.player.speed = Math.max(0, Math.min(maxSpeed, this.player.speed));

        if (this.player.speed > 10) {
            if (this.keys.left) this.player.rotation -= 0.03 * delta * (this.player.speed / 100);
            if (this.keys.right) this.player.rotation += 0.03 * delta * (this.player.speed / 100);
            if ((this.keys.left || this.keys.right) && this.player.speed > 80 && Date.now() % 100 < 5) {
                this.createParticle(this.player.x + (Math.random() < 0.5 ? 10 : 50), this.player.y + 100, 6, '#aaa');
            }
        }

        this.player.rotation = Math.max(-0.2, Math.min(0.2, this.player.rotation));
        this.player.x += this.player.rotation * this.player.speed * 0.1 * delta;
        this.player.x = Math.max(150, Math.min(this.player.x, 650));

        this.dom.playerCar.style.left = `${this.player.x - 30}px`;
        this.dom.playerCar.style.transform = `rotate(${this.player.rotation}rad)`;
    }

    updateOpponents(delta) {
        this.opponents.forEach((opp, i) => {
            opp.y += opp.speed * delta / 60;
            if (Date.now() % 5000 < 10) opp.lane = Math.floor(Math.random() * 3);
            
            const targetX = 200 + opp.lane * 150;
            opp.x += (targetX - opp.x) * 0.02 * delta;
            
            if (opp.y > 700) {
                opp.y = -100 - i * 100;
                opp.lap++;
                if (opp.lap >= this.race.maxLaps) opp.y = -200;
            }
            
            opp.element.style.left = `${opp.x - 30}px`;
            opp.element.style.bottom = `${opp.y}px`;
        });
    }

    updateRace() {
        this.race.distance += this.player.speed * this.state.delta / 1000;
        const newLap = Math.floor(this.race.distance / 1800) + 1;
        
        if (newLap > this.player.lap) {
            this.player.lap = newLap;
            this.dom.ui.lap.textContent = newLap;
            if (newLap > this.race.maxLaps) this.finishRace();
        }

        const allCars = [
            { id: -1, progress: this.player.lap * 600 + (600 - this.player.y) },
            ...this.opponents.map((o, i) => ({ id: i, progress: o.lap * 600 + (600 - o.y) }))
        ].sort((a, b) => b.progress - a.progress);

        allCars.forEach((car, i) => {
            if (car.id === -1) {
                this.player.position = i + 1;
                this.dom.ui.position.textContent = `${i + 1}º`;
            } else {
                this.opponents[car.id].position = i + 1;
            }
        });
    }

    updateRoad() {
        const offset = this.race.distance;
        this.dom.layers.far.style.backgroundPositionY = `${offset * 0.2 % 40}px`;
        this.dom.layers.mid.style.backgroundPositionY = `${offset * 0.5 % 60}px`;
        this.dom.layers.near.style.backgroundPositionY = `${offset * 0.8 % 80}px`;
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

    createParticle(x, y, size, color) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = color;
        this.dom.particles.appendChild(p);
        
        const driftX = (Math.random() - 0.5) * 20;
        p.animate([
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: `translate(${driftX}px, -20px) scale(0.5)` }
        ], { duration: 800, easing: 'ease-out' }).onfinish = () => p.remove();
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
            this.updateRoad();
        }
        
        this.updateUI();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

window.addEventListener('load', () => new TopGearGame());