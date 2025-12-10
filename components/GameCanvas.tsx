import React, { useRef, useEffect, useCallback } from 'react';
import { Player, Rock, Star, GameState } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  setScore: (score: number) => void;
  updateLives: (lives: number) => void;
  inputQueue: React.MutableRefObject<string[]>;
}

// Visual Constants
const LANES = 4;
const MAX_GAME_WIDTH = 600; // Increased for 3D width at bottom
const PLAYER_Y_OFFSET = 120; // Player distance from bottom

// Nebula cloud data structure
interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface Planet {
  x: number;
  y: number;
  radius: number;
  color: string;
  type: 'ringed' | 'cratered' | 'gas';
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onGameOver, 
  setScore, 
  updateLives,
  inputQueue 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Game Entities Refs
  const playerRef = useRef<Player>({
    lane: 1, 
    x: 0, // Logic X
    y: 0,
    isHit: false,
    hitTimer: 0
  });
  
  const rocksRef = useRef<Rock[]>([]);
  const starsRef = useRef<Star[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const difficultyRef = useRef(1);
  const lastSpawnFrameRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const wasGameOverRef = useRef(false);

  // --- AUDIO SYSTEM ---
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playSound = useCallback((type: 'move' | 'hit') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === 'move') {
      // Sci-fi "Swish"
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.connect(gainNode);
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'hit') {
      // Explosion Noise
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Lowpass filter for "boom" sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      noise.connect(filter);
      filter.connect(gainNode);
      
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      noise.start(now);
      noise.stop(now + 0.5);
    }
  }, []);

  // --- HELPERS ---
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // 3D Projection Helper
  const project = (x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    // 0 scale at horizon, 1 scale at bottom
    // We want some visibility at top, so map y range [0, height] to scale [0.4, 1.0]
    const scale = 0.4 + 0.6 * (y / canvasHeight);
    
    // Center point
    const cx = canvasWidth / 2;
    
    // Apply perspective transform to X
    // x relative to center * scale
    const dx = x - cx;
    const projectedX = cx + dx * scale;
    
    return { x: projectedX, y, scale };
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Load Background Image
    const img = new Image();
    // High-quality Andromeda Galaxy URL
    img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/M31_Lanoue.png/1280px-M31_Lanoue.png";
    img.onload = () => {
        bgImageRef.current = img;
    };

    // Initialize Audio on first interaction
    const handleInteract = () => initAudio();
    window.addEventListener('click', handleInteract, { once: true });
    window.addEventListener('keydown', handleInteract, { once: true });
    window.addEventListener('touchstart', handleInteract, { once: true });

    // Setup initial positions
    const gameWidth = Math.min(canvas.width, MAX_GAME_WIDTH);
    const laneWidth = gameWidth / LANES;
    const offsetX = (canvas.width - gameWidth) / 2;

    playerRef.current.lane = 1;
    playerRef.current.x = offsetX + (laneWidth * 1.5); 
    playerRef.current.y = canvas.height - PLAYER_Y_OFFSET;
    
    // Stars with Z depth (Fewer stars since background is busy)
    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    starsRef.current = stars;

    // Planets (No procedural nebulas, relying on background image)
    const planets: Planet[] = [];
    planets.push({
        x: canvas.width * 0.85,
        y: canvas.height * 0.2,
        radius: 40,
        color: '#fbbf24', 
        type: 'gas'
    });
    planetsRef.current = planets;
    
    rocksRef.current = [];
    scoreRef.current = 0;
    frameCountRef.current = 0;
    difficultyRef.current = 1;
    lastSpawnFrameRef.current = 0;
    playerRef.current.isHit = false;
    playerRef.current.hitTimer = 0;

    return () => {
       window.removeEventListener('click', handleInteract);
       window.removeEventListener('keydown', handleInteract);
       window.removeEventListener('touchstart', handleInteract);
    }
  }, [gameState.isPlaying, initAudio]);

  // Reset score when game starts or restarts
  useEffect(() => {
    // Detect restart: transitioning from game over (isGameOver: true) to playing (isGameOver: false)
    const isRestarting = wasGameOverRef.current && !gameState.isGameOver && gameState.isPlaying;
    // Detect new game: transitioning from not playing to playing
    const isNewGame = !wasPlayingRef.current && gameState.isPlaying && !gameState.isGameOver;
    
    if (isRestarting || isNewGame) {
      // Game just started/restarted - reset score to 0
      setScore(0);
      scoreRef.current = 0; // Also reset internal score ref
      wasPlayingRef.current = true;
    }
    
    // Track game over state
    wasGameOverRef.current = gameState.isGameOver;
    
    // Track playing state
    if (gameState.isPlaying && !gameState.isGameOver) {
      wasPlayingRef.current = true;
    } else if (!gameState.isPlaying) {
      wasPlayingRef.current = false;
    }
  }, [gameState.isPlaying, gameState.isGameOver, setScore]);

  // --- UPDATE LOOP ---
  const update = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Layout
    const gameWidth = Math.min(canvas.width, MAX_GAME_WIDTH);
    const laneWidth = gameWidth / LANES;
    const offsetX = (canvas.width - gameWidth) / 2;

    if (!gameState.isPlaying || gameState.isGameOver) {
       if(gameState.isGameOver) draw(ctx, canvas, offsetX, gameWidth, laneWidth);
       return;
    }

    // Process Input
    if (inputQueue.current.length > 0) {
      const move = inputQueue.current.shift();
      let didMove = false;
      if (move === 'left' && playerRef.current.lane > 0) {
        playerRef.current.lane--;
        didMove = true;
      } else if (move === 'right' && playerRef.current.lane < LANES - 1) {
        playerRef.current.lane++;
        didMove = true;
      }
      
      if (didMove) {
        playSound('move');
      }
    }

    // Logic X Interpolation (Flat logic)
    const targetX = offsetX + (playerRef.current.lane + 0.5) * laneWidth;
    playerRef.current.x += (targetX - playerRef.current.x) * 0.2; 
    
    playerRef.current.y = canvas.height - PLAYER_Y_OFFSET;

    // Game Logic Update
    frameCountRef.current++;
    scoreRef.current++;
    
    if (frameCountRef.current % 10 === 0) {
      setScore(Math.floor(scoreRef.current / 10));
      difficultyRef.current = 1 + (scoreRef.current / 4000); 
    }

    // Spawn Rocks
    const baseSpawnRate = 90;
    const spawnRate = Math.max(30, Math.floor(baseSpawnRate / difficultyRef.current)); 
    
    // Spawn rocks based on frame difference to ensure consistent spawning
    if (frameCountRef.current - lastSpawnFrameRef.current >= spawnRate) {
      const lane = Math.floor(Math.random() * LANES);
      rocksRef.current.push({
        id: Date.now() + Math.random(),
        lane: lane,
        y: -100, // Start above screen
        speed: (Math.random() * 2 + 2) * difficultyRef.current,
        rotation: Math.random() * Math.PI,
        type: Math.random() > 0.8 ? 'crystal' : Math.random() > 0.6 ? 'jagged' : 'round'
      });
      lastSpawnFrameRef.current = frameCountRef.current;
    }

    // Update Rocks
    rocksRef.current.forEach(rock => {
      rock.y += rock.speed;
      rock.rotation += 0.02;
    });

    // Remove old rocks
    rocksRef.current = rocksRef.current.filter(rock => rock.y < canvas.height + 150);

    // Collision (Logic based - uses Flat Coordinates)
    const hitDistance = 50; 
    if (playerRef.current.hitTimer > 0) {
      playerRef.current.hitTimer--;
      playerRef.current.isHit = false; 
    }

    if (playerRef.current.hitTimer === 0) {
       for (let i = rocksRef.current.length - 1; i >= 0; i--) {
          const rock = rocksRef.current[i];
          if (rock.lane === playerRef.current.lane) {
             const distY = Math.abs(rock.y - playerRef.current.y);
             if (distY < hitDistance) {
                handleHit(i);
             }
          }
       }
    }

    draw(ctx, canvas, offsetX, gameWidth, laneWidth);

    requestRef.current = requestAnimationFrame(update);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.lives, onGameOver, setScore, updateLives, inputQueue, playSound]);

  const handleHit = (rockIndex: number) => {
     rocksRef.current.splice(rockIndex, 1);
     playSound('hit');
     playerRef.current.hitTimer = 60; 
     playerRef.current.isHit = true;
     
     const newLives = gameState.lives - 1;
     updateLives(newLives);

     if (newLives <= 0) {
        onGameOver(Math.floor(scoreRef.current / 10));
     }
  };

  // --- DRAWING ---
  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, offsetX: number, gameWidth: number, laneWidth: number) => {
    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Background Image (Andromeda)
    if (bgImageRef.current) {
        // Draw image "cover" style
        const img = bgImageRef.current;
        const scale = Math.max(w / img.width, h / img.height);
        const x = (w / 2) - (img.width / 2) * scale;
        const y = (h / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Dark Overlay to make game elements pop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, w, h);
    } else {
        // Fallback Gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
        bgGradient.addColorStop(0, '#02040a'); 
        bgGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, w, h);
    }

    // Stars (Parallax on top of background image)
    starsRef.current.forEach(star => {
      star.y += (star.size * 0.3); 
      if (star.y > h) star.y = 0;
      
      const brightness = 0.5 + Math.random() * 0.5;
      ctx.globalAlpha = star.opacity * brightness;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 2. 3D Track
    // We draw the track lanes using the projection function
    
    // Draw Lane Lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'; // Indigo
    
    // Vertical Lines (The Lanes)
    for (let i = 0; i <= LANES; i++) {
        const lx = offsetX + i * laneWidth;
        
        ctx.beginPath();
        // Calculate points along the line for curve/perspective
        const steps = 10;
        for(let j=0; j<=steps; j++) {
            const ly = (h * j) / steps;
            const p = project(lx, ly, w, h);
            if(j===0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // Active Lane Highlight (Projected)
    const activeLane = playerRef.current.lane;
    const alx = offsetX + activeLane * laneWidth;
    
    // Draw a quad for the active lane
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.beginPath();
    const p1 = project(alx, 0, w, h);
    const p2 = project(alx + laneWidth, 0, w, h);
    const p3 = project(alx + laneWidth, h, w, h);
    const p4 = project(alx, h, w, h);
    
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.fill();


    // 3. Rocks (Projected & 3D Shaded)
    rocksRef.current.forEach(rock => {
      const rockLogicX = offsetX + (rock.lane + 0.5) * laneWidth;
      const { x: rx, y: ry, scale: rScale } = project(rockLogicX, rock.y, w, h);
      
      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(rScale, rScale);
      ctx.rotate(rock.rotation);

      // --- 3D Rock Rendering ---
      const radius = 40;
      const seed = rock.id;
      
      // Gradient for Sphere-like shading
      const grad = ctx.createRadialGradient(-10, -10, 5, 0, 0, radius);
      
      if (rock.type === 'crystal') {
          grad.addColorStop(0, '#A5F3FC'); // Light Cyan
          grad.addColorStop(0.5, '#06B6D4'); // Cyan
          grad.addColorStop(1, '#164E63'); // Dark Cyan
      } else if (rock.type === 'jagged') {
          grad.addColorStop(0, '#E2E8F0'); // Light Slate
          grad.addColorStop(0.5, '#64748B'); // Slate
          grad.addColorStop(1, '#1E293B'); // Dark Slate
      } else {
          // Magma
          grad.addColorStop(0, '#78716C'); // Stone
          grad.addColorStop(0.6, '#44403C'); 
          grad.addColorStop(1, '#0C0A09'); 
      }
      
      ctx.fillStyle = grad;
      
      // Draw shape
      ctx.beginPath();
      const vertices = 7;
      for (let j = 0; j < vertices; j++) {
          const angle = (j / vertices) * Math.PI * 2;
          const variance = pseudoRandom(seed + j); 
          const r = radius * (0.85 + 0.3 * variance); 
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Deep Shadow (Ambience)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(10, 10, radius * 0.6, 0, Math.PI*2);
      ctx.fill();

      // Craters / Surface Detail (clipped to shape? no, just simple)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(-8, -12, 6, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; // Highlight edge
      ctx.beginPath();
      ctx.arc(-8, -12, 6, 0, Math.PI, true); // Bottom rim lit
      ctx.fill();

      if (rock.type === 'round') {
        // Magma glow cracks
        ctx.strokeStyle = '#F87171';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(5, 15);
        ctx.stroke();
      }

      ctx.restore();
    });

    // 4. Player Spaceship (Projected)
    const p = playerRef.current;
    if (!(p.hitTimer > 0 && Math.floor(p.hitTimer / 4) % 2 === 0)) {
        // Project Player Position
        const { x: px, y: py, scale: pScale } = project(p.x, p.y, w, h);

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(pScale, pScale); // Scale player based on depth (though usually player is static Y)
        
        // Tilt
        const targetLogicX = offsetX + (p.lane + 0.5) * laneWidth;
        const tilt = (p.x - targetLogicX) * -0.015; 
        ctx.rotate(tilt);

        // --- 3D Spaceship ---
        
        // Engine Glow (Behind)
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#06b6d4';
        
        // Thrusters
        const flicker = Math.random() * 0.2 + 0.8;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(-12, 25);
        ctx.lineTo(0, 50 * flicker);
        ctx.lineTo(12, 25);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body (Shiny)
        const hullGrad = ctx.createLinearGradient(-20, 0, 20, 0);
        hullGrad.addColorStop(0, '#334155');
        hullGrad.addColorStop(0.4, '#f8fafc'); // Highlight
        hullGrad.addColorStop(0.6, '#94a3b8');
        hullGrad.addColorStop(1, '#1e293b');
        
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(0, -40); // Nose
        ctx.quadraticCurveTo(30, 20, 30, 30);
        ctx.lineTo(-30, 30);
        ctx.quadraticCurveTo(-30, 20, 0, -40);
        ctx.fill();

        // Cockpit
        const glassGrad = ctx.createRadialGradient(0, -10, 2, 0, -10, 15);
        glassGrad.addColorStop(0, '#7dd3fc');
        glassGrad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.ellipse(0, -10, 12, 18, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Gloss
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(-4, -14, 3, 6, -0.3, 0, Math.PI*2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.moveTo(-30, 10);
        ctx.lineTo(-50, 35);
        ctx.lineTo(-30, 30);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(50, 35);
        ctx.lineTo(30, 30);
        ctx.fill();

        ctx.restore();
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full absolute top-0 left-0 touch-none"
    />
  );
};