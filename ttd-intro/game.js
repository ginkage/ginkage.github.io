// Simple Side-Scrolling Platformer Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Constants ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const GAME_ASPECT = GAME_WIDTH / GAME_HEIGHT;
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

// --- Fullscreen Utility Functions ---
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
function isLandscape() {
  if (window.screen && window.screen.orientation && window.screen.orientation.type) {
    return window.screen.orientation.type.startsWith('landscape');
  }
  // Fallback to innerWidth/innerHeight
  return window.innerWidth > window.innerHeight;
}
function isFullscreen() {
  return !!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
}
function requestFullscreen(elem) {
  if (elem.requestFullscreen) return elem.requestFullscreen();
  if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
  if (elem.mozRequestFullScreen) return elem.mozRequestFullScreen();
  if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
}
function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}

// --- Auto Fullscreen on Mobile Landscape with Button ---
const fullscreenBtn = document.getElementById('fullscreenBtn');
function updateFullscreenButton() {
  var isFS = isFullscreen();
  // Auto-exit fullscreen if in portrait on mobile
  if (isMobile() && !isLandscape() && isFS) {
    exitFullscreen();
  }
  if (isMobile() && isLandscape() && !isFS) {
    fullscreenBtn.style.display = 'block';
  } else {
    fullscreenBtn.style.display = 'none';
  }
}
// Helper to call updateFullscreenButton after a short delay
function delayedUpdateFullscreenButton() {
  setTimeout(updateFullscreenButton, 300);
}
window.addEventListener('orientationchange', delayedUpdateFullscreenButton);
window.addEventListener('resize', delayedUpdateFullscreenButton);
document.addEventListener('fullscreenchange', delayedUpdateFullscreenButton);
document.addEventListener('webkitfullscreenchange', delayedUpdateFullscreenButton);
document.addEventListener('mozfullscreenchange', delayedUpdateFullscreenButton);
document.addEventListener('MSFullscreenChange', delayedUpdateFullscreenButton);
document.addEventListener('DOMContentLoaded', function() {
  const gameWrapper = document.getElementById('gameWrapper');
  if (!gameWrapper) {
    return;
  }
  fullscreenBtn.addEventListener('click', function() {
    requestFullscreen(gameWrapper);
    fullscreenBtn.style.display = 'none';
  });
});
// Add a periodic check as a fallback for mobile browsers
setInterval(updateFullscreenButton, 500);
// Initial call
updateFullscreenButton();

// --- Resize Canvas ---
function resizeCanvas() {
  // Set canvas internal size to window size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.style.margin = '0';
  canvas.style.display = 'block';
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

  // Camera follows player (use fixed GAME_WIDTH)
  cameraX = Math.max(0, player.x - GAME_WIDTH / 2 + player.width / 2);
  // Optionally clamp cameraX to level bounds
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
  // Calculate scale and offset to fit 800x450 into canvas
  const scale = Math.min(canvas.width / GAME_WIDTH, canvas.height / GAME_HEIGHT);
  const offsetX = (canvas.width - GAME_WIDTH * scale) / 2;
  const offsetY = (canvas.height - GAME_HEIGHT * scale) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Fill with black for letterboxing/pillarboxing
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Set transform for scaling and centering
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  // Draw sky background in the game area (before camera translation!)
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  // Set up clipping region for the game area (before camera translation)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.clip();
  // Now translate for camera
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
  ctx.save();
  ctx.translate(player.x, player.y);
  if (playerSpriteLoaded) {
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
  } else {
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(0, 0, player.width, player.height);
  }
  ctx.restore();
  // End of game drawing and clipping
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset for UI overlays if needed
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
