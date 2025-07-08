// Simple Side-Scrolling Platformer Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Constants ---
const GAME_BASE_WIDTH = 800;
const GAME_BASE_HEIGHT = 450;
const GAME_ASPECT = GAME_BASE_WIDTH / GAME_BASE_HEIGHT;
let GAME_WIDTH = GAME_BASE_WIDTH;
let GAME_HEIGHT = GAME_BASE_HEIGHT;
const GRAVITY = 0.6;
const MOVE_SPEED = 4;
const JUMP_POWER = 12;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const PLATFORM_COLOR = '#654321';
const PLAYER_COLOR = '#ff4444';

// --- Player Sprite ---
let playerSprite = null;
let playerSpriteLoaded = false;
let playerFrame = 0;
let playerFrameTimer = 0;
const PLAYER_FRAME_COUNT = 4;
const PLAYER_FRAME_WIDTH = 40;
const PLAYER_FRAME_HEIGHT = 50;
const PLAYER_FRAME_DURATION = 8; // frames per animation frame
const playerImg = new Image();
playerImg.src = 'player.png';
playerImg.onload = function() {
  playerSprite = playerImg;
  playerSpriteLoaded = true;
};
playerImg.onerror = function() {
  playerSprite = null;
  playerSpriteLoaded = false;
};

// --- Platform Texture ---
let platformTexture = null;
let platformPattern = null;
const platformImg = new Image();
platformImg.src = 'platform.png';
platformImg.onload = function() {
  platformTexture = platformImg;
  platformPattern = ctx.createPattern(platformTexture, 'repeat');
};
platformImg.onerror = function() {
  platformTexture = null;
  platformPattern = null;
};

// --- Game State ---
let cameraX = 0;
let keys = { left: false, right: false, up: false };
let touchControls = { left: false, right: false, up: false };

const platforms = [
  { x: 0, y: 400, width: 400, height: 50 },
  { x: 450, y: 350, width: 120, height: 20 },
  { x: 650, y: 300, width: 120, height: 20 },
  { x: 850, y: 400, width: 400, height: 50 },
  { x: 1300, y: 350, width: 120, height: 20 },
  { x: 1500, y: 250, width: 120, height: 20 },
  { x: 1700, y: 400, width: 400, height: 50 },
];

const player = {
  x: 100,
  y: platforms[0].y - PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  onGround: false,
};

// --- Input Handling ---
function handleKey(e, isDown) {
  switch (e.code) {
    case 'ArrowLeft':
      keys.left = isDown;
      break;
    case 'ArrowRight':
      keys.right = isDown;
      break;
    case 'Space':
    case 'ArrowUp':
      keys.up = isDown;
      break;
  }
}
window.addEventListener('keydown', e => handleKey(e, true));
window.addEventListener('keyup', e => handleKey(e, false));

// --- Mobile Controls ---
function setupMobileControls() {
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnJump = document.getElementById('btnJump');

  function setBtn(btn, dir, isDown) {
    touchControls[dir] = isDown;
    btn.style.background = isDown ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';
  }

  btnLeft.addEventListener('touchstart', e => { e.preventDefault(); setBtn(btnLeft, 'left', true); });
  btnLeft.addEventListener('touchend', e => { e.preventDefault(); setBtn(btnLeft, 'left', false); });
  btnRight.addEventListener('touchstart', e => { e.preventDefault(); setBtn(btnRight, 'right', true); });
  btnRight.addEventListener('touchend', e => { e.preventDefault(); setBtn(btnRight, 'right', false); });
  btnJump.addEventListener('touchstart', e => { e.preventDefault(); setBtn(btnJump, 'up', true); });
  btnJump.addEventListener('touchend', e => { e.preventDefault(); setBtn(btnJump, 'up', false); });
}
setupMobileControls();

// --- Resize Canvas ---
function resizeCanvas() {
  // Calculate the largest 16:9 area that fits in the window
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  let width = windowWidth;
  let height = windowWidth / GAME_ASPECT;
  if (height > windowHeight) {
    height = windowHeight;
    width = height * GAME_ASPECT;
  }
  // Set canvas CSS size to fill the centered game area
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.style.marginLeft = ((windowWidth - width) / 2) + 'px';
  canvas.style.marginTop = ((windowHeight - height) / 2) + 'px';
  canvas.style.display = 'block';
  // Set internal resolution to match the visible area
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  GAME_WIDTH = canvas.width;
  GAME_HEIGHT = canvas.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Game Loop ---
function update() {
  // Merge keyboard and touch controls
  const left = keys.left || touchControls.left;
  const right = keys.right || touchControls.right;
  const up = keys.up || touchControls.up;

  // Horizontal movement
  if (left) {
    player.vx = -MOVE_SPEED;
  } else if (right) {
    player.vx = MOVE_SPEED;
  } else {
    player.vx = 0;
  }

  // Jump
  if (up && player.onGround) {
    player.vy = -JUMP_POWER;
    player.onGround = false;
  }

  // Gravity
  player.vy += GRAVITY;

  // Move player
  player.x += player.vx;
  player.y += player.vy;

  // Collision detection
  player.onGround = false;
  for (const plat of platforms) {
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > plat.y &&
      player.y + player.height - player.vy <= plat.y
    ) {
      // Landed on platform
      player.y = plat.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Prevent falling below world
  if (player.y > GAME_HEIGHT) {
    player.x = 100;
    player.y = platforms[0].y - PLAYER_HEIGHT;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;
  }

  // Camera follows player (use dynamic GAME_WIDTH)
  cameraX = Math.max(0, player.x - GAME_WIDTH / 2 + player.width / 2);
  // Optionally clamp cameraX to level bounds (optional improvement)
  // let maxCameraX = Math.max(0, platforms[platforms.length-1].x + platforms[platforms.length-1].width - GAME_WIDTH);
  // cameraX = Math.min(cameraX, maxCameraX);

  // Animation update
  if ((left || right) && playerSpriteLoaded && player.onGround) {
    playerFrameTimer++;
    if (playerFrameTimer >= PLAYER_FRAME_DURATION) {
      playerFrame = (playerFrame + 1) % PLAYER_FRAME_COUNT;
      playerFrameTimer = 0;
    }
  } else {
    playerFrame = 0; // idle
    playerFrameTimer = 0;
  }
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  
  ctx.save();
  ctx.translate(-cameraX, 0);

  // Draw platforms
  for (const plat of platforms) {
    if (platformPattern) {
      ctx.save();
      ctx.translate(plat.x, plat.y);
      ctx.fillStyle = platformPattern;
      ctx.fillRect(0, 0, plat.width, plat.height);
      ctx.restore();
    } else {
      ctx.fillStyle = PLATFORM_COLOR;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    }
  }

  // Draw player
  if (playerSpriteLoaded) {
    ctx.save();
    ctx.translate(player.x, player.y);
    // Flip sprite if moving left
    if (player.vx < 0) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        playerSprite,
        playerFrame * PLAYER_FRAME_WIDTH, 0,
        PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT,
        -PLAYER_FRAME_WIDTH, 0,
        PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT
      );
    } else {
      ctx.drawImage(
        playerSprite,
        playerFrame * PLAYER_FRAME_WIDTH, 0,
        PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT,
        0, 0,
        PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT
      );
    }
    ctx.restore();
  } else {
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start game loop after a short delay to ensure canvas is properly sized
setTimeout(() => {
  gameLoop();
}, 100); 
