import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronDown,
  Lock,
  Menu,
  Minus,
  Plus,
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
    { label: 'DAYS', value: Math.floor(msLeft / 86400000) },
    { label: 'HOURS', value: Math.floor((msLeft / 3600000) % 24) },
    { label: 'MINUTES', value: Math.floor((msLeft / 60000) % 60) },
    { label: 'SECONDS', value: Math.floor((msLeft / 1000) % 60) },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-5">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="font-bodoni-editorial text-[34px] leading-none tracking-[-0.02em] text-[#1D335B] tabular-nums [font-variant-numeric:lining-nums]">
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="mt-2.5 text-[7.5px] font-medium uppercase tracking-[0.22em] text-[#95A0B3]">
            {item.label}
          </div>
        </div>
      ))}
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
  const [phase, setPhase] = useState<'closed' | 'untying' | 'doors' | 'zooming'>('closed');

  const handleOpen = () => {
    if (phase !== 'closed') return;
    soundEngine.playOpenChime();
    setPhase('untying');
    window.setTimeout(() => setPhase('doors'), 720);
    window.setTimeout(() => setPhase('zooming'), 1750);
    window.setTimeout(() => onComplete(), 2550);
  };

  const isUntying = phase !== 'closed';
  const areDoorsOpen = phase === 'doors' || phase === 'zooming';
  const isZooming = phase === 'zooming';

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      onClick={handleOpen}
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#F3ECEA] px-4 select-none"
    >
      {/* Khung phong bì đứng 3 cánh gập 3D */}
      <motion.div
        animate={isZooming ? { scale: 1.18, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[9/14.2] w-full max-w-[355px] [perspective:1800px]"
      >
        {/* Bóng đổ nền ấm dưới phong bì */}
        <div className="pointer-events-none absolute -inset-2 rounded-sm bg-[#2D1F18]/12 blur-2xl" />

        {/* THÂN PHONG BÌ TRONG (Đựng tấm thiệp hoa sứ xanh thực sự bên trong!) */}
        <div className="relative h-full w-full overflow-visible bg-[#EFE4D6] shadow-[0_24px_65px_rgba(40,28,22,0.22)]">
          {/* Nắp gập hình thang phía trên (mở bung ra sau khi cánh mở) */}
          <motion.div
            animate={isZooming ? { rotateX: 115, opacity: 0.2 } : { rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[11%] bg-gradient-to-b from-[#EDE0D0] to-[#F5ECDF] [clip-path:polygon(0_0,100%_0,88%_100%,12%_100%)] shadow-inner"
          />

          {/* Nắp gập hình thang phía dưới */}
          <motion.div
            animate={isZooming ? { rotateX: -115, opacity: 0.2 } : { rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
            style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[11%] bg-gradient-to-t from-[#E8DAC8] to-[#F4EBDE] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)]"
          />

          {/* TẤM THIỆP HOA XANH SỨ TRẮNG BÊN TRONG — LỘ RA NGAY KHI 2 CÁNH MỞ! */}
          <motion.div
            animate={isZooming ? { scale: 1.07 } : { scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-[4.5%] z-10 overflow-hidden bg-[#FAF5F4] shadow-inner"
          >
            <img
              src={decorUrl('style9-porcelain-hero-frame.jpg')}
              alt=""
              className="h-full w-full object-cover mix-blend-multiply"
            />
            <div className="absolute inset-[18%_20%] bg-[#FAF5F4]/95">
              <BaroqueInnerFrameSvg />
            </div>
          </motion.div>

          {/* CÁNH CỬA PHONG BÌ TRÁI (3D SWING LEFT — NẾP GẤP CHÉO KIM CƯƠNG Y HỆT VIDEO 2) */}
          <motion.div
            animate={
              areDoorsOpen
                ? { rotateY: -130, boxShadow: '-12px 16px 35px rgba(35,24,16,0.22)' }
                : { rotateY: 0, boxShadow: '2px 0 6px rgba(55,40,28,0.12)' }
            }
            transition={{ duration: 1.05, ease: [0.45, 0.05, 0.25, 1] }}
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
                ? { rotateY: 130, boxShadow: '12px 16px 35px rgba(35,24,16,0.22)' }
                : { rotateY: 0, boxShadow: '-2px 0 6px rgba(55,40,28,0.10)' }
            }
            transition={{ duration: 1.05, ease: [0.45, 0.05, 0.25, 1] }}
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
            animate={isUntying ? { opacity: 0 } : { opacity: 0.55 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-0 top-[15%] z-30 text-center"
          >
            <p className="font-handwritten-minimal text-[23px] text-[#9E8B76]">
              {data.groom.shortName} &amp; {data.bride.shortName}
            </p>
          </motion.div>

          {/* NƠ LỤA BẠC SATIN 3D CHÂN THỰC QUẤN NGANG PHONG BÌ — THÁO RƠI XUỐNG KHI CHẠM */}
          <motion.div
            animate={
              isUntying
                ? { y: 230, scale: 0.9, rotate: -4, opacity: 0 }
                : { y: 0, scale: [1, 1.018, 1], rotate: 0, opacity: 1 }
            }
            transition={
              isUntying
                ? { duration: 0.85, ease: [0.4, 0, 0.2, 1] }
                : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
            }
            className="pointer-events-none absolute inset-x-[-2%] top-[38%] z-40"
          >
            <img
              src={decorUrl('style9-silver-bow.png')}
              alt="Chạm vào nơ lụa bạc để mở thiệp"
              className="w-full drop-shadow-[0_12px_18px_rgba(32,26,22,0.28)]"
            />
          </motion.div>

          {/* Chữ gợi ý chạm siêu mảnh ở đáy phong bì */}
          <motion.p
            animate={isUntying ? { opacity: 0 } : { opacity: [0.45, 0.85, 0.45] }}
            transition={
              isUntying ? { duration: 0.25 } : { duration: 2.6, repeat: Infinity }
            }
            className="pointer-events-none absolute inset-x-0 bottom-[7%] z-30 text-center font-bodoni-editorial text-[9px] uppercase tracking-[0.34em] text-[#8A7B6B]"
          >
            CHẠM VÀO NƠ ĐỂ MỞ THIỆP
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FAQ_ITEMS = [
  {
    q: 'Tôi có thể đi cùng người thương hoặc gia đình không?',
    a: 'Sự hiện diện của bạn cùng người thân là niềm hạnh phúc lớn nhất của Huy Đức & Phan Hậu. Bạn chỉ cần ghi chú trong mục RSVP để gia đình chu đáo đón tiếp nhé.',
  },
  {
    q: 'Trang phục phù hợp cho ngày lễ là gì?',
    a: 'Chúng mình gợi ý trang phục thanh lịch với các tông màu xanh navy, xanh pastel, kem ngà, trắng sữa hoặc be nhã nhặn để cùng hòa sắc trong những khung hình kỷ niệm.',
  },
  {
    q: 'Thời gian đón khách & khu vực gửi xe như thế nào?',
    a: 'Gia đình đón khách từ 17:00 ngày 02/03 (Tiệc thân mật) và 10:30 ngày 03/03/2027 (Lễ Thành Hôn). Có khu vực đỗ ô tô và xe máy rộng rãi ngay sát tư gia nhà trai.',
  },
];

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

  const [showAccount, setShowAccount] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
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
  const [willAttend, setWillAttend] = useState<'yes' | 'no'>('yes');
  const [wishText, setWishText] = useState('');
  const [rsvpSent, setRsvpSent] = useState(false);

  const monogram = getMonogram(data.groom.shortName, data.bride.shortName);
  const [dPart, mPart, yPart] = data.weddingDate.displayDate.split('.');
  const dottedDate = `${dPart || '03'} · ${mPart || '03'} · ${yPart || '2027'}`;

  useEffect(() => {
    const initial = getInitialGuestName(guestName);
    if (initial) setGuestInput(initial);
  }, [guestName]);

  // Tải trước toàn bộ họa tiết sứ xanh + nơ lụa bạc + ảnh Style 7
  useEffect(() => {
    const urls = [
      decorUrl('style9-silver-bow.png'),
      decorUrl('style9-porcelain-hero-frame.jpg'),
      decorUrl('style9-champagne-tower.jpg'),
      decorUrl('style9-corner-rose.jpg'),
      decorUrl('style9-rings-sprig.jpg'),
      decorUrl('style9-dancing-couple.jpg'),
      decorUrl('style9-wedding-cake.jpg'),
      data.sectionImages.hero,
      ...data.album9Images.slice(0, 4).map((p) => p.url),
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
      attendance:
        willAttend === 'yes'
          ? 'Có, chắc chắn mình sẽ tham dự!'
          : 'Rất tiếc, mình không thể tham dự',
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

  // 4 ảnh đôi tinh tuyển từ Style 7
  const coupleGallery = [
    data.sectionImages.hero,
    data.album9Images[0]?.url,
    data.album9Images[1]?.url,
    data.album9Images[2]?.url,
  ].filter(Boolean) as string[];

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
      <main className="relative w-full max-w-[430px] min-h-screen bg-[#FAF5F4] shadow-[0_0_70px_rgba(22,38,72,0.16)] overflow-x-clip pb-16">
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
            className="cursor-pointer grid h-8 w-8 place-items-center rounded-full border border-white/45 font-bodoni-editorial text-[10px] tracking-[0.06em]"
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
                <div className="grid grid-cols-2 gap-y-3 text-left text-[10px] uppercase tracking-[0.2em] text-white/90">
                  {[
                    ['s9-home', 'Home'],
                    ['s9-location', '01 · Location'],
                    ['s9-the-day', '02 · The Day'],
                    ['s9-dress-code', '03 · Dress Code'],
                    ['s9-gift-list', '04 · Gift List'],
                    ['s9-rsvp', '05 · RSVP'],
                    ['s9-faq', '06 · FAQ'],
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
          className="relative flex min-h-[calc(100svh-46px)] items-center justify-center overflow-hidden px-5 py-12 text-center"
        >
          {/* Khung hoa mẫu đơn & hồng xanh sứ Delft phủ kín 4 viền */}
          <img
            src={decorUrl('style9-porcelain-hero-frame.jpg')}
            alt="Hoa xanh sứ trắng"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none mix-blend-multiply"
          />

          {/* Tấm thẻ trung tâm có khung viền đôi hoa văn góc Baroque */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isEnvelopeOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-[66%] min-w-[238px] max-w-[268px] flex-col items-center justify-center bg-[#FAF5F4]/95 px-5 py-10 shadow-[0_6px_30px_rgba(24,44,82,0.08)]"
          >
            <BaroqueInnerFrameSvg />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={isEnvelopeOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.65, delay: 0.35 }}
              className="text-[7.5px] font-medium uppercase leading-[1.6] tracking-[0.22em] text-[#7A8AA6]"
            >
              WITH ALL OUR LOVE, WE
              <br />
              INVITE YOU
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={isEnvelopeOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="font-bodoni-editorial mt-4 text-[34px] font-normal leading-[1.08] tracking-[-0.01em] text-[#1D335B]"
            >
              {data.groom.shortName}
            </motion.h1>

            <motion.span
              initial={{ opacity: 0 }}
              animate={isEnvelopeOpen ? { opacity: 0.75 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.62 }}
              className="font-handwritten-minimal my-0.5 text-[21px] text-[#667899]"
            >
              &amp;
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={isEnvelopeOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.8, delay: 0.68 }}
              className="font-bodoni-editorial text-[34px] font-normal leading-[1.08] tracking-[-0.01em] text-[#1D335B]"
            >
              {data.bride.shortName}
            </motion.h1>

            <div className="my-4 h-px w-14 bg-[#C4CEDE]" />

            <motion.p
              initial={{ opacity: 0 }}
              animate={isEnvelopeOpen ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.82 }}
              className="font-bodoni-editorial text-[12.5px] tracking-[0.22em] text-[#4C6289]"
            >
              {dottedDate}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isEnvelopeOpen ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.92 }}
              className="font-handwritten-minimal mt-1.5 text-[21px] text-[#6D7FA0]"
            >
              Bắc Ninh · Việt Nam
            </motion.p>

            <motion.button
              type="button"
              onClick={() => scrollToSection('s9-countdown')}
              initial={{ opacity: 0 }}
              animate={isEnvelopeOpen ? { opacity: 0.75 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 1.05 }}
              className="cursor-pointer mt-5 flex flex-col items-center gap-1 text-[7.5px] uppercase tracking-[0.28em] text-[#6E7F9E]"
            >
              <span>SCROLL</span>
              <ChevronDown className="h-3 w-3 animate-bounce" />
            </motion.button>
          </motion.div>
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
            <p className="font-handwritten-minimal text-[25px] text-[#66799C]">
              Forever begins in
            </p>
            <div className="mt-7">
              <PorcelainCountdown isoDate={data.weddingDate.isoDate} />
            </div>

            {/* Minh họa tháp ly Champagne rót rượu quấn hoa hồng xanh (y hệt f_015 video 2!) */}
            <motion.img
              src={decorUrl('style9-champagne-tower.jpg')}
              alt="Champagne tower illustration"
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
            <p className="text-[8px] uppercase tracking-[0.26em] text-[#95A0B3]">DATE</p>
            <p className="font-bodoni-editorial mt-2 text-[22px] text-[#1D335B]">
              03 Tháng 03, 2027
            </p>
            <p className="mt-1 text-[11px] text-[#7E8BA2]">
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
            <p className="font-bodoni-editorial text-[11px] tracking-[0.2em] text-[#8E9AB0]">
              01
            </p>
            <h2 className="font-bodoni-editorial mt-1 text-[28px] text-[#1D335B]">
              Location
            </h2>
          </motion.div>

          {/* Các địa điểm sự kiện của Style 7 — trình bày căn trái tối giản + bản đồ sáng */}
          <div className="mt-10 space-y-12 text-left">
            {data.partyEvents.map((ev, idx) => {
              const query = encodeURIComponent(ev.address);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.75 }}
                >
                  <p className="text-[8.5px] uppercase tracking-[0.22em] text-[#8C98AD]">
                    {idx === 0 ? 'TIỆC MỜI THÂN MẬT (02.03.2027)' : 'LỄ THÀNH HÔN & KHAI TIỆC (03.03.2027)'}
                  </p>
                  <h3 className="font-bodoni-editorial mt-1.5 text-[23px] text-[#1D335B]">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#6E7C94]">
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
                      Open in Maps ↗
                    </a>
                  </div>

                  <a
                    href={ev.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-[#667899] hover:text-[#1D335B]"
                  >
                    OPEN IN MAPS →
                  </a>
                </motion.div>
              );
            })}
          </div>

          {/* Mục thông tin gia đình & chỉ dẫn đỗ xe (giống f_023 video 2) */}
          <div className="mt-12 space-y-6 border-t border-[#E6E2E5] pt-8 text-left">
            <div>
              <p className="text-[8.5px] uppercase tracking-[0.22em] text-[#95A0B3]">
                GIA ĐÌNH NHÀ TRAI
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#50607B]">
                Ông {data.groom.fatherName} &amp; Bà {data.groom.motherName} — Thôn Phú Xá, Xã Văn Môn, Yên Phong, Bắc Ninh.
              </p>
            </div>
            <div className="border-t border-[#ECE7E9] pt-5">
              <p className="text-[8.5px] uppercase tracking-[0.22em] text-[#95A0B3]">
                GIA ĐÌNH NHÀ GÁI
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#50607B]">
                Ông {data.bride.fatherName} &amp; Bà {data.bride.motherName}.
              </p>
            </div>
            <div className="border-t border-[#ECE7E9] pt-5">
              <p className="text-[8.5px] uppercase tracking-[0.22em] text-[#95A0B3]">
                ĐỖ XE &amp; DI CHUYỂN
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#50607B]">
                Khu vực đỗ xe ô tô và xe máy rộng rãi, hoàn toàn miễn phí ngay sát Tư Gia Nhà Trai.
              </p>
            </div>
          </div>
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
            <p className="font-bodoni-editorial text-[11px] tracking-[0.2em] text-[#8E9AB0]">
              02
            </p>
            <h2 className="font-bodoni-editorial mt-1 text-[28px] text-[#1D335B]">
              The Day
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
                  <p className="text-[11px] font-medium tracking-[0.06em] text-[#8E9AB0]">
                    {item.time}
                  </p>
                  <p className="text-[9px] text-[#AAB3C2]">{item.day}</p>
                </div>

                <div className="relative border-l border-[#D8DCE7] pb-9 pl-5 text-left">
                  <span className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#1D335B]" />
                  <h3 className="font-bodoni-editorial text-[20px] leading-snug text-[#1D335B]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#7E8BA2]">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Khối ảnh cưới tinh tuyển của Style 7 (khung viền mảnh phong cách Editorial Porcelain) */}
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-2.5">
            {coupleGallery.map((url, idx) => (
              <motion.button
                key={url}
                type="button"
                onClick={() => setLightboxUrl(url)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: idx * 0.08 }}
                className="cursor-pointer group overflow-hidden border border-[#DCE1EB] bg-white p-1 shadow-sm"
              >
                <img
                  src={url}
                  alt={`${data.groom.shortName} & ${data.bride.shortName} - ${idx + 1}`}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </motion.button>
            ))}
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
            <p className="font-bodoni-editorial text-[11px] tracking-[0.2em] text-[#8E9AB0]">
              03
            </p>
            <h2 className="font-bodoni-editorial mt-1 text-[23px] text-[#4E6184]">
              Dress code
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
            <h3 className="font-bodoni-editorial text-[44px] font-normal leading-[1.04] tracking-[-0.02em] text-[#1D335B]">
              Formal
              <br />
              elegance
            </h3>
            <p className="mt-5 max-w-[270px] text-[12px] leading-[1.7] text-[#6E7C94]">
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
            <p className="font-bodoni-editorial text-[11px] tracking-[0.2em] text-[#8E9AB0]">
              04
            </p>
            <h2 className="font-bodoni-editorial mt-1 text-[23px] text-[#1D335B]">
              Gift list
            </h2>
          </div>

          <div className="mt-9 text-left">
            <h3 className="font-bodoni-editorial text-[30px] leading-tight text-[#1D335B]">
              A gift for us
            </h3>
            <p className="mt-3 text-[12px] leading-[1.7] text-[#6E7C94]">
              Sự hiện diện của bạn là món quà quý giá nhất đối với {data.groom.shortName} &amp; {data.bride.shortName}. Nếu bạn muốn gửi thêm lời chúc phúc từ xa, có thể mở thông tin bên dưới.
            </p>

            <button
              type="button"
              onClick={() => setShowAccount((prev) => !prev)}
              className="cursor-pointer mt-5 border border-[#CFD5E2] bg-transparent px-6 py-2.5 text-[9.5px] font-medium uppercase tracking-[0.22em] text-[#4C6084] transition-colors hover:border-[#1D335B] hover:text-[#1D335B]"
            >
              {showAccount ? 'HIDE ACCOUNT' : 'GIVE A GIFT'}
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
                        <p className="text-[8.5px] uppercase tracking-[0.2em] text-[#8D98AC]">
                          ACCOUNT HOLDER · {gift.accountHolder}
                        </p>
                        <p className="font-bodoni-editorial mt-1.5 text-[16px] tracking-[0.06em] text-[#1D335B]">
                          {gift.accountNumber}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6E7C94]">
                          {gift.bankBranch}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => handleCopy(key, gift.accountNumber)}
                            className="cursor-pointer inline-flex items-center gap-1.5 bg-[#21365C] px-6 py-2 text-[9.5px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#162745]"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="h-3 w-3" /> COPIED
                              </>
                            ) : (
                              'COPY'
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
            PHẦN 7: 05 RSVP — 2 NÚT CHỌN SONG SONG + NÚT SEND RSVP NAVY (f_036 - f_039)
           ============================================================ */}
        <section id="s9-rsvp" className="border-t border-[#ECE5E4] px-7 pb-14 pt-12">
          <div className="text-center">
            <p className="font-bodoni-editorial text-[11px] tracking-[0.2em] text-[#8E9AB0]">
              05
            </p>
            <h2 className="font-bodoni-editorial mt-1 text-[26px] text-[#1D335B]">
              RSVP
            </h2>
          </div>

          <form onSubmit={handleRsvpSubmit} className="mt-9 text-left">
            <p className="text-[8.5px] uppercase tracking-[0.22em] text-[#96A1B4]">
              LET US KNOW
            </p>
            <p className="font-handwritten-minimal mt-1 text-[28px] leading-tight text-[#5F7396]">
              {guestInput || 'Quý Khách Mời'}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#7E8BA2]">
              Vui lòng xác nhận sự tham dự của bạn trước ngày 25 Tháng 02, 2027.
            </p>

            {/* Ô nhập tên khách với đường kẻ mảnh dưới đáy */}
            <div className="mt-7">
              <label className="block text-[8.5px] uppercase tracking-[0.2em] text-[#95A0B3]">
                HỌ VÀ TÊN CỦA BẠN
              </label>
              <input
                type="text"
                required
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="font-bodoni-editorial mt-1.5 w-full border-b border-[#D8DCE6] bg-transparent pb-2 text-[18px] text-[#1D335B] placeholder-[#BCC4D2] outline-none focus:border-[#1D335B]"
              />
            </div>

            {/* Hai nút chia đôi ngang YES, I'LL BE THERE / CAN'T MAKE IT giống hệt f_036 video 2! */}
            <div className="mt-5 grid grid-cols-2 border border-[#DFE3EC]">
              <button
                type="button"
                onClick={() => setWillAttend('yes')}
                className={`cursor-pointer px-3 py-3.5 text-center text-[9px] font-medium uppercase leading-snug tracking-[0.16em] transition-colors ${
                  willAttend === 'yes'
                    ? 'bg-[#21365C] text-white'
                    : 'bg-white/50 text-[#7B88A0] hover:bg-white'
                }`}
              >
                YES, I&apos;LL BE
                <br />
                THERE
              </button>
              <button
                type="button"
                onClick={() => setWillAttend('no')}
                className={`cursor-pointer border-l border-[#DFE3EC] px-3 py-3.5 text-center text-[9px] font-medium uppercase leading-snug tracking-[0.16em] transition-colors ${
                  willAttend === 'no'
                    ? 'bg-[#21365C] text-white'
                    : 'bg-white/50 text-[#7B88A0] hover:bg-white'
                }`}
              >
                CAN&apos;T MAKE IT
              </button>
            </div>

            {/* Lời chúc gửi cô dâu chú rể */}
            <div className="mt-6">
              <label className="block text-[8.5px] uppercase tracking-[0.2em] text-[#95A0B3]">
                LỜI CHÚC GỬI DÂU RỂ
              </label>
              <input
                type="text"
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Gửi lời chúc phúc đến Huy Đức & Phan Hậu..."
                className="mt-2 w-full border-b border-[#D8DCE6] bg-transparent pb-2 text-[12.5px] text-[#35486A] placeholder-[#B4BDCB] outline-none focus:border-[#1D335B]"
              />
            </div>

            {/* Nút SEND RSVP xanh navy vuông sắc nét căn trái giống hệt f_039 video 2! */}
            <button
              type="submit"
              className="cursor-pointer mt-8 bg-[#21365C] px-8 py-3 text-[10px] font-medium uppercase tracking-[0.22em] text-white shadow-sm transition-colors hover:bg-[#162745]"
            >
              {rsvpSent ? 'RSVP SENT ✓' : 'SEND RSVP'}
            </button>
          </form>

          {wishes.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-[#E6E1E4] pt-5 text-left">
              {wishes.slice(0, 3).map((w) => (
                <div key={w.id} className="border-b border-[#EFEAED] pb-2.5">
                  <p className="font-bodoni-editorial text-[14px] text-[#1D335B]">
                    {w.name}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#6E7C94]">{w.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================
            PHẦN 8: 06 FREQUENTLY ASKED QUESTIONS ACCORDION (f_039 - f_040)
           ============================================================ */}
        <section id="s9-faq" className="relative border-t border-[#ECE5E4] px-7 pb-14 pt-14">
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute left-1 top-1 w-24 select-none mix-blend-multiply opacity-85"
          />
          <img
            src={decorUrl('style9-corner-rose.jpg')}
            alt=""
            className="pointer-events-none absolute right-1 top-1 w-24 -scale-x-100 select-none mix-blend-multiply opacity-85"
          />

          <div className="text-center">
            <p className="font-bodoni-editorial text-[11px] tracking-[0.2em] text-[#8E9AB0]">
              06
            </p>
            <h2 className="font-bodoni-editorial mt-1 text-[23px] text-[#1D335B]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-8 divide-y divide-[#E7E2E5] border-y border-[#E7E2E5] text-left">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={item.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="cursor-pointer flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="font-bodoni-editorial text-[16px] text-[#1D335B]">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <Minus className="h-3.5 w-3.5 shrink-0 text-[#8693AA]" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 shrink-0 text-[#8693AA]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-2.5 text-[12px] leading-relaxed text-[#6E7C94]"
                      >
                        {item.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            PHẦN 9: FOOTER MONOGRAM + WITH LOVE + BÁNH CƯỚI 3 TẦNG MÀU SỨ XANH (f_042)
           ============================================================ */}
        <footer className="px-7 pb-10 pt-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#DCE0EA] font-bodoni-editorial text-[18px] tracking-[0.06em] text-[#1D335B]">
            {monogram}
          </div>

          <p className="font-handwritten-minimal mt-7 text-[24px] text-[#6A7B9C]">
            With love
          </p>

          <h2 className="font-bodoni-editorial mt-2 text-[36px] leading-[1.08] text-[#1D335B]">
            {data.groom.shortName} &amp;
            <br />
            {data.bride.shortName}
          </h2>

          <p className="mt-4 text-[10px] uppercase tracking-[0.26em] text-[#8D98AC]">
            {dottedDate}
          </p>

          <p className="mt-7 text-[8.5px] uppercase tracking-[0.24em] text-[#9BA5B7]">
            CONTACT US FOR INFO
          </p>
          <p className="mt-1 text-[11px] text-[#7B889E]">
            Thôn Phú Xá, Xã Văn Môn, Yên Phong, Bắc Ninh
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
            THANH TAB BAR DƯỚI ĐÁY CỐ ĐỊNH (HOME | LOCATION | GIFT LIST | RSVP) Y HỆT VIDEO 2
           ============================================================ */}
        {isEnvelopeOpen && (
          <nav className="fixed bottom-0 left-1/2 z-50 grid h-[46px] w-full max-w-[430px] -translate-x-1/2 grid-cols-4 items-center border-t border-[#EAE4E3] bg-[#FAF5F4]/95 px-2 backdrop-blur-md">
            {(
              [
                ['home', 's9-home', 'HOME'],
                ['location', 's9-location', 'LOCATION'],
                ['gift-list', 's9-gift-list', 'GIFT LIST'],
                ['rsvp', 's9-rsvp', 'RSVP'],
              ] as const
            ).map(([tabKey, targetId, label]) => {
              const active = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => scrollToSection(targetId)}
                  className={`cursor-pointer mx-auto pb-0.5 text-[8.5px] font-medium uppercase tracking-[0.16em] transition-colors ${
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
