import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, TILE_SIZE } from '../game/GameEngine';
import { musicManager } from '../game/MusicManager';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new GameEngine());
  const [playerConfig, setPlayerConfig] = useState(engine.state.playerConfig);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  
  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && !e.repeat) {
        if (!engine.state.isGameOver && !engine.state.isLevelComplete && !engine.state.isGameComplete) {
          setIsPaused(prev => {
            if (!prev) engine.clearKeys();
            return !prev;
          });
        }
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      engine.handleKeyDown(e);
    };
    const handleKeyUp = (e: KeyboardEvent) => engine.handleKeyUp(e);
    const handleBlur = () => engine.clearKeys();
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const render = (ctx: CanvasRenderingContext2D, time: number) => {
      // Clear
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, 800, 480);
      
      const state = engine.state;
      
      ctx.save();
      ctx.translate(-state.cameraX, 0);
      
      // Draw background features
      const startCol = Math.floor(state.cameraX / TILE_SIZE);
      const endCol = startCol + Math.ceil(800 / TILE_SIZE) + 1;
      
      for (let x = startCol; x <= endCol; x++) {
        for (let y = 0; y < 15; y++) {
          const hash = Math.sin(x * 12.9898 + y * 78.233 + state.levelIndex * 137.5) * 43758.5453;
          const val = hash - Math.floor(hash);
          
          if (val < 0.01) {
            // Draw slime
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 10 + val * 20, 0, Math.PI * 2);
            ctx.fill();
            // dripping slime
            ctx.fillRect(x * TILE_SIZE + 12, y * TILE_SIZE + 16, 8, 20 + val * 30);
          } else if (val < 0.02) {
            // Draw chains
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE + 16, y * TILE_SIZE);
            ctx.lineTo(x * TILE_SIZE + 16, y * TILE_SIZE + 64);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 10, 4, 0, Math.PI * 2);
            ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 26, 4, 0, Math.PI * 2);
            ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 42, 4, 0, Math.PI * 2);
            ctx.stroke();
          } else if (val < 0.03) {
            // Draw flaming torch
            ctx.fillStyle = '#8B4513'; // wood
            ctx.fillRect(x * TILE_SIZE + 12, y * TILE_SIZE + 16, 8, 24);
            
            // Flame
            const flicker = Math.sin(time / 100 + val * 100) * 4;
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE + 16, y * TILE_SIZE - 8 + flicker);
            ctx.lineTo(x * TILE_SIZE + 24, y * TILE_SIZE + 16);
            ctx.lineTo(x * TILE_SIZE + 8, y * TILE_SIZE + 16);
            ctx.fill();
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE + 16, y * TILE_SIZE + flicker);
            ctx.lineTo(x * TILE_SIZE + 20, y * TILE_SIZE + 16);
            ctx.lineTo(x * TILE_SIZE + 12, y * TILE_SIZE + 16);
            ctx.fill();
            
            // Light glow
            ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
            ctx.beginPath();
            ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 8, 40 + flicker, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      // Draw walls
      ctx.fillStyle = '#555';
      for (const w of state.walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }
      
      // Draw entities
      for (const e of state.entities) {
        if (e.collected) continue;
        
        if (e.type === 'coin') {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'heart') {
          ctx.fillStyle = '#F00';
          const cx = e.x + e.w/2;
          const cy = e.y + e.h/2;
          const size = e.w/2;
          ctx.beginPath();
          ctx.moveTo(cx, cy + size/2);
          ctx.bezierCurveTo(cx + size, cy - size/2, cx + size*1.5, cy + size/3, cx, cy + size);
          ctx.bezierCurveTo(cx - size*1.5, cy + size/3, cx - size, cy - size/2, cx, cy + size/2);
          ctx.fill();
        } else if (e.type === 'key') {
          ctx.fillStyle = '#FFD700';
          // Key head
          ctx.beginPath();
          ctx.arc(e.x + 6, e.y + 8, 4, 0, Math.PI * 2);
          ctx.fill();
          // Key shaft
          ctx.fillRect(e.x + 10, e.y + 6, 8, 4);
          // Key teeth
          ctx.fillRect(e.x + 12, e.y + 10, 2, 4);
          ctx.fillRect(e.x + 16, e.y + 10, 2, 4);
        } else if (e.type === 'door') {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(e.x, e.y, e.w, e.h);
          ctx.fillStyle = '#000';
          ctx.fillRect(e.x + e.w - 10, e.y + e.h/2 - 4, 8, 8); // knob
        } else if (e.type === 'spike') {
          ctx.fillStyle = '#CCC';
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + e.h);
          ctx.lineTo(e.x + e.w/2, e.y);
          ctx.lineTo(e.x + e.w, e.y + e.h);
          ctx.fill();
        } else if (e.type === 'lava') {
          ctx.fillStyle = '#FF4500';
          ctx.fillRect(e.x, e.y, e.w, e.h);
          ctx.fillStyle = '#FF8C00';
          const offset = (performance.now() / 200) % 16;
          ctx.fillRect(e.x, e.y, e.w, 4);
          ctx.fillRect(e.x + offset, e.y + 4, 4, 4);
          ctx.fillRect(e.x + 24 - offset, e.y + 8, 4, 4);
        } else if (e.type === 'monster' || e.type === 'green_monster' || e.type === 'yellow_monster' || e.type === 'purple_monster' || e.type === 'blue_monster') {
          ctx.fillStyle = e.type === 'green_monster' ? '#008000' : e.type === 'yellow_monster' ? '#FFFF00' : e.type === 'purple_monster' ? '#800080' : e.type === 'blue_monster' ? '#0000FF' : '#800080'; // Green, Yellow, Purple, or Blue monster
          ctx.fillRect(e.x, e.y, e.w, e.h);
          // Eyes
          ctx.fillStyle = '#FFF';
          ctx.fillRect(e.x + 4, e.y + 4, 4, 4);
          ctx.fillRect(e.x + 16, e.y + 4, 4, 4);
          ctx.fillStyle = '#F00';
          // Angry eyebrows
          ctx.beginPath();
          ctx.moveTo(e.x + 2, e.y + 2);
          ctx.lineTo(e.x + 8, e.y + 4);
          ctx.moveTo(e.x + 22, e.y + 2);
          ctx.lineTo(e.x + 16, e.y + 4);
          ctx.stroke();
        } else if (e.type === 'bat_monster') {
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y, e.w, e.h);
          // Wings
          ctx.fillStyle = '#111';
          const wingOffset = Math.sin(time / 50) * 15;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + 8);
          ctx.lineTo(e.x - 16, e.y + 8 - wingOffset);
          ctx.lineTo(e.x, e.y + 24);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.x + e.w, e.y + 8);
          ctx.lineTo(e.x + e.w + 16, e.y + 8 - wingOffset);
          ctx.lineTo(e.x + e.w, e.y + 24);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#F00';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#F00';
          ctx.fillRect(e.x + 8, e.y + 8, 6, 6);
          ctx.fillRect(e.x + 20, e.y + 8, 6, 6);
          ctx.shadowBlur = 0;
        } else if (e.type === 'flying_monster') {
          ctx.fillStyle = '#00BFFF'; // Deep sky blue
          ctx.fillRect(e.x, e.y, e.w, e.h);
          // Wings
          ctx.fillStyle = '#ADD8E6'; // Light blue
          const wingOffset = Math.sin(time / 50) * 10;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + 8);
          ctx.lineTo(e.x - 12, e.y + 8 - wingOffset);
          ctx.lineTo(e.x, e.y + 16);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.x + e.w, e.y + 8);
          ctx.lineTo(e.x + e.w + 12, e.y + 8 - wingOffset);
          ctx.lineTo(e.x + e.w, e.y + 16);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#FFF';
          ctx.fillRect(e.x + 4, e.y + 4, 4, 4);
          ctx.fillRect(e.x + 16, e.y + 4, 4, 4);
          ctx.fillStyle = '#F00';
          ctx.fillRect(e.x + 5, e.y + 5, 2, 2);
          ctx.fillRect(e.x + 17, e.y + 5, 2, 2);
        } else if (e.type === 'pellet') {
          ctx.fillStyle = '#00BFFF'; // Deep sky blue
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2 - 2, e.y + e.h/2 - 2, e.w/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'red_projectile') {
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2 - 4, e.y + e.h/2 - 4, e.w/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'tracking_projectile') {
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'boss_projectile') {
          ctx.fillStyle = '#DC143C'; // Crimson
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFA500'; // Orange core
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'yellow_boss_projectile') {
          ctx.fillStyle = '#DAA520'; // Goldenrod
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFF00'; // Yellow core
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/4, 0, Math.PI * 2);
          ctx.fill();
          // Glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#FFFF00';
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset
        } else if (e.type === 'white_boss') {
          // Body
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(e.x, e.y, e.w, e.h);
          // Eyes
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(e.x + 20, e.y + 20, 16, 16);
          ctx.fillRect(e.x + e.w - 36, e.y + 20, 16, 16);
          // Horns
          ctx.fillStyle = '#8B0000';
          ctx.beginPath();
          ctx.moveTo(e.x + 10, e.y);
          ctx.lineTo(e.x + 20, e.y - 30);
          ctx.lineTo(e.x + 30, e.y);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.x + e.w - 10, e.y);
          ctx.lineTo(e.x + e.w - 20, e.y - 30);
          ctx.lineTo(e.x + e.w - 30, e.y);
          ctx.fill();
          // Wings (if flying)
          if (e.state === 'flying') {
            ctx.fillStyle = '#F0F0F0';
            const wingOffset = Math.sin(time / 50) * 30;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y + 32);
            ctx.lineTo(e.x - 50, e.y + 32 - wingOffset);
            ctx.lineTo(e.x, e.y + 64);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(e.x + e.w, e.y + 32);
            ctx.lineTo(e.x + e.w + 50, e.y + 32 - wingOffset);
            ctx.lineTo(e.x + e.w, e.y + 64);
            ctx.fill();
          }
          // HP Bar
          if (e.hp !== undefined) {
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x, e.y - 10, e.w, 6);
            ctx.fillStyle = '#FFF';
            ctx.fillRect(e.x + 1, e.y - 9, (e.w - 2) * (e.hp / 7), 4);
          }
        } else if (e.type === 'black_boss') {
          // Body
          ctx.fillStyle = '#000000';
          ctx.fillRect(e.x, e.y, e.w, e.h);
          // Red Outline
          ctx.strokeStyle = '#F00';
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x, e.y, e.w, e.h);
          // Eyes
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(e.x + 20, e.y + 20, 16, 16);
          ctx.fillRect(e.x + e.w - 36, e.y + 20, 16, 16);
          // Horns
          ctx.fillStyle = '#8B0000';
          ctx.beginPath();
          ctx.moveTo(e.x + 10, e.y);
          ctx.lineTo(e.x + 20, e.y - 30);
          ctx.lineTo(e.x + 30, e.y);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.x + e.w - 10, e.y);
          ctx.lineTo(e.x + e.w - 20, e.y - 30);
          ctx.lineTo(e.x + e.w - 30, e.y);
          ctx.fill();
          // Wings
          ctx.fillStyle = '#1A1A1A';
          ctx.strokeStyle = '#F00';
          ctx.lineWidth = 2;
          const wingOffset = Math.sin(time / 40) * 40;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + 32);
          ctx.lineTo(e.x - 60, e.y + 32 - wingOffset);
          ctx.lineTo(e.x, e.y + 64);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(e.x + e.w, e.y + 32);
          ctx.lineTo(e.x + e.w + 60, e.y + 32 - wingOffset);
          ctx.lineTo(e.x + e.w, e.y + 64);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.lineWidth = 1;
          // HP Bar
          if (e.hp !== undefined) {
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x, e.y - 10, e.w, 6);
            ctx.fillStyle = '#F00';
            ctx.fillRect(e.x + 1, e.y - 9, (e.w - 2) * (e.hp / 40), 4);
          }
        } else if (e.type === 'boss2') {
          // Wings
          ctx.fillStyle = '#ADD8E6'; // Light blue
          const wingOffset = Math.sin(time / 50) * 20;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + 32);
          ctx.lineTo(e.x - 40, e.y + 32 - wingOffset);
          ctx.lineTo(e.x, e.y + 64);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.x + e.w, e.y + 32);
          ctx.lineTo(e.x + e.w + 40, e.y + 32 - wingOffset);
          ctx.lineTo(e.x + e.w, e.y + 64);
          ctx.fill();

          ctx.fillStyle = '#00008B'; // Dark blue
          ctx.fillRect(e.x, e.y, e.w, e.h);
          ctx.fillStyle = '#00BFFF'; // Deep sky blue
          ctx.fillRect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
          // Eyes
          ctx.fillStyle = '#FFF';
          ctx.fillRect(e.x + 16, e.y + 16, 16, 16);
          ctx.fillRect(e.x + e.w - 32, e.y + 16, 16, 16);
          ctx.fillStyle = '#F00';
          ctx.fillRect(e.x + 20, e.y + 20, 8, 8);
          ctx.fillRect(e.x + e.w - 28, e.y + 20, 8, 8);
          // HP Bar
          if (e.hp !== undefined) {
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x, e.y - 10, e.w, 6);
            ctx.fillStyle = '#F00';
            ctx.fillRect(e.x + 1, e.y - 9, (e.w - 2) * (e.hp / 15), 4);
          }
        } else if (e.type === 'lava_pellet') {
          // Lava animation for pellet
          ctx.fillStyle = '#FF4500';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner glow
          const flicker = Math.sin(time / 5) * 4;
          ctx.fillStyle = '#FF8C00';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/3 + flicker/2, 0, Math.PI * 2);
          ctx.fill();
          
          // Surface bubbles
          ctx.fillStyle = '#FFFF00';
          for (let i = 0; i < 3; i++) {
            const bx = e.x + e.w/2 + Math.cos(time/10 + i) * 10;
            const by = e.y + e.h/2 + Math.sin(time/10 + i) * 10;
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (e.type === 'recharge_orb') {
          // Floating red orb
          const floatY = Math.sin(time / 20) * 10;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#F00';
          ctx.fillStyle = '#8B0000';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2 + floatY, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#F00';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2 + floatY, e.w/3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2 - 5, e.y + e.h/2 - 5 + floatY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (e.type === 'boss2_pellet') {
          ctx.fillStyle = '#00008B';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#00BFFF';
          ctx.beginPath();
          ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/4, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'rainbow_explosion') {
          if (e.timer !== undefined && e.maxTimer !== undefined) {
            const progress = 1 - (e.timer / e.maxTimer);
            const hue = (time / 10) % 360;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.3 * (1 - progress)})`;
            ctx.fillRect(state.cameraX, 0, 800, 480);
            
            // Rainbow particles filling the screen
            for (let i = 0; i < 30; i++) {
              const px = ((Math.sin(i * 123.45) + 1) / 2) * 800 + state.cameraX;
              const py = ((Math.cos(i * 678.90) + 1) / 2) * 480;
              const size = (Math.sin(time / 20 + i) + 1.5) * 40;
              ctx.fillStyle = `hsla(${(hue + i * 30) % 360}, 100%, 50%, ${0.6 * (1 - progress)})`;
              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (e.type === 'explosion') {
          if (e.timer !== undefined && e.maxTimer !== undefined) {
            const progress = 1 - (e.timer / e.maxTimer);
            ctx.beginPath();
            ctx.arc(e.x, e.y, progress * 100, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 165, 0, ${1 - progress})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(e.x, e.y, progress * 60, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${1 - progress})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(e.x, e.y, progress * 30, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
            ctx.fill();
          }
        } else if (e.type === 'ladder') {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(e.x + 4, e.y, 4, e.h);
          ctx.fillRect(e.x + e.w - 8, e.y, 4, e.h);
          for (let i = 0; i < e.h; i += 8) {
            ctx.fillRect(e.x + 4, e.y + i, e.w - 8, 4);
          }
        } else if (e.type === 'powerup_speed') {
          ctx.fillStyle = '#00FFFF'; // Cyan
          ctx.beginPath();
          ctx.moveTo(e.x + 8, e.y);
          ctx.lineTo(e.x + 16, e.y + 8);
          ctx.lineTo(e.x + 8, e.y + 16);
          ctx.lineTo(e.x, e.y + 8);
          ctx.fill();
        } else if (e.type === 'powerup_jump') {
          ctx.fillStyle = '#00FF00'; // Lime
          ctx.beginPath();
          ctx.moveTo(e.x + 8, e.y);
          ctx.lineTo(e.x + 16, e.y + 8);
          ctx.lineTo(e.x + 8, e.y + 16);
          ctx.lineTo(e.x, e.y + 8);
          ctx.fill();
        } else if (e.type === 'powerup_invincibility') {
          ctx.fillStyle = '#FFD700'; // Gold
          ctx.beginPath();
          ctx.moveTo(e.x + 8, e.y);
          ctx.lineTo(e.x + 16, e.y + 8);
          ctx.lineTo(e.x + 8, e.y + 16);
          ctx.lineTo(e.x, e.y + 8);
          ctx.fill();
        } else if (e.type === 'trampoline') {
          ctx.fillStyle = '#1E90FF'; // Dodger blue
          ctx.fillRect(e.x, e.y + 8, e.w, e.h - 8);
          // Springs
          ctx.strokeStyle = '#CCC';
          ctx.beginPath();
          ctx.moveTo(e.x + 4, e.y + 8);
          ctx.lineTo(e.x + 4, e.y + e.h);
          ctx.moveTo(e.x + e.w - 4, e.y + 8);
          ctx.lineTo(e.x + e.w - 4, e.y + e.h);
          ctx.stroke();
          // Bounce pad
          ctx.fillStyle = '#0000CD'; // Medium blue
          const bounceOffset = Math.sin(time / 100) * 2;
          ctx.fillRect(e.x, e.y + 4 + bounceOffset, e.w, 4);
        } else if (e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss') {
          if (e.type === 'yellow_boss') {
            // Yellow Boss Redesign: Goldenrod, one large red eye, and horns
            ctx.fillStyle = '#DAA520'; // Goldenrod
            ctx.fillRect(e.x, e.y, e.w, e.h);
            
            // Horns
            ctx.fillStyle = '#8B4513'; // Saddle Brown
            ctx.beginPath();
            ctx.moveTo(e.x + 10, e.y);
            ctx.lineTo(e.x + 25, e.y - 20);
            ctx.lineTo(e.x + 40, e.y);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(e.x + e.w - 10, e.y);
            ctx.lineTo(e.x + e.w - 25, e.y - 20);
            ctx.lineTo(e.x + e.w - 40, e.y);
            ctx.fill();

            // One Large Red Eye
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(e.x + e.w / 2, e.y + e.h / 3 + 5, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#F00'; // Red pupil
            ctx.beginPath();
            const eyePulse = Math.sin(time / 200) * 2;
            ctx.arc(e.x + e.w / 2, e.y + e.h / 3 + 5, 10 + eyePulse, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000'; // Small black center
            ctx.beginPath();
            ctx.arc(e.x + e.w / 2, e.y + e.h / 3 + 5, 4, 0, Math.PI * 2);
            ctx.fill();

            // Angry eyebrow for the single eye
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(e.x + e.w / 2 - 25, e.y + e.h / 3 - 15);
            ctx.lineTo(e.x + e.w / 2 + 25, e.y + e.h / 3 - 15);
            ctx.stroke();
            ctx.lineWidth = 1;
          } else {
            ctx.fillStyle = e.type === 'green_boss' ? '#006400' : '#DC143C'; // Dark green or Crimson boss
            ctx.fillRect(e.x, e.y, e.w, e.h);
            // Big Eyes
            ctx.fillStyle = '#FFF';
            ctx.fillRect(e.x + 12, e.y + 12, 12, 12);
            ctx.fillRect(e.x + 40, e.y + 12, 12, 12);
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x + 16, e.y + 16, 4, 4);
            ctx.fillRect(e.x + 44, e.y + 16, 4, 4);
            // Angry eyebrows
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(e.x + 8, e.y + 8);
            ctx.lineTo(e.x + 24, e.y + 16);
            ctx.moveTo(e.x + 56, e.y + 8);
            ctx.lineTo(e.x + 40, e.y + 16);
            ctx.stroke();
            ctx.lineWidth = 1; // reset
          }
          
          // Boss HP Bar (Skip for yellow_boss as requested)
          if (e.hp !== undefined && e.type !== 'yellow_boss') {
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x, e.y - 10, e.w, 6);
            ctx.fillStyle = '#F00';
            const maxHp = e.type === 'green_boss' ? 20 : 5;
            ctx.fillRect(e.x + 1, e.y - 9, (e.w - 2) * (e.hp / maxHp), 4);
          }
        }
      }
      
      // Draw player (custom hero)
      const p = state.player;
      
      // Powerup Auras
      if (p.powerInvulnTimer > 0) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
        ctx.lineWidth = 1;
      } else if (p.speedTimer > 0) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
        ctx.lineWidth = 1;
      } else if (p.jumpTimer > 0) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4);
        ctx.lineWidth = 1;
      }

      if (state.player.invulnerableTimer <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
        ctx.fillStyle = state.playerConfig.color;
        ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
        
        // Eyes
        ctx.fillStyle = '#FFF';
        const dir = state.player.vx < 0 ? -1 : 1;
        const eyeOffsetX = dir === 1 ? 12 : 4;
        ctx.fillRect(state.player.x + eyeOffsetX, state.player.y + 4, 4, 4);
        ctx.fillRect(state.player.x + eyeOffsetX + 6, state.player.y + 4, 4, 4);
        
        // Pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(state.player.x + eyeOffsetX + (dir === 1 ? 2 : 0), state.player.y + 4, 2, 2);
        ctx.fillRect(state.player.x + eyeOffsetX + 6 + (dir === 1 ? 2 : 0), state.player.y + 4, 2, 2);
        
        // Headband
        ctx.fillStyle = state.playerConfig.headbandColor;
        ctx.fillRect(state.player.x, state.player.y, state.player.w, 3);

        // Shield (Blocking)
        if (state.player.isBlocking) {
          ctx.fillStyle = '#888';
          ctx.beginPath();
          ctx.arc(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2, state.player.w / 2 + 4, 0, Math.PI * 2);
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Sword (Attacking)
        if (state.player.isAttacking) {
          ctx.fillStyle = '#DDD';
          const swordW = 20;
          const swordH = 4;
          if (state.player.vx < 0) {
            ctx.fillRect(state.player.x - swordW, state.player.y + 12, swordW, swordH);
          } else {
            ctx.fillRect(state.player.x + state.player.w, state.player.y + 12, swordW, swordH);
          }
        } else if (state.player.isDownwardAttacking) {
          ctx.fillStyle = '#DDD';
          const swordW = 4;
          const swordH = 24;
          ctx.fillRect(state.player.x + state.player.w / 2 - swordW / 2, state.player.y + state.player.h, swordW, swordH);
          
          // Motion trail
          ctx.fillStyle = 'rgba(221, 221, 221, 0.4)';
          ctx.fillRect(state.player.x + state.player.w / 2 - swordW / 2 - 2, state.player.y + state.player.h - 10, swordW + 4, 10);
        }
      }
      
      ctx.restore();
      
      // Draw HUD
      ctx.fillStyle = '#FFF';
      ctx.font = '20px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Level: ${state.levelIndex + 1}`, 10, 30);
      ctx.fillText(`Score: ${state.score}`, 10, 60);
      
      // Draw Yellow Boss HP Bar if visible
      const yellowBoss = state.entities.find(e => e.type === 'yellow_boss' && !e.collected);
      if (yellowBoss && yellowBoss.hp !== undefined) {
        const maxHp = 5;
        const barWidth = 400;
        const barHeight = 20;
        const startX = 400 - barWidth / 2;
        const startY = 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(startX - 4, startY - 4, barWidth + 8, barHeight + 8);
        
        ctx.fillStyle = '#555';
        ctx.fillRect(startX, startY, barWidth, barHeight);
        
        ctx.fillStyle = '#F00';
        ctx.fillRect(startX, startY, barWidth * (yellowBoss.hp / maxHp), barHeight);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YELLOW DEMON', 400, startY + 15);
      }

      // Draw Level 21 Boss bars (Pale Warrior and Burnt God)
      if (state.levelIndex === 20) {
        const paleWarrior = state.entities.find(e => e.type === 'white_boss' && !e.collected);
        const burntGod = state.entities.find(e => e.type === 'black_boss' && !e.collected);
        
        if (paleWarrior && paleWarrior.hp !== undefined) {
          const maxHp = 7;
          const barWidth = 400;
          const barHeight = 20;
          const startX = 400 - barWidth / 2;
          const startY = 20;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(startX - 4, startY - 4, barWidth + 8, barHeight + 8);
          ctx.fillStyle = '#555';
          ctx.fillRect(startX, startY, barWidth, barHeight);
          ctx.fillStyle = '#FFF';
          ctx.fillRect(startX, startY, barWidth * (paleWarrior.hp / maxHp), barHeight);
          ctx.fillStyle = '#000';
          ctx.font = '16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PALE WARRIOR', 400, startY + 15);
        } else if (burntGod && burntGod.hp !== undefined) {
          const maxHp = 20;
          const barWidth = 400;
          const barHeight = 20;
          const startX = 400 - barWidth / 2;
          const startY = 20;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(startX - 4, startY - 4, barWidth + 8, barHeight + 8);
          ctx.fillStyle = '#555';
          ctx.fillRect(startX, startY, barWidth, barHeight);
          ctx.fillStyle = '#F00';
          ctx.fillRect(startX, startY, barWidth * (burntGod.hp / maxHp), barHeight);
          ctx.fillStyle = '#FFF';
          ctx.font = '16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BURNT GOD', 400, startY + 15);
        }
      }
      
      // Draw "You're Fired" message
      if (state.firedMessageTimer > 0) {
        ctx.fillStyle = '#F00';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("YOU'RE FIRED!", 400, 240);
      }

      // Draw Secret Level message
      if (state.secretMessageTimer > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('secret level unlocked! The secret code is 1425!', 400, 200);
      }
      
      // Draw Hearts
      ctx.fillStyle = '#F00';
      for (let i = 0; i < 5; i++) {
        if (i < state.player.hp) {
          ctx.fillText('♥', 10 + i * 20, 90);
        } else {
          ctx.fillStyle = '#555';
          ctx.fillText('♥', 10 + i * 20, 90);
          ctx.fillStyle = '#F00';
        }
      }

      if (state.player.hasKey) {
        ctx.fillStyle = '#FFA500';
        ctx.fillText(`Key: YES`, 10, 120);
      }
      
      if (state.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 800, 480);
        ctx.fillStyle = '#F00';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 240);
        ctx.font = '20px monospace';
        ctx.fillText('Press R to Restart', 400, 280);
      } else if (state.isLevelComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 800, 480);
        ctx.fillStyle = '#0F0';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE', 400, 240);
        ctx.font = '20px monospace';
        ctx.fillText('Press Enter for Next Level', 400, 280);
      } else if (state.isGameComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 800, 480);
        ctx.fillStyle = '#FFD700';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', 400, 240);
        ctx.font = '20px monospace';
        ctx.fillText(`Final Score: ${state.score}`, 400, 280);
      }
    };
    
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      if (!isPausedRef.current) {
        // Cap dt to prevent huge jumps if tab is inactive
        if (dt < 0.1) {
          engine.update(dt);
          
          // Handle level transitions
          if (engine.state.isGameOver && (engine.keys['r'] || engine.keys['R'])) {
            // Reset score to what it was at start of level (approximate by removing current level coins)
            // Actually, just keep current score for simplicity or reset to 0. Let's just keep it.
            engine.loadLevel(engine.state.levelIndex, engine.state.score);
          } else if (engine.state.isLevelComplete && engine.keys['Enter']) {
            engine.loadLevel(engine.state.levelIndex + 1, engine.state.score);
          }
          
          // Music logic
          if (engine.state.isGameOver) {
            musicManager.playState('gameover');
          } else if (engine.state.isLevelComplete || engine.state.isGameComplete) {
            musicManager.stop();
          } else {
            const hasBoss = engine.state.entities.some(e => 
              !e.collected && (e.type === 'boss' || e.type === 'green_boss' || e.type === 'yellow_boss' || e.type === 'boss2')
            );
            if (hasBoss) {
              musicManager.playState('boss');
            } else {
              musicManager.playState('normal');
            }
          }
        }
      } else {
        musicManager.stop();
      }
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          render(ctx, time);
        }
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      cancelAnimationFrame(animationFrameId);
      musicManager.stop();
    };
  }, [engine, gameStarted]);

  const characters = [
    { name: 'Green', color: '#4CAF50', headbandColor: '#2E7D32' },
    { name: 'Red', color: '#F44336', headbandColor: '#D32F2F' },
    { name: 'Blue', color: '#2196F3', headbandColor: '#1565C0' },
    { name: 'Yellow', color: '#FFEB3B', headbandColor: '#F57F17' },
  ];

  if (!gameStarted) {
    if (!showLevelSelect) {
      return (
        <div className="flex flex-col items-center justify-center bg-gray-900 border-4 border-gray-800 rounded shadow-2xl p-8 w-[800px] h-[480px]">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">Select Your Character</h2>
          <div className="flex gap-8 mb-12">
            {characters.map((char, i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-4 p-4 rounded-lg hover:bg-gray-800 transition-colors border-2 border-transparent hover:border-gray-600"
                onClick={() => {
                  setPlayerConfig({ color: char.color, headbandColor: char.headbandColor });
                  engine.state.playerConfig.color = char.color;
                  engine.state.playerConfig.headbandColor = char.headbandColor;
                  setShowLevelSelect(true);
                }}
              >
                <div 
                  className="w-16 h-16 relative"
                  style={{ backgroundColor: char.color }}
                >
                  <div className="absolute top-0 left-0 w-full h-3" style={{ backgroundColor: char.headbandColor }}></div>
                  <div className="absolute top-4 left-3 w-2 h-2 bg-white"><div className="w-1 h-1 bg-black absolute bottom-0 right-0"></div></div>
                  <div className="absolute top-4 right-3 w-2 h-2 bg-white"><div className="w-1 h-1 bg-black absolute bottom-0 right-0"></div></div>
                </div>
                <span className="text-white font-mono font-bold">{char.name}</span>
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center bg-gray-900 border-4 border-gray-800 rounded shadow-2xl p-8 w-[800px] h-[480px]">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">Select Level</h2>
          <div className="grid grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <button
                key={i}
                className="w-16 h-16 bg-gray-800 text-white font-mono font-bold text-xl rounded hover:bg-blue-600 transition-colors border-2 border-gray-700 hover:border-blue-400 flex items-center justify-center"
                onClick={() => {
                  engine.loadLevel(i);
                  setGameStarted(true);
                  musicManager.init();
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Secret Code"
              className="px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 font-mono text-center w-40 focus:outline-none focus:border-blue-500"
              value={secretCode}
              onChange={(e) => {
                const val = e.target.value;
                setSecretCode(val);
                if (val === '1425') {
                  engine.loadLevel(20);
                  setGameStarted(true);
                  musicManager.init();
                  setSecretCode('');
                }
              }}
            />
          </div>
          <button 
            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors font-mono"
            onClick={() => setShowLevelSelect(false)}
          >
            Back to Character Select
          </button>
        </div>
      );
    }
  }
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 mb-4">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-bold"
          onClick={() => {
            engine.saveGame();
            alert('Game Saved!');
            // Return focus to window so keys work
            window.focus();
          }}
        >
          Save Game
        </button>
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bold"
          onClick={() => {
            if (engine.loadGame()) {
              setPlayerConfig(engine.state.playerConfig);
              alert('Game Loaded!');
            } else {
              alert('No save found.');
            }
            window.focus();
          }}
        >
          Load Game
        </button>
      </div>
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={480} 
          className="border-4 border-gray-800 rounded shadow-2xl bg-gray-900"
          style={{ imageRendering: 'pixelated' }}
          tabIndex={0}
        />
        {isPaused && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded z-10">
            <h2 className="text-4xl font-bold text-white mb-8 font-mono">PAUSED</h2>
            <div className="flex flex-col gap-4">
              <button 
                className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-bold font-mono text-xl"
                onClick={() => {
                  setIsPaused(false);
                  canvasRef.current?.focus();
                }}
              >
                Resume Game
              </button>
              <button 
                className="px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bold font-mono text-xl"
                onClick={() => {
                  setIsPaused(false);
                  setGameStarted(false);
                  setShowLevelSelect(false);
                  musicManager.stop();
                }}
              >
                Character Select
              </button>
              <button 
                className="px-8 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-bold font-mono text-xl"
                onClick={() => {
                  setIsPaused(false);
                  setGameStarted(false);
                  setShowLevelSelect(true);
                  musicManager.stop();
                }}
              >
                Level Select
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="text-gray-400 text-sm mt-2 font-mono">
        Controls: Arrow Keys / WASD to move and jump. F to fight. B to block. P to pause.
      </div>

      <div className="bg-slate-800 p-4 rounded-lg w-full max-w-[800px] mt-4">
        <h3 className="text-white font-bold mb-4 font-mono">Customize Hero</h3>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm font-mono">Body Color</label>
            <input 
              type="color" 
              value={playerConfig.color}
              onChange={(e) => {
                const newColor = e.target.value;
                setPlayerConfig(prev => ({ ...prev, color: newColor }));
                engine.state.playerConfig.color = newColor;
                window.focus();
              }}
              className="w-16 h-8 cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-sm font-mono">Headband Color</label>
            <input 
              type="color" 
              value={playerConfig.headbandColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setPlayerConfig(prev => ({ ...prev, headbandColor: newColor }));
                engine.state.playerConfig.headbandColor = newColor;
                window.focus();
              }}
             className="w-16 h-8 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
