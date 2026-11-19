import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowUp,
  Check,
  Copy,
  Download,
  Lock,
  Mail,
  Music,
  VolumeX,
  X,
} from 'lucide-react';
import { WeddingData, WishItem } from '../data/weddingData';
import { preloadAndDecodeImages } from '../utils/imagePreloader';

interface LotusVietnamInvitationProps {
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

/**
 * Cánh hoa sen hồng trong suốt rơi chéo nhẹ nhàng (thuần CSS GPU — 60fps)
 */
const LOTUS_PETALS = [
  { left: '14%', dur: '13s', delay: '0s', size: 18, rot: 20 },
  { left: '72%', dur: '15s', delay: '-4s', size: 16, rot: -25 },
  { left: '38%', dur: '17s', delay: '-9s', size: 15, rot: 40 },
  { left: '85%', dur: '14s', delay: '-2s', size: 20, rot: -15 },
  { left: '24%', dur: '16s', delay: '-6s', size: 14, rot: 55 },
  { left: '60%', dur: '18s', delay: '-11s', size: 17, rot: -35 },
];

/**
 * Khung viền cắt góc lõm (scalloped-notch corner frame) giống hệt video mẫu Hoa Sen Việt Nam
 */
const LotusNotchedFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative mx-4 px-5 pt-11 pb-11 text-center">
    <svg
      viewBox="0 0 360 320"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* Viền mảnh màu xanh rêu đậm có 4 góc lượn lõm (inverted-shoulder Vietnamese frame) */}
      <path
        d="M 46 6
           L 314 6
           Q 314 28 338 28
           Q 354 28 354 46
           L 354 274
           Q 354 292 338 292
           Q 314 292 314 314
           L 46 314
           Q 46 292 22 292
           Q 6 292 6 274
           L 6 46
           Q 6 28 22 28
           Q 46 28 46 6 Z"
        fill="none"
        stroke="#576357"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
    <div className="relative z-10">{children}</div>
  </div>
);

