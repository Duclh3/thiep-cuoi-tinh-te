import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  animate as animateMotion,
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  Menu,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { WeddingData, WishItem } from '../data/weddingData';
import { soundEngine } from '../utils/soundEngine';
import { preloadAndDecodeImages } from '../utils/imagePreloader';

interface PorcelainBlueInvitationProps {
  data: WeddingData;
  wishes: WishItem[];
  onAddWish: (wish: WishItem) => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onStartMusic: () => void;
  guestName?: string;
  onOpenAdmin?: () => void;
}

const BASE_URL = import.meta.env.BASE_URL || '/';
const decorUrl = (file: string) => `${BASE_URL}images/decor/${file}`;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function getInitialGuestName(propName?: string): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('guest') || params.get('name') || params.get('u');
    if (q?.trim()) return q.trim();
  }
  return propName && propName !== 'Bạn & Người Thương' ? propName : '';
}

function getMonogram(groomShort: string, brideShort: string): string {
  const gParts = groomShort.trim().split(/\s+/);
  const bParts = brideShort.trim().split(/\s+/);
  const g = (gParts[gParts.length - 1] || 'Đ')[0].toUpperCase();
  const b = (bParts[bParts.length - 1] || 'H')[0].toUpperCase();
  return `${g}&${b}`;
}

/**
 * Khung chữ nhật đôi cổ điển kiểu Sponsalia với hoa văn cuộn 4 góc ở giữa bìa hoa sứ xanh
 */
const BaroqueInnerFrameSvg: React.FC = () => (
  <svg
    viewBox="0 0 260 360"
    preserveAspectRatio="none"
    className="pointer-events-none absolute inset-0 h-full w-full"
    aria-hidden="true"
  >
    {/* Viền ngoài mảnh */}
    <rect
      x="3"
      y="3"
      width="254"
      height="354"
      fill="none"
      stroke="#5C739C"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
    {/* Viền trong mảnh */}
    <rect
      x="8"
      y="8"
      width="244"
      height="344"
      fill="none"
      stroke="#5C739C"
      strokeWidth="0.7"
      opacity="0.8"
      vectorEffect="non-scaling-stroke"
    />
    {/* Họa tiết hoa văn góc mảnh 4 góc */}
    <path
      d="M8 28 Q18 26 20 18 Q22 10 30 8 M252 28 Q242 26 240 18 Q238 10 230 8 M8 332 Q18 334 20 342 Q22 350 30 352 M252 332 Q242 334 240 342 Q238 350 230 352"
      fill="none"
      stroke="#5C739C"
      strokeWidth="0.9"
      opacity="0.85"
    />
  </svg>
);

/**
 * Đồng hồ đếm ngược Bodoni Editorial 4 cột sắc nét (y hệt f_015 video 2)
 */
