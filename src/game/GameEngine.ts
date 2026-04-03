import { generateLevel } from './levels';

export const TILE_SIZE = 32;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  isGrounded: boolean;
  hasKey: boolean;
  hp: number;
  isBlocking: boolean;
  isAttacking: boolean;
  isDownwardAttacking: boolean;
  isClimbingWall: boolean;
  attackTimer: number;
  invulnerableTimer: number;
  knockbackTimer: number;
  speedTimer?: number;
  jumpTimer?: number;
  powerInvulnTimer?: number;
  onLadder?: boolean;
}

export interface Entity extends Rect {
  type: string;
  collected?: boolean;
  vx?: number;
  vy?: number;
  hp?: number;
  attackTimer?: number;
  startX?: number;
  timer?: number;
  maxTimer?: number;
  splitsInto?: string;
  isFromGreenBoss?: boolean;
  jumpTimer?: number;
  spawnTimer?: number;
  state?: string;
  targetX?: number;
  targetY?: number;
  isSpawned?: boolean;
  isClimbing?: boolean;
}

export interface GameState {
  levelIndex: number;
  score: number;
  player: Player;
  entities: Entity[];
  walls: Rect[];
  isGameOver: boolean;
  isLevelComplete: boolean;
  isGameComplete: boolean;
  cameraX: number;
  firedMessageTimer: number;
  secretMessageTimer: number;
  playerConfig: {
    color: string;
    headbandColor: string;
  };
}

export class GameEngine {
  state: GameState;
  keys: { [key: string]: boolean } = {};

  constructor() {
    this.state = this.getInitialState();
    this.loadLevel(0);
  }

  getInitialState(): GameState {
    return {
      levelIndex: 0,
      score: 0,
      player: { x: 0, y: 0, w: 24, h: 24, vx: 0, vy: 0, isGrounded: false, hasKey: false, hp: 3, isBlocking: false, isAttacking: false, isDownwardAttacking: false, isClimbingWall: false, attackTimer: 0, invulnerableTimer: 0, knockbackTimer: 0 },
      entities: [],
      walls: [],
      isGameOver: false,
      isLevelComplete: false,
      isGameComplete: false,
      cameraX: 0,
      firedMessageTimer: 0,
      secretMessageTimer: 0,
      playerConfig: {
        color: '#4CAF50',
        headbandColor: '#E53935'
      }
    };
  }

