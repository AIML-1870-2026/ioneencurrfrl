/**
 * Pink Snake Game
 * A delightfully pink snake game with emergent complexity
 * Three simple rules create infinite challenge:
 * 1. Eat food → Grow longer
 * 2. Don't hit yourself
 * 3. Don't hit walls
 */

// Game Configuration
const CONFIG = {
    gridSize: 20,
    canvasSize: 400,
    difficulty: {
        easy: { speed: 150, speedIncrease: 2 },
        medium: { speed: 100, speedIncrease: 3 },
        hard: { speed: 70, speedIncrease: 4 }
    },
    colors: {
        primaryPink: '#FF69B4',
        secondaryPink: '#FFB6C1',
        accentPink: '#FF1493',
        darkPink: '#C71585',
        neonPink: '#FF10F0',
        background: '#FFF0F5'
    },
    powerUpDuration: 5000,
    powerUpChance: 0.15
};

// Game State
let game = {
    snake: [],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 0, y: 0 },
    powerUp: null,
    score: 0,
    highScore: 0,
    isRunning: false,
    isPaused: false,
    gameLoop: null,
    speed: CONFIG.difficulty.medium.speed,
    speedIncrease: CONFIG.difficulty.medium.speedIncrease,
    multiplier: 1,
    isInvincible: false,
    activePowerUp: null,
    powerUpTimer: null
};

// Settings
let settings = {
    difficulty: 'medium',
    soundEnabled: true,
    musicEnabled: false,
    powerUpsEnabled: true
};

// Audio Context for sound effects
let audioContext = null;

// DOM Elements
const elements = {
    startScreen: document.getElementById('startScreen'),
    settingsScreen: document.getElementById('settingsScreen'),
    gameScreen: document.getElementById('gameScreen'),
    pauseScreen: document.getElementById('pauseScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    canvas: document.getElementById('gameCanvas'),
    startHighScore: document.getElementById('startHighScore'),
    currentScore: document.getElementById('currentScore'),
    finalScore: document.getElementById('finalScore'),
    newHighScore: document.getElementById('newHighScore'),
    multiplierDisplay: document.getElementById('multiplierDisplay'),
    multiplierValue: document.getElementById('multiplierValue'),
    canvasContainer: document.querySelector('.canvas-container'),
    particles: document.getElementById('particles')
};

const ctx = elements.canvas.getContext('2d');

// Initialize Canvas Size
function initCanvas() {
    const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 250, 400);
    const size = Math.floor(maxSize / CONFIG.gridSize) * CONFIG.gridSize;
    elements.canvas.width = size;
    elements.canvas.height = size;
    CONFIG.canvasSize = size;
}

// Initialize Game
function init() {
    loadHighScore();
    loadSettings();
    initCanvas();
    setupEventListeners();
    updateHighScoreDisplay();

    // Handle window resize
    window.addEventListener('resize', () => {
        if (!game.isRunning) {
            initCanvas();
        }
    });
}

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('pinkSnakeHighScore');
    game.highScore = saved ? parseInt(saved) : 0;
}

