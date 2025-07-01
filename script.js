// Elementos do jogo (seleção original)
const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const cloud = document.querySelector('.cloud');
const gameOver = document.querySelector('.game-over');
const restartButton = document.querySelector('.restart');

// Elementos do fliperama (novos)
const joystick = document.querySelector('.joystick');
const actionButtons = document.querySelectorAll('.button');
const coinSlot = document.querySelector('.coin-slot');

// Estados do jogo
let gameRunning = true;
let gameLoopInterval;

// Função de pulo (original)
const jump = () => {
    if (!gameRunning) return;
    
    mario.classList.add('jump');
    
    // Efeito no joystick
    joystick.style.transform = 'translateY(5px)';
    setTimeout(() => {
        joystick.style.transform = '';
    }, 200);

    setTimeout(() => {
        mario.classList.remove('jump');
    }, 500);
}

// Função de colisão (original com melhorias)
const checkCollision = () => {
    const pipePosition = pipe.offsetLeft;
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');
    
    if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
        // Parar animações
        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;
        
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        
        // Trocar sprite do Mario
        mario.src = 'assets/imgs/game-over.png';
        mario.style.width = '70px';
        mario.style.marginLeft = '35px';
        
        // Efeitos no fliperama
        document.querySelector('.marquee').style.animation = 'glitch 0.5s infinite';
        actionButtons.forEach(btn => btn.style.opacity = '0.5');
        
        // Mostrar tela de game over
        gameOver.style.visibility = 'visible';
        gameRunning = false;
        
        clearInterval(gameLoopInterval);
    }
}

// Função de reinício (original com melhorias)
const restartGame = () => {
    // Resetar elementos do jogo
    pipe.style.animation = 'pipe-animations 1.5s infinite linear';
    pipe.style.left = '';
    
    mario.src = 'assets/imgs/mario.gif';
    mario.style.width = '130px';
    mario.style.bottom = '0px';
    mario.style.marginLeft = '';
    mario.style.animation = '';
    
    // Resetar efeitos do fliperama
    document.querySelector('.marquee').style.animation = '';
    actionButtons.forEach(btn => btn.style.opacity = '1');
    
    // Esconder tela de game over
    gameOver.style.visibility = 'hidden';
    gameRunning = true;
    
    // Reiniciar loop do jogo
    startGameLoop();
}

// Loop principal do jogo
const startGameLoop = () => {
    gameLoopInterval = setInterval(checkCollision, 10);
}

// Efeitos interativos no fliperama
coinSlot.addEventListener('click', () => {
    if (!gameRunning) {
        restartGame();
    }
    coinSlot.textContent = 'CREDIT 1';
    setTimeout(() => {
        coinSlot.textContent = 'INSERT COIN';
    }, 2000);
});

actionButtons.forEach(button => {
    button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.9)';
        button.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.8)';
    });
    
    button.addEventListener('mouseup', () => {
        button.style.transform = '';
        button.style.boxShadow = '';
    });
});

// Controles (original + touch para mobile)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === ' ') {
        jump();
    }
});

document.addEventListener('touchstart', jump);

// Botão de reinício (original)
restartButton.addEventListener('click', restartGame);

// Iniciar o jogo
startGameLoop();

// Efeito de piscar "INSERT COIN"
setInterval(() => {
    if (gameRunning) return;
    coinSlot.style.visibility = coinSlot.style.visibility === 'hidden' ? 'visible' : 'hidden';
}, 500);