export const LotusVietnamInvitation: React.FC<LotusVietnamInvitationProps> = ({
  data,
  wishes,
  onAddWish,
  isMusicPlaying,
  onToggleMusic,
  onStartMusic,
  guestName,
  onOpenAdmin,
}) => {
  const [nameInput, setNameInput] = useState(() => getInitialGuestName(guestName));
  const [relationInput, setRelationInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [attendance, setAttendance] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const initial = getInitialGuestName(guestName);
    if (initial) setNameInput(initial);
  }, [guestName]);

  // Tải trước artwork hoa sen và ảnh chính Style 7 mượt mà
  useEffect(() => {
    const urls = [
      decorUrl('style8-lotus-cluster.jpg'),
      decorUrl('style8-lotus-top-leaf.jpg'),
      decorUrl('style8-lotus-footer.jpg'),
      data.sectionImages.hero,
      data.sectionImages.heroLeftFloat,
      ...data.album9Images.slice(0, 6).map((p) => p.url),
    ];
    return preloadAndDecodeImages(urls, { delayMs: 200, concurrency: 3 });
  }, [data]);

  // Tự động kích hoạt nhạc khi người dùng chạm lần đầu
  useEffect(() => {
    const handleFirstGesture = () => {
      onStartMusic();
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    return () => window.removeEventListener('pointerdown', handleFirstGesture);
  }, [onStartMusic]);

  // Lấy ngày/tháng/năm từ dữ liệu Style 7 (03.03.2027)
  const [dayPart, monthPart, yearPart] = data.weddingDate.displayDate.split('.');
  const dayMonthDot = `${dayPart || '03'}.${monthPart || '03'}`;
  const mainYear = yearPart || '2027';

  // Hai sự kiện của Style 7 (Lễ Thành Hôn + Bữa Cơm Thân Mật)
  const mainCeremony = data.partyEvents[1] || data.partyEvents[0];
  const warmDinner = data.partyEvents[0];

  const spacedDate = (dm: string, yr: string) =>
    `${dm.replace('/', '.')}.${yr}`.split('').join(' ');

  const mapQuery = encodeURIComponent(
    mainCeremony?.address || 'Phú Xá, Văn Môn, Yên Phong, Bắc Ninh'
  );
  const mapUrl =
    mainCeremony?.mapUrl ||
    `https://maps.google.com/?q=${mapQuery}`;

  const handleCopyStk = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSubmitRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const now = new Date();
    const relPrefix = relationInput.trim() ? `[${relationInput.trim()}] ` : '';
    const finalMsg =
      messageInput.trim() ||
      'Chúc hai bạn trăm năm hạnh phúc, mãi bên nhau viên mãn!';
    onAddWish({
      id: `lotus-wish-${Date.now()}`,
      name: nameInput.trim(),
      message: `${relPrefix}${finalMsg}`,
      attendance: attendance || 'Có, chắc chắn mình sẽ tham dự!',
      createdAt: `${now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })} • ${now.toLocaleDateString('vi-VN')}`,
    });
    setRelationInput('');
    setMessageInput('');
    setSentSuccess(true);
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#E89BAE', '#5A7858', '#F6E8CC'],
    });
    window.setTimeout(() => setSentSuccess(false), 2600);
  };

  // 8 ảnh cưới sạch từ Style 7 để hiển thị đúng lưới 2 cột dọc như video
  const galleryPhotos = data.album9Images.slice(0, 8);

  return (
    <div className="min-h-screen w-full bg-[#E5EAE3] text-[#283028] flex justify-center overflow-x-clip md:py-8">
      {/* Nút Quản Trị kín đáo góc trên trái */}
      {onOpenAdmin && (
        <button
          type="button"
          onClick={onOpenAdmin}
          title="Quản trị"
          aria-label="Admin Login"
          className="cursor-pointer fixed top-3 left-3 z-50 rounded-full p-2 text-[#283028]/25 hover:text-[#283028] hover:opacity-100 transition-opacity"
        >
          <Lock className="h-3.5 w-3.5" />
        </button>
      )}

      {/* KHUNG THIỆP CHÍNH 9:16 MÀU GIẤY MỸ THUẬT TRẮNG NGÀ */}
      <main className="relative w-full max-w-[430px] min-h-screen bg-[#F6F5F0] shadow-[0_0_65px_rgba(25,40,25,0.14)] overflow-x-clip">
        {/* Cánh hoa sen rơi chéo dịu nhẹ xuyên suốt màn hình */}
        <div className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] overflow-hidden z-30">
          {LOTUS_PETALS.map((petal, idx) => (
            <svg
              key={idx}
              viewBox="0 0 24 36"
              style={
                {
                  left: petal.left,
                  width: petal.size,
                  height: petal.size * 1.4,
                  '--petal-dur': petal.dur,
                  '--petal-delay': petal.delay,
                } as React.CSSProperties
              }
              className="animate-lotus-petal absolute -top-10"
              aria-hidden="true"
            >
              <path
                d="M12 2 C19 10, 21 24, 12 34 C4 24, 5 10, 12 2 Z"
                fill="url(#lotusPetalGrad)"
                opacity="0.72"
              />
              <defs>
                <linearGradient id="lotusPetalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E69BB2" />
                  <stop offset="65%" stopColor="#F4CFD9" />
                  <stop offset="100%" stopColor="#FAF1F3" />
                </linearGradient>
              </defs>
            </svg>
          ))}
        </div>

        {/* ============================================================
            PHẦN 1: BÌA MỞ ĐẦU HOA SEN (MIN-H-100SVH — UNROLL CENTER-OUT)
           ============================================================ */}
        <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-16 text-center">
          {/* Mảng màu nước hồng phấn mờ góc trên phải & xanh ngọc mờ góc dưới trái */}
          <div
            className="pointer-events-none absolute -right-12 -top-10 h-64 w-64 rounded-full opacity-45 blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(235,186,200,0.65) 0%, rgba(246,245,240,0) 72%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-60 w-60 rounded-full opacity-40 blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(173,204,178,0.55) 0%, rgba(246,245,240,0) 72%)',
            }}
          />

          {/* Lá sen màu nước rủ xuống ở góc trên trái (y hệt video 1) */}
          <motion.img
            src={decorUrl('style8-lotus-top-leaf.jpg')}
            alt=""
            initial={{ opacity: 0, x: -24, y: -24, rotate: -14 }}
            animate={{ opacity: 0.92, x: 0, y: 0, rotate: -8 }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
            className="pointer-events-none absolute -left-14 -top-16 w-48 select-none mix-blend-multiply"
          />

          {/* Cụm chữ mở dần từ giữa ra 2 bên (clipPath inset 50% -> 0%) đúng animation video 1 */}
          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0% 50% 0% 50%)' }}
            animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 1.35, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 -mt-12 flex flex-col items-center"
          >
            <p className="font-serif-luxury text-[22px] tracking-[0.03em] text-[#2B322B]">
              Thư Mời Cưới
            </p>
            <h1 className="font-handwritten-minimal mt-2.5 text-[33px] leading-[1.3] text-[#454D45] px-2">
              {data.groom.shortName} &amp; {data.bride.shortName}
            </h1>
            <div className="font-serif-luxury mt-3.5 text-[50px] font-normal leading-[1.03] tracking-[0.04em] text-[#222922] [font-variant-numeric:lining-nums]">
              <div>{dayMonthDot}</div>
              <div>{mainYear}</div>
            </div>
          </motion.div>

          {/* Khóm hoa sen màu nước hồng góc dưới phải (y hệt video 1) */}
          <motion.img
            src={decorUrl('style8-lotus-cluster.jpg')}
            alt="Hoa sen Việt Nam"
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 0.98, y: 0, scale: 1 }}
            transition={{ duration: 1.25, delay: 0.15, ease: 'easeOut' }}
            className="pointer-events-none absolute -bottom-2 -right-4 w-[78%] max-w-[335px] select-none mix-blend-multiply"
          />
        </section>

        {/* ============================================================
            PHẦN 2: HOA SEN TRÀN KHUNG + THÔNG TIN HAI HỌ & TÊN DÂU RỂ TRƯỢT 2 BÊN
           ============================================================ */}
        <section className="relative pt-36 pb-5">
          {/* Cụm hoa sen vươn lên ngay trên vai phải khung viền — không che chữ NHÀ GÁI */}
          <motion.img
            src={decorUrl('style8-lotus-cluster.jpg')}
            alt=""
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.96, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute -right-2 -top-2 z-20 w-[58%] max-w-[245px] select-none mix-blend-multiply"
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.8 }}
          >
            <LotusNotchedFrame>
              {/* Hai họ Nhà Trai — Nhà Gái */}
              <div className="grid grid-cols-2 gap-3 pt-4 font-lotus-sans text-[10.5px] leading-[1.6] text-[#2A322A]">
                <div>
                  <p className="mb-1 text-[11px] font-bold tracking-[0.04em] uppercase">
                    NHÀ TRAI
                  </p>
                  <p className="uppercase">ÔNG {data.groom.fatherName}</p>
                  <p className="uppercase">BÀ {data.groom.motherName}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold tracking-[0.04em] uppercase">
                    NHÀ GÁI
                  </p>
                  <p className="uppercase">ÔNG {data.bride.fatherName}</p>
                  <p className="uppercase">BÀ {data.bride.motherName}</p>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.12 }}
                className="font-serif-luxury mt-6 text-[16.5px] text-[#2E362E]"
              >
                Trân Trọng Báo Tin Lễ Thành Hôn Của
              </motion.p>

              {/* Animation đặc trưng video 1: Chú rể trượt từ TRÁI vào, Cô dâu trượt từ PHẢI vào */}
              <div className="mt-5 flex flex-col items-center overflow-hidden">
                <motion.h2
                  initial={{ opacity: 0, x: -85 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                  className="font-handwritten-minimal text-[40px] leading-[1.2] text-[#404940]"
                >
                  {data.groom.shortName}
                </motion.h2>
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 0.75, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="font-serif-italic -my-1 text-[18px] text-[#4C554C]"
                >
                  &amp;
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, x: 85 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                  className="font-handwritten-minimal text-[40px] leading-[1.2] text-[#404940]"
                >
                  {data.bride.shortName}
                </motion.h2>
              </div>
            </LotusNotchedFrame>
          </motion.div>
        </section>

        {/* ============================================================
            PHẦN 3: ẢNH ĐÔI TAN VIỀN SƯƠNG MỜ + LỊCH HÔN LỄ + BẢN ĐỒ VỆ TINH
           ============================================================ */}
        <section className="relative pb-7 text-center">
          {/* Ảnh cô dâu chú rể của Style 7 với viền sương mềm tan dần vào nền trắng ngà */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.9 }}
            className="relative mx-0 overflow-hidden"
          >
            <img
              src={data.sectionImages.heroLeftFloat || data.sectionImages.hero}
              alt={`${data.groom.fullName} & ${data.bride.fullName}`}
              className="aspect-[4/4.2] w-full object-cover object-top"
              loading="eager"
            />
            {/* Lớp tan mờ trên & dưới giống hệt hiệu ứng ảnh của video 1 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#F6F5F0] via-[#F6F5F0]/45 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F6F5F0] via-[#F6F5F0]/75 to-transparent" />
          </motion.div>

          {/* Tiêu đề thư mời tham dự tiệc cưới */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-serif-luxury relative z-10 -mt-5 text-[16.5px] uppercase tracking-[0.07em] text-[#3A433A]"
          >
            THƯ MỜI THAM DỰ TIỆC CƯỚI
          </motion.p>

          {/* Hoa sen mờ lấp ló bên mép phải mục lịch sự kiện (giống f_017 video 1) */}
          <img
            src={decorUrl('style8-lotus-cluster.jpg')}
            alt=""
            className="pointer-events-none absolute -right-24 top-[54%] w-56 opacity-25 select-none mix-blend-multiply"
          />

          <div className="relative z-10 mt-6 px-7">
            {/* Sự kiện 1: Lễ Thành Hôn */}
            {mainCeremony && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
              >
                <h3 className="font-condensed-minimal text-[20px] font-medium uppercase tracking-[0.05em] text-[#1F271F]">
                  LỄ THÀNH HÔN
                </h3>
                <p className="font-lotus-sans mt-1.5 text-[12px] text-[#3F483F]">
                  11:00 - {mainCeremony.dayOfWeek}
                </p>
                <p className="font-lotus-sans mt-1.5 text-[17px] font-semibold tracking-[0.08em] text-[#1D251D]">
                  {spacedDate(mainCeremony.dayMonth, mainCeremony.year)}
                </p>
                <p className="font-serif-italic mt-1.5 text-[13px] text-[#717A71]">
                  ({mainCeremony.lunarText})
                </p>
                <p className="font-lotus-sans mt-1.5 text-[12.5px] text-[#2D362D]">
                  Tại Tư Gia Nhà Trai
                </p>
              </motion.div>
            )}

            {/* Đường kẻ ngang mảnh ngăn cách 2 lễ */}
            <div className="mx-auto my-6 h-px w-48 bg-[#8C968C]/70" />

            {/* Sự kiện 2: Tiệc Mời Thân Mật (Ăn cỗ trước - dữ liệu Style 7) */}
            {warmDinner && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
              >
                <h3 className="font-condensed-minimal text-[20px] font-medium uppercase tracking-[0.05em] text-[#1F271F]">
                  TIỆC MỪNG LỄ THÀNH HÔN
                </h3>
                <p className="font-lotus-sans mt-1.5 text-[12px] text-[#3F483F]">
                  17:00 - {warmDinner.dayOfWeek}
                </p>
                <p className="font-lotus-sans mt-1.5 text-[17px] font-semibold tracking-[0.08em] text-[#1D251D]">
                  {spacedDate(warmDinner.dayMonth, warmDinner.year)}
                </p>
                <p className="font-serif-italic mt-1.5 text-[13px] text-[#717A71]">
                  ({warmDinner.lunarText})
                </p>
                <p className="font-lotus-sans mt-1.5 text-[12.5px] text-[#2D362D]">
                  Tại Tư Gia Nhà Trai
                </p>
                <p className="font-lotus-sans mx-auto mt-1 max-w-[300px] text-[12px] leading-relaxed text-[#424C42]">
                  Thôn Phú Xá, Xã Văn Môn, Yên Phong, Bắc Ninh
                </p>
              </motion.div>
            )}

            {/* Nút pill màu xanh rêu đậm: Xem Chỉ Đường */}
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="font-lotus-sans mt-5 inline-flex items-center justify-center rounded-full bg-[#4F5B50] px-7 py-2 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-[#384639]"
            >
              Xem Chỉ Đường
            </a>
          </div>

          {/* Bản đồ vệ tinh Google Maps nền tối giống hệt f_017 & f_022 video 1 (tham số t=k) */}
          <div className="relative mx-4 mt-5 overflow-hidden border border-[#C8CFC8] bg-[#1E2B1E] shadow-sm">
            <iframe
              title="Bản đồ vệ tinh địa điểm lễ cưới"
              src={`https://maps.google.com/maps?q=${mapQuery}&t=k&z=15&output=embed`}
              className="h-[220px] w-full border-0"
              loading="lazy"
            />
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="font-lotus-sans absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded bg-white/95 px-2.5 py-1 text-[11px] font-medium text-[#1A73E8] shadow"
            >
              Open in Maps ↗
            </a>
          </div>
        </section>

        {/* ============================================================
            PHẦN 4: THANH XANH LÁ ĐẬM + FORM XÁC NHẬN THAM DỰ & GỬI MỪNG CƯỚI
           ============================================================ */}
        <section id="rsvp" className="relative pb-10">
          {/* Thanh bar xanh rêu đậm nguyên chiều ngang giống hệt video 1 */}
          <div className="flex items-center justify-center bg-[#182F18] px-4 py-3 text-white relative">
            <Mail className="absolute left-4 h-5 w-5 stroke-[1.5] text-white/90" />
            <h3 className="font-condensed-minimal text-[15.5px] font-medium uppercase tracking-[0.07em]">
              XÁC NHẬN THAM DỰ LỄ CƯỚI
            </h3>
          </div>

          {/* Nền lá sen chìm cực nhẹ sau form */}
          <div className="relative px-7 pt-6">
            <img
              src={decorUrl('style8-lotus-top-leaf.jpg')}
              alt=""
              className="pointer-events-none absolute right-0 top-12 w-64 opacity-[0.12] select-none mix-blend-multiply"
            />

            <form onSubmit={handleSubmitRsvp} className="relative z-10 space-y-3">
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Tên của bạn là?"
                className="font-lotus-sans w-full border border-[#6E776E] bg-white/35 px-3.5 py-2.5 text-[12.5px] text-[#242C24] placeholder-[#828A82] outline-none focus:border-[#182F18]"
              />
              <input
                type="text"
                value={relationInput}
                onChange={(e) => setRelationInput(e.target.value)}
                placeholder="Bạn là gì của Dâu Rể nhỉ?"
                className="font-lotus-sans w-full border border-[#6E776E] bg-white/35 px-3.5 py-2.5 text-[12.5px] text-[#242C24] placeholder-[#828A82] outline-none focus:border-[#182F18]"
              />
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Gửi lời chúc đến Dâu Rể nhé!"
                className="font-lotus-sans w-full border border-[#6E776E] bg-white/35 px-3.5 py-2.5 text-[12.5px] text-[#242C24] placeholder-[#828A82] outline-none focus:border-[#182F18]"
              />
              <select
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                className="font-lotus-sans w-full border border-[#6E776E] bg-[#F6F5F0]/80 px-3.5 py-2.5 text-[12.5px] text-[#454D45] outline-none focus:border-[#182F18]"
              >
                <option value="">Bạn có tham dự không?</option>
                <option value="Có, chắc chắn mình sẽ tham dự!">
                  Có, mình sẽ tham dự
                </option>
                <option value="Rất tiếc, mình bận không thể tới dự">
                  Rất tiếc, mình không thể tham dự
                </option>
              </select>

              {/* Hai nút GỬI NGAY & GỬI MỪNG CƯỚI viền mảnh đổ bóng nhẹ giống hệt video 1 */}
              <div className="flex flex-col items-center gap-3.5 pt-2.5">
                <button
                  type="submit"
                  className="cursor-pointer font-lotus-sans w-[176px] border border-[#4D564D] bg-[#F7F6F1] py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#1E261E] shadow-[0_3px_10px_rgba(0,0,0,0.09)] transition-all hover:bg-[#182F18] hover:text-white active:scale-95"
                >
                  {sentSuccess ? 'ĐÃ GỬI THÀNH CÔNG ✓' : 'GỬI NGAY'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsGiftModalOpen(true)}
                  className="cursor-pointer font-lotus-sans w-[152px] rounded-md border border-[#4D564D] bg-[#F7F6F1] py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#1E261E] shadow-[0_3px_10px_rgba(0,0,0,0.09)] transition-all hover:bg-[#4F5B50] hover:text-white active:scale-95"
                >
                  GỬI MỪNG CƯỚI
                </button>
              </div>
            </form>

            {/* Lời chúc gần đây nếu đã có */}
            {wishes.length > 0 && (
              <div className="relative z-10 mt-6 space-y-2 border-t border-[#C5CCC5]/60 pt-4">
                {wishes.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className="rounded border border-[#D4DAD4] bg-white/55 px-3 py-2 text-left"
                  >
                    <p className="font-lotus-sans text-[11px] font-semibold text-[#1E311E]">
                      {w.name}
                    </p>
                    <p className="font-lotus-sans mt-0.5 text-[11px] leading-snug text-[#465046]">
                      {w.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            PHẦN 5: ALBUM HÌNH CƯỚI — LƯỚI 2 CỘT DỌC & DÒNG KẺ TRÁI TIM NHỎ
           ============================================================ */}
        <section id="gallery" className="px-3 pb-10 pt-2">
          {/* Tiêu đề chữ viết tay bên trái + đường kẻ ngang có trái tim nhỏ chính giữa */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-4 flex items-center gap-2.5 px-1"
          >
            <h2 className="font-handwritten-minimal shrink-0 text-[31px] leading-none text-[#283028]">
              Album hình cưới
            </h2>
            <div className="flex flex-1 items-center">
              <div className="h-px flex-1 bg-[#7A847A]/60" />
              <span className="mx-1.5 text-[9px] text-[#283028]">♥</span>
              <div className="h-px flex-1 bg-[#7A847A]/60" />
            </div>
          </motion.div>

          {/* Lưới 2 cột ảnh chân dung sắc nét — hiệu ứng lướt nhẹ 2 bên vào */}
          <div className="grid grid-cols-2 gap-1.5">
            {galleryPhotos.map((photo, idx) => (
              <motion.button
                key={photo.id}
                type="button"
                onClick={() => setLightboxUrl(photo.url)}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -18 : 18, y: 12 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.6, delay: (idx % 2) * 0.08 }}
                className="cursor-pointer group relative overflow-hidden bg-[#ECEBE5]"
              >
                <img
                  src={photo.url}
                  alt={photo.alt}
                  loading="lazy"
                  className="aspect-[3/4.3] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </motion.button>
            ))}
          </div>
        </section>

        {/* ============================================================
            PHẦN 6: LỜI CHÀO ĐÓN TIẾP + TÊN DÂU RỂ XẾP CHÉO + ĐẦM SEN XANH NGỌC
           ============================================================ */}
        <footer className="relative overflow-hidden pt-5 pb-44 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-serif-luxury relative z-10 text-[20px] text-[#272F27]"
          >
            Rất hân hạnh được đón tiếp!
          </motion.p>

          {/* Bố cục tên dâu rể xếp chéo lệch trái-phải đặc trưng cuối video 1 (f_032) */}
          <div className="relative z-10 mx-auto mt-5 flex max-w-[340px] flex-col px-6">
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85 }}
              className="font-handwritten-minimal self-start text-[42px] leading-[1.15] text-[#3B433B]"
            >
              {data.groom.shortName}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.12 }}
              className="font-handwritten-minimal -mt-1 self-end text-[42px] leading-[1.15] text-[#3B433B]"
            >
              {data.bride.shortName}
            </motion.p>
          </div>

          {/* Đầm lá sen xanh lục & hoa sen trắng kem ở chân thiệp */}
          <motion.img
            src={decorUrl('style8-lotus-footer.jpg')}
            alt=""
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 0.96, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1.0 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none mix-blend-multiply"
          />
        </footer>

        {/* ============================================================
            HAI NÚT TRÒN VIỀN MẢNH GÓC DƯỚI (NHẠC TRÁI • LÊN ĐẦU TRANG PHẢI)
           ============================================================ */}
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-between px-4">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={isMusicPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            className="pointer-events-auto cursor-pointer grid h-9 w-9 place-items-center rounded-full border border-[#242B24] bg-[#F6F5F0]/80 text-[#242B24] shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
          >
            {isMusicPlaying ? (
              <Music className="h-4 w-4 animate-spin-vinyl" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Lên đầu trang"
            className="pointer-events-auto cursor-pointer grid h-9 w-9 place-items-center rounded-full border border-[#242B24] bg-[#F6F5F0]/80 text-[#242B24] shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
          >
            <ArrowUp className="h-4 w-4 stroke-[1.6]" />
          </button>
        </div>
      </main>

      {/* MODAL GỬI MỪNG CƯỚI (QR CHÚ RỂ & CÔ DÂU STYLE 7) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isGiftModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGiftModalOpen(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 16 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[90vh] w-full max-w-[410px] overflow-y-auto rounded-xl border border-[#8E9B8E] bg-[#F6F5F0] p-5 text-center shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setIsGiftModalOpen(false)}
                    aria-label="Đóng"
                    className="cursor-pointer absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-[#8E9B8E]/50 text-[#2A332A]"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <p className="font-condensed-minimal text-[11px] uppercase tracking-[0.16em] text-[#4F5E4F]">
                    HỘP QUÀ MỪNG CƯỚI
                  </p>
                  <h3 className="font-handwritten-minimal mt-1 text-[34px] text-[#1D321D]">
                    Gửi Mừng Cưới
                  </h3>
                  <p className="font-lotus-sans mx-auto mt-1 max-w-xs text-[11.5px] leading-relaxed text-[#525C52]">
                    Cảm ơn tình cảm và lời chúc phúc tốt đẹp của bạn dành cho {data.groom.shortName} &amp; {data.bride.shortName}.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { key: 'groom', item: data.groomQrGift, file: 'QR-Chu-Re.png' },
                      { key: 'bride', item: data.brideQrGift, file: 'QR-Co-Dau.png' },
                    ].map(({ key, item, file }) => (
                      <div
                        key={key}
                        className="rounded-lg border border-[#C6CFC6] bg-white p-3.5 shadow-sm"
                      >
                        <p className="font-lotus-sans text-[10px] font-semibold uppercase tracking-[0.06em] text-[#1D321D]">
                          {item.roleLabel}
                        </p>
                        <img
                          src={item.qrImageUrl}
                          alt={item.accountHolder}
                          className="mx-auto mt-2.5 h-36 w-36 rounded border border-[#E5EAE5] object-contain p-1"
                        />
                        <p className="font-lotus-sans mt-2.5 text-[11px] font-bold text-[#1F271F]">
                          {item.accountHolder}
                        </p>
                        <p className="font-lotus-sans text-[11px] text-[#4D574D]">
                          {item.accountNumber}
                        </p>
                        <p className="font-lotus-sans mt-0.5 text-[10px] text-[#6E776E]">
                          {item.bankBranch}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyStk(key, item.accountNumber)}
                            className="cursor-pointer font-lotus-sans inline-flex items-center gap-1 rounded border border-[#4D5B4D] px-2.5 py-1 text-[10px] font-medium text-[#1D321D] hover:bg-[#1D321D] hover:text-white"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="h-3 w-3" /> Đã chép
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy STK
                              </>
                            )}
                          </button>
                          <a
                            href={item.qrImageUrl}
                            download={file}
                            className="font-lotus-sans inline-flex items-center gap-1 rounded bg-[#182F18] px-2.5 py-1 text-[10px] font-medium text-white"
                          >
                            <Download className="h-3 w-3" /> Tải QR
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* LIGHTBOX XEM ẢNH ALBUM PHÓNG TO */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {lightboxUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setLightboxUrl(null)}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  aria-label="Đóng ảnh"
                  className="cursor-pointer absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <motion.img
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  src={lightboxUrl}
                  alt="Ảnh cưới phóng to"
                  className="max-h-[88vh] max-w-full rounded object-contain shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default LotusVietnamInvitation;