// Save high score to localStorage
function saveHighScore() {
    localStorage.setItem('pinkSnakeHighScore', game.highScore.toString());
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('pinkSnakeSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    applySettings();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('pinkSnakeSettings', JSON.stringify(settings));
}

// Apply settings to UI
function applySettings() {
    document.getElementById('difficultySelect').value = settings.difficulty;
    document.getElementById('soundToggle').checked = settings.soundEnabled;
    document.getElementById('musicToggle').checked = settings.musicEnabled;
    document.getElementById('powerupsToggle').checked = settings.powerUpsEnabled;

    const diff = CONFIG.difficulty[settings.difficulty];
    game.speed = diff.speed;
    game.speedIncrease = diff.speedIncrease;
}

// Update high score display
function updateHighScoreDisplay() {
    elements.startHighScore.textContent = game.highScore;
}

// Setup Event Listeners
function setupEventListeners() {
    // Start screen buttons
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);

    // Settings screen
    document.getElementById('backBtn').addEventListener('click', hideSettings);
    document.getElementById('difficultySelect').addEventListener('change', (e) => {
        settings.difficulty = e.target.value;
        const diff = CONFIG.difficulty[settings.difficulty];
        game.speed = diff.speed;
        game.speedIncrease = diff.speedIncrease;
        saveSettings();
    });
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        saveSettings();
    });
    document.getElementById('musicToggle').addEventListener('change', (e) => {
        settings.musicEnabled = e.target.checked;
        saveSettings();
    });
    document.getElementById('powerupsToggle').addEventListener('change', (e) => {
        settings.powerUpsEnabled = e.target.checked;
        saveSettings();
    });

    // Game screen
    document.getElementById('pauseBtn').addEventListener('click', togglePause);

    // Pause screen
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('quitBtn').addEventListener('click', quitToMenu);

    // Game over screen
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    document.getElementById('menuBtn').addEventListener('click', quitToMenu);

    // Keyboard controls
    document.addEventListener('keydown', handleKeydown);

    // Touch/Swipe controls
    setupTouchControls();

    // Mobile button controls
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const direction = btn.dataset.direction;
            handleDirectionInput(direction);
        });
    });
}

// Handle keyboard input
function handleKeydown(e) {
    if (!game.isRunning) return;

    // Pause with Escape or P
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (game.isPaused) return;

    // Direction controls
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            handleDirectionInput('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            handleDirectionInput('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            handleDirectionInput('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            handleDirectionInput('right');
            break;
    }
}

// Handle direction input
function handleDirectionInput(direction) {
    if (game.isPaused) return;

    const { x, y } = game.direction;

    switch (direction) {
        case 'up':
            if (y !== 1) game.nextDirection = { x: 0, y: -1 };
            break;
        case 'down':
            if (y !== -1) game.nextDirection = { x: 0, y: 1 };
            break;
        case 'left':
            if (x !== 1) game.nextDirection = { x: -1, y: 0 };
            break;
        case 'right':
            if (x !== -1) game.nextDirection = { x: 1, y: 0 };
            break;
    }
}

// Setup touch/swipe controls
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30;

    elements.canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });

    elements.canvas.addEventListener('touchend', (e) => {
        if (!game.isRunning || game.isPaused) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            handleDirectionInput(dx > 0 ? 'right' : 'left');
        } else {
            handleDirectionInput(dy > 0 ? 'down' : 'up');
        }
    });
}

// Screen management
function showScreen(screen) {
    [elements.startScreen, elements.settingsScreen, elements.gameScreen,
        elements.pauseScreen, elements.gameOverScreen].forEach(s => {
            s.classList.add('hidden');
        });
    screen.classList.remove('hidden');
}

function showSettings() {
    showScreen(elements.settingsScreen);
}

function hideSettings() {
    showScreen(elements.startScreen);
}

// Start new game
function startGame() {
    initCanvas();
    resetGame();
    showScreen(elements.gameScreen);
    game.isRunning = true;
    game.isPaused = false;
    gameLoop();
}

// Reset game state
function resetGame() {
    const centerX = Math.floor(CONFIG.canvasSize / CONFIG.gridSize / 2);
    const centerY = Math.floor(CONFIG.canvasSize / CONFIG.gridSize / 2);

    game.snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    game.score = 0;
    game.multiplier = 1;
    game.isInvincible = false;
    game.activePowerUp = null;
    game.powerUp = null;

    const diff = CONFIG.difficulty[settings.difficulty];
    game.speed = diff.speed;

    elements.currentScore.textContent = '0';
    elements.multiplierDisplay.classList.add('hidden');
    elements.canvasContainer.classList.remove('shield-active');

    if (game.powerUpTimer) {
        clearTimeout(game.powerUpTimer);
        game.powerUpTimer = null;
    }

    spawnFood();
}

// Main game loop
function gameLoop() {
    if (!game.isRunning || game.isPaused) return;

    update();
    draw();

    game.gameLoop = setTimeout(gameLoop, game.speed);
}

