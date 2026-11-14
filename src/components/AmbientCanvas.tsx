import React, { useEffect, useRef } from 'react';
import { StyleId } from '../data/weddingData';

interface AmbientCanvasProps {
  styleId: StyleId;
}

type AmbientParticleKind =
  | 'heart'
  | 'petal'
  | 'butterfly'
  | 'gold-foil'
  | 'champagne-bubble'
  | 'diamond-star'
  | 'firefly'
  | 'lantern'
  | 'apricot-blossom';

interface AmbientParticle {
  kind: AmbientParticleKind;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  phase: number;
  phaseSpeed: number;
  color: string;
  secondaryColor?: string;
  alpha: number;
  sprite: HTMLCanvasElement;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  decay: number;
  color: string;
}

interface FireworkSpark {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  shape: 'circle' | 'heart' | 'star' | 'trail';
  gravity: number;
  sprite?: HTMLCanvasElement;
}

interface CenterSymbolFlash {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  sprite: HTMLCanvasElement;
}

declare global {
  interface Window {
    triggerWeddingFireworks?: (count?: number) => void;
  }
}

// ============================================================================
// BỘ NHỚ ĐỆM OFFSCREEN SPRITE TOÀN CỤC (LOẠI BỎ 100% RUNTIME SHADOWBLUR TRONG 60FPS)
// Vẽ sẵn hào quang Gaussian Blur & đường cong Bezier 1 lần duy nhất lên GPU Bitmap
// ============================================================================
const spriteCache = new Map<string, HTMLCanvasElement>();

function getOrCreateSprite(
  key: string,
  pixelSize: number,
  drawer: (sctx: CanvasRenderingContext2D, half: number, size: number) => void
): HTMLCanvasElement {
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const off = document.createElement('canvas');
  off.width = pixelSize;
  off.height = pixelSize;
  const sctx = off.getContext('2d');
  if (sctx) {
    drawer(sctx, pixelSize / 2, pixelSize);
  }
  spriteCache.set(key, off);
  return off;
}

function getHeartSprite(color: string, withGlow: boolean): HTMLCanvasElement {
  return getOrCreateSprite(`heart:${color}:${withGlow ? 1 : 0}`, 72, (sctx, half) => {
    const unit = 22;
    sctx.translate(half, half - unit * 0.5);
    sctx.fillStyle = color;
    if (withGlow) {
      sctx.shadowColor = color;
      sctx.shadowBlur = 12;
    }
    const topCurve = unit * 0.3;
    sctx.beginPath();
    sctx.moveTo(0, topCurve);
    sctx.bezierCurveTo(0, 0, -unit / 2, 0, -unit / 2, topCurve);
    sctx.bezierCurveTo(
      -unit / 2,
      (unit + topCurve) / 2,
      0,
      (unit + topCurve) / 1.4,
      0,
      unit
    );
    sctx.bezierCurveTo(
      0,
      (unit + topCurve) / 1.4,
      unit / 2,
      (unit + topCurve) / 2,
      unit / 2,
      topCurve
    );
    sctx.bezierCurveTo(unit / 2, 0, 0, 0, 0, topCurve);
    sctx.closePath();
    sctx.fill();
  });
}

function getStarSprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`star:${color}`, 80, (sctx, half) => {
    const r = 18;
    sctx.translate(half, half);
    sctx.fillStyle = color;
    sctx.shadowColor = color;
    sctx.shadowBlur = 14;
    sctx.beginPath();
    for (let i = 0; i < 4; i++) {
      sctx.lineTo(Math.cos((i * Math.PI) / 2) * r, Math.sin((i * Math.PI) / 2) * r);
      sctx.lineTo(
        Math.cos(((i + 0.5) * Math.PI) / 2) * (r * 0.28),
        Math.sin(((i + 0.5) * Math.PI) / 2) * (r * 0.28)
      );
    }
    sctx.closePath();
    sctx.fill();
  });
}

function getGlowDotSprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`dot:${color}`, 64, (sctx, half) => {
    sctx.fillStyle = color;
    sctx.shadowColor = color;
    sctx.shadowBlur = 14;
    sctx.beginPath();
    sctx.arc(half, half, 10, 0, Math.PI * 2);
    sctx.fill();
  });
}

function getPetalSprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`petal:${color}`, 72, (sctx, half) => {
    const u = 16;
    sctx.translate(half, half - u * 0.45);
    sctx.fillStyle = color;
    sctx.beginPath();
    sctx.moveTo(0, 0);
    sctx.bezierCurveTo(u, -u * 0.9, u * 1.5, u * 0.5, 0, u * 1.45);
    sctx.bezierCurveTo(-u * 1.5, u * 0.5, -u, -u * 0.9, 0, 0);
    sctx.fill();
  });
}

function getButterflySprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`butterfly:${color}`, 84, (sctx, half) => {
    const u = 18;
    sctx.translate(half, half);
    sctx.fillStyle = color;
    sctx.shadowColor = '#FFD700';
    sctx.shadowBlur = 12;
    sctx.beginPath();
    sctx.ellipse(-u * 0.45, 0, u * 0.55, u * 0.35, -0.3, 0, Math.PI * 2);
    sctx.ellipse(u * 0.45, 0, u * 0.55, u * 0.35, 0.3, 0, Math.PI * 2);
    sctx.fill();
  });
}

function getBubbleSprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`bubble:${color}`, 56, (sctx, half) => {
    const u = 18;
    sctx.strokeStyle = color;
    sctx.lineWidth = 2.2;
    sctx.beginPath();
    sctx.arc(half, half, u, 0, Math.PI * 2);
    sctx.stroke();
    sctx.fillStyle = 'rgba(255,255,255,0.48)';
    sctx.beginPath();
    sctx.arc(half - u * 0.3, half - u * 0.3, u * 0.25, 0, Math.PI * 2);
    sctx.fill();
  });
}

function getGoldFoilSprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`foil:${color}`, 40, (sctx, half) => {
    const u = 22;
    sctx.fillStyle = color;
    sctx.fillRect(half - u / 2, half - (u * 0.7) / 2, u, u * 0.7);
  });
}

function getLanternSprite(): HTMLCanvasElement {
  return getOrCreateSprite('lantern:hoian', 96, (sctx, half) => {
    const u = 20;
    sctx.translate(half, half);
    sctx.shadowColor = '#FF9F1C';
    sctx.shadowBlur = 20;
    const grad = sctx.createRadialGradient(0, u * 0.2, 1, 0, 0, u);
    grad.addColorStop(0, '#FFF3B0');
    grad.addColorStop(0.5, '#FF9F1C');
    grad.addColorStop(1, '#E71D36');
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.roundRect(-u * 0.42, -u * 0.55, u * 0.84, u * 1.1, [
      u * 0.3,
      u * 0.3,
      u * 0.1,
      u * 0.1,
    ]);
    sctx.fill();
  });
}

function getApricotSprite(color: string): HTMLCanvasElement {
  return getOrCreateSprite(`apricot:${color}`, 64, (sctx, half) => {
    const u = 18;
    sctx.translate(half, half);
    sctx.fillStyle = color;
    for (let k = 0; k < 5; k++) {
      sctx.rotate((Math.PI * 2) / 5);
      sctx.beginPath();
      sctx.arc(0, -u * 0.55, u * 0.36, 0, Math.PI * 2);
      sctx.fill();
    }
    sctx.fillStyle = '#B91C1C';
    sctx.beginPath();
    sctx.arc(0, 0, u * 0.2, 0, Math.PI * 2);
    sctx.fill();
  });
}

function getSymbolFlashSprite(text: string, color: string): HTMLCanvasElement {
  return getOrCreateSprite(`sym:${text}:${color}`, 96, (sctx, half) => {
    sctx.translate(half, half);
    sctx.fillStyle = color;
    sctx.shadowColor = color;
    sctx.shadowBlur = 16;
    sctx.font = 'bold 34px "Cormorant Garamond", serif';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText(text, 0, 0);
  });
}

