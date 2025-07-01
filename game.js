// Configurações
const player = document.getElementById('player');
const goomba = document.querySelector('.goomba');
let playerX = 50;
let isJumping = false;
let jumpVelocity = 0;
const gravity = 0.8;

// Controles
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') playerX -= 10;
    if (e.key === 'ArrowRight') playerX += 10;
    if (e.key === 'ArrowUp' && !isJumping) {
        jumpVelocity = -15;
        isJumping = true;
    }
    player.style.left = playerX + 'px';
});

// Física do pulo
function update() {
    if (isJumping) {
        jumpVelocity += gravity;
        const playerY = parseInt(player.style.bottom || '60') + jumpVelocity;
        
        if (playerY >= 60) { // Chegou no chão
            player.style.bottom = '60px';
            isJumping = false;
        } else {
            player.style.bottom = playerY + 'px';
        }
    }

    // Movimento do Goomba (simples)
    const goombaX = parseInt(goomba.style.left || '500');
    goomba.style.left = (goombaX - 2) + 'px';
    if (goombaX < -30) goomba.style.left = '800px';

    requestAnimationFrame(update);
}

update();