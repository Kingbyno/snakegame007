class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [
            { x: 10, y: 10 }
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameRunning = false;
        this.gameLoop = null;
        
        // Difficulty levels - Easy, Medium, Hard
        this.difficultyLevels = {
            easy: 200,    // Very slow - good for beginners
            medium: 150,  // Balanced speed
            hard: 100     // Fast - challenging
        };
        this.currentDifficulty = 'medium'; // Start with medium difficulty
        
        this.initializeGame();
        this.setupEventListeners();
        this.updateHighScoreDisplay();
        this.updateDifficultyDisplay();
    }
    
    initializeGame() {
        this.generateFood();
        this.drawGame();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Game control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Difficulty control buttons with data attributes
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.target.dataset.difficulty;
                this.setDifficulty(difficulty);
            });
        });
        
        // Mobile touch controls
        this.setupTouchControls();
        this.setupSwipeGestures();
        
        // Add button hover effects for desktop
        this.setupButtonEffects();
    }
    
    setupButtonEffects() {
        // Add ripple effect to buttons
        document.querySelectorAll('.btn, .difficulty-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning && e.key !== ' ') return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case ' ':
                e.preventDefault();
                if (this.gameRunning) {
                    this.pauseGame();
                } else {
                    this.startGame();
                }
                break;
        }
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            const currentSpeed = this.difficultyLevels[this.currentDifficulty];
            this.gameLoop = setInterval(() => this.updateGame(), currentSpeed);
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
        }
    }
    
    pauseGame() {
        if (this.gameRunning) {
            this.gameRunning = false;
            clearInterval(this.gameLoop);
            document.getElementById('startBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.generateFood();
        this.updateScore();
        this.drawGame();
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    restartGame() {
        document.getElementById('gameOver').classList.add('hidden');
        this.resetGame();
        this.startGame();
    }
    
    setDifficulty(difficulty) {
        if (this.difficultyLevels.hasOwnProperty(difficulty)) {
            if (this.currentDifficulty === difficulty) return;
            
            // Add visual feedback
            const button = document.querySelector(`[data-difficulty="${difficulty}"]`);
            if (button) {
                button.classList.add('loading');
                setTimeout(() => button.classList.remove('loading'), 300);
            }
            
            this.currentDifficulty = difficulty;
            this.updateDifficultyDisplay();
            
            // Add smooth transition effect
            this.canvas.style.transition = 'all 0.3s ease';
            this.canvas.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                this.canvas.style.transform = 'scale(1)';
            }, 300);
            
            // If game is running, restart with new difficulty
            if (this.gameRunning) {
                this.pauseGame();
                setTimeout(() => this.startGame(), 500);
            }
        }
    }
    
    updateDifficultyDisplay() {
        const difficultyNames = {
            easy: 'Easy',
            medium: 'Medium', 
            hard: 'Hard'
        };
        document.getElementById('difficultyDisplay').textContent = difficultyNames[this.currentDifficulty];
        
        // Update button states
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(this.currentDifficulty + 'Btn').classList.add('active');
    }
    
    setupTouchControls() {
        // Directional button controls
        const directions = ['up', 'down', 'left', 'right'];
        directions.forEach(dir => {
            const btn = document.getElementById(dir + 'Btn');
            if (btn) {
                btn.addEventListener('click', () => this.changeDirection(dir));
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.changeDirection(dir);
                });
            }
        });
    }
    
    setupSwipeGestures() {
        let startX, startY;
        const canvas = this.canvas;
        const minSwipeDistance = 30;
        
        // Touch start
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: false });
        
        // Touch end
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Check if swipe is long enough
            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
                return;
            }
            
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.changeDirection('right');
                } else {
                    this.changeDirection('left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.changeDirection('down');
                } else {
                    this.changeDirection('up');
                }
            }
            
            startX = null;
            startY = null;
        }, { passive: false });
    }
    
    changeDirection(direction) {
        if (!this.gameRunning) return;
        
        switch(direction) {
            case 'up':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'down':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'left':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'right':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
        }
    }
    
    updateGame() {
        this.moveSnake();
        
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        this.checkFoodCollision();
        this.drawGame();
    }
    
    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        this.snake.unshift(head);
        
        if (head.x !== this.food.x || head.y !== this.food.y) {
            this.snake.pop();
        }
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkFoodCollision() {
        const head = this.snake[0];
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.generateFood();
        }
    }
    
    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }
    
    drawGame() {
        this.clearCanvas();
        this.drawSnake();
        this.drawFood();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.gridSize, segment.y * this.gridSize,
                (segment.x + 1) * this.gridSize, (segment.y + 1) * this.gridSize
            );
            
            if (index === 0) {
                // Head of snake with gradient
                gradient.addColorStop(0, '#4ade80');
                gradient.addColorStop(1, '#22c55e');
                this.ctx.fillStyle = gradient;
            } else {
                // Body segments with slightly different gradient
                gradient.addColorStop(0, '#22c55e');
                gradient.addColorStop(1, '#16a34a');
                this.ctx.fillStyle = gradient;
            }
            
            // Add rounded corners for modern look
            const radius = this.gridSize * 0.2;
            this.roundRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2,
                radius
            );
            
            // Add subtle shadow for depth
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fill();
            this.ctx.shadowColor = 'transparent'; // Reset shadow
            
            // Add highlight on head
            if (index === 0) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.roundRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize * 0.3,
                    radius * 0.5
                );
                this.ctx.fill();
            }
        });
    }
    
    // Helper function to draw rounded rectangles
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    drawFood() {
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        
        // Create gradient for food
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.7, '#f56565');
        gradient.addColorStop(1, '#e53e3e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Add subtle shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.shadowColor = 'transparent'; // Reset shadow
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }
    }
    
    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = this.highScore;
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});