// Update game state
function update() {
    // Apply next direction
    game.direction = { ...game.nextDirection };

    // Calculate new head position
    const head = { ...game.snake[0] };
    head.x += game.direction.x;
    head.y += game.direction.y;

    const gridCount = CONFIG.canvasSize / CONFIG.gridSize;

    // Check wall collision
    if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
        if (!game.isInvincible) {
            gameOver();
            return;
        }
        // Wrap around if invincible
        if (head.x < 0) head.x = gridCount - 1;
        if (head.x >= gridCount) head.x = 0;
        if (head.y < 0) head.y = gridCount - 1;
        if (head.y >= gridCount) head.y = 0;
    }

    // Check self collision
    if (!game.isInvincible && game.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // Add new head
    game.snake.unshift(head);

    // Check food collision
    if (head.x === game.food.x && head.y === game.food.y) {
        eatFood();
    } else {
        // Remove tail if no food eaten
        game.snake.pop();
    }

    // Check power-up collision
    if (game.powerUp && head.x === game.powerUp.x && head.y === game.powerUp.y) {
        collectPowerUp();
    }
}

// Eat food
function eatFood() {
    const points = 10 * game.multiplier;
    game.score += points;
    elements.currentScore.textContent = game.score;

    // Play sound
    playSound('eat');

    // Create particles at food position
    createParticles(
        game.food.x * CONFIG.gridSize + CONFIG.gridSize / 2,
        game.food.y * CONFIG.gridSize + CONFIG.gridSize / 2
    );

    // Spawn new food
    spawnFood();

    // Maybe spawn power-up
    if (settings.powerUpsEnabled && !game.powerUp && Math.random() < CONFIG.powerUpChance) {
        spawnPowerUp();
    }

    // Increase speed (emergent difficulty enhancement)
    game.speed = Math.max(50, game.speed - game.speedIncrease);
}

// Spawn food at random location
function spawnFood() {
    const gridCount = CONFIG.canvasSize / CONFIG.gridSize;
    let newFood;

    do {
        newFood = {
            x: Math.floor(Math.random() * gridCount),
            y: Math.floor(Math.random() * gridCount)
        };
    } while (
        game.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        (game.powerUp && game.powerUp.x === newFood.x && game.powerUp.y === newFood.y)
    );

    game.food = newFood;
}

// Spawn power-up
function spawnPowerUp() {
    const gridCount = CONFIG.canvasSize / CONFIG.gridSize;
    const types = ['speed', 'multiplier', 'invincible'];
    let newPowerUp;

    do {
        newPowerUp = {
            x: Math.floor(Math.random() * gridCount),
            y: Math.floor(Math.random() * gridCount),
            type: types[Math.floor(Math.random() * types.length)]
        };
    } while (
        game.snake.some(segment => segment.x === newPowerUp.x && segment.y === newPowerUp.y) ||
        (game.food.x === newPowerUp.x && game.food.y === newPowerUp.y)
    );

    game.powerUp = newPowerUp;

    // Power-up disappears after some time
    setTimeout(() => {
        if (game.powerUp === newPowerUp) {
            game.powerUp = null;
        }
    }, 8000);
}

// Collect power-up
function collectPowerUp() {
    if (!game.powerUp) return;

    const type = game.powerUp.type;
    game.powerUp = null;

    playSound('powerup');

    // Clear existing power-up timer
    if (game.powerUpTimer) {
        clearTimeout(game.powerUpTimer);
    }

    // Apply power-up effect
    switch (type) {
        case 'speed':
            game.activePowerUp = 'speed';
            game.speed = Math.max(30, game.speed - 30);
            showPowerUpNotification('Speed Boost!');
            break;
        case 'multiplier':
            game.activePowerUp = 'multiplier';
            game.multiplier = 2;
            elements.multiplierDisplay.classList.remove('hidden');
            elements.multiplierValue.textContent = '2';
            showPowerUpNotification('Double Points!');
            break;
        case 'invincible':
            game.activePowerUp = 'invincible';
            game.isInvincible = true;
            elements.canvasContainer.classList.add('shield-active');
            showPowerUpNotification('Invincible!');
            break;
    }

    // Set timer to end power-up
    game.powerUpTimer = setTimeout(() => {
        endPowerUp();
    }, CONFIG.powerUpDuration);
}

