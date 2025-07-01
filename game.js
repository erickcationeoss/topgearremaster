// Configurações do canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sprites (caminhos relativos)
const SPRITES = {
    MARIO: 'assets/mario.png',
    GOOMBA: 'assets/goomba.png',
    BLOCK: 'assets/block.png',
    GROUND: 'assets/ground.png'
};

// Carrega imagens
const IMAGES = {};
let loadedImages = 0;

function loadImage(key, src) {
    IMAGES[key] = new Image();
    IMAGES[key].src = src;
    IMAGES[key].onload = () => {
        loadedImages++;
        if (loadedImages === Object.keys(SPRITES).length) {
            gameLoop();
        }
    };
}

// Carrega todos os sprites
Object.keys(SPRITES).forEach(key => {
    loadImage(key, SPRITES[key]);
});

// Objetos do jogo
const mario = {
    x: 50,
    y: 300,
    width: 32,
    height: 48,
    speedX: 0,
    speedY: 0,
    isJumping: false,
    frame: 0
};

const goombas = [
    { x: 600, y: 332, width: 32, height: 32, speedX: -2 }
];

const blocks = [
    { x: 300, y: 250, width: 64, height: 64 },
    { x: 500, y: 200, width: 64, height: 64 }
];

// Controles
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Funções do jogo
function update() {
    // Movimento do Mario
    if (keys['ArrowLeft']) {
        mario.speedX = -5;
        mario.frame = (mario.frame + 0.2) % 4; // Animação
    } else if (keys['ArrowRight']) {
        mario.speedX = 5;
        mario.frame = (mario.frame + 0.2) % 4;
    } else {
        mario.speedX = 0;
        mario.frame = 0;
    }

    if (keys['ArrowUp'] && !mario.isJumping) {
        mario.speedY = -15;
        mario.isJumping = true;
    }

    // Física
    mario.speedY += 0.8;
    mario.x += mario.speedX;
    mario.y += mario.speedY;

    // Colisão com o chão
    if (mario.y + mario.height > canvas.height - 50) {
        mario.y = canvas.height - 50 - mario.height;
        mario.speedY = 0;
        mario.isJumping = false;
    }

    // Movimento dos Goombas
    goombas.forEach(goomba => {
        goomba.x += goomba.speedX;
        if (goomba.x < -50) goomba.x = canvas.width;
    });
}

function render() {
    // Céu
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chão
    ctx.drawImage(IMAGES.GROUND, 0, canvas.height - 50, canvas.width, 50);

    // Blocos
    blocks.forEach(block => {
        ctx.drawImage(IMAGES.BLOCK, block.x, block.y, block.width, block.height);
    });

    // Goombas
    goombas.forEach(goomba => {
        ctx.drawImage(IMAGES.GOOMBA, goomba.x, goomba.y, goomba.width, goomba.height);
    });

    // Mario (com animação)
    const frameX = Math.floor(mario.frame) * mario.width;
    ctx.drawImage(
        IMAGES.MARIO,
        frameX, 0, mario.width, mario.height,
        mario.x, mario.y, mario.width, mario.height
    );
}

// Loop principal
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}