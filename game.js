// Configurações do canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// URLs dos sprites (ImgBB)
const SPRITES = {
    MARIO: 'https://i.ibb.co/0jQvY1L/mario-sprite.png',
    GOOMBA: 'https://i.ibb.co/4W2NHYx/goomba.png',
    BLOCK: 'https://i.ibb.co/0ZfQZ6K/block.png'
};

// Carrega imagens
const IMAGES = {};
let assetsLoaded = 0;

function loadImage(key, url) {
    IMAGES[key] = new Image();
    IMAGES[key].src = url;
    IMAGES[key].onload = () => {
        assetsLoaded++;
        if (assetsLoaded === Object.keys(SPRITES).length) {
            gameLoop();
        }
    };
}

// Inicia o carregamento
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
    isJumping: false
};

const goombas = [
    { x: 600, y: 332, width: 32, height: 32, speedX: -2 }
];

const blocks = [
    { x: 300, y: 250, width: 64, height: 64 }
];

// Controles
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Loop do jogo
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Controles do Mario
    if (keys['ArrowLeft']) mario.speedX = -5;
    else if (keys['ArrowRight']) mario.speedX = 5;
    else mario.speedX = 0;

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
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Céu
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height - 50);

    // Chão
    ctx.fillStyle = '#6a4a3a';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Blocos
    blocks.forEach(block => {
        ctx.drawImage(IMAGES.BLOCK, block.x, block.y, block.width, block.height);
    });

    // Goombas
    goombas.forEach(goomba => {
        ctx.drawImage(IMAGES.GOOMBA, goomba.x, goomba.y, goomba.width, goomba.height);
    });

    // Mario
    ctx.drawImage(IMAGES.MARIO, mario.x, mario.y, mario.width, mario.height);
}