// End power-up effect
function endPowerUp() {
    if (game.activePowerUp === 'multiplier') {
        game.multiplier = 1;
        elements.multiplierDisplay.classList.add('hidden');
    } else if (game.activePowerUp === 'invincible') {
        game.isInvincible = false;
        elements.canvasContainer.classList.remove('shield-active');
    } else if (game.activePowerUp === 'speed') {
        const diff = CONFIG.difficulty[settings.difficulty];
        game.speed = diff.speed - (game.snake.length - 3) * game.speedIncrease;
        game.speed = Math.max(50, game.speed);
    }

    game.activePowerUp = null;
    game.powerUpTimer = null;
}

// Show power-up notification
function showPowerUpNotification(text) {
    const notification = document.createElement('div');
    notification.className = 'power-up-active';
    notification.textContent = text;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);

    // Draw grid (subtle)
    drawGrid();

    // Draw food
    drawFood();

    // Draw power-up
    if (game.powerUp) {
        drawPowerUp();
    }

    // Draw snake
    drawSnake();
}

// Draw subtle grid
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 182, 193, 0.3)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= CONFIG.canvasSize; i += CONFIG.gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CONFIG.canvasSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CONFIG.canvasSize, i);
        ctx.stroke();
    }
}

// Draw snake with gradient and glow
function drawSnake() {
    game.snake.forEach((segment, index) => {
        const x = segment.x * CONFIG.gridSize;
        const y = segment.y * CONFIG.gridSize;
        const size = CONFIG.gridSize - 2;

        // Calculate gradient color based on position
        const ratio = index / game.snake.length;
        const r = Math.round(255 - ratio * 50);
        const g = Math.round(105 - ratio * 50);
        const b = Math.round(180 - ratio * 30);

        // Glow effect
        ctx.shadowColor = CONFIG.colors.neonPink;
        ctx.shadowBlur = index === 0 ? 15 : 8;

        // Draw segment
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, size, size, 5);
        ctx.fill();

        // Draw eyes on head
        if (index === 0) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';

            const eyeSize = 4;
            const eyeOffset = 5;

            // Position eyes based on direction
            let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

            if (game.direction.x === 1) { // Right
                leftEyeX = x + size - eyeOffset;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + size - eyeOffset;
                rightEyeY = y + size - eyeOffset - eyeSize;
            } else if (game.direction.x === -1) { // Left
                leftEyeX = x + eyeOffset - eyeSize + 2;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + eyeOffset - eyeSize + 2;
                rightEyeY = y + size - eyeOffset - eyeSize;
            } else if (game.direction.y === -1) { // Up
                leftEyeX = x + eyeOffset;
                leftEyeY = y + eyeOffset - eyeSize + 2;
                rightEyeX = x + size - eyeOffset - eyeSize;
                rightEyeY = y + eyeOffset - eyeSize + 2;
            } else { // Down
                leftEyeX = x + eyeOffset;
                leftEyeY = y + size - eyeOffset;
                rightEyeX = x + size - eyeOffset - eyeSize;
                rightEyeY = y + size - eyeOffset;
            }

            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = CONFIG.colors.darkPink;
            ctx.beginPath();
            ctx.arc(leftEyeX + game.direction.x, leftEyeY + game.direction.y, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(rightEyeX + game.direction.x, rightEyeY + game.direction.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    });
}

// Draw food with sparkle effect
function drawFood() {
    const x = game.food.x * CONFIG.gridSize + CONFIG.gridSize / 2;
    const y = game.food.y * CONFIG.gridSize + CONFIG.gridSize / 2;
    const size = CONFIG.gridSize / 2 - 2;

    // Glow
    ctx.shadowColor = CONFIG.colors.accentPink;
    ctx.shadowBlur = 15;

    // Main food circle
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, CONFIG.colors.accentPink);
    gradient.addColorStop(1, CONFIG.colors.darkPink);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle effect
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const sparkleTime = Date.now() / 200;
    const sparkleOffset = Math.sin(sparkleTime) * 2;

    ctx.beginPath();
    ctx.arc(x - 3 + sparkleOffset, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw power-up
function drawPowerUp() {
    const x = game.powerUp.x * CONFIG.gridSize + CONFIG.gridSize / 2;
    const y = game.powerUp.y * CONFIG.gridSize + CONFIG.gridSize / 2;
    const size = CONFIG.gridSize / 2 - 1;

    // Different colors for different power-ups
    let color;
    switch (game.powerUp.type) {
        case 'speed':
            color = '#FF00FF'; // Magenta
            break;
        case 'multiplier':
            color = '#FFD700'; // Gold with pink tint
            break;
        case 'invincible':
            color = '#FFC0CB'; // Pale pink
            break;
    }

    // Pulsing glow
    const pulse = Math.sin(Date.now() / 150) * 5 + 10;
    ctx.shadowColor = color;
    ctx.shadowBlur = pulse;

    // Draw star shape
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
}

// Create particle effects
function createParticles(x, y) {
    const canvasRect = elements.canvas.getBoundingClientRect();
    const containerRect = elements.canvasContainer.getBoundingClientRect();

    const offsetX = canvasRect.left - containerRect.left + 15;
    const offsetY = canvasRect.top - containerRect.top + 15;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const angle = (Math.PI * 2 * i) / 8;
        const distance = 30 + Math.random() * 20;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;

        particle.style.left = (canvasRect.left + x) + 'px';
        particle.style.top = (canvasRect.top + y) + 'px';
        particle.style.setProperty('--end-x', endX + 'px');
        particle.style.setProperty('--end-y', endY + 'px');

        // Random pink shade
        const pinkShades = ['#FF69B4', '#FF1493', '#FFB6C1', '#FF10F0'];
        particle.style.background = pinkShades[Math.floor(Math.random() * pinkShades.length)];

        elements.particles.appendChild(particle);

        // Animate
        particle.animate([
            { transform: 'scale(1) translate(0, 0)', opacity: 1 },
            { transform: `scale(0) translate(${endX}px, ${endY}px)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

// Sound effects using Web Audio API
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!settings.soundEnabled) return;

    try {
        initAudio();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'eat':
                oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1); // A5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'powerup':
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case 'gameover':
                oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
                oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15); // F4
                oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.3); // D4
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
        }
    } catch (e) {
        // Audio not supported, fail silently
    }
}

// Game Over
function gameOver() {
    game.isRunning = false;

    if (game.gameLoop) {
        clearTimeout(game.gameLoop);
    }

    if (game.powerUpTimer) {
        clearTimeout(game.powerUpTimer);
    }

    playSound('gameover');

    // Check high score
    const isNewHighScore = game.score > game.highScore;
    if (isNewHighScore) {
        game.highScore = game.score;
        saveHighScore();
    }

    // Show game over screen
    elements.finalScore.textContent = game.score;
    elements.newHighScore.classList.toggle('hidden', !isNewHighScore);
    elements.gameOverScreen.classList.remove('hidden');

    updateHighScoreDisplay();
}

// Pause/Resume
function togglePause() {
    if (!game.isRunning) return;

    if (game.isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

function pauseGame() {
    game.isPaused = true;
    if (game.gameLoop) {
        clearTimeout(game.gameLoop);
    }
    elements.pauseScreen.classList.remove('hidden');
}

function resumeGame() {
    game.isPaused = false;
    elements.pauseScreen.classList.add('hidden');
    gameLoop();
}

function restartGame() {
    elements.pauseScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    startGame();
}

function quitToMenu() {
    game.isRunning = false;
    game.isPaused = false;

    if (game.gameLoop) {
        clearTimeout(game.gameLoop);
    }

    if (game.powerUpTimer) {
        clearTimeout(game.powerUpTimer);
    }

    elements.pauseScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');
    elements.canvasContainer.classList.remove('shield-active');

    showScreen(elements.startScreen);
    updateHighScoreDisplay();
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
