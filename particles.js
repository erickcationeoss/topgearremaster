const particlesContainer = document.getElementById('particles');

function createParticles(x, y, intensity) {
    const particleCount = Math.floor(5 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posição inicial
        const posX = x + (Math.random() * 60 - 30);
        const posY = y + (Math.random() * 40 - 20);
        
        particle.style.left = `${posX}px`;
        particle.style.bottom = `${posY}px`;
        
        // Tamanho aleatório
        const size = 2 + Math.random() * 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Cor aleatória (tons de amarelo/laranja)
        const hue = 40 + Math.random() * 30;
        particle.style.background = `hsl(${hue}, 100%, 50%)`;
        
        particlesContainer.appendChild(particle);
        
        // Animação
        const animationDuration = 0.5 + Math.random() * 1;
        
        particle.animate([
            { 
                transform: 'translateY(0) scale(1)',
                opacity: 0.8 
            },
            { 
                transform: `translateY(${100 + Math.random() * 50}px) scale(0.2)`,
                opacity: 0 
            }
        ], {
            duration: animationDuration * 1000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        // Remove a partícula após animação
        setTimeout(() => {
            particle.remove();
        }, animationDuration * 1000);
    }
}