const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ballRadius = 10;
let balls = []; // 儲存多顆球的數組
let paddleHeight = 10;
const paddleWidth = 75;
let paddleX;

let rightPressed = false;
let leftPressed = false;
let jumpPressed = false; // 跳躍按鈕狀態

let brickRowCount; // 磚塊行數
const brickColumnCount = 5; // 固定每行顯示5個磚塊
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let score;
let lives; // 玩家生命數
let bricks = [];
let gameOver = false;
let timeLeft;
let timer;
let timeChallengeMode = false;
let highScore = 0; // 最高分

// 記錄球的歷史位置以繪製尾跡
const tailLength = 10; // 尾跡的長度

let comboCount = 0; // 連擊次數
const comboScoreMultiplier = 2; // 連擊加分乘數
let lastHitTime = 0; // 上次擊中的時間

// 跳躍相關變數
let jumpCooldown = false; // 跳躍冷卻
const jumpHeight = 30; // 跳躍高度
const jumpCooldownTime = 2000; // 冷卻時間 (毫秒)

// 獎勵分數
const scoreRewardThreshold = 100; // 獲得獎勵的分數閾值
const timeExtension = 15; // 獎勵延長的時間 (秒)
const lifeReward = 1; // 獎勵增加的生命數

function initBricks() {
    bricks = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickColumnCount; c++) {
            let hitCount;
            if (document.getElementById('difficulty').value === 'easy') {
                hitCount = 1; // 簡單模式下，所有磚塊只需要1次擊打
            } else {
                const specialBrickChance = Math.random(); // 隨機機會決定是否為特殊磚塊
                hitCount = specialBrickChance < 0.3 ? Math.floor(Math.random() * 3) + 2 : 1; // 中等和困難模式下30%機會為需要多次擊打的磚塊
            }
            bricks[r][c] = { x: 0, y: 0, status: hitCount, hitCount: hitCount }; // 將狀態設置為需擊打次數
        }
    }
}

// 初始化球
function initBalls() {
    balls = []; // 清空球數組
    const initialBall = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: 2,
        dy: -2,
        tail: [] // 每顆球的尾跡
    };
    balls.push(initialBall); // 添加初始球
}

// 更新每顆球的尾跡
function updateBallsTail() {
    for (const ball of balls) {
        if (ball.tail.length >= tailLength) {
            ball.tail.shift(); // 移除最舊的尾跡
        }
        ball.tail.push([ball.x, ball.y]); // 添加當前位置到尾跡
    }
}

document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('click', jumpHandler); // 監聽滑鼠點擊事件

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === ' ') {
        jumpPressed = true; // 按下空白鍵啟動跳躍
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    } else if (e.key === ' ') {
        jumpPressed = false; // 釋放空白鍵停止跳躍
    }
}

function jumpHandler() {
    if (!jumpCooldown) {
        paddleX += 0; // 不移動擋板的 X 軸
        paddleHeight += jumpHeight; // 增加擋板高度以模擬跳躍
        jumpCooldown = true; // 開始冷卻

        setTimeout(() => {
            paddleHeight -= jumpHeight; // 恢復擋板高度
            jumpCooldown = false; // 結束冷卻
        }, jumpCooldownTime);
    }
}

function collisionDetection() {
    const currentTime = Date.now();
    for (const ball of balls) {
        for (let r = 0; r < brickRowCount; r++) {
            for (let c = 0; c < brickColumnCount; c++) {
                const b = bricks[r][c];
                if (b.status > 0) {
                    if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                        ball.dy = -ball.dy; // 反彈
                        b.status--; // 碰到後減少擊打次數
                        // 播放擊打音效
                        document.getElementById('hitSound').play();
                        
                        // 檢查連擊
                        if (currentTime - lastHitTime < 1000) { // 1秒內連擊
                            comboCount++;
                        } else {
                            comboCount = 1; // 重置連擊計數
                        }
                        lastHitTime = currentTime; // 更新上次擊中的時間

                        // 計算分數
                        score += 10 * (comboCount > 1 ? comboScoreMultiplier : 1); // 連擊加分
                        if (b.status === 0) {
                            // 磚塊被擊破，檢查獎勵
                            if (score % scoreRewardThreshold === 0) { // 每當分數達到閾值時
                                if (Math.random() < 0.5) {
                                    // 增加生命
                                    lives += lifeReward;
                                    document.getElementById('livesDisplay').innerText = lives;
                                } else {
                                    // 隨機延長時間
                                    timeLeft += timeExtension;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function drawBalls() {
    for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();

        // 繪製尾跡
        ctx.strokeStyle = '#0095DD';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < ball.tail.length; i++) {
            const [x, y] = ball.tail[i];
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            const b = bricks[r][c];
            if (b.status > 0) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;

                b.x = brickX; // 更新磚塊位置
                b.y = brickY; // 更新磚塊位置

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = '#0095DD';
                ctx.fill();
                ctx.closePath();

                // 繪製擊打次數
                ctx.fillStyle = 'white'; // 使用白色文字顯示
                ctx.font = '12px Arial';
                ctx.fillText(b.status, brickX + brickWidth / 2 - 5, brickY + brickHeight / 2 + 5); // 在磚塊中間顯示
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawPaddle();
    drawBalls();
    collisionDetection();

    updateBallsTail(); // 更新每顆球的尾跡

    for (const ball of balls) {
        // 碰到邊界反彈
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        } else if (ball.y + ball.dy > canvas.height - ballRadius) {
            if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                ball.dy = -ball.dy; // 碰到球拍反彈
            } else {
                // 球掉落
                balls.splice(balls.indexOf(ball), 1); // 移除掉落的球
                if (balls.length === 0) {
                    lives--;
                    if (lives === 0) {
                        gameOver = true;
                        document.getElementById('gameOver').style.display = 'block';
                        document.getElementById('restart').style.display = 'block';
                        if (score > highScore) {
                            highScore = score; // 更新最高分
                            localStorage.setItem('highScore', highScore); // 存儲最高分
                        }
                        return;
                    } else {
                        initBalls(); // 重置球
                    }
                }
            }
        }

        ball.x += ball.dx;
        ball.y += ball.dy;
    }

    // 移動球拍
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    // 更新剩餘時間
    if (timeChallengeMode) {
        timeLeft--;
        if (timeLeft <= 0) {
            gameOver = true;
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('restart').style.display = 'block';
            if (score > highScore) {
                highScore = score; // 更新最高分
                localStorage.setItem('highScore', highScore); // 存儲最高分
            }
            return;
        }
        document.getElementById('timeDisplay').innerText = timeLeft;
    }

    document.getElementById('scoreDisplay').innerText = score;
    document.getElementById('livesDisplay').innerText = lives;
    requestAnimationFrame(draw);
}

function startGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('restart').style.display = 'none';
    score = 0;
    lives = 3;
    gameOver = false;
    paddleX = (canvas.width - paddleWidth) / 2;
    brickRowCount = document.getElementById('difficulty').value === 'easy' ? 2 : document.getElementById('difficulty').value === 'medium' ? 3 : 4;
    initBricks();
    initBalls();
    timeChallengeMode = document.getElementById('timeChallenge').checked;
    timeLeft = 3600; // 初始60秒
    highScore = localStorage.getItem('highScore') || 0; // 從本地存儲獲取最高分
    document.getElementById('highScoreDisplay').innerText = highScore;

    if (timeChallengeMode) {
        timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
            } else {
                timeLeft--;
            }
        }, 1000);
    }
    draw();

    // 開始背景音樂
    const backgroundMusic = document.getElementById('backgroundMusic');
    backgroundMusic.play();
}