function getSpriteForParticleKind(kind: AmbientParticleKind, color: string): HTMLCanvasElement {
  switch (kind) {
    case 'heart':
      return getHeartSprite(color, false);
    case 'petal':
      return getPetalSprite(color);
    case 'butterfly':
      return getButterflySprite(color);
    case 'diamond-star':
      return getStarSprite(color);
    case 'champagne-bubble':
      return getBubbleSprite(color);
    case 'gold-foil':
      return getGoldFoilSprite(color);
    case 'firefly':
      return getGlowDotSprite(color);
    case 'lantern':
      return getLanternSprite();
    case 'apricot-blossom':
      return getApricotSprite(color);
  }
}

export const AmbientCanvas: React.FC<AmbientCanvasProps> = ({ styleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId = 0;
    let isTabHidden = document.hidden;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const syncCanvasSize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize, { passive: true });

    // ============================================================================
    // 1. KHỞI TẠO HẠT MÔI TRƯỜNG ĐẶC TRƯNG RIÊNG CHO TỪNG PHONG CÁCH (GIỮ NGUYÊN 100%)
    // ============================================================================
    const particles: AmbientParticle[] = [];
    const shootingStars: ShootingStar[] = [];
    const sparks: FireworkSpark[] = [];
    const symbolFlashes: CenterSymbolFlash[] = [];

    const count = width < 768 ? 26 : 42;

    for (let i = 0; i < count; i++) {
      if (styleId === 'fairytale') {
        const rand = i % 6;
        const kind: AmbientParticleKind =
          rand === 0 ? 'butterfly' : rand % 2 === 0 ? 'diamond-star' : 'petal';
        const color =
          kind === 'butterfly'
            ? '#D4AF37'
            : i % 3 === 0
            ? 'rgba(225, 95, 125, 0.78)'
            : 'rgba(248, 175, 192, 0.82)';
        particles.push({
          kind,
          x: Math.random() * width,
          y: Math.random() * height,
          size: kind === 'butterfly' ? Math.random() * 6 + 9 : Math.random() * 6 + 6,
          vx: (Math.random() - 0.5) * 0.6,
          vy: kind === 'butterfly' ? -(Math.random() * 0.5 + 0.25) : Math.random() * 0.85 + 0.45,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.018,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: kind === 'butterfly' ? 0.14 : 0.035,
          color,
          secondaryColor: '#FFF0F5',
          alpha: 0.85,
          sprite: getSpriteForParticleKind(kind, color),
        });
      } else if (styleId === 'editorial') {
        const kind: AmbientParticleKind =
          i % 3 === 0 ? 'diamond-star' : i % 2 === 0 ? 'champagne-bubble' : 'gold-foil';
        const color = i % 2 === 0 ? '#D4AF37' : '#F5E1A4';
        particles.push({
          kind,
          x: Math.random() * width,
          y: Math.random() * height,
          size: kind === 'diamond-star' ? Math.random() * 7 + 6 : Math.random() * 5 + 3.5,
          vx: (Math.random() - 0.5) * 0.35,
          vy: kind === 'champagne-bubble' ? -(Math.random() * 0.75 + 0.35) : Math.random() * 0.6 + 0.25,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.02,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.045,
          color,
          secondaryColor: '#FFFFFF',
          alpha: Math.random() * 0.55 + 0.35,
          sprite: getSpriteForParticleKind(kind, color),
        });
      } else if (styleId === 'cinematic') {
        const kind: AmbientParticleKind = i % 4 === 0 ? 'diamond-star' : 'firefly';
        const color = i % 2 === 0 ? '#FFD166' : '#FF9E64';
        particles.push({
          kind,
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 3.5 + 2,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          angle: Math.random() * Math.PI * 2,
          spin: 0.01,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: Math.random() * 0.06 + 0.02,
          color,
          alpha: 0.8,
          sprite: getSpriteForParticleKind(kind, color),
        });
      } else if (styleId === 'garden') {
        const mod = i % 5;
        const kind: AmbientParticleKind = mod === 0 ? 'diamond-star' : mod === 1 ? 'heart' : 'petal';
        const color =
          kind === 'heart'
            ? 'rgba(244, 182, 198, 0.55)'
            : i % 2 === 0
            ? 'rgba(255, 255, 255, 0.78)'
            : 'rgba(222, 242, 227, 0.72)';
        particles.push({
          kind,
          x: Math.random() * width,
          y: Math.random() * height,
          size:
            kind === 'diamond-star'
              ? Math.random() * 4.5 + 3.5
              : kind === 'heart'
              ? Math.random() * 4.5 + 5.5
              : Math.random() * 6.5 + 5.5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 0.75 + 0.38,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.02,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.035,
          color,
          secondaryColor: '#C8E6C9',
          alpha: kind === 'heart' ? 0.58 : 0.78,
          sprite: getSpriteForParticleKind(kind, color),
        });
      } else if (styleId === 'calla') {
        const mod = i % 5;
        const kind: AmbientParticleKind = mod === 0 ? 'diamond-star' : mod === 1 ? 'heart' : 'petal';
        const color =
          kind === 'heart'
            ? 'rgba(232, 140, 165, 0.52)'
            : i % 2 === 0
            ? 'rgba(214, 112, 138, 0.58)'
            : 'rgba(246, 205, 216, 0.68)';
        particles.push({
          kind,
          x: Math.random() * width,
          y: Math.random() * height,
          size:
            kind === 'diamond-star'
              ? Math.random() * 5 + 3.5
              : kind === 'heart'
              ? Math.random() * 4.5 + 5.5
              : Math.random() * 6.5 + 5.5,
          vx: (Math.random() - 0.5) * 0.55,
          vy: Math.random() * 0.8 + 0.4,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.025,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.04,
          color,
          secondaryColor: '#D4AF37',
          alpha: kind === 'heart' ? 0.55 : 0.72,
          sprite: getSpriteForParticleKind(kind, color),
        });
      } else {
        const isLantern = i % 3 === 0;
        const kind: AmbientParticleKind = isLantern ? 'lantern' : 'apricot-blossom';
        const color = isLantern ? '#FF6B35' : '#F7CE68';
        particles.push({
          kind,
          x: Math.random() * width,
          y: Math.random() * height,
          size: isLantern ? Math.random() * 7 + 10 : Math.random() * 5 + 5.5,
          vx: (Math.random() - 0.5) * 0.35,
          vy: isLantern ? -(Math.random() * 0.65 + 0.35) : Math.random() * 0.7 + 0.35,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.02,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.035,
          color,
          secondaryColor: '#FFF3B0',
          alpha: 0.88,
          sprite: getSpriteForParticleKind(kind, color),
        });
      }
    }

    // ============================================================================
    // 2. HÀM TẠO PHÁO HOA ĐẶC TRƯNG THEO TỪNG PHONG CÁCH (GIỮ NGUYÊN 100%)
    // ============================================================================
    const spawnStyleFirework = (cx: number, cy: number) => {
      if (isTabHidden || sparks.length > 360) return;

      if (styleId === 'fairytale') {
        const total = 44;
        for (let i = 0; i < total; i++) {
          const t = (Math.PI * 2 * i) / total;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          const scale = 0.22 + Math.random() * 0.04;
          const color = i % 2 === 0 ? '#FF4D79' : '#FFB3C6';
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: hx * scale,
            vy: hy * scale,
            alpha: 1,
            decay: 0.013 + Math.random() * 0.006,
            color,
            size: 3.2,
            shape: 'heart',
            gravity: 0.02,
            sprite: getHeartSprite(color, true),
          });
        }
        symbolFlashes.push({
          x: cx,
          y: cy,
          alpha: 1,
          scale: 0.6,
          sprite: getSymbolFlashSprite('♥', '#FF4D79'),
        });
      } else if (styleId === 'editorial') {
        const total = 48;
        const goldPalette = ['#D4AF37', '#FFF3C4', '#C5A059', '#FFFFFF'];
        for (let i = 0; i < total; i++) {
          const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.12;
          const speed = Math.random() * 4.5 + 1.4;
          const color = goldPalette[i % goldPalette.length];
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.011 + Math.random() * 0.007,
            color,
            size: Math.random() * 3.5 + 2.2,
            shape: 'star',
            gravity: 0.065,
            sprite: getStarSprite(color),
          });
        }
      } else if (styleId === 'cinematic') {
        const outerCount = 46;
        const innerCount = 26;
        const palette = ['#FFD166', '#FF6B8B', '#4CC9F0', '#F72585', '#FFF3B0'];
        const mainColor = palette[Math.floor(Math.random() * palette.length)];
        const subColor = '#FFD166';
        const mainDot = getGlowDotSprite(mainColor);
        const subStar = getStarSprite(subColor);

        for (let i = 0; i < outerCount; i++) {
          const angle = (Math.PI * 2 * i) / outerCount;
          const speed = 4.2 + Math.random() * 1.2;
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.012,
            color: mainColor,
            size: 2.6,
            shape: 'trail',
            gravity: 0.04,
            sprite: mainDot,
          });
        }
        for (let i = 0; i < innerCount; i++) {
          const angle = (Math.PI * 2 * i) / innerCount;
          const speed = 2.1 + Math.random() * 0.6;
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.015,
            color: subColor,
            size: 2.2,
            shape: 'star',
            gravity: 0.03,
            sprite: subStar,
          });
        }
      } else if (styleId === 'garden') {
        const total = 46;
        const gardenPalette = ['#4E8A5E', '#83C294', '#D4AF37', '#FFFDF9', '#A8D5BA'];
        for (let i = 0; i < total; i++) {
          const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.15;
          const speed = Math.random() * 4.2 + 1.6;
          const color = gardenPalette[i % gardenPalette.length];
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.012 + Math.random() * 0.006,
            color,
            size: Math.random() * 3.5 + 2.2,
            shape: 'star',
            gravity: 0.045,
            sprite: getStarSprite(color),
          });
        }
        symbolFlashes.push({
          x: cx,
          y: cy,
          alpha: 1,
          scale: 0.65,
          sprite: getSymbolFlashSprite('🌿', '#83C294'),
        });
      } else if (styleId === 'calla') {
        const total = 46;
        const callaPalette = ['#9B2240', '#681427', '#D4AF37', '#FCE79C', '#FFD1DC'];
        for (let i = 0; i < total; i++) {
          const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.15;
          const speed = Math.random() * 4.4 + 1.8;
          const color = callaPalette[i % callaPalette.length];
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.012 + Math.random() * 0.006,
            color,
            size: Math.random() * 3.6 + 2.2,
            shape: 'star',
            gravity: 0.05,
            sprite: getStarSprite(color),
          });
        }
        symbolFlashes.push({
          x: cx,
          y: cy,
          alpha: 1,
          scale: 0.65,
          sprite: getSymbolFlashSprite('✨', '#D4AF37'),
        });
      } else {
        const total = 44;
        const goldDot = getGlowDotSprite('#F7CE68');
        const redDot = getGlowDotSprite('#FF3B3B');
        for (let i = 0; i < total; i++) {
          const angle = (Math.PI * 2 * i) / total;
          const petalMod = 1 + 0.35 * Math.cos(8 * angle);
          const speed = 3.2 * petalMod;
          const isEven = i % 2 === 0;
          const color = isEven ? '#F7CE68' : '#FF3B3B';
          sparks.push({
            x: cx,
            y: cy,
            prevX: cx,
            prevY: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            decay: 0.013,
            color,
            size: 2.8,
            shape: 'trail',
            gravity: 0.03,
            sprite: isEven ? goldDot : redDot,
          });
        }
        symbolFlashes.push({
          x: cx,
          y: cy,
          alpha: 1,
          scale: 0.7,
          sprite: getSymbolFlashSprite('囍', '#F7CE68'),
        });
      }
    };

    const spawnShootingStar = () => {
      if (styleId !== 'cinematic' || isTabHidden) return;
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.35,
        vx: 7 + Math.random() * 4,
        vy: 3.5 + Math.random() * 2,
        length: 65 + Math.random() * 45,
        alpha: 1,
        decay: 0.022,
        color: '#FFE599',
      });
    };

    window.triggerWeddingFireworks = (burstCount = 5) => {
      for (let i = 0; i < burstCount; i++) {
        window.setTimeout(() => {
          const rx = width * (0.18 + Math.random() * 0.64);
          const ry = height * (0.15 + Math.random() * 0.42);
          spawnStyleFirework(rx, ry);
          if (styleId === 'cinematic') spawnShootingStar();
        }, i * 280);
      }
    };

    const autoFireworkInterval = window.setInterval(() => {
      if (isTabHidden) return;
      const rx = width * (0.15 + Math.random() * 0.7);
      const ry = height * (0.12 + Math.random() * 0.42);
      spawnStyleFirework(rx, ry);
      if (styleId === 'cinematic' && Math.random() > 0.35) {
        spawnShootingStar();
      }
    }, 3200);

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('button'))
      ) {
        return;
      }
      spawnStyleFirework(e.clientX, e.clientY);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    // ============================================================================
    // 3. VÒNG LẶP VẼ GPU SPRITE BLIT SIÊU MƯỢT (0 SHADOWBLUR, 0 GC CHURNING)
    // ============================================================================
    const drawTransformedSprite = (
      img: HTMLCanvasElement,
      x: number,
      y: number,
      rot: number,
      sx: number,
      sy: number,
      drawSize: number
    ) => {
      const cos = Math.cos(rot) * dpr;
      const sin = Math.sin(rot) * dpr;
      ctx.setTransform(cos * sx, sin * sx, -sin * sy, cos * sy, x * dpr, y * dpr);
      const half = drawSize * 0.5;
      ctx.drawImage(img, -half, -half, drawSize, drawSize);
    };

    const render = () => {
      if (isTabHidden) {
        animationFrameId = 0;
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // A. Vẽ các hạt môi trường bằng GPU Sprite Blit
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.phaseSpeed;
        p.angle += p.spin;
        p.x += p.vx + Math.sin(p.phase) * 0.4;
        p.y += p.vy;

        if (p.vy > 0 && p.y > height + 30) {
          p.y = -25;
          p.x = Math.random() * width;
        } else if (p.vy < 0 && p.y < -30) {
          p.y = height + 25;
          p.x = Math.random() * width;
        }
        if (p.x > width + 30) p.x = -25;
        if (p.x < -30) p.x = width + 25;

        if (p.kind === 'heart') {
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 22) * 72;
          drawTransformedSprite(p.sprite, p.x, p.y, Math.sin(p.phase) * 0.25, 1, 1, dSize);
        } else if (p.kind === 'petal') {
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 16) * 72;
          const flipY = Math.max(0.25, Math.abs(Math.cos(p.phase)));
          drawTransformedSprite(p.sprite, p.x, p.y, p.angle, 1, flipY, dSize);
        } else if (p.kind === 'butterfly') {
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 18) * 84;
          const wingScale = Math.abs(Math.cos(p.phase)) * 0.85 + 0.15;
          drawTransformedSprite(
            p.sprite,
            p.x,
            p.y,
            Math.sin(p.phase * 0.3) * 0.25,
            wingScale,
            1,
            dSize
          );
        } else if (p.kind === 'diamond-star') {
          const twinkle = (Math.sin(p.phase * 1.5) + 1) * 0.5;
          ctx.globalAlpha = 0.25 + twinkle * 0.75;
          const r = p.size * (0.7 + twinkle * 0.5);
          const dSize = (r / 18) * 80;
          drawTransformedSprite(p.sprite, p.x, p.y, p.angle, 1, 1, dSize);
        } else if (p.kind === 'champagne-bubble') {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 18) * 56;
          ctx.drawImage(p.sprite, p.x - dSize * 0.5, p.y - dSize * 0.5, dSize, dSize);
        } else if (p.kind === 'gold-foil') {
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 22) * 40;
          const sx = Math.cos(p.phase) || 0.05;
          const sy = Math.sin(p.phase) || 0.05;
          drawTransformedSprite(p.sprite, p.x, p.y, p.angle, sx, sy, dSize);
        } else if (p.kind === 'firefly') {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const glow = (Math.sin(p.phase) + 1) * 0.5;
          ctx.globalAlpha = 0.2 + glow * 0.8;
          const r = p.size * (0.6 + glow * 0.6);
          const dSize = (r / 10) * 64;
          ctx.drawImage(p.sprite, p.x - dSize * 0.5, p.y - dSize * 0.5, dSize, dSize);
        } else if (p.kind === 'lantern') {
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 20) * 96;
          drawTransformedSprite(p.sprite, p.x, p.y, Math.sin(p.phase) * 0.08, 1, 1, dSize);
        } else if (p.kind === 'apricot-blossom') {
          ctx.globalAlpha = p.alpha;
          const dSize = (p.size / 18) * 64;
          drawTransformedSprite(p.sprite, p.x, p.y, p.angle, 1, 1, dSize);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // B. Vẽ Sao Băng (Shooting Stars) cho phong cách Cinematic (Zero-GC compaction)
      let stWrite = 0;
      for (let i = 0; i < shootingStars.length; i++) {
        const st = shootingStars[i];
        st.x += st.vx;
        st.y += st.vy;
        st.alpha -= st.decay;
        if (st.alpha <= 0.02) continue;

        shootingStars[stWrite++] = st;
        const tailX = st.x - st.vx * 8;
        const tailY = st.y - st.vy * 8;
        const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.4, st.color);
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = st.alpha;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
      shootingStars.length = stWrite;

      // C. Vẽ Pháo Hoa tốc độ cao không dùng shadowBlur runtime (Zero-GC compaction)
      ctx.lineCap = 'round';
      let spWrite = 0;
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.prevX = s.x;
        s.prevY = s.y;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.vx *= 0.982;
        s.vy *= 0.982;
        s.alpha -= s.decay;

        if (s.alpha <= 0.02) continue;
        sparks[spWrite++] = s;

        ctx.globalAlpha = s.alpha;

        if (s.shape === 'heart' && s.sprite) {
          const dSize = ((s.size * 2.1) / 22) * 72;
          ctx.drawImage(s.sprite, s.x - dSize * 0.5, s.y - dSize * 0.35, dSize, dSize);
        } else if (s.shape === 'star' && s.sprite) {
          const dSize = ((s.size * 1.6) / 18) * 80;
          ctx.drawImage(s.sprite, s.x - dSize * 0.5, s.y - dSize * 0.5, dSize, dSize);
        } else if (s.shape === 'trail') {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.size;
          ctx.beginPath();
          ctx.moveTo(s.prevX, s.prevY);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          if (s.sprite) {
            const glowSize = (s.size / 10) * 44;
            ctx.drawImage(s.sprite, s.x - glowSize * 0.5, s.y - glowSize * 0.5, glowSize, glowSize);
          }
        } else if (s.sprite) {
          const dSize = (s.size / 10) * 64;
          ctx.drawImage(s.sprite, s.x - dSize * 0.5, s.y - dSize * 0.5, dSize, dSize);
        }
      }
      sparks.length = spWrite;

      // D. Vẽ Biểu Tượng Tỏa Sáng Ở Tâm Pháo Hoa (♥ / 🌿 / ✨ / 囍)
      let flWrite = 0;
      for (let i = 0; i < symbolFlashes.length; i++) {
        const fl = symbolFlashes[i];
        fl.alpha -= 0.022;
        fl.scale += 0.025;
        if (fl.alpha <= 0.02) continue;

        symbolFlashes[flWrite++] = fl;
        ctx.globalAlpha = fl.alpha;
        const dSize = 80 * fl.scale;
        ctx.drawImage(fl.sprite, fl.x - dSize * 0.5, fl.y - dSize * 0.5, dSize, dSize);
      }
      symbolFlashes.length = flWrite;

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      isTabHidden = document.hidden;
      if (!isTabHidden && animationFrameId === 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearInterval(autoFireworkInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', syncCanvasSize);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [styleId]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 transform-gpu"
      aria-hidden="true"
    />
  );
};
