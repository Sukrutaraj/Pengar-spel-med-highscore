// CANVAS SETUP
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===== LOAD IMAGES =====
const moneyTypes = [
    { name: "krona1", value: 1, speed: 1.5, width: 60, height: 60, chance: 50 },
    { name: "krona2", value: 2, speed: 1.7, width: 60, height: 60, chance: 50 },
    { name: "krona5", value: 5, speed: 2.0, width: 60, height: 60, chance: 50 },
    { name: "krona10", value: 10, speed: 2.2, width: 60, height: 60, chance: 50 },
    { name: "krona20", value: 20, speed: 2.4, width: 120, height: 80, chance: 30 },
    { name: "krona50", value: 50, speed: 2.6, width: 120, height: 80, chance: 30 },
    { name: "krona100", value: 100, speed: 3.0, width: 120, height: 80, chance: 20 },
    { name: "krona200", value: 200, speed: 3.2, width: 120, height: 80, chance: 20 },
    { name: "krona500", value: 500, speed: 3.6, width: 120, height: 80, chance: 20 }
];

moneyTypes.forEach(m => {
    m.img = new Image();
    m.img.src = `${m.name}.png`;
});

// Player (bankkort)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 140,
    height: 90,
    angle: 0,
    img: new Image()
};
player.img.src = "player.png";

// Gun offset (chip-sidan)
const gunOffsetX = -40;
const gunOffsetY = 0;

// ===== SOUNDS =====
const shootSound = new Audio("laser.mp3");
const explodeSound = new Audio("explosion.mp3");
const gameOverSound = new Audio("gameover.mp3");

// ===== GAME STATE =====
let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;

// Highscore
let highScore = localStorage.getItem("highScore") || 0;

// Statistik
let stats = {1:0,2:0,5:0,10:0,20:0,50:0,100:0,200:0,500:0};

// ===== POPUP FUNCTION =====
function createPopup(text, x, y, isPlus) {
    const popup = document.createElement("div");
    popup.className = "popup";
    popup.innerText = text;
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    popup.style.color = isPlus ? "#00ff5e" : "#ff3030";
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
}

// ===== ROTATION =====
function rotateTo(mx, my) {
    const dx = mx - player.x;
    const dy = my - player.y;
    player.angle = Math.atan2(dy, dx);
}
canvas.addEventListener("mousemove", e => rotateTo(e.clientX, e.clientY));
canvas.addEventListener("touchmove", e => {
    const t = e.touches[0];
    rotateTo(t.clientX, t.clientY);
});

// ===== SHOOT =====
function shoot() {
    if(gameOver) return;
    bullets.push({
        x: player.x + gunOffsetX * Math.cos(player.angle) - gunOffsetY * Math.sin(player.angle),
        y: player.y + gunOffsetX * Math.sin(player.angle) + gunOffsetY * Math.cos(player.angle),
        vx: Math.cos(player.angle) * 8,
        vy: Math.sin(player.angle) * 8
    });
    shootSound.currentTime = 0;
    shootSound.play();
}
canvas.addEventListener("click", shoot);
canvas.addEventListener("touchstart", shoot);

// ===== SPAWN ENEMY =====
function spawnEnemy() {
    if(gameOver) return;
    const filtered = moneyTypes.filter(m => Math.random() * 100 < m.chance);
    if(filtered.length === 0) return;

    const type = filtered[Math.floor(Math.random() * filtered.length)];
    let x, y;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = Math.random() * canvas.width; y = -60; }
    if (side === 1) { x = canvas.width + 60; y = Math.random() * canvas.height; }
    if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 60; }
    if (side === 3) { x = -60; y = Math.random() * canvas.height; }

    enemies.push({
        x, y,
        img: type.img,
        value: type.value,
        speed: type.speed,
        width: type.width,
        height: type.height
    });
}