  loadLevel(index: number, score: number = 0, keepHp: boolean = false) {
    const levelData = generateLevel(index);
    this.state.levelIndex = index;
    this.state.score = score;
    this.state.isGameOver = false;
    this.state.isLevelComplete = false;
    this.state.firedMessageTimer = 0;
    this.state.secretMessageTimer = 0;
    
    if (index === 20) {
      this.state.secretMessageTimer = 4.0;
    }
    
    const currentHp = (index === 20) ? 5 : (keepHp ? this.state.player.hp : 5);
    
    this.state.player = { 
      x: 0, y: 0, w: 24, h: 24, vx: 0, vy: 0, 
      isGrounded: false, hasKey: false, 
      hp: currentHp, isBlocking: false, isAttacking: false, isDownwardAttacking: false, isClimbingWall: false,
      attackTimer: 0, invulnerableTimer: 0, knockbackTimer: 0,
      speedTimer: 0, jumpTimer: 0, powerInvulnTimer: 0, onLadder: false
    };
    this.state.entities = [];
    this.state.walls = [];

    for (let y = 0; y < levelData.length; y++) {
      for (let x = 0; x < levelData[y].length; x++) {
        const char = levelData[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (char === '#') {
          this.state.walls.push({ x: px, y: py, w: TILE_SIZE, h: TILE_SIZE });
        } else if (char === 'P') {
          this.state.player.x = px + 4;
          this.state.player.y = py + 8;
        } else if (char === 'C') {
          this.state.entities.push({ type: 'coin', x: px + 8, y: py + 8, w: 16, h: 16 });
        } else if (char === 'K') {
          this.state.entities.push({ type: 'key', x: px + 8, y: py + 8, w: 16, h: 16 });
        } else if (char === 'D') {
          this.state.entities.push({ type: 'door', x: px, y: py, w: TILE_SIZE, h: TILE_SIZE });
        } else if (char === 'S') {
          this.state.entities.push({ type: 'spike', x: px, y: py + 16, w: TILE_SIZE, h: 16 });
        } else if (char === 'L') {
          this.state.entities.push({ type: 'lava', x: px, y: py + 8, w: TILE_SIZE, h: 24 });
        } else if (char === 'M') {
          this.state.entities.push({ type: 'monster', x: px + 4, y: py + 8, w: 24, h: 24, vx: 50, hp: 1 });
        } else if (char === 'G') {
          this.state.entities.push({ type: 'green_monster', x: px + 4, y: py + 8, w: 24, h: 24, vx: 50, hp: 1 });
        } else if (char === 'F') {
          this.state.entities.push({ type: 'flying_monster', x: px + 4, y: py + 8, w: 24, h: 24, vx: 60, vy: 0, hp: 1, attackTimer: Math.random() * 2 });
        } else if (char === 'T') {
          this.state.entities.push({ type: 'trampoline', x: px, y: py + 16, w: TILE_SIZE, h: 16 });
        } else if (char === 'B') {
          this.state.entities.push({ type: 'boss', x: px, y: py - 32, w: 64, h: 64, vx: 80, hp: 5 });
        } else if (char === 'Z') {
          this.state.entities.push({ type: 'boss2', x: px, y: py - 64, w: 96, h: 96, vx: 100, hp: 15, startX: px });
        } else if (char === 'X') {
          this.state.entities.push({ type: 'green_boss', x: px, y: py - 64, w: 96, h: 96, vx: 150, hp: 20, startX: px });
        } else if (char === 'Y') {
          this.state.entities.push({ type: 'yellow_monster', x: px + 4, y: py + 8, w: 24, h: 24, vx: 100, hp: 1, jumpTimer: 0 });
        } else if (char === 'W') {
          this.state.entities.push({ type: 'yellow_boss', x: px, y: py - 64, w: 96, h: 96, vx: 200, hp: 5, startX: px, jumpTimer: 0, attackTimer: 2, spawnTimer: 4 });
        } else if (char === 'V') {
          this.state.entities.push({ type: 'white_boss', x: px, y: py - 64, w: 96, h: 96, vx: 150, hp: 7, startX: px, state: 'walking', timer: 5, attackTimer: 2, spawnTimer: 4 });
        } else if (char === 'H') {
          this.state.entities.push({ type: 'heart', x: px + 8, y: py + 8, w: 16, h: 16 });
        } else if (char === '=') {
          this.state.entities.push({ type: 'ladder', x: px, y: py, w: TILE_SIZE, h: TILE_SIZE });
        } else if (char === 'U') {
          this.state.entities.push({ type: 'powerup_speed', x: px + 8, y: py + 8, w: 16, h: 16 });
        } else if (char === 'J') {
          this.state.entities.push({ type: 'powerup_jump', x: px + 8, y: py + 8, w: 16, h: 16 });
        } else if (char === 'I') {
          this.state.entities.push({ type: 'powerup_invincibility', x: px + 8, y: py + 8, w: 16, h: 16 });
        }
      }
    }
  }

  update(dt: number) {
    if (this.state.isGameOver || this.state.isLevelComplete || this.state.isGameComplete) return;

    const p = this.state.player;
    
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }
    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) {
        p.isAttacking = false;
        p.isDownwardAttacking = false;
      }
    }
    if (p.knockbackTimer > 0) {
      p.knockbackTimer -= dt;
    }
    if (p.speedTimer > 0) p.speedTimer -= dt;
    if (p.jumpTimer > 0) p.jumpTimer -= dt;
    if (p.powerInvulnTimer > 0) {
      p.powerInvulnTimer -= dt;
      p.invulnerableTimer = 0.1; // Keep standard invuln active
    }

    if (this.state.firedMessageTimer > 0) {
      this.state.firedMessageTimer -= dt;
    }
    if (this.state.secretMessageTimer > 0) {
      this.state.secretMessageTimer -= dt;
    }

    p.onLadder = false;
    for (const e of this.state.entities) {
      if (e.type === 'ladder' && this.checkRectCollision(p, e as Rect)) {
        p.onLadder = true;
        break;
      }
    }

    // Wall climbing detection
    p.isClimbingWall = false;
    let againstLeft = false;
    let againstRight = false;
    if (!p.isGrounded && !p.onLadder) {
      const leftCheck = { x: p.x - 2, y: p.y, w: 2, h: p.h };
      const rightCheck = { x: p.x + p.w, y: p.y, w: 2, h: p.h };
      for (const w of this.state.walls) {
        if (this.checkRectCollision(leftCheck, w)) againstLeft = true;
        if (this.checkRectCollision(rightCheck, w)) againstRight = true;
      }
      
      if ((againstLeft && (this.keys['ArrowLeft'] || this.keys['a'])) || 
          (againstRight && (this.keys['ArrowRight'] || this.keys['d']))) {
        p.isClimbingWall = true;
      }
    }

    // Input
    const speed = p.speedTimer > 0 ? 350 : 200;
    const jumpForce = p.jumpTimer > 0 ? -600 : -400;
    p.isBlocking = this.keys['b'] || this.keys['B'];
    
    if (this.keys['f'] || this.keys['F']) {
      if (!p.isAttacking && !p.isDownwardAttacking && p.attackTimer <= 0) {
        if (!p.isGrounded && (this.keys['ArrowDown'] || this.keys['s'])) {
          p.isDownwardAttacking = true;
          p.attackTimer = 0.4;
          p.vy = 200; // Slight downward boost
        } else {
          p.isAttacking = true;
          p.attackTimer = 0.3;
        }
      }
    }

    if (p.knockbackTimer <= 0) {
      if (!p.isBlocking) {
        if (this.keys['ArrowLeft'] || this.keys['a']) {
          p.vx = -speed;
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
          p.vx = speed;
        } else {
          p.vx = 0;
        }

        if (p.onLadder || p.isClimbingWall) {
          p.vy = 0;
          if (this.keys['ArrowUp'] || this.keys['w']) p.vy = -150;
          else if (this.keys['ArrowDown'] || this.keys['s']) p.vy = 150;
          
          // Wall Jump
          if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys[' ']) && p.isClimbingWall) {
            p.vy = jumpForce;
            p.vx = againstLeft ? speed : -speed;
            p.knockbackTimer = 0.2; // Use knockback timer to lock horizontal movement briefly
            p.isClimbingWall = false;
          }
        } else {
          if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys[' ']) && p.isGrounded) {
            p.vy = jumpForce;
            p.isGrounded = false;
          }
        }
      } else {
        p.vx = 0; // Can't move while blocking
        if (p.onLadder) p.vy = 0;
      }
    }

    // Physics
    if (!p.onLadder && !p.isClimbingWall) {
      p.vy += 1000 * dt; // Gravity
      // Clamp fall speed
      if (p.vy > 600) p.vy = 600;
    }

    // Move X
    p.x += p.vx * dt;
    this.handleCollisions(true);

    // Move Y
    p.y += p.vy * dt;
    p.isGrounded = false;
    this.handleCollisions(false);

    // Camera follow
    this.state.cameraX = p.x - 400 + p.w / 2;
    if (this.state.cameraX < 0) this.state.cameraX = 0;

    // Entity updates and collisions
    const attackRect = p.isDownwardAttacking ? {
      x: p.x,
      y: p.y + p.h,
      w: p.w,
      h: 24
    } : {
      x: p.vx < 0 ? p.x - 20 : p.x + p.w,
      y: p.y,
      w: 20,
      h: p.h
    };

    for (const e of this.state.entities) {
      if (e.collected) continue;

      if (e.type === 'monster' || e.type === 'green_monster' || e.type === 'yellow_monster' || e.type === 'purple_monster' || e.type === 'blue_monster' || e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss' || e.type === 'white_boss' || e.type === 'black_boss') {
        // Check if yellow monster is on a ladder
        let onLadder = false;
        if (e.type === 'yellow_monster' || e.type === 'purple_monster' || e.type === 'blue_monster' || e.type === 'yellow_boss' || e.type === 'white_boss') {
          for (const l of this.state.entities) {
            if (l.type === 'ladder' && this.checkRectCollision(e as Rect, l as Rect)) {
              onLadder = true;
              break;
            }
          }
        }

        // Apply gravity if not on ladder and not flying and not climbing
        if (!onLadder && e.state !== 'flying' && e.type !== 'black_boss' && !e.isClimbing) {
          e.vy = (e.vy || 0) + 1000 * dt;
          if (e.vy > 600) e.vy = 600;
        } else if (onLadder) {
          // Move up or down ladder towards player
          if (p.y < e.y - 10) {
            e.vy = -150;
          } else if (p.y > e.y + 10) {
            e.vy = 150;
          } else {
            e.vy = 0;
          }
        }
        e.y += (e.vy || 0) * dt;
        
        let isGrounded = false;
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            if ((e.vy || 0) > 0) {
              e.y = w.y - e.h;
              e.vy = 0;
              isGrounded = true;
            } else if ((e.vy || 0) < 0) {
              e.y = w.y + w.h;
              e.vy = 0;
            }
          }
        }

        // Yellow monster jump logic
        if ((e.type === 'yellow_monster' || e.type === 'purple_monster' || e.type === 'yellow_boss' || e.type === 'blue_monster') && isGrounded && !onLadder) {
          e.jumpTimer = (e.jumpTimer || 0) - dt;
          if (e.jumpTimer <= 0) {
            // Randomly jump
            if (Math.random() < 0.05) {
              e.vy = -400; // Jump
              e.jumpTimer = 1.0; // Cooldown
            }
          }
        }

        // Monster AI
        e.x += (e.vx || 0) * dt;
        // Simple wall collision for monster
        let hitWall = false;
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            hitWall = true;
            if ((e.vx || 0) > 0) {
              e.x = w.x - e.w;
            } else {
              e.x = w.x + w.w;
            }
            break;
          }
        }
        
        // Check if about to fall off edge
        let hasFloor = false;
        if (isGrounded) {
          const floorCheck = { x: e.x + ((e.vx || 0) > 0 ? e.w : 0), y: e.y + e.h + 2, w: 1, h: 1 };
          for (const w of this.state.walls) {
            if (this.checkRectCollision(floorCheck, w)) {
              hasFloor = true;
              break;
            }
          }
        }

        if (hitWall || (isGrounded && !hasFloor)) {
          if (e.type === 'blue_monster' && hitWall) {
            e.isClimbing = true;
            e.vy = -150;
          } else {
            e.vx = -(e.vx || 0);
            e.isClimbing = false;
          }
        }

        // If climbing, check if still hitting wall
        if (e.isClimbing) {
          let stillAgainstWall = false;
          const checkRect = { x: e.x + ((e.vx || 0) > 0 ? 2 : -2), y: e.y, w: e.w, h: e.h };
          for (const w of this.state.walls) {
            if (this.checkRectCollision(checkRect, w)) {
              stillAgainstWall = true;
              break;
            }
          }
          if (!stillAgainstWall) {
            e.isClimbing = false;
            e.vy = 0;
          } else {
            // Move up
            e.vy = -150;
          }
        }

        // Green boss chase logic
        if (e.type === 'green_boss' || e.type === 'yellow_boss') {
          const speed = e.type === 'yellow_boss' ? 200 : 150;
          if (p.x < e.x) {
            e.vx = -speed;
          } else {
            e.vx = speed;
          }
          
          // Restrict to their arena (approx 60 tiles wide)
          if (e.startX !== undefined) {
            const arenaLeft = e.startX - 25 * 32;
            const arenaRight = e.startX + 34 * 32;
            if (e.x < arenaLeft && e.vx < 0) {
              e.vx = speed;
            } else if (e.x + e.w > arenaRight && e.vx > 0) {
              e.vx = -speed;
            }
          }
        }

        // Boss shooting logic
        if (e.type === 'boss') {
          e.attackTimer = (e.attackTimer || 0) - dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = 1.5; // Shoot every 1.5 seconds
            // Shoot towards player
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 600) {
              this.state.entities.push({
                type: 'boss_projectile',
                x: e.x + e.w / 2 - 8,
                y: e.y + e.h / 2 - 8,
                w: 16,
                h: 16,
                vx: (dx / dist) * 200,
                vy: (dy / dist) * 200
              });
            }
          }
        }
        
        if (e.type === 'white_boss') {
          e.timer = (e.timer || 0) - dt;
          if (e.timer <= 0) {
            if (e.state === 'walking') {
              e.state = 'flying';
              e.timer = 5;
              e.vy = -200;
            } else {
              e.state = 'walking';
              e.timer = 5;
            }
          }

          if (e.state === 'flying') {
            e.vy = Math.sin(Date.now() / 500) * 50;
            if (p.x < e.x) e.vx = -100;
            else e.vx = 100;
            const targetY = 100;
            if (e.y > targetY) e.y -= 100 * dt;
            else if (e.y < targetY - 50) e.y += 100 * dt;
          }

          e.attackTimer = (e.attackTimer || 0) - dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = 2.0;
            const dx = p.x - (e.x + e.w / 2);
            const dy = p.y - (e.y + e.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 800) {
              this.state.entities.push({
                type: 'red_projectile',
                x: e.x + e.w / 2 - 16,
                y: e.y + e.h / 2 - 16,
                w: 32,
                h: 32,
                vx: dist > 0 ? (dx / dist) * 300 : 0,
                vy: dist > 0 ? (dy / dist) * 300 : 0
              });
            }
          }

          e.spawnTimer = (e.spawnTimer || 0) - dt;
          if (e.spawnTimer <= 0) {
            e.spawnTimer = 4.0;
            this.state.entities.push({
              type: 'blue_monster',
              x: e.x + e.w / 2 - 12,
              y: e.y + e.h,
              w: 24,
              h: 24,
              vx: (Math.random() > 0.5 ? 1 : -1) * 250,
              vy: 0,
              hp: 1,
              jumpTimer: 0,
              isSpawned: true
            });
          }
        }

        if (e.type === 'black_boss') {
          e.timer = (e.timer || 0) - dt;
          
          // Recharge logic
          if (e.hp !== undefined && e.hp < 10 && e.state !== 'recharging') {
            const orbs = this.state.entities.filter(ent => ent.type === 'recharge_orb' && !ent.collected);
            if (orbs.length > 0) {
              e.state = 'recharging';
              // Find nearest orb
              let nearest = orbs[0];
              let minDist = Math.sqrt(Math.pow(e.x - nearest.x, 2) + Math.pow(e.y - nearest.y, 2));
              for (const orb of orbs) {
                const d = Math.sqrt(Math.pow(e.x - orb.x, 2) + Math.pow(e.y - orb.y, 2));
                if (d < minDist) {
                  minDist = d;
                  nearest = orb;
                }
              }
              e.targetX = nearest.x;
              e.targetY = nearest.y;
            }
          }

          if (e.state === 'recharging') {
            if (e.targetX !== undefined && e.targetY !== undefined) {
              const dx = e.targetX - e.x;
              const dy = e.targetY - e.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 10) {
                e.vx = (dx / dist) * 200;
                e.vy = (dy / dist) * 200;
              } else {
                e.vx = 0;
                e.vy = 0;
                if (e.hp !== undefined && e.hp < 20) {
                  e.hp += 2 * dt; // Recharge HP
                  if (e.hp > 20) e.hp = 20;
                } else {
                  e.state = 'flying';
                  e.timer = 5;
                }
              }
            }
          } else if (e.timer <= 0) {
            if (e.state === 'walking') {
              e.state = 'flying';
              e.timer = 5;
              e.vy = -200;
            } else {
              e.state = 'walking';
              e.timer = 5;
            }
          }

          if (e.state === 'flying') {
            e.vy = Math.sin(Date.now() / 400) * 60;
            if (p.x < e.x) e.vx = -120;
            else e.vx = 120;
            const targetY = 150;
            if (e.y > targetY) e.y -= 120 * dt;
            else if (e.y < targetY - 60) e.y += 120 * dt;
          } else if (e.state === 'walking') {
            if (p.x < e.x) e.vx = -120;
            else e.vx = 120;
          }

          // Wall collision for black_boss
          for (const w of this.state.walls) {
            if (this.checkRectCollision(e as Rect, w)) {
              if ((e.vx || 0) > 0) e.x = w.x - e.w;
              else e.x = w.x + w.w;
              e.vx = -(e.vx || 0);
              break;
            }
          }

          e.attackTimer = (e.attackTimer || 0) - dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = 3.0;
            const dx = p.x - (e.x + e.w / 2);
            const dy = p.y - (e.y + e.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Randomly choose between normal attack and lava blast
            if (Math.random() < 0.3) {
              this.state.entities.push({
                type: 'lava_pellet',
                x: e.x + e.w / 2 - 24,
                y: e.y + e.h / 2 - 24,
                w: 48,
                h: 48,
                vx: dist > 0 ? (dx / dist) * 150 : 0,
                vy: dist > 0 ? (dy / dist) * 150 : 150
              });
            } else {
              this.state.entities.push({
                type: 'red_projectile',
                x: e.x + e.w / 2 - 16,
                y: e.y + e.h / 2 - 16,
                w: 32,
                h: 32,
                vx: dist > 0 ? (dx / dist) * 300 : 0,
                vy: dist > 0 ? (dy / dist) * 300 : 0
              });
            }
          }

          e.spawnTimer = (e.spawnTimer || 0) - dt;
          if (e.spawnTimer <= 0) {
            e.spawnTimer = 3.5;
            this.state.entities.push({
              type: 'bat_monster',
              x: e.x + e.w / 2 - 16,
              y: e.y + e.h,
              w: 32,
              h: 32,
              vx: (Math.random() > 0.5 ? 1 : -1) * 150,
              vy: 0,
              hp: 1,
              attackTimer: 1.0,
              isSpawned: true
            });
          }
        }

        if (e.type === 'yellow_boss') {
          e.attackTimer = (e.attackTimer || 0) - dt;
          if (e.attackTimer <= 0) {
            e.attackTimer = 2.5;
            const dx = p.x - (e.x + e.w / 2);
            const dy = p.y - (e.y + e.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 800) {
              this.state.entities.push({
                type: 'yellow_boss_projectile',
                x: e.x + e.w / 2 - 16,
                y: e.y + e.h / 2 - 16,
                w: 32,
                h: 32,
                vx: dist > 0 ? (dx / dist) * 250 : 0,
                vy: dist > 0 ? (dy / dist) * 250 : 0
              });
            }
          }
          e.spawnTimer = (e.spawnTimer || 0) - dt;
          if (e.spawnTimer <= 0) {
            e.spawnTimer = 5.0;
            if (Math.abs(p.x - e.x) < 800) {
              this.state.entities.push({
                type: 'blue_monster',
                x: e.x + e.w / 2 - 12,
                y: e.y - 24,
                w: 24,
                h: 24,
                vx: (Math.random() > 0.5 ? 1 : -1) * 250,
                vy: -200,
                hp: 1,
                jumpTimer: 0,
                isSpawned: true
              });
            }
          }
        }

        // Check attack collision
        if ((p.isAttacking || p.isDownwardAttacking) && this.checkRectCollision(attackRect, e as Rect)) {
          if (e.hp !== undefined) {
            e.hp -= 1;
            p.isAttacking = false; // Prevent multi-hit on same swing
            p.isDownwardAttacking = false;
            if (e.hp <= 0) {
              e.collected = true; // Monster dies
              this.state.score += (e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss') ? 500 : 50;
              
              if (e.type === 'green_monster' || e.type === 'yellow_monster' || e.type === 'purple_monster') {
                const dir = p.x < e.x ? 1 : -1;
                this.state.entities.push({ type: 'monster', x: e.x - 10, y: e.y, w: 24, h: 24, vx: dir * 100, vy: -400, hp: 1 });
                this.state.entities.push({ type: 'monster', x: e.x + 10, y: e.y, w: 24, h: 24, vx: dir * 150, vy: -500, hp: 1 });
              } else if (e.type === 'green_boss' || e.type === 'yellow_boss') {
                this.state.entities.push({ type: 'explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 0, h: 0, timer: 0.5, maxTimer: 0.5 });
                const splitsIntoType = e.type === 'yellow_boss' ? 'blue_monster' : 'green_monster';
                this.state.entities.push({ type: 'boss', x: e.x - 30, y: e.y, w: 64, h: 64, vx: -80, vy: -400, hp: 5, splitsInto: splitsIntoType, isFromGreenBoss: true });
                this.state.entities.push({ type: 'boss', x: e.x + 30, y: e.y, w: 64, h: 64, vx: 80, vy: -400, hp: 5, splitsInto: splitsIntoType, isFromGreenBoss: true });
              } else if (e.type === 'white_boss') {
                this.state.entities.push({ type: 'explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 0, h: 0, timer: 1.0, maxTimer: 1.0 });
                this.state.entities.push({ type: 'black_boss', x: e.x, y: e.y, w: 96, h: 96, vx: 120, hp: 20, attackTimer: 3, spawnTimer: 3.5, state: 'walking', timer: 5 });
                // Spawn recharge orbs
                this.state.entities.push({ type: 'recharge_orb', x: 800, y: 100, w: 48, h: 48 });
                this.state.entities.push({ type: 'recharge_orb', x: 2400, y: 100, w: 48, h: 48 });
              } else if (e.type === 'black_boss') {
                this.state.entities.push({ type: 'rainbow_explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 800, h: 480, timer: 5.0, maxTimer: 5.0 });
                this.state.entities.push({ type: 'key', x: e.x + e.w / 2 - 8, y: e.y + e.h / 2 - 8, w: 16, h: 16 });
              } else if (e.type === 'boss') {
                if (e.splitsInto === 'green_monster' || e.splitsInto === 'yellow_monster' || e.splitsInto === 'purple_monster' || e.splitsInto === 'blue_monster') {
                  const dir = p.x < e.x ? 1 : -1;
                  this.state.entities.push({ type: e.splitsInto, x: e.x - 20, y: e.y, w: 24, h: 24, vx: dir * 100, vy: -400, hp: 1 });
                  this.state.entities.push({ type: e.splitsInto, x: e.x + 20, y: e.y, w: 24, h: 24, vx: dir * 150, vy: -500, hp: 1 });
                } else if (this.state.levelIndex === 4) {
                  // Only drop key for the normal level 5 boss
                  this.state.entities.push({ type: 'key', x: e.x + e.w / 2 - 8, y: e.y + e.h / 2 - 8, w: 16, h: 16 });
                }
                
                if (e.isFromGreenBoss) {
                  const otherBosses = this.state.entities.filter(ent => ent.type === 'boss' && ent.isFromGreenBoss && !ent.collected && ent !== e);
                  if (otherBosses.length === 0) {
                    this.state.entities.push({ type: 'key', x: e.x + e.w / 2 - 8, y: e.y + e.h / 2 - 8, w: 16, h: 16 });
                  }
                } else if (e.splitsInto === 'yellow_monster' || e.splitsInto === 'purple_monster' || e.splitsInto === 'blue_monster') {
                  const otherBosses = this.state.entities.filter(ent => ent.type === 'boss' && (ent.splitsInto === 'yellow_monster' || ent.splitsInto === 'purple_monster' || ent.splitsInto === 'blue_monster') && !ent.collected && ent !== e);
                  if (otherBosses.length === 0) {
                    this.state.entities.push({ type: 'key', x: e.x + e.w / 2 - 8, y: e.y + e.h / 2 - 8, w: 16, h: 16 });
                  }
                }
                
                this.state.entities.push({ type: 'explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 0, h: 0, timer: 0.5, maxTimer: 0.5 });
              }
            } else {
              // Knockback monster
              e.x += p.vx > 0 ? 20 : -20;
            }
          }
          continue;
        }
      } else if (e.type === 'flying_monster') {
        // Flying monster AI
        e.x += (e.vx || 0) * dt;
        
        // Horizontal Wall collision
        let hitWall = false;
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            hitWall = true;
            if ((e.vx || 0) > 0) {
              e.x = w.x - e.w;
            } else {
              e.x = w.x + w.w;
            }
            break;
          }
        }
        if (hitWall) {
          e.vx = -(e.vx || 0);
        }

        // Hover up and down slightly
        const hoverAmount = Math.sin(Date.now() / 200) * 30 * dt;
        e.y += hoverAmount;
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            e.y -= hoverAmount; // Undo hover if it hits a wall
            break;
          }
        }

        // Drop pellets
        e.attackTimer = (e.attackTimer || 0) - dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = 2.0 + Math.random(); // Drop every 2-3 seconds
          // Only drop if player is somewhat nearby
          if (Math.abs(p.x - e.x) < 300) {
            this.state.entities.push({
              type: 'pellet',
              x: e.x + e.w / 2 - 6,
              y: e.y + e.h,
              w: 12,
              h: 12,
              vy: 150 // Falls down
            });
          }
        }

        // Check attack collision
        if ((p.isAttacking || p.isDownwardAttacking) && this.checkRectCollision(attackRect, e as Rect)) {
          if (e.hp !== undefined) {
            e.hp -= 1;
            p.isAttacking = false;
            p.isDownwardAttacking = false;
            if (e.hp <= 0) {
              e.collected = true;
              this.state.score += 75;
            } else {
              e.x += p.vx > 0 ? 20 : -20;
            }
          }
          continue;
        }
      } else if (e.type === 'boss2') {
        e.x += (e.vx || 0) * dt;

        let hitWall = false;
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            hitWall = true;
            if ((e.vx || 0) > 0) e.x = w.x - e.w;
            else e.x = w.x + w.w;
            break;
          }
        }
        
        if (hitWall) {
          e.vx = -(e.vx || 0);
        } else if (e.startX !== undefined) {
          // Limit boss2 mobility to the ladder area (approx 36 tiles wide)
          if (e.x < e.startX - 34 * 32 && (e.vx || 0) < 0) {
            e.vx = Math.abs(e.vx || 0);
          } else if (e.x > e.startX + 2 * 32 && (e.vx || 0) > 0) {
            e.vx = -Math.abs(e.vx || 0);
          }
        } else if (e.x < this.state.cameraX && (e.vx || 0) < 0) {
          e.vx = Math.abs(e.vx || 0);
        } else if (e.x > this.state.cameraX + 800 - e.w && (e.vx || 0) > 0) {
          e.vx = -Math.abs(e.vx || 0);
        }

        const hoverAmount = Math.sin(Date.now() / 300) * 50 * dt;
        e.y += hoverAmount; // Hover
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            e.y -= hoverAmount; // Undo hover if it hits a wall
            break;
          }
        }

        e.attackTimer = (e.attackTimer || 0) - dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = 2.0; // Drop pellet every 2 seconds
          if (Math.abs(p.x - e.x) < 800) {
            const dx = p.x - (e.x + e.w / 2);
            const dy = p.y - (e.y + e.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.state.entities.push({
              type: 'boss2_pellet',
              x: e.x + e.w / 2 - 8,
              y: e.y + e.h / 2 - 8,
              w: 16,
              h: 16,
              vx: dist > 0 ? (dx / dist) * 200 : 0,
              vy: dist > 0 ? (dy / dist) * 200 : 200
            });
          }
        }

        if ((p.isAttacking || p.isDownwardAttacking) && this.checkRectCollision(attackRect, e as Rect)) {
          if (e.hp !== undefined) {
            e.hp -= 1;
            p.isAttacking = false;
            p.isDownwardAttacking = false;
            if (e.hp <= 0) {
              e.collected = true;
              this.state.score += 1000;
              this.state.entities.push({ type: 'key', x: e.x + e.w / 2 - 8, y: e.y + e.h / 2 - 8, w: 16, h: 16 });
              this.state.entities.push({ type: 'explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 0, h: 0, timer: 0.5, maxTimer: 0.5 });
            } else {
              e.x += p.vx > 0 ? 10 : -10;
            }
          }
          continue;
        }
      } else if (e.type === 'pellet' || e.type === 'boss_projectile' || e.type === 'boss2_pellet' || e.type === 'yellow_boss_projectile' || e.type === 'red_projectile' || e.type === 'lava_pellet') {
        e.x += (e.vx || 0) * dt;
        e.y += (e.vy || 0) * dt;
        
        // Destroy on wall hit
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            if (e.type === 'red_projectile') {
              this.state.entities.push({ type: 'explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 0, h: 0, timer: 0.3, maxTimer: 0.3 });
            } else if (e.type === 'lava_pellet') {
              // Turn impact area into lava
              const impactX = e.x + e.w / 2;
              const impactY = e.y + e.h / 2;
              // Add 3 lava blocks near impact
              for (let i = -1; i <= 1; i++) {
                this.state.entities.push({
                  type: 'lava',
                  x: Math.floor(impactX / TILE_SIZE + i) * TILE_SIZE,
                  y: Math.floor(impactY / TILE_SIZE) * TILE_SIZE,
                  w: TILE_SIZE,
                  h: TILE_SIZE
                });
              }
            }
            e.collected = true;
            break;
          }
        }
      } else if (e.type === 'tracking_projectile') {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          e.vx = (dx / dist) * 250;
          e.vy = (dy / dist) * 250;
        }
        e.x += (e.vx || 0) * dt;
        e.y += (e.vy || 0) * dt;
        e.timer = (e.timer || 0) - dt;
        if (e.timer <= 0) {
          this.state.entities.push({ type: 'explosion', x: e.x + e.w / 2, y: e.y + e.h / 2, w: 0, h: 0, timer: 0.5, maxTimer: 0.5 });
          e.collected = true;
        }
      } else if (e.type === 'bat_monster') {
        e.x += (e.vx || 0) * dt;
        
        // Wall collision for bat_monster
        for (const w of this.state.walls) {
          if (this.checkRectCollision(e as Rect, w)) {
            if ((e.vx || 0) > 0) e.x = w.x - e.w;
            else e.x = w.x + w.w;
            e.vx = -(e.vx || 0);
            break;
          }
        }

        e.y += Math.sin(Date.now() / 200) * 2;
        e.attackTimer = (e.attackTimer || 0) - dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = 1.5;
          this.state.entities.push({
            type: 'pellet',
            x: e.x + e.w / 2 - 4,
            y: e.y + e.h,
            w: 8,
            h: 8,
            vx: 0,
            vy: 300
          });
        }
        if (e.x < this.state.cameraX - 100 || e.x > this.state.cameraX + 900) {
          e.vx = -(e.vx || 0);
        }
      }

      // Check spawned monster limit
      const spawnedMonsters = this.state.entities.filter(ent => ent.isSpawned && !ent.collected);
      if (spawnedMonsters.length > 7) {
        this.state.firedMessageTimer = 2.0; // Show message for 2 seconds
        for (const m of spawnedMonsters) {
          m.collected = true;
          this.state.entities.push({ type: 'explosion', x: m.x + m.w / 2, y: m.y + m.h / 2, w: 0, h: 0, timer: 0.3, maxTimer: 0.3 });
        }
      } else if (e.type === 'explosion' || e.type === 'rainbow_explosion') {
        if (e.timer !== undefined) {
          e.timer -= dt;
          if (e.timer <= 0) {
            e.collected = true;
          }
        }
      }

      if (this.checkRectCollision(p, e as Rect)) {
        if (e.type === 'coin') {
          e.collected = true;
          this.state.score += 10;
        } else if (e.type === 'heart') {
          e.collected = true;
          if (p.hp < 5) p.hp += 1;
        } else if (e.type === 'key') {
          e.collected = true;
          p.hasKey = true;
        } else if (e.type === 'powerup_speed') {
          e.collected = true;
          p.speedTimer = 10;
        } else if (e.type === 'powerup_jump') {
          e.collected = true;
          p.jumpTimer = 10;
        } else if (e.type === 'powerup_invincibility') {
          e.collected = true;
          p.powerInvulnTimer = 10;
        } else if (e.type === 'door') {
          if (p.hasKey) {
            if (this.state.levelIndex === 19) {
              this.loadLevel(20, this.state.score, true);
            } else if (this.state.levelIndex >= 20) {
              this.state.isGameComplete = true;
            } else {
              this.state.isLevelComplete = true;
            }
          }
        } else if (e.type === 'trampoline') {
          if (p.vy > 0) { // Only bounce if falling
            p.vy = -800; // Big bounce
            p.isGrounded = false;
          }
        } else if (e.type === 'spike' || e.type === 'lava' || e.type === 'monster' || e.type === 'green_monster' || e.type === 'yellow_monster' || e.type === 'purple_monster' || e.type === 'blue_monster' || e.type === 'bat_monster' || e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss' || e.type === 'white_boss' || e.type === 'black_boss' || e.type === 'boss2' || e.type === 'flying_monster' || e.type === 'pellet' || e.type === 'boss_projectile' || e.type === 'boss2_pellet' || e.type === 'yellow_boss_projectile' || e.type === 'red_projectile' || e.type === 'tracking_projectile') {
          if ((e.type === 'monster' || e.type === 'green_monster' || e.type === 'yellow_monster' || e.type === 'purple_monster' || e.type === 'blue_monster' || e.type === 'bat_monster' || e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss' || e.type === 'white_boss' || e.type === 'black_boss' || e.type === 'boss2' || e.type === 'flying_monster' || e.type === 'boss_projectile' || e.type === 'pellet' || e.type === 'boss2_pellet' || e.type === 'yellow_boss_projectile' || e.type === 'red_projectile' || e.type === 'tracking_projectile') && p.isBlocking) {
            // Blocked! Push player back
            p.vx = e.x > p.x ? -300 : 300;
            p.vy = -200;
            p.knockbackTimer = 0.2;
            if (e.type === 'pellet' || e.type === 'boss_projectile' || e.type === 'boss2_pellet' || e.type === 'yellow_boss_projectile' || e.type === 'red_projectile' || e.type === 'tracking_projectile') {
              e.collected = true; // destroy projectile on successful block
            }
          } else if (p.invulnerableTimer <= 0) {
            p.hp -= (e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss' || e.type === 'white_boss' || e.type === 'black_boss' || e.type === 'boss2') ? 2 : 1;
            p.invulnerableTimer = 1.0; // 1 second invulnerability
            p.vy = -300; // Knockback
            p.vx = e.x > p.x ? -200 : 200;
            p.knockbackTimer = 0.3;
            if (e.type === 'pellet' || e.type === 'boss_projectile' || e.type === 'boss2_pellet' || e.type === 'yellow_boss_projectile' || e.type === 'red_projectile' || e.type === 'tracking_projectile') {
              e.collected = true; // destroy projectile on hit
            }
            if (p.hp <= 0) {
              this.state.isGameOver = true;
            }
          }
        }
      }
    }
    
    // Fall off screen
    if (p.y > 600) {
      p.hp = 0;
      this.state.isGameOver = true;
    }
  }

  handleCollisions(isX: boolean) {
    const p = this.state.player;
    for (const w of this.state.walls) {
      if (this.checkRectCollision(p, w)) {
        if (isX) {
          if (p.vx > 0) {
            p.x = w.x - p.w;
          } else if (p.vx < 0) {
            p.x = w.x + w.w;
          }
          p.vx = 0;
        } else {
          if (p.vy > 0) {
            p.y = w.y - p.h;
            p.isGrounded = true;
          } else if (p.vy < 0) {
            p.y = w.y + w.h;
          }
          p.vy = 0;
        }
      }
    }
  }

  checkRectCollision(r1: Rect, r2: Rect) {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  }

  handleKeyDown(e: KeyboardEvent) {
    this.keys[e.key] = true;
  }

  handleKeyUp(e: KeyboardEvent) {
    this.keys[e.key] = false;
  }

  clearKeys() {
    this.keys = {};
  }

  saveGame() {
    const save = {
      levelIndex: this.state.levelIndex,
      score: this.state.score,
      playerConfig: this.state.playerConfig,
    };
    localStorage.setItem('dungeon_save', JSON.stringify(save));
  }

  loadGame() {
    const saveStr = localStorage.getItem('dungeon_save');
    if (saveStr) {
      try {
        const save = JSON.parse(saveStr);
        if (save.playerConfig) {
          this.state.playerConfig = save.playerConfig;
        }
        this.loadLevel(save.levelIndex, save.score);
        return true;
      } catch (e) {
        console.error('Failed to load save', e);
      }
    }
    return false;
  }
}