const PorcelainCountdown: React.FC<{ isoDate: string }> = ({ isoDate }) => {
  const [msLeft, setMsLeft] = useState(() =>
    Math.max(0, new Date(isoDate).getTime() - Date.now())
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setMsLeft(Math.max(0, new Date(isoDate).getTime() - Date.now())),
      1000
    );
    return () => window.clearInterval(id);
  }, [isoDate]);

  const items = [
    { label: 'NGÀY', value: Math.floor(msLeft / 86400000) },
    { label: 'GIỜ', value: Math.floor((msLeft / 3600000) % 24) },
    { label: 'PHÚT', value: Math.floor((msLeft / 60000) % 60) },
    { label: 'GIÂY', value: Math.floor((msLeft / 1000) % 60) },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-5">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="font-porcelain-serif text-[40px] leading-none tracking-[-0.02em] text-[#1D335B] tabular-nums [font-variant-numeric:lining-nums]">
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7F8CA3]">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

const PorcelainRotatingGallery: React.FC<{
  photos: string[];
  coupleName: string;
  onSelect: (url: string) => void;
}> = ({ photos, coupleName, onSelect }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(0);
  const stepRemainingRef = useRef(0);
  const isInView = useInView(viewportRef, { margin: '260px 0px' });
  const angleStep = photos.length > 0 ? 360 / photos.length : 0;

  useEffect(() => {
    if (!isInView || photos.length === 0) return;

    let rafId = 0;
    let lastTs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(34, Math.max(0, now - lastTs));
      lastTs = now;
      const frameScale = dt / 16.667;

      if (autoRotate) angleRef.current -= 0.11 * frameScale;
      if (Math.abs(stepRemainingRef.current) > 0.05) {
        const delta = stepRemainingRef.current * Math.min(1, 0.18 * frameScale);
        angleRef.current += delta;
        stepRemainingRef.current -= delta;
      } else if (stepRemainingRef.current !== 0) {
        angleRef.current += stepRemainingRef.current;
        stepRemainingRef.current = 0;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `rotateX(-3deg) rotateY(${angleRef.current.toFixed(2)}deg)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoRotate, isInView, photos.length]);

  const step = (direction: -1 | 1) => {
    stepRemainingRef.current += direction * angleStep;
  };

  if (photos.length === 0) return null;

  return (
    <div ref={viewportRef} className="relative z-10 mt-8 flex flex-col items-center">
      <div
        className="relative flex h-[300px] w-full items-center justify-center overflow-visible select-none"
        style={{ perspective: '1300px' }}
      >
        <div
          ref={trackRef}
          className="relative h-[200px] w-[144px] will-change-transform [transform-style:preserve-3d]"
          style={{ transform: 'rotateX(-3deg) rotateY(0deg)' }}
        >
          {photos.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={() => onSelect(url)}
              aria-label={`Mở ảnh cưới ${idx + 1}`}
              className="cursor-pointer group absolute inset-0 border border-[#8FA3C8] bg-[#FCFAF8] p-1.5 pb-7 shadow-[0_14px_28px_rgba(18,42,82,0.2)] [backface-visibility:hidden]"
              style={{
                transform: `rotateY(${idx * angleStep}deg) translateZ(var(--porcelain-carousel-z, 192px))`,
              }}
            >
              <span className="block h-full overflow-hidden border border-[#D9E0EC] bg-[#E9EDF4]">
                <img
                  src={url}
                  alt={`${coupleName} — ảnh cưới ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="font-porcelain-serif absolute inset-x-1 bottom-1.5 truncate text-center text-[12px] italic text-[#4F648A]">
                Kỷ niệm {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Xoay album sang trái"
          className="cursor-pointer grid h-9 w-9 place-items-center rounded-full border border-[#AEBBD1] bg-white/80 text-[#29436F] shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setAutoRotate((value) => !value)}
          className="cursor-pointer inline-flex min-w-[148px] items-center justify-center gap-2 rounded-full bg-[#21365C] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white shadow-md"
        >
          {autoRotate ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
          {autoRotate ? 'Tạm dừng xoay' : 'Tiếp tục xoay'}
        </button>
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Xoay album sang phải"
          className="cursor-pointer grid h-9 w-9 place-items-center rounded-full border border-[#AEBBD1] bg-white/80 text-[#29436F] shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const PorcelainHeroArtwork: React.FC<{
  data: WeddingData;
  textVisible: boolean;
  compact?: boolean;
  onScrollDown?: () => void;
}> = ({ data, textVisible, compact = false, onScrollDown }) => {
  const displayDate = data.weddingDate.displayDate.split('.').join(' · ');

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-5 py-12 text-center">
      <img
        src={decorUrl('style9-porcelain-hero-frame.jpg')}
        alt={compact ? '' : 'Hoa xanh sứ trắng'}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none mix-blend-multiply"
      />

      <div
        className={`relative z-10 flex flex-col items-center justify-center bg-[#FAF5F4]/95 shadow-[0_6px_30px_rgba(24,44,82,0.08)] ${
          compact
            ? 'h-[48%] w-[50%] px-2 py-4'
            : 'w-[66%] min-w-[238px] max-w-[268px] px-5 py-10'
        }`}
      >
        <BaroqueInnerFrameSvg />

        <motion.div
          initial={false}
          animate={{ opacity: textVisible ? 1 : 0, y: textVisible ? 0 : 8 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex w-full flex-col items-center justify-center"
        >
          <p className={`${compact ? 'text-[5.5px]' : 'text-[10px]'} font-medium uppercase leading-[1.6] tracking-[0.18em] text-[#7A8AA6]`}>
            BẰNG TẤT CẢ YÊU THƯƠNG
            <br />
            TRÂN TRỌNG KÍNH MỜI
          </p>

          <h1 className={`font-porcelain-serif font-medium leading-[1.02] tracking-[-0.01em] text-[#1D335B] ${compact ? 'mt-2 text-[19px]' : 'mt-4 text-[42px]'}`}>
            {data.groom.shortName}
          </h1>

          <span className={`font-handwritten-minimal text-[#667899] opacity-75 ${compact ? 'my-0 text-[10px]' : 'my-0.5 text-[21px]'}`}>
            &amp;
          </span>

          <h1 className={`font-porcelain-serif font-medium leading-[1.02] tracking-[-0.01em] text-[#1D335B] ${compact ? 'text-[19px]' : 'text-[42px]'}`}>
            {data.bride.shortName}
          </h1>

          <div className={`${compact ? 'my-1.5 w-7' : 'my-4 w-14'} h-px bg-[#C4CEDE]`} />

          <p className={`font-porcelain-serif tracking-[0.2em] text-[#4C6289] ${compact ? 'text-[7px]' : 'text-[16px]'}`}>
            {displayDate}
          </p>

          <p className={`font-handwritten-minimal text-[#6D7FA0] ${compact ? 'mt-0.5 text-[9px]' : 'mt-1.5 text-[21px]'}`}>
            Hưng Yên · Việt Nam
          </p>

          {!compact && (
            onScrollDown ? (
              <button
                type="button"
                onClick={onScrollDown}
                className="cursor-pointer mt-5 flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-[#6E7F9E] opacity-75"
              >
                <span>CUỘN XUỐNG</span>
                <ChevronDown className="h-3 w-3 animate-bounce" />
              </button>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-[#6E7F9E] opacity-75">
                <span>CUỘN XUỐNG</span>
                <ChevronDown className="h-3 w-3 animate-bounce" />
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Phong bì giấy kem 3 cánh gập (Trifold Gatefold) buộc nơ lụa bạc 3D — mở đúng 3 nhịp như video 2
 * 1) Chạm -> Nơ lụa bạc tháo lỏng và trượt rơi xuống
 * 2) Hai cánh cửa gập chéo mở bung 3D sang trái & phải lộ thiệp hoa sứ xanh bên trong
 * 3) Nắp trên/dưới mở ra & thiệp hoa sứ xanh phóng mượt lấp đầy màn hình
 */
const PorcelainTrifoldEnvelope: React.FC<{
  data: WeddingData;
  onComplete: () => void;
}> = ({ data, onComplete }) => {
  const [phase, setPhase] = useState<
    'closed' | 'untying' | 'doors' | 'flaps' | 'zooming' | 'revealing'
  >('closed');
  const animationTimersRef = useRef<number[]>([]);
  const hasStartedRef = useRef(false);
  const bowAnimationRef = useRef<{ stop: () => void } | null>(null);
  const bowProgress = useMotionValue(0);

  // Nơ dùng một đồng hồ duy nhất 0→1. Các công thức liên tục bên dưới
  // mô phỏng đúng nhịp video: giữ nút nơ, rũ tâm xuống, sau đó mới tách
  // hai nửa và tăng tốc theo trọng lực. Không còn easing khởi động lại
  // ở từng keyframe nên vận tốc không bị rơi về 0 giữa chừng.
  // Pha 1: dải lụa còn neo ở mép ngoài phong bì, nút nơ rũ xuống.
  const bowLeftDroopRotate = useTransform(bowProgress, (progress) => {
    return 20 * smoothstep(0.12, 0.75, progress);
  });
  const bowRightDroopRotate = useTransform(bowProgress, (progress) => {
    return -20 * smoothstep(0.12, 0.75, progress);
  });
  const bowDroopScaleX = useTransform(bowProgress, (progress) => {
    const angle = 20 * smoothstep(0.12, 0.75, progress);
    return 1 / Math.cos((angle * Math.PI) / 180);
  });

  // Pha 2: sau khi nút nơ đã rũ, hai nửa mới nhả neo và rơi theo trọng lực.
  const bowLeftReleaseX = useTransform(bowProgress, (progress) => {
    return -28 * smoothstep(0.55, 1, progress);
  });
  const bowRightReleaseX = useTransform(bowProgress, (progress) => {
    return 28 * smoothstep(0.55, 1, progress);
  });
  const bowLeftReleaseY = useTransform(bowProgress, (progress) => {
    const fall = clamp01((progress - 0.45) / 0.55);
    return 430 * fall * fall;
  });
  const bowRightReleaseY = useTransform(bowProgress, (progress) => {
    const fall = clamp01((progress - 0.45) / 0.55);
    return 440 * fall * fall;
  });
  const bowReleaseScaleY = useTransform(bowProgress, (progress) => {
    return 1 + 0.04 * smoothstep(0.45, 0.9, progress);
  });
  const bowOpacity = useTransform(bowProgress, (progress) => {
    return 1 - smoothstep(0.94, 1, progress);
  });

  useEffect(
    () => () => {
      animationTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      bowAnimationRef.current?.stop();
    },
    []
  );

  const schedulePhase = (callback: () => void, delay: number) => {
    animationTimersRef.current.push(window.setTimeout(callback, delay));
  };

  const handleOpen = () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    soundEngine.playOpenChime();
    bowAnimationRef.current?.stop();
    bowProgress.set(0);
    bowAnimationRef.current = animateMotion(bowProgress, 1, {
      duration: 2.08,
      ease: 'linear',
    });
    setPhase('untying');
    // Nơ rơi hẳn và nghỉ đúng nhịp video rồi mới trao lại cho
    // chuỗi mở cửa/nắp/zoom hiện có. Các khoảng sau đó giữ nguyên
    // timing của bản mới nhất mà người dùng đã hoàn thiện.
    schedulePhase(() => setPhase('doors'), 2750);
    schedulePhase(() => setPhase('flaps'), 3830);
    schedulePhase(() => setPhase('zooming'), 4480);
    schedulePhase(() => setPhase('revealing'), 5180);
    schedulePhase(() => onComplete(), 5780);
  };

  const phaseOrder = ['closed', 'untying', 'doors', 'flaps', 'zooming', 'revealing'] as const;
  const phaseIndex = phaseOrder.indexOf(phase);
  const isUntying = phase !== 'closed';
  const areDoorsOpen = phaseIndex >= phaseOrder.indexOf('doors');
  const areFlapsOpen = phaseIndex >= phaseOrder.indexOf('flaps');
  const isZooming = phaseIndex >= phaseOrder.indexOf('zooming');
  const isRevealing = phase === 'revealing';

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'linear' }}
      onClick={handleOpen}
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#F3ECEA] select-none"
    >
      {/* Chính bìa hoa này zoom thành trang đầu — không đổi sang một bản sao khác. */}
      <motion.div
        aria-hidden={!isZooming}
        initial={false}
        animate={
          isZooming
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.72 }
        }
        transition={
          isZooming
            ? { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.1 }
        }
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-[calc(100svh-46px)] w-full max-w-[430px] -translate-x-1/2 origin-center overflow-hidden"
      >
        <PorcelainHeroArtwork data={data} textVisible={isRevealing} />
      </motion.div>

      <div className="relative flex h-full w-full max-w-[430px] items-center justify-center overflow-hidden px-4">
        {/* Khung phong bì đứng 3 cánh gập 3D */}
        <motion.div
          initial={false}
          animate={isZooming ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5, delay: isZooming ? 0.18 : 0, ease: 'easeOut' }}
          className="relative z-20 aspect-[9/14.2] w-full max-w-[355px] [perspective:1800px]"
        >
        {/* THÂN PHONG BÌ TRONG (Đựng tấm thiệp hoa sứ xanh thực sự bên trong!) */}
        <div className="relative h-full w-full overflow-visible bg-[#EFE4D6]">
          {/* Nắp gập hình thang phía trên (mở bung ra sau khi cánh mở) */}
          <motion.div
            animate={areFlapsOpen ? { rotateX: 118, y: -12, opacity: 1 } : { rotateX: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.75, ease: [0.35, 0.05, 0.2, 1] }}
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[17%] bg-gradient-to-b from-[#EDE0D0] to-[#F5ECDF] [clip-path:polygon(0_0,100%_0,82%_100%,18%_100%)]"
          />

          {/* Nắp gập hình thang phía dưới */}
          <motion.div
            animate={areFlapsOpen ? { rotateX: -118, y: 12, opacity: 1 } : { rotateX: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.75, delay: areFlapsOpen ? 0.06 : 0, ease: [0.35, 0.05, 0.2, 1] }}
            style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[12%] bg-gradient-to-t from-[#E8DAC8] to-[#F4EBDE] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]"
          />

          {/* TẤM THIỆP HOA XANH SỨ TRẮNG BÊN TRONG — LỘ RA NGAY KHI 2 CÁNH MỞ! */}
          <div className="absolute inset-[4.5%] z-10 overflow-hidden bg-[#FAF5F4]">
            <PorcelainHeroArtwork data={data} textVisible={false} compact />
          </div>

          {/* CÁNH CỬA PHONG BÌ TRÁI (3D SWING LEFT — NẾP GẤP CHÉO KIM CƯƠNG Y HỆT VIDEO 2) */}
          <motion.div
            animate={
              areDoorsOpen
                ? { rotateY: -110 }
                : { rotateY: 0 }
            }
            transition={{ duration: 1.25, ease: [0.35, 0.05, 0.2, 1] }}
            style={{
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'visible',
            }}
            className="absolute inset-y-0 left-0 z-20 w-1/2 overflow-hidden border-r border-[#D9CBB9] bg-[#F5ECDF]"
          >
            {/* Hiệu ứng giấy vân kem & 2 nếp gấp tam giác chéo đặc trưng trifold */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(155deg, rgba(255,252,247,0.72) 0%, rgba(235,221,203,0.45) 48%, rgba(250,242,232,0.7) 52%, rgba(226,210,190,0.5) 100%)',
              }}
            />
            {/* Đường gập chéo từ góc trên-trái xuống tâm mép phải */}
            <svg
              viewBox="0 0 100 300"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <polygon points="0,0 100,150 0,300" fill="rgba(255,251,245,0.48)" />
              <line x1="0" y1="0" x2="100" y2="150" stroke="rgba(165,145,120,0.42)" strokeWidth="1" />
              <line x1="0" y1="300" x2="100" y2="150" stroke="rgba(165,145,120,0.42)" strokeWidth="1" />
            </svg>
          </motion.div>

          {/* CÁNH CỬA PHONG BÌ PHẢI (3D SWING RIGHT — CÓ VÂN LÁ DẬP CHÌM Y HỆT VIDEO 2) */}
          <motion.div
            animate={
              areDoorsOpen
                ? { rotateY: 110 }
                : { rotateY: 0 }
            }
            transition={{ duration: 1.25, delay: areDoorsOpen ? 0.06 : 0, ease: [0.35, 0.05, 0.2, 1] }}
            style={{
              transformOrigin: 'right center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'visible',
            }}
            className="absolute inset-y-0 right-0 z-20 w-1/2 overflow-hidden border-l border-[#D9CBB9] bg-[#F3E8D9]"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(205deg, rgba(255,252,247,0.68) 0%, rgba(232,216,197,0.45) 48%, rgba(248,240,228,0.68) 52%, rgba(224,207,186,0.52) 100%)',
              }}
            />
            <svg
              viewBox="0 0 100 300"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <polygon points="100,0 0,150 100,300" fill="rgba(255,250,244,0.42)" />
              <line x1="100" y1="0" x2="0" y2="150" stroke="rgba(165,145,120,0.42)" strokeWidth="1" />
              <line x1="100" y1="300" x2="0" y2="150" stroke="rgba(165,145,120,0.42)" strokeWidth="1" />
              {/* Nhành lá dập nổi mờ trên cánh phải (blind-deboss giống f_002 video 2) */}
              <path
                d="M42 128 C58 108, 72 95, 88 80 M54 114 C48 106, 52 96, 62 98 M66 102 C74 104, 80 96, 75 88 M48 122 C58 124, 64 118, 60 112"
                fill="none"
                stroke="rgba(176,158,136,0.28)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Chữ dập chìm tinh tế phía trên nơ (mờ dần ngay khi mở) */}
          <motion.div
            animate={isUntying ? { opacity: 0 } : { opacity: 0.62 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-x-0 top-[15%] z-30 text-center"
          >
            <p className="font-handwritten-minimal text-[27px] text-[#8F7E6C]">
              {data.groom.shortName} &amp; {data.bride.shortName}
            </p>
          </motion.div>

          {/* Cụm nơ lụa bạc: hai nửa ghép sẵn, dùng chung một MotionValue
              để không cross-fade, không reset vận tốc và không raster lại shadow. */}
          <div className="pointer-events-none absolute inset-x-[-2%] top-[38%] z-[51] h-[150px]">
            <motion.div
              initial={false}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '51.11%',
                x: bowLeftReleaseX,
                y: bowLeftReleaseY,
                scaleY: bowReleaseScaleY,
                opacity: bowOpacity,
                willChange: 'transform, opacity',
              }}
              className="transform-gpu [backface-visibility:hidden]"
            >
              <motion.div
                style={{
                  transformOrigin: '0% 35%',
                  rotate: bowLeftDroopRotate,
                  scaleX: bowDroopScaleX,
                  willChange: 'transform',
                }}
                className="transform-gpu [backface-visibility:hidden]"
              >
                <img
                  src={decorUrl('style9-silver-bow-left.png')}
                  alt="Nơ lụa bạc trái"
                  draggable={false}
                  className="w-full select-none"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={false}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '51.11%',
                x: bowRightReleaseX,
                y: bowRightReleaseY,
                scaleY: bowReleaseScaleY,
                opacity: bowOpacity,
                willChange: 'transform, opacity',
              }}
              className="transform-gpu [backface-visibility:hidden]"
            >
              <motion.div
                style={{
                  transformOrigin: '100% 35%',
                  rotate: bowRightDroopRotate,
                  scaleX: bowDroopScaleX,
                  willChange: 'transform',
                }}
                className="transform-gpu [backface-visibility:hidden]"
              >
                <img
                  src={decorUrl('style9-silver-bow-right.png')}
                  alt=""
                  draggable={false}
                  className="w-full select-none"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Chữ gợi ý chạm siêu mảnh ở đáy phong bì */}
          <motion.p
            animate={isUntying ? { opacity: 0 } : { opacity: [0.45, 0.85, 0.45] }}
            transition={
              isUntying ? { duration: 0.25 } : { duration: 2.6, repeat: Infinity }
            }
            className="pointer-events-none absolute inset-x-0 bottom-[7%] z-30 text-center font-porcelain-serif text-[11px] uppercase tracking-[0.28em] text-[#7F705F]"
          >
            CHẠM VÀO NƠ ĐỂ MỞ THIỆP
          </motion.p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const PorcelainBlueInvitation: React.FC<PorcelainBlueInvitationProps> = ({
  data,
  wishes,
  onAddWish,
  isMusicPlaying,
  onToggleMusic,
  onStartMusic,
  guestName,
  onOpenAdmin,
}) => {
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'location' | 'gift-list' | 'rsvp'>('home');

  const [showAccount, setShowAccount] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Tự động thử bật nhạc sau 1 giây khi vừa vào link (nếu trình duyệt cho phép; nếu bị chặn sẽ phát ngay khi chạm nơ mở thiệp)
  useEffect(() => {
    const autoTimer = window.setTimeout(() => {
      onStartMusic();
    }, 1000);
    return () => window.clearTimeout(autoTimer);
  }, [onStartMusic]);

  // Form RSVP
  const [guestInput, setGuestInput] = useState(() => getInitialGuestName(guestName));
  const [attendanceAnswer, setAttendanceAnswer] = useState('Có, chắc chắn mình sẽ tham dự!');
  const [wishText, setWishText] = useState('');
  const [rsvpSent, setRsvpSent] = useState(false);

  const monogram = getMonogram(data.groom.shortName, data.bride.shortName);
  const [dPart, mPart, yPart] = data.weddingDate.displayDate.split('.');
  const dottedDate = `${dPart || '03'} · ${mPart || '03'} · ${yPart || '2027'}`;

  useEffect(() => {
    const initial = getInitialGuestName(guestName);
    if (initial) setGuestInput(initial);
  }, [guestName]);

  // Giữ trang nền ở đúng đầu bìa trong lúc phong bao đang mở. Nếu không khóa,
  // thao tác cuộn trong lúc chờ animation có thể khiến cảnh zoom đáp xuống giữa trang.
  useEffect(() => {
    if (isEnvelopeOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEnvelopeOpen]);

  // Tải trước toàn bộ họa tiết sứ xanh + nơ lụa bạc + ảnh Style 7
  useEffect(() => {
    const urls = [
      decorUrl('style9-silver-bow.png'),
      decorUrl('style9-silver-bow-left.png'),
      decorUrl('style9-silver-bow-right.png'),
      decorUrl('style9-porcelain-hero-frame.jpg'),
      decorUrl('style9-champagne-tower.jpg'),
      decorUrl('style9-corner-rose.jpg'),
      decorUrl('style9-rings-sprig.jpg'),
      decorUrl('style9-dancing-couple.jpg'),
      decorUrl('style9-wedding-cake.jpg'),
      data.sectionImages.hero,
      ...data.album9Images.slice(0, 7).map((p) => p.url),
    ];
    return preloadAndDecodeImages(urls, { delayMs: 150, concurrency: 3 });
  }, [data]);

  // Thanh header xanh navy chỉ trượt xuống khi cuộn qua bìa hoa sứ xanh (y hệt video 2!)
  useEffect(() => {
    if (!isEnvelopeOpen) return;
    const onScroll = () => {
      const y = window.scrollY;
      setShowStickyHeader(y > 160);

      const rsvpEl = document.getElementById('s9-rsvp');
      const giftEl = document.getElementById('s9-gift-list');
      const locEl = document.getElementById('s9-location');
      const offset = y + 260;

      if (rsvpEl && offset >= rsvpEl.offsetTop) {
        setActiveTab('rsvp');
      } else if (giftEl && offset >= giftEl.offsetTop) {
        setActiveTab('gift-list');
      } else if (locEl && offset >= locEl.offsetTop) {
        setActiveTab('location');
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isEnvelopeOpen]);

  const handleCompleteEnvelope = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setIsEnvelopeOpen(true);
    onStartMusic();
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    if (id === 's9-home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const now = new Date();
    onAddWish({
      id: `porcelain-wish-${Date.now()}`,
      name: guestInput.trim(),
      message:
        wishText.trim() ||
        'Chúc hai bạn trăm năm hạnh phúc và mãi giữ trọn yêu thương!',
      attendance: attendanceAnswer,
      createdAt: `${now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })} • ${now.toLocaleDateString('vi-VN')}`,
    });
    setWishText('');
    setRsvpSent(true);
    confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.72 },
      colors: ['#1F355C', '#7C96C2', '#FFFFFF'],
    });
    window.setTimeout(() => setRsvpSent(false), 2600);
  };

  const coupleGallery = Array.from(
    new Set(
      [data.sectionImages.hero, ...data.album9Images.slice(0, 7).map((photo) => photo.url)].filter(
        Boolean
      ) as string[]
    )
  );

  const style9Locations = data.partyEvents.slice(0, 2).map((event, idx) => {
    const address =
      idx === 0
        ? '123 Sài Thị - Hưng Yên'
        : 'Nhà văn hóa xã Triệu Việt Vương - Hưng Yên';
    return {
      ...event,
      address,
      title: idx === 0 ? 'Tư gia nhà trai' : 'Nhà văn hóa xã Triệu Việt Vương',
      familyLabel: idx === 0 ? 'NHÀ TRAI' : 'NHÀ GÁI',
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    };
  });

  return (
    <div className="min-h-screen w-full bg-[#EAE5E7] text-[#1D335B] flex justify-center overflow-x-clip md:py-8">
      {/* PHONG BÌ 3 CÁNH NƠ LỤA BẠC MỞ ĐẦU (GIỐNG HỆT VIDEO 2) */}
      <AnimatePresence>
        {!isEnvelopeOpen && (
          <PorcelainTrifoldEnvelope
            data={data}
            onComplete={handleCompleteEnvelope}
          />
        )}
      </AnimatePresence>

      {/* Nút Admin kín đáo ở góc trên trái (khi chưa mở thiệp) */}
      {onOpenAdmin && !isEnvelopeOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdmin();
          }}
          title="Quản trị"
          aria-label="Admin Login"
          className="cursor-pointer fixed top-3 left-3 z-[90] rounded-full p-2 text-[#1D335B]/25 hover:text-[#1D335B] hover:opacity-100 transition-opacity"
        >
          <Lock className="h-3.5 w-3.5" />
        </button>
      )}

      {/* KHUNG THIỆP SỨ TRẮNG HOA XANH 9:16 */}
      <main className="relative w-full max-w-[430px] min-h-screen bg-[#FAF5F4] text-[14px] leading-relaxed shadow-[0_0_70px_rgba(22,38,72,0.16)] overflow-x-clip pb-16">
        {/* THANH HEADER NAVY CỐ ĐỊNH — CHỈ TRƯỢT XUỐNG KHI CUỘN QUA BÌA (Y HỆT VIDEO 2!) */}
        <motion.header
          initial={false}
          animate={
            showStickyHeader && isEnvelopeOpen
              ? { y: 0, opacity: 1 }
              : { y: -64, opacity: 0 }
          }
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="fixed top-0 left-1/2 z-50 flex h-[52px] w-full max-w-[430px] -translate-x-1/2 items-center justify-between bg-[#21365C] px-4 text-white shadow-md"
        >
          <button
            type="button"
            onClick={() => scrollToSection('s9-home')}
            className="cursor-pointer grid h-8 w-8 place-items-center rounded-full border border-white/45 font-porcelain-serif text-[12px] tracking-[0.06em]"
          >
            {monogram}
          </button>

          <div className="flex items-center gap-2">
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                aria-label="Quản trị"
                className="cursor-pointer p-1.5 text-white/35 hover:text-white"
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Mở menu điều hướng"
              className="cursor-pointer p-1 text-white"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-x-0 top-full border-t border-white/15 bg-[#1D3154] px-6 py-4 shadow-xl"
              >
                <div className="grid grid-cols-2 gap-y-3 text-left text-[11px] uppercase tracking-[0.15em] text-white/90">
                  {[
                    ['s9-home', 'Trang đầu'],
                    ['s9-location', '01 · Địa điểm'],
                    ['s9-the-day', '02 · Ngày cưới'],
                    ['s9-dress-code', '03 · Trang phục'],
                    ['s9-gift-list', '04 · Mừng cưới'],
                    ['s9-rsvp', '05 · Lời chúc'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => scrollToSection(id)}
                      className="cursor-pointer text-left hover:text-white"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ============================================================
            PHẦN 1: BÌA HOA SỨ XANH DELFT FULL-BLEED + KHUNG BAROQUE GIỮA (Y HỆT f_011 VIDEO 2)
           ============================================================ */}
        <section
          id="s9-home"
          className="relative h-[calc(100svh-46px)] overflow-hidden"
        >
          <PorcelainHeroArtwork
            data={data}
            textVisible
            onScrollDown={() => scrollToSection('s9-countdown')}
          />
        </section>

        {/* ============================================================
            PHẦN 2: FOREVER BEGINS IN + ĐẾM NGƯỢC + THÁP LY CHAMPAGNE XANH SỨ (f_015)
           ============================================================ */}
        <section id="s9-countdown" className="relative px-4 pb-20 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-handwritten-minimal text-[30px] text-[#66799C]">
              Hạnh phúc bắt đầu sau
            </p>
            <div className="mt-7">
              <PorcelainCountdown isoDate={data.weddingDate.isoDate} />
            </div>

            {/* Minh họa tháp ly Champagne rót rượu quấn hoa hồng xanh (y hệt f_015 video 2!) */}
            <motion.img
              src={decorUrl('style9-champagne-tower.jpg')}
              alt="Tháp ly champagne"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9 }}
              className="mx-auto mt-7 w-[250px] select-none mix-blend-multiply"
            />
          </motion.div>

          {/* Cặp hoa hồng xanh đối xứng 2 góc dưới phân tách section (y hệt f_015 video 2) */}
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute -bottom-2 left-1 w-28 -scale-y-100 select-none mix-blend-multiply opacity-90"
          />
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute -bottom-2 right-1 w-28 -scale-x-100 -scale-y-100 select-none mix-blend-multiply opacity-90"
          />
        </section>

        {/* ============================================================
            PHẦN 3: DATE + 01 LOCATION + BẢN ĐỒ SÁNG + HƯỚNG DẪN DI CHUYỂN (f_018 - f_023)
           ============================================================ */}
        <section id="s9-location" className="relative border-t border-[#ECE5E4] px-7 pb-14 pt-12">

          {/* Khối Ngày Cưới ở giữa */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="text-center"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#95A0B3]">NGÀY CƯỚI</p>
            <p className="font-porcelain-serif mt-2 text-[28px] text-[#1D335B]">
              03 Tháng 03, 2027
            </p>
            <p className="mt-1 text-[13px] text-[#7E8BA2]">
              {data.weddingDate.dayOfWeek} · {data.weddingDate.lunarDate}
            </p>
          </motion.div>

          {/* Tiêu đề mục 01 Location */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="mt-12 text-center"
          >
            <p className="font-porcelain-serif text-[13px] tracking-[0.2em] text-[#8E9AB0]">
              01
            </p>
            <h2 className="font-porcelain-serif mt-1 text-[34px] text-[#1D335B]">
              Địa điểm tổ chức
            </h2>
          </motion.div>

          {/* Các địa điểm sự kiện của Style 7 — trình bày căn trái tối giản + bản đồ sáng */}
          <div className="mt-10 space-y-12 text-left">
            {style9Locations.map((ev, idx) => {
              const query = encodeURIComponent(ev.address);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.75 }}
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#8C98AD]">
                    {idx === 0 ? 'NHÀ TRAI · TIỆC MỜI THÂN MẬT' : 'NHÀ GÁI · LỄ THÀNH HÔN'}
                  </p>
                  <h3 className="font-porcelain-serif mt-1.5 text-[28px] text-[#1D335B]">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6E7C94]">
                    {ev.timeText} · {ev.dayOfWeek}, {ev.dayMonth}.{ev.year}
                    <br />
                    {ev.address}
                  </p>

                  {/* Google Map sáng thanh lịch với nút Open in Maps giống f_018 & f_020 */}
                  <div className="relative mt-4 overflow-hidden border border-[#E2E6EE] bg-[#EDF2F7]">
                    <iframe
                      title={`Bản đồ ${ev.title}`}
                      src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
                      className="h-48 w-full border-0"
                      loading="lazy"
                    />
                    <a
                      href={ev.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded bg-white/95 px-2.5 py-1 text-[10px] font-medium text-[#1D335B] shadow-sm"
                    >
                      Mở bản đồ ↗
                    </a>
                  </div>

                  <a
                    href={ev.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#667899] hover:text-[#1D335B]"
                  >
                    XEM ĐƯỜNG ĐI →
                  </a>
                </motion.div>
              );
            })}
          </div>

          {/* Thông tin hai gia đình được đặt trong khung thiệp sứ cân đối */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="relative mt-14 overflow-hidden border border-[#AAB8CF] bg-white/55 px-4 py-8 text-center shadow-[0_12px_30px_rgba(31,53,92,0.08)]"
          >
            <div className="pointer-events-none absolute inset-1 border border-[#D6DDE9]" />
            <img
              src={decorUrl('style9-corner-rose.jpg')}
              alt=""
              className="pointer-events-none absolute -left-5 -top-5 w-24 select-none mix-blend-multiply opacity-45"
            />
            <img
              src={decorUrl('style9-corner-rose.jpg')}
              alt=""
              className="pointer-events-none absolute -bottom-5 -right-5 w-24 -scale-x-100 -scale-y-100 select-none mix-blend-multiply opacity-45"
            />

            <p className="relative text-[11px] uppercase tracking-[0.2em] text-[#7E8DA7]">
              ĐẠI DIỆN HAI GIA ĐÌNH
            </p>
            <div className="relative mx-auto mt-3 h-px w-12 bg-[#AAB8CF]" />

            <div className="relative mt-7 grid grid-cols-2 divide-x divide-[#D6DDE9]">
              <div className="px-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#71819D]">
                  NHÀ TRAI
                </p>
                <p className="font-porcelain-serif mt-3 text-[17px] leading-relaxed text-[#1D335B]">
                  Ông {data.groom.fatherName}
                  <br />
                  Bà {data.groom.motherName}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[#7A879D]">
                  123 Sài Thị
                  <br />
                  Hưng Yên
                </p>
              </div>
              <div className="px-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#71819D]">
                  NHÀ GÁI
                </p>
                <p className="font-porcelain-serif mt-3 text-[17px] leading-relaxed text-[#1D335B]">
                  Ông {data.bride.fatherName}
                  <br />
                  Bà {data.bride.motherName}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[#7A879D]">
                  Xã Triệu Việt Vương
                  <br />
                  Hưng Yên
                </p>
              </div>
            </div>

            <div className="relative mx-2 mt-7 border-t border-[#D6DDE9] pt-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#71819D]">
                ĐỖ XE &amp; DI CHUYỂN
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#66758F]">
                Có khu vực đỗ ô tô và xe máy thuận tiện tại địa điểm tổ chức.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ============================================================
            PHẦN 4: 02 THE DAY — TIMELINE CHẤM NAVY + KHỐI HOA GÓC TRÁI + ẢNH ĐÔI STYLE 7 (f_025 - f_026)
           ============================================================ */}
        <section id="s9-the-day" className="relative overflow-hidden px-7 pb-24 pt-10">
          {/* Biểu tượng nhẫn cưới & hoa hồng nét mực xanh mảnh phía trên (f_025) */}
          <motion.img
            src={decorUrl('style9-rings-sprig.jpg')}
            alt=""
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 0.85, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto w-20 select-none mix-blend-multiply"
          />

          <div className="mt-4 text-center">
            <p className="font-porcelain-serif text-[13px] tracking-[0.2em] text-[#8E9AB0]">
              02
            </p>
            <h2 className="font-porcelain-serif mt-1 text-[34px] text-[#1D335B]">
              Ngày trọng đại
            </h2>
          </div>

          {/* Timeline 2 cột: Giờ bên trái | Đường dọc mảnh & chấm tròn navy | Nội dung bên phải */}
          <div className="mx-auto mt-10 max-w-[330px]">
            {[
              {
                time: '17:00',
                day: '02/03',
                title: 'Tiệc Mời Thân Mật',
                desc: 'Bữa cơm thân mật ấm cúng chung vui cùng gia đình và bạn bè tại Tư Gia Nhà Trai.',
              },
              {
                time: '10:30',
                day: '03/03',
                title: 'Đón Khách & Chụp Ảnh',
                desc: 'Đón tiếp quý khách và cùng lưu lại những bức ảnh kỷ niệm tuyệt đẹp.',
              },
              {
                time: '11:00',
                day: '03/03',
                title: 'Lễ Thành Hôn',
                desc: 'Nghi thức thành hôn trang trọng dưới sự chúc phúc của hai bên gia đình.',
              },
              {
                time: '11:30',
                day: '03/03',
                title: 'Khai Tiệc Chung Vui',
                desc: 'Cùng nâng ly chúc mừng hạnh phúc và thưởng thức tiệc cưới thân mật.',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, delay: idx * 0.08 }}
                className="grid grid-cols-[62px_1fr] gap-4"
              >
                <div className="pt-0.5 text-right">
                  <p className="text-[13px] font-medium tracking-[0.06em] text-[#8E9AB0]">
                    {item.time}
                  </p>
                  <p className="text-[11px] text-[#AAB3C2]">{item.day}</p>
                </div>

                <div className="relative border-l border-[#D8DCE7] pb-9 pl-5 text-left">
                  <span className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#1D335B]" />
                  <h3 className="font-porcelain-serif text-[23px] leading-snug text-[#1D335B]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#7E8BA2]">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div id="s9-gallery" className="relative z-10 mt-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8290A8]">
              NHỮNG KHOẢNH KHẮC YÊU THƯƠNG
            </p>
            <h3 className="font-porcelain-serif mt-1 text-[32px] text-[#1D335B]">
              Album ảnh cưới
            </h3>
            <PorcelainRotatingGallery
              photos={coupleGallery}
              coupleName={`${data.groom.shortName} & ${data.bride.shortName}`}
              onSelect={setLightboxUrl}
            />
          </div>

          {/* Cụm hoa sứ xanh lớn tràn từ góc dưới trái (y hệt f_026 video 2!) */}
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute -bottom-6 -left-6 w-52 -scale-y-100 select-none mix-blend-multiply opacity-90"
          />
        </section>

        {/* ============================================================
            PHẦN 5: 03 DRESS CODE — CẶP ĐÔI KHIÊU VŨ + FORMAL ELEGANCE (f_029)
           ============================================================ */}
        <section id="s9-dress-code" className="relative overflow-hidden border-t border-[#ECE5E4] px-7 pb-20 pt-14">
          {/* Hình minh họa nét xanh mảnh cô dâu chú rể khiêu vũ ở trên cùng */}
          <motion.img
            src={decorUrl('style9-dancing-couple.jpg')}
            alt=""
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 0.85, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="mx-auto w-28 select-none mix-blend-multiply"
          />

          <div className="mt-4 text-center">
            <p className="font-porcelain-serif text-[13px] tracking-[0.2em] text-[#8E9AB0]">
              03
            </p>
            <h2 className="font-porcelain-serif mt-1 text-[30px] text-[#4E6184]">
              Trang phục
            </h2>
          </div>

          {/* Nhành hoa sứ mảnh vươn từ mép phải (f_029) */}
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute -right-12 top-[48%] w-40 -rotate-90 select-none mix-blend-multiply opacity-80"
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="relative z-10 mt-10 text-left"
          >
            <h3 className="font-porcelain-serif text-[46px] font-medium leading-[1.04] tracking-[-0.02em] text-[#1D335B]">
              Thanh lịch
              <br />
              &amp; trang trọng
            </h3>
            <p className="mt-5 max-w-[300px] text-[14px] leading-[1.7] text-[#6E7C94]">
              Chúng mình rất mong quý khách diện trang phục lịch sự, thanh nhã với các tông màu xanh navy, xanh pastel, kem ngà hoặc be sáng.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {['#1D335B', '#7C94BD', '#DCE4F0', '#EFE6DA'].map((hex) => (
                <span
                  key={hex}
                  className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </motion.div>

          {/* Cặp hoa góc dưới đối xứng */}
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute -bottom-2 left-1 w-24 -scale-y-100 select-none mix-blend-multiply opacity-85"
          />
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute -bottom-2 right-1 w-24 -scale-x-100 -scale-y-100 select-none mix-blend-multiply opacity-85"
          />
        </section>

        {/* ============================================================
            PHẦN 6: 04 GIFT LIST — A GIFT FOR US + KHUNG CHUYỂN KHOẢN & NÚT COPY NAVY (f_033)
           ============================================================ */}
        <section id="s9-gift-list" className="relative border-t border-[#ECE5E4] px-7 pb-16 pt-12">

          <div className="text-center">
            <p className="font-porcelain-serif text-[13px] tracking-[0.2em] text-[#8E9AB0]">
              04
            </p>
            <h2 className="font-porcelain-serif mt-1 text-[30px] text-[#1D335B]">
              Mừng cưới
            </h2>
          </div>

          <div className="mt-9 text-left">
            <h3 className="font-porcelain-serif text-[36px] leading-tight text-[#1D335B]">
              Món quà yêu thương
            </h3>
            <p className="mt-3 text-[14px] leading-[1.7] text-[#6E7C94]">
              Sự hiện diện của bạn là món quà quý giá nhất đối với {data.groom.shortName} &amp; {data.bride.shortName}. Nếu bạn muốn gửi thêm lời chúc phúc từ xa, có thể mở thông tin bên dưới.
            </p>

            <button
              type="button"
              onClick={() => setShowAccount((prev) => !prev)}
              className="cursor-pointer mt-5 border border-[#CFD5E2] bg-transparent px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#4C6084] transition-colors hover:border-[#1D335B] hover:text-[#1D335B]"
            >
              {showAccount ? 'ẨN THÔNG TIN' : 'GỬI QUÀ MỪNG'}
            </button>

            <AnimatePresence>
              {showAccount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 space-y-4">
                    {[
                      { key: 'groom', gift: data.groomQrGift },
                      { key: 'bride', gift: data.brideQrGift },
                    ].map(({ key, gift }) => (
                      <div
                        key={key}
                        className="border border-[#1D335B]/55 bg-white/60 p-5 text-left"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8D98AC]">
                          CHỦ TÀI KHOẢN · {gift.accountHolder}
                        </p>
                        <p className="font-porcelain-serif mt-1.5 text-[19px] tracking-[0.06em] text-[#1D335B]">
                          {gift.accountNumber}
                        </p>
                        <p className="mt-0.5 text-[13px] text-[#6E7C94]">
                          {gift.bankBranch}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => handleCopy(key, gift.accountNumber)}
                            className="cursor-pointer inline-flex items-center gap-1.5 bg-[#21365C] px-6 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#162745]"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="h-3 w-3" /> ĐÃ SAO CHÉP
                              </>
                            ) : (
                              'SAO CHÉP'
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setLightboxUrl(gift.qrImageUrl)}
                            className="cursor-pointer border border-[#D8DDE8] bg-white p-1"
                            title="Phóng to mã QR"
                          >
                            <img
                              src={gift.qrImageUrl}
                              alt={gift.accountHolder}
                              className="h-20 w-20 object-contain"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ============================================================
            PHẦN 7: 05 LỜI CHÚC & XÁC NHẬN THAM DỰ
           ============================================================ */}
        <section id="s9-rsvp" className="border-t border-[#ECE5E4] px-7 pb-14 pt-12">
          <div className="text-center">
            <p className="font-porcelain-serif text-[13px] tracking-[0.2em] text-[#8E9AB0]">
              05
            </p>
            <h2 className="font-porcelain-serif mt-1 text-[32px] text-[#1D335B]">
              Gửi lời chúc
            </h2>
          </div>

          <form onSubmit={handleRsvpSubmit} className="mt-9 text-left">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#96A1B4]">
              CHÚNG MÌNH RẤT MONG TIN BẠN
            </p>
            <p className="font-handwritten-minimal mt-1 text-[32px] leading-tight text-[#5F7396]">
              {guestInput || 'Quý Khách Mời'}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#7E8BA2]">
              Hãy để lại một lời chúc và cho chúng mình biết bạn có thể đến chung vui nhé.
            </p>

            <div className="mt-7">
              <label htmlFor="s9-guest-name" className="block text-[11px] uppercase tracking-[0.18em] text-[#95A0B3]">
                1. Tên của bạn là gì?
              </label>
              <input
                id="s9-guest-name"
                type="text"
                required
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="font-porcelain-serif mt-2 w-full border border-[#D8DCE6] bg-white/60 px-4 py-3 text-[18px] text-[#1D335B] placeholder-[#AAB4C4] outline-none transition focus:border-[#7890B8] focus:ring-2 focus:ring-[#7890B8]/15"
              />
            </div>

            <div className="mt-6">
              <label htmlFor="s9-wish" className="block text-[11px] uppercase tracking-[0.18em] text-[#95A0B3]">
                2. Bạn muốn gửi lời chúc gì tới cô dâu chú rể?
              </label>
              <textarea
                id="s9-wish"
                required
                rows={4}
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder={`Gửi lời chúc phúc đến ${data.groom.shortName} & ${data.bride.shortName}...`}
                className="mt-2 w-full resize-none border border-[#D8DCE6] bg-white/60 px-4 py-3 text-[14px] leading-relaxed text-[#35486A] placeholder-[#AAB4C4] outline-none transition focus:border-[#7890B8] focus:ring-2 focus:ring-[#7890B8]/15"
              />
            </div>

            <div className="mt-6">
              <label htmlFor="s9-attendance" className="block text-[11px] uppercase tracking-[0.18em] text-[#95A0B3]">
                3. Bạn có thể tham dự lễ cưới không?
              </label>
              <div className="relative mt-2">
                <select
                  id="s9-attendance"
                  value={attendanceAnswer}
                  onChange={(e) => setAttendanceAnswer(e.target.value)}
                  className="w-full appearance-none border border-[#D8DCE6] bg-white/70 py-3 pl-4 pr-12 text-[14px] text-[#35486A] outline-none transition focus:border-[#7890B8] focus:ring-2 focus:ring-[#7890B8]/15"
                >
                  <option value="Có, chắc chắn mình sẽ tham dự!">Có, chắc chắn mình sẽ tham dự!</option>
                  <option value="Rất tiếc, mình không thể tham dự">Rất tiếc, mình không thể tham dự</option>
                  <option value="Mình sẽ phản hồi lại sớm">Mình sẽ phản hồi lại sớm</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F7F99]" />
              </div>
            </div>

            <button
              type="submit"
              className="cursor-pointer mt-8 w-full bg-[#21365C] px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-[#162745]"
            >
              {rsvpSent ? 'ĐÃ GỬI LỜI CHÚC ✓' : 'GỬI LỜI CHÚC & XÁC NHẬN'}
            </button>
          </form>

          {wishes.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-[#E6E1E4] pt-5 text-left">
              {wishes.slice(0, 3).map((w) => (
                <div key={w.id} className="border-b border-[#EFEAED] pb-2.5">
                  <p className="font-porcelain-serif text-[17px] text-[#1D335B]">
                    {w.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#6E7C94]">{w.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Chân thiệp */}
        <footer className="px-7 pb-10 pt-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#DCE0EA] font-porcelain-serif text-[20px] tracking-[0.06em] text-[#1D335B]">
            {monogram}
          </div>

          <p className="font-handwritten-minimal mt-7 text-[28px] text-[#6A7B9C]">
            Với tất cả yêu thương
          </p>

          <h2 className="font-porcelain-serif mt-2 text-[40px] leading-[1.08] text-[#1D335B]">
            {data.groom.shortName} &amp;
            <br />
            {data.bride.shortName}
          </h2>

          <p className="mt-4 text-[12px] uppercase tracking-[0.22em] text-[#8D98AC]">
            {dottedDate}
          </p>

          <p className="mt-7 text-[10px] uppercase tracking-[0.2em] text-[#9BA5B7]">
            THÔNG TIN LIÊN HỆ
          </p>
          <p className="mt-1 text-[13px] text-[#7B889E]">
            123 Sài Thị - Hưng Yên
          </p>

          {/* Hình bánh cưới 3 tầng màu sứ xanh mờ dịu ở chân thiệp (f_042 video 2!) */}
          <img
            src={decorUrl('style9-wedding-cake.jpg')}
            alt=""
            className="mx-auto mt-6 w-36 select-none mix-blend-multiply opacity-75"
          />
        </footer>

        {/* ============================================================
            NÚT SÓNG ÂM EQUALIZER NỔI GÓC DƯỚI TRÁI (ll.) Y HỆT VIDEO 2
           ============================================================ */}
        {isEnvelopeOpen && (
          <div className="pointer-events-none fixed bottom-[56px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-4">
            <button
              type="button"
              onClick={onToggleMusic}
              aria-label={isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
              className="pointer-events-auto cursor-pointer flex h-9 w-9 items-center justify-center gap-[2.5px] rounded-full border border-[#E4E1E8] bg-white/95 shadow-[0_4px_14px_rgba(24,42,78,0.12)]"
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <span
                  key={i}
                  style={
                    isMusicPlaying
                      ? { animationDelay: `${delay}s`, height: i === 1 ? 12 : 9 }
                      : { height: 4 }
                  }
                  className={`w-[2px] rounded-full bg-[#21365C] ${
                    isMusicPlaying ? 'eq-bar' : 'opacity-45'
                  }`}
                />
              ))}
            </button>
          </div>
        )}

        {/* ============================================================
            THANH ĐIỀU HƯỚNG DƯỚI ĐÁY
           ============================================================ */}
        {isEnvelopeOpen && (
          <nav className="fixed bottom-0 left-1/2 z-50 grid h-[46px] w-full max-w-[430px] -translate-x-1/2 grid-cols-4 items-center border-t border-[#EAE4E3] bg-[#FAF5F4]/95 px-2 backdrop-blur-md">
            {(
              [
                ['home', 's9-home', 'TRANG ĐẦU'],
                ['location', 's9-location', 'ĐỊA ĐIỂM'],
                ['gift-list', 's9-gift-list', 'MỪNG CƯỚI'],
                ['rsvp', 's9-rsvp', 'LỜI CHÚC'],
              ] as const
            ).map(([tabKey, targetId, label]) => {
              const active = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => scrollToSection(targetId)}
                  className={`cursor-pointer mx-auto pb-0.5 text-[9px] font-medium uppercase tracking-[0.1em] transition-colors ${
                    active
                      ? 'border-b border-[#1D335B] text-[#1D335B]'
                      : 'text-[#9AA3B5] hover:text-[#1D335B]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        )}
      </main>

      {/* LIGHTBOX PHÓNG TO ẢNH / MÃ QR */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {lightboxUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxUrl(null)}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-[#121D33]/85 p-5 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  aria-label="Đóng"
                  className="cursor-pointer absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <motion.img
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  src={lightboxUrl}
                  alt="Xem phóng to"
                  className="max-h-[85vh] max-w-full rounded bg-white p-1.5 object-contain shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default PorcelainBlueInvitation;