// Dynamisk spawn
function dynamicSpawn() {
    if(gameOver) return;
    let spawnCount = 1 + Math.floor(score / 500);
    for(let i=0; i<spawnCount; i++){
        spawnEnemy();
    }
}
setInterval(dynamicSpawn, 900);

// ===== UPDATE =====
function update() {
    if(gameOver) return;

    bullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height) bullets.splice(i, 1);
    });

    enemies.forEach((e, i) => {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;

        if (dist < 60) {
            score -= e.value;
            createPopup("-" + e.value, player.x, player.y - 40, false);
            enemies.splice(i, 1);
        }
    });

    enemies.forEach((e, ei) => {
        bullets.forEach((b, bi) => {
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            if (dist < 60) {
                score += e.value;
                stats[e.value]++;
                createPopup("+" + e.value, e.x, e.y, true);
                explodeSound.currentTime = 0;
                explodeSound.play();
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
            }
        });
    });

    if(score > highScore){
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    if(score < 0 && !gameOver){
        gameOver = true;
        gameOverSound.play();
    }
}

// ===== DRAW =====
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(player.img, -player.width/2, -player.height/2, player.width, player.height);
    ctx.restore();

    // Bullets
    ctx.font = "32px Arial";
    bullets.forEach(b => {
        ctx.fillText("💰", b.x - 16, b.y + 16);
    });

    // Enemies
    enemies.forEach(e => {
        ctx.drawImage(e.img, e.x - e.width/2, e.y - e.height/2, e.width, e.height);
    });

    // Score och Highscore
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Saldo: " + score + " kr", 20, 40);
    ctx.fillText("Highscore: " + highScore + " kr", 20, 70);

    // Game over
    if(gameOver){
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        const boxWidth = 400;
        const boxHeight = 400;
        const boxX = canvas.width/2 - boxWidth/2;
        const boxY = canvas.height/2 - boxHeight/2;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";

        let line = 0;
        ctx.fillText("GAME OVER", canvas.width/2, boxY + 40 + line*30);
        line++;
        ctx.fillText(`Saldo denna runda: ${score} kr`, canvas.width/2, boxY + 40 + line*30);
        line++;
        ctx.fillText(`Highscore: ${highScore} kr`, canvas.width/2, boxY + 40 + line*30);
        line++;
        ctx.fillText(`Statistik per valör:`, canvas.width/2, boxY + 40 + line*30);
        line++;

        ctx.textAlign = "left";
        let startX = boxX + 30;
        let startY = boxY + 40 + line*30;
        for(let val in stats){
            ctx.fillText(`${val} kr: ${stats[val]} träffar`, startX, startY);
            startY += 25;
        }

        let total = 0;
        for(let val in stats){
            total += val * stats[val];
        }
        ctx.fillText(`Totalt förtjänat: ${total} kr`, startX, startY + 20);

        // NY RUNDA KNAPP
        const btnWidth = 140;
        const btnHeight = 50;
        const btnX = canvas.width - btnWidth - 20;
        const btnY = canvas.height - btnHeight - 20;
        ctx.fillStyle = "#28a745"; // grön
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Ny runda", btnX + btnWidth/2, btnY + 32);
    }
}

// Klicka på knapp för ny runda
canvas.addEventListener("click", e => {
    if(gameOver){
        const btnWidth = 140;
        const btnHeight = 50;
        const btnX = canvas.width - btnWidth - 20;
        const btnY = canvas.height - btnHeight - 20;
        if(e.clientX >= btnX && e.clientX <= btnX + btnWidth &&
           e.clientY >= btnY && e.clientY <= btnY + btnHeight){
            newRound();
        }
    }
});

// ===== NEW ROUND =====
function newRound() {
    score = 0;
    bullets = [];
    enemies = [];
    stats = {1:0,2:0,5:0,10:0,20:0,50:0,100:0,200:0,500:0};
    gameOver = false;
}

// ===== GAME LOOP =====
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
