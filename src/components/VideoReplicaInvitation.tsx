import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  CalendarDays,
  Check,
  Copy,
  Gift,
  Heart,
  Lock,
  MapPin,
  Menu,
  Music,
  Send,
  VolumeX,
  X,
} from 'lucide-react';
import { WeddingData, WishItem } from '../data/weddingData';
import { soundEngine } from '../utils/soundEngine';

export type ReplicaVariant = 'lotus' | 'porcelain';

const BASE_URL = import.meta.env.BASE_URL || '/';
const assetUrl = (path: string) => `${BASE_URL}${path.replace(/^\//, '')}`;

interface VideoReplicaInvitationProps {
  variant: ReplicaVariant;
  data: WeddingData;
  wishes: WishItem[];
  onAddWish: (wish: WishItem) => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onStartMusic: () => void;
  guestName?: string;
  onOpenAdmin?: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.72, ease: 'easeOut' as const },
};

function initialGuestName(guestName?: string) {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryName = params.get('guest') || params.get('name') || params.get('u');
    if (queryName?.trim()) return queryName.trim();
  }
  return guestName && guestName !== 'Bạn & Người Thương' ? guestName : '';
}

function buildGoogleCalendarUrl(data: WeddingData) {
  const start = data.weddingDate.isoDate.replace(/[-:]/g, '').replace('.000', '');
  const finishDate = new Date(data.weddingDate.isoDate);
  finishDate.setHours(finishDate.getHours() + 3);
  const finish = finishDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Lễ cưới ${data.groom.shortName} & ${data.bride.shortName}`,
    dates: `${start}/${finish}`,
    details: data.weddingDate.heroSubHeadline,
    location: data.partyEvents[0]?.address || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function Countdown({ isoDate, accent }: { isoDate: string; accent: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(isoDate).getTime() - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(
      () => setRemaining(Math.max(0, new Date(isoDate).getTime() - Date.now())),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isoDate]);

  const units = [
    ['NGÀY', Math.floor(remaining / 86400000)],
    ['GIỜ', Math.floor((remaining / 3600000) % 24)],
    ['PHÚT', Math.floor((remaining / 60000) % 60)],
    ['GIÂY', Math.floor((remaining / 1000) % 60)],
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2 px-5">
      {units.map(([label, value]) => (
        <div key={label} className="text-center">
          <p className="font-display-luxury text-2xl sm:text-3xl leading-none" style={{ color: accent }}>
            {String(value).padStart(2, '0')}
          </p>
          <p className="mt-2 text-[8px] tracking-[0.2em] opacity-60">{label}</p>
        </div>
      ))}
    </div>
  );
}

function MusicButton({ playing, toggle, accent }: { playing: boolean; toggle: () => void; accent: string }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 left-4 z-50 grid h-10 w-10 place-items-center rounded-full border bg-white/90 shadow-lg backdrop-blur-md"
      style={{ color: accent, borderColor: `${accent}45` }}
      aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}
    >
      {playing ? <Music className="h-4 w-4 animate-spin-vinyl" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}

function FamilyIntro({ data, accent }: { data: WeddingData; accent: string }) {
  return (
    <motion.section {...fadeUp} className="px-7 text-center">
      <div className="grid grid-cols-2 gap-5 text-[10px] leading-relaxed sm:text-xs">
        <div>
          <p className="mb-2 font-semibold tracking-[0.2em]" style={{ color: accent }}>NHÀ TRAI</p>
          <p>Ông {data.groom.fatherName}</p>
          <p>Bà {data.groom.motherName}</p>
        </div>
        <div>
          <p className="mb-2 font-semibold tracking-[0.2em]" style={{ color: accent }}>NHÀ GÁI</p>
          <p>Ông {data.bride.fatherName}</p>
          <p>Bà {data.bride.motherName}</p>
        </div>
      </div>
      <p className="mt-9 text-[10px] uppercase tracking-[0.22em] opacity-65">Trân trọng báo tin lễ thành hôn của</p>
      <h2 className="font-script-luxury mt-3 text-5xl sm:text-6xl" style={{ color: accent }}>
        {data.groom.shortName}
      </h2>
      <p className="font-serif-italic my-1 text-lg opacity-60">&amp;</p>
      <h2 className="font-script-luxury text-5xl sm:text-6xl" style={{ color: accent }}>
        {data.bride.shortName}
      </h2>
    </motion.section>
  );
}

function CouplePhoto({ data, rounded = false }: { data: WeddingData; rounded?: boolean }) {
  return (
    <motion.figure {...fadeUp} className="mx-6 overflow-hidden bg-stone-100 shadow-[0_18px_50px_rgba(20,30,30,0.12)]">
      <img
        src={data.sectionImages.hero}
        alt={`${data.groom.shortName} và ${data.bride.shortName}`}
        className={`aspect-[4/5] w-full object-cover object-center ${rounded ? 'rounded-t-[44%]' : ''}`}
        loading="eager"
      />
      <figcaption className="bg-white/90 px-4 py-5 text-center font-serif-italic text-sm tracking-wide">
        The wedding of {data.groom.shortName} &amp; {data.bride.shortName}
      </figcaption>
    </motion.figure>
  );
}

function EventCards({ data, accent, porcelain = false }: { data: WeddingData; accent: string; porcelain?: boolean }) {
  return (
    <section className="space-y-8 px-6">
      {data.partyEvents.map((event) => {
        const query = encodeURIComponent(event.address);
        return (
          <motion.article
            key={event.id}
            {...fadeUp}
            className={`overflow-hidden border bg-white/75 ${porcelain ? 'border-[#b9c6df]' : 'border-[#c8d6c5]'}`}
          >
            <div className="px-5 py-7 text-center">
              <p className="text-[9px] uppercase tracking-[0.24em] opacity-55">{event.badge}</p>
              <h3 className="font-display-luxury mt-2 text-2xl" style={{ color: accent }}>{event.title}</h3>
              <p className="mt-4 text-xs leading-6">{event.timeText}</p>
              <p className="font-display-luxury text-xl">{event.dayOfWeek} • {event.dayMonth} • {event.year}</p>
              <p className="mt-3 text-[10px] italic opacity-60">{event.lunarText}</p>
              <p className="mx-auto mt-4 max-w-xs text-[11px] leading-5">{event.address}</p>
            </div>
            <iframe
              title={`Bản đồ ${event.title}`}
              src={`https://maps.google.com/maps?q=${query}&z=14&output=embed`}
              className="h-44 w-full border-0 grayscale-[0.15]"
              loading="lazy"
            />
            <a
              href={event.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mx-auto my-5 flex w-fit items-center gap-2 border px-5 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-white"
              style={{ borderColor: accent, color: accent }}
            >
              <MapPin className="h-3.5 w-3.5" /> Xem chỉ đường
            </a>
          </motion.article>
        );
      })}
    </section>
  );
}

function Gallery({ data, accent }: { data: WeddingData; accent: string }) {
  return (
    <motion.section {...fadeUp} className="px-5">
      <p className="text-center text-[9px] uppercase tracking-[0.28em] opacity-50">Our gallery</p>
      <h2 className="font-script-luxury mb-7 text-center text-4xl" style={{ color: accent }}>Khoảnh khắc yêu thương</h2>
      <div className="grid grid-cols-2 gap-2">
        {data.album9Images.slice(0, 8).map((photo, index) => (
          <motion.img
            key={photo.id}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: (index % 4) * 0.07 }}
            src={photo.url}
            alt={photo.alt}
            loading="lazy"
            className={`w-full object-cover ${index === 0 || index === 5 ? 'col-span-2 aspect-[16/10]' : 'aspect-[3/4]'}`}
          />
        ))}
      </div>
    </motion.section>
  );
}

function GiftSection({ data, accent }: { data: WeddingData; accent: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <motion.section {...fadeUp} className="mx-6 border bg-white/70 p-6 text-center" style={{ borderColor: `${accent}45` }}>
      <Gift className="mx-auto h-5 w-5" style={{ color: accent }} />
      <h2 className="font-display-luxury mt-2 text-2xl" style={{ color: accent }}>Gửi quà mừng cưới</h2>
      <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 opacity-65">Tình cảm và sự hiện diện của bạn là món quà quý giá nhất với chúng mình.</p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-5 border px-5 py-2 text-[10px] uppercase tracking-[0.18em]"
        style={{ color: accent, borderColor: accent }}
      >
        {open ? 'Đóng thông tin' : 'Mở hộp quà'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ['groom', data.groomQrGift],
                ['bride', data.brideQrGift],
              ].map(([key, gift]) => {
                const item = gift as WeddingData['groomQrGift'];
                return (
                  <div key={key as string} className="border bg-white p-3" style={{ borderColor: `${accent}35` }}>
                    <img src={item.qrImageUrl} alt={item.roleLabel} className="mx-auto aspect-square w-full max-w-28 object-contain" />
                    <p className="mt-2 text-[9px] font-semibold uppercase">{item.accountHolder}</p>
                    <button type="button" onClick={() => copy(key as string, item.accountNumber)} className="mt-1 inline-flex items-center gap-1 text-[9px]" style={{ color: accent }}>
                      {item.accountNumber} {copied === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <p className="mt-1 text-[8px] leading-3 opacity-55">{item.bankBranch}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function RsvpSection({ data, wishes, onAddWish, accent, guestName }: {
  data: WeddingData;
  wishes: WishItem[];
  onAddWish: (wish: WishItem) => void;
  accent: string;
  guestName?: string;
}) {
  const [name, setName] = useState(() => initialGuestName(guestName));
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState('Có, mình sẽ tham dự');
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !message.trim()) return;
    const now = new Date();
    onAddWish({
      id: `wish-${Date.now()}`,
      name: name.trim(),
      message: message.trim(),
      attendance,
      createdAt: `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${now.toLocaleDateString('vi-VN')}`,
    });
    setMessage('');
    setSent(true);
    confetti({ particleCount: 70, spread: 75, colors: [accent, '#d9c59b', '#ffffff'] });
    window.setTimeout(() => setSent(false), 2500);
  };

  return (
    <motion.section {...fadeUp} className="mx-6 border bg-white/75 p-6" style={{ borderColor: `${accent}45` }}>
      <p className="text-center text-[9px] uppercase tracking-[0.28em] opacity-55">RSVP</p>
      <h2 className="font-script-luxury text-center text-4xl" style={{ color: accent }}>Xác nhận tham dự</h2>
      <p className="mx-auto mt-2 max-w-xs text-center text-[11px] leading-5 opacity-60">Hãy cho {data.groom.shortName} và {data.bride.shortName} biết bạn sẽ đến chung vui nhé.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Tên của bạn" className="w-full border bg-transparent px-3 py-3 text-xs outline-none" style={{ borderColor: `${accent}55` }} />
        <select value={attendance} onChange={(event) => setAttendance(event.target.value)} className="w-full border bg-transparent px-3 py-3 text-xs outline-none" style={{ borderColor: `${accent}55` }}>
          <option>Có, mình sẽ tham dự</option>
          <option>Rất tiếc, mình không thể tham dự</option>
        </select>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={4} placeholder="Gửi lời chúc tới cô dâu chú rể" className="w-full resize-none border bg-transparent px-3 py-3 text-xs outline-none" style={{ borderColor: `${accent}55` }} />
        <button type="submit" className="flex w-full items-center justify-center gap-2 py-3 text-xs uppercase tracking-[0.18em] text-white" style={{ backgroundColor: accent }}>
          {sent ? <><Check className="h-4 w-4" /> Đã gửi</> : <><Send className="h-4 w-4" /> Gửi ngay</>}
        </button>
      </form>
      {wishes.length > 0 && (
        <div className="mt-7 max-h-52 space-y-3 overflow-y-auto border-t pt-5" style={{ borderColor: `${accent}25` }}>
          {wishes.slice(0, 5).map((wish) => (
            <div key={wish.id} className="text-left">
              <p className="text-xs font-semibold" style={{ color: accent }}>{wish.name}</p>
              <p className="mt-1 text-[10px] leading-4 opacity-65">{wish.message}</p>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function Closing({ data, accent, floral }: { data: WeddingData; accent: string; floral: string }) {
  return (
    <motion.footer {...fadeUp} className="relative overflow-hidden px-8 pb-32 pt-20 text-center">
      <img src={floral} alt="" className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-50" />
      <div className="relative z-10">
        <Heart className="mx-auto h-4 w-4" style={{ color: accent }} />
        <h2 className="font-script-luxury mt-3 text-5xl" style={{ color: accent }}>{data.thankYouText.title}</h2>
        <p className="mx-auto mt-4 max-w-sm text-[11px] leading-6 opacity-65">{data.thankYouText.message}</p>
        <p className="font-script-luxury mt-6 text-3xl" style={{ color: accent }}>{data.groom.shortName} &amp; {data.bride.shortName}</p>
      </div>
    </motion.footer>
  );
}

function PorcelainEnvelope({ data, onOpen }: { data: WeddingData; onOpen: () => void }) {
  const [opening, setOpening] = useState(false);
  const open = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(onOpen, 980);
  };

  return (
    <motion.div exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[70] grid place-items-center bg-[#f4eff0] p-6">
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#c3b7ad_0.7px,transparent_0.7px)] [background-size:7px_7px]" />
      <div className="relative aspect-[3/4] w-full max-w-[390px] [perspective:1400px]">
        <motion.div
          animate={opening ? { scale: 1.04 } : { scale: 1 }}
          className="absolute inset-0 overflow-hidden border border-[#d7cec7] bg-[#f5f0ea] shadow-[0_30px_80px_rgba(52,38,32,0.2)]"
        >
          <motion.div
            animate={opening ? { rotateX: -178 } : { rotateX: 0 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            style={{ transformOrigin: 'top', transformStyle: 'preserve-3d' }}
            className="absolute inset-x-0 top-0 z-30 h-[53%] bg-[#f0e8de] [clip-path:polygon(0_0,100%_0,50%_100%)] shadow-lg"
          />
          <motion.div animate={opening ? { x: '-102%' } : { x: 0 }} transition={{ duration: 0.8, delay: 0.12 }} className="absolute inset-y-0 left-0 z-20 w-[55%] bg-[#f7f2ec] [clip-path:polygon(0_0,100%_50%,0_100%)]" />
          <motion.div animate={opening ? { x: '102%' } : { x: 0 }} transition={{ duration: 0.8, delay: 0.12 }} className="absolute inset-y-0 right-0 z-20 w-[55%] bg-[#eee5da] [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
          <div className="absolute inset-x-[10%] bottom-[5%] h-[85%] border border-[#d7cec7] bg-white/70 p-8 text-center">
            <p className="mt-10 text-[9px] uppercase tracking-[0.3em] text-[#183d78]">Wedding invitation</p>
            <p className="font-display-luxury mt-4 text-3xl text-[#17376c]">{data.groom.shortName}</p>
            <p className="font-serif-italic my-1 text-sm text-[#7182a0]">and</p>
            <p className="font-display-luxury text-3xl text-[#17376c]">{data.bride.shortName}</p>
          </div>
        </motion.div>
        <motion.button
          type="button"
          onClick={open}
          animate={opening ? { opacity: 0, scale: 1.5 } : { opacity: 1, scale: [1, 1.04, 1] }}
          transition={opening ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity }}
          className="absolute left-1/2 top-1/2 z-50 h-28 w-40 -translate-x-1/2 -translate-y-1/2"
          aria-label="Mở phong bì"
        >
          <span className="absolute left-1/2 top-0 h-full w-7 -translate-x-1/2 bg-gradient-to-r from-[#bfc4ca] via-white to-[#aeb4bc] shadow-md" />
          <span className="absolute left-0 top-1/2 h-16 w-[52%] -translate-y-1/2 rotate-[18deg] rounded-[50%_15%_50%_15%] bg-gradient-to-br from-white via-[#d9dde1] to-[#aeb4bc] shadow-lg" />
          <span className="absolute right-0 top-1/2 h-16 w-[52%] -translate-y-1/2 -rotate-[18deg] rounded-[15%_50%_15%_50%] bg-gradient-to-bl from-white via-[#d9dde1] to-[#aeb4bc] shadow-lg" />
          <span className="absolute left-1/2 top-1/2 h-10 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white to-[#9fa7b0] shadow-lg" />
        </motion.button>
      </div>
      <p className="relative z-10 mt-6 text-[10px] uppercase tracking-[0.3em] text-[#6b7280]">Chạm vào nơ để mở thiệp</p>
    </motion.div>
  );
}

export const VideoReplicaInvitation: React.FC<VideoReplicaInvitationProps> = ({
  variant,
  data,
  wishes,
  onAddWish,
  isMusicPlaying,
  onToggleMusic,
  onStartMusic,
  guestName,
  onOpenAdmin,
}) => {
  const isLotus = variant === 'lotus';
  const accent = isLotus ? '#315b45' : '#173d78';
  const [isOpen, setIsOpen] = useState(isLotus);
  const [menuOpen, setMenuOpen] = useState(false);
  const floral = isLotus
    ? assetUrl('/images/decor/lotus-watercolor-cluster.png')
    : assetUrl('/images/decor/porcelain-blue-floral-frame.png');
  const calendarUrl = useMemo(() => buildGoogleCalendarUrl(data), [data]);

  const openInvitation = () => {
    setIsOpen(true);
    soundEngine.playOpenChime();
    onStartMusic();
    confetti({ particleCount: 90, spread: 88, origin: { y: 0.55 }, colors: [accent, '#d8cbb2', '#fdfbf7'] });
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${isLotus ? 'bg-[#e9eee8]' : 'bg-[#e9edf4]'}`}>
      <AnimatePresence>{!isOpen && <PorcelainEnvelope data={data} onOpen={openInvitation} />}</AnimatePresence>

      {onOpenAdmin && (
        <button type="button" onClick={onOpenAdmin} className="fixed left-3 top-3 z-50 rounded-full p-2 opacity-30 hover:opacity-80" aria-label="Quản trị">
          <Lock className="h-3.5 w-3.5" />
        </button>
      )}
      <MusicButton playing={isMusicPlaying} toggle={onToggleMusic} accent={accent} />

      <main className={`relative mx-auto min-h-screen w-full max-w-[480px] overflow-hidden shadow-[0_0_70px_rgba(25,40,45,0.16)] ${isLotus ? 'bg-[#fbfaf5] text-[#2e3c33]' : 'bg-[#fcfaf7] text-[#1a2c4a]'}`}>
        {isLotus ? (
          <>
            {/* VIDEO 1 — màn mở đầu tối giản, hoa sen nằm sát đáy như bản mẫu */}
            <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-8 pb-48 pt-20 text-center">
              <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#94a99a_0.55px,transparent_0.55px)] [background-size:13px_13px]" />
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }} className="relative text-[10px] uppercase tracking-[0.34em] opacity-55">Thư mời cưới</motion.p>
              <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9 }} className="font-script-luxury relative mt-5 text-4xl" style={{ color: accent }}>Trân trọng kính mời</motion.p>
              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.9 }} className="font-display-luxury relative mt-4 text-[2.55rem] tracking-[0.09em]">{data.weddingDate.day}<span className="mx-2 text-lg opacity-30">.</span>03<span className="mx-2 text-lg opacity-30">.</span>2027</motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.58 }} transition={{ delay: 1.1 }} className="relative mt-5 text-[9px] uppercase tracking-[0.25em]">{guestName || 'Bạn & Người Thương'}</motion.p>
              <motion.img initial={{ opacity: 0, y: 38 }} animate={{ opacity: 0.96, y: 0 }} transition={{ delay: 0.9, duration: 1.2 }} src={floral} alt="Hoa sen" className="pointer-events-none absolute bottom-[-1px] left-1/2 w-[132%] max-w-none -translate-x-1/2" />
            </section>
            <div className="pb-8">
              {/* Cụm sen + khung thông tin hai gia đình đúng thứ tự video */}
              <motion.section {...fadeUp} className="relative px-5 pb-8 pt-28 text-center">
                <img src={floral} alt="" className="pointer-events-none absolute -right-20 -top-4 z-10 w-[115%] max-w-none opacity-95" />
                <div className="relative border border-[#78927f] px-5 pb-12 pt-24">
                  <div className="pointer-events-none absolute inset-[5px] rounded-[24px] border border-[#78927f]/45" />
                  <div className="relative grid grid-cols-2 gap-5 text-[9px] leading-4">
                    <div><p className="mb-2 font-semibold tracking-[0.2em]">NHÀ TRAI</p><p>Ông {data.groom.fatherName}</p><p>Bà {data.groom.motherName}</p></div>
                    <div><p className="mb-2 font-semibold tracking-[0.2em]">NHÀ GÁI</p><p>Ông {data.bride.fatherName}</p><p>Bà {data.bride.motherName}</p></div>
                  </div>
                  <p className="relative mt-7 text-[9px] uppercase tracking-[0.22em] opacity-60">Trân trọng báo tin lễ thành hôn của</p>
                  <h2 className="font-script-luxury relative mt-4 text-4xl" style={{ color: accent }}>{data.groom.shortName}</h2>
                  <p className="font-serif-italic relative -my-1 text-sm opacity-55">&amp;</p>
                  <h2 className="font-script-luxury relative text-4xl" style={{ color: accent }}>{data.bride.shortName}</h2>
                </div>
              </motion.section>

              {/* Ảnh đôi duy nhất ở phần thiệp chính, mép dưới tan trắng giống video */}
              <motion.section {...fadeUp} className="relative mx-5 -mt-1 overflow-hidden">
                <img src={data.sectionImages.hero} alt={`${data.groom.shortName} và ${data.bride.shortName}`} className="aspect-[4/3] w-full object-cover object-center" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fbfaf5] to-transparent" />
              </motion.section>
              <motion.div {...fadeUp} className="px-7 pb-10 pt-2 text-center">
                <p className="font-serif-italic text-[11px] tracking-[0.16em]">THE WEDDING DAY</p>
                <p className="mt-1 text-[9px] tracking-[0.2em] opacity-55">{data.groom.fullName} &amp; {data.bride.fullName}</p>
              </motion.div>

              {/* Hai nghi lễ hiển thị dạng typography liền mạch, không dùng card */}
              <section id="events" className="relative px-8 pb-8 text-center">
                {data.partyEvents.map((event, index) => (
                  <motion.div key={event.id} {...fadeUp} className="mb-9">
                    <h3 className="font-condensed-minimal text-lg font-medium uppercase tracking-[0.08em]">{index === 0 ? 'LỄ VU QUY' : 'TIỆC MỪNG LỄ THÀNH HÔN'}</h3>
                    <p className="mt-2 text-[10px]">{event.timeText}</p>
                    <p className="font-display-luxury mt-1 text-xl tracking-[0.08em]">{event.dayMonth.replace('/', '.')}<span className="mx-2 opacity-30">•</span>{event.year}</p>
                    <p className="mt-2 text-[9px] italic opacity-55">{event.lunarText}</p>
                    <p className="mx-auto mt-3 max-w-xs text-[10px] leading-5">{event.address}</p>
                    <a href={event.mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#263e30] px-5 py-2 text-[9px] uppercase tracking-[0.12em] text-white"><MapPin className="h-3 w-3" /> Xem chỉ đường</a>
                  </motion.div>
                ))}
                <img src={floral} alt="" className="pointer-events-none absolute -right-28 top-20 w-72 opacity-25" />
                <iframe title="Bản đồ lễ cưới" src={`https://maps.google.com/maps?q=${encodeURIComponent(data.partyEvents[0]?.address || '')}&z=14&output=embed`} className="relative h-56 w-full border-4 border-white shadow-md" loading="lazy" />
              </section>

              {/* Thanh xanh + form RSVP theo đúng video */}
              <div className="mt-2 bg-[#213b2a] px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white">✉ &nbsp; Xác nhận tham dự lễ cưới</div>
              <div id="rsvp" className="pt-7"><RsvpSection data={data} wishes={wishes} onAddWish={onAddWish} accent={accent} guestName={guestName} /></div>
              <div id="gift" className="pt-8"><GiftSection data={data} accent={accent} /></div>
              <div id="gallery" className="pt-14"><Gallery data={data} accent={accent} /></div>
              <Closing data={data} accent={accent} floral={floral} />
            </div>
          </>
        ) : (
          <div className="pb-8">
            {/* VIDEO 2 — bìa hoa xanh trước, thanh navy chỉ xuất hiện khi bắt đầu cuộn */}
            <section className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center overflow-hidden px-8 py-20 text-center">
              <img src={floral} alt="Hoa xanh porcelain" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-95" />
              <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.9 }} className="relative z-10 border border-[#9eb2d2] bg-[#fffdfa]/85 px-8 py-12 shadow-[0_15px_45px_rgba(19,55,108,0.16)] backdrop-blur-[2px]">
                <p className="text-[9px] uppercase tracking-[0.28em] text-[#5d7194]">The wedding of</p>
                <h1 className="font-display-luxury mt-5 text-4xl leading-tight text-[#173d78]">{data.groom.shortName}</h1>
                <p className="font-serif-italic my-2 text-[#8190aa]">and</p>
                <h1 className="font-display-luxury text-4xl leading-tight text-[#173d78]">{data.bride.shortName}</h1>
                <div className="mx-auto my-7 h-px w-16 bg-[#9eb2d2]" />
                <p className="text-xs tracking-[0.22em] text-[#173d78]">{data.weddingDate.displayDate}</p>
              </motion.div>
            </section>

            <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[#173d78] px-4 text-white shadow-lg">
              <span className="font-display-luxury text-xs tracking-[0.14em]">HĐ &amp; PH</span>
              <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
              <AnimatePresence>{menuOpen && <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute inset-x-0 top-full bg-[#173d78] px-6 pb-5 pt-3 text-[10px] uppercase tracking-[0.12em] shadow-xl"><button type="button" onClick={() => setMenuOpen(false)} className="absolute right-4 top-3"><X className="h-4 w-4" /></button><div className="grid grid-cols-2 gap-3 pr-8"><a href="#locations" onClick={() => setMenuOpen(false)}>Locations</a><a href="#the-day" onClick={() => setMenuOpen(false)}>The day</a><a href="#gift" onClick={() => setMenuOpen(false)}>Gift list</a><a href="#rsvp" onClick={() => setMenuOpen(false)}>RSVP</a></div></motion.nav>}</AnimatePresence>
            </header>

            <div className="h-40 overflow-hidden"><img src={floral} alt="" className="h-[430px] w-full object-cover object-top" /></div>
            <motion.section {...fadeUp} className="px-8 pb-16 pt-14 text-center">
              <p className="font-serif-italic text-sm opacity-65">Forever begins now</p>
              <div className="mt-9"><Countdown isoDate={data.weddingDate.isoDate} accent={accent} /></div>
              <div className="mx-auto mt-12 h-px w-12 bg-[#93a9c9]" />
              <p className="font-display-luxury mt-9 text-3xl tracking-[0.1em]" style={{ color: accent }}>{data.weddingDate.displayDate}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] opacity-55">{data.weddingDate.dayOfWeek} • {data.weddingDate.lunarDate}</p>
            </motion.section>

            {/* Locations: chữ + bản đồ xen kẽ giống video */}
            <motion.section id="locations" {...fadeUp} className="relative px-7 pb-14 pt-6 text-left">
              <img src={floral} alt="" className="pointer-events-none absolute -left-24 -top-20 h-52 w-48 object-cover object-left-top opacity-35" />
              <p className="text-center text-[9px] uppercase tracking-[0.3em] opacity-45">Our wedding</p>
              <h2 className="font-display-luxury mt-2 text-center text-3xl" style={{ color: accent }}>Locations</h2>
              <div className="mt-12 space-y-12">
                {data.partyEvents.map((event) => <div key={event.id}><p className="font-serif-italic text-[11px] opacity-50">{event.timeText}</p><h3 className="font-display-luxury mt-1 text-xl" style={{ color: accent }}>{event.title}</h3><p className="mt-2 text-[10px] leading-5 opacity-65">{event.address}</p><iframe title={`Bản đồ ${event.title}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&z=13&output=embed`} className="mt-4 h-48 w-full border-0" loading="lazy" /></div>)}
              </div>
            </motion.section>

            {/* The Day: timeline dọc, khoảng trắng và hoa góc theo video */}
            <motion.section id="the-day" {...fadeUp} className="relative px-8 py-16 text-center">
              <img src={floral} alt="" className="pointer-events-none absolute -bottom-20 -left-24 h-64 w-64 object-cover object-left-bottom opacity-45" />
              <p className="text-[9px] uppercase tracking-[0.3em] opacity-45">The celebration</p>
              <h2 className="font-display-luxury mt-2 text-4xl" style={{ color: accent }}>The Day</h2>
              <div className="mx-auto mt-12 max-w-xs space-y-9 border-l border-[#9eb2d2] pl-7 text-left">
                {[['10:30', 'Đón khách'], ['11:00', 'Lễ thành hôn'], ['11:30', 'Khai tiệc'], ['13:00', 'Chụp hình & chúc mừng']].map(([time, title]) => <div key={title} className="relative"><span className="absolute -left-[31px] top-1 h-2 w-2 rounded-full bg-[#173d78]" /><p className="text-[9px] tracking-[0.2em] opacity-50">{time}</p><p className="font-display-luxury mt-1 text-xl">{title}</p></div>)}
              </div>
            </motion.section>

            <motion.section {...fadeUp} className="relative overflow-hidden px-8 py-16 text-left">
              <img src={floral} alt="" className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 object-cover object-right-top opacity-35" />
              <p className="text-[9px] uppercase tracking-[0.28em] opacity-45">Dress code</p>
              <h2 className="font-display-luxury mt-2 text-4xl leading-none" style={{ color: accent }}>Formal<br />elegance</h2>
              <p className="mt-5 max-w-xs text-[10px] leading-5 opacity-60">Trang phục lịch sự với các gam màu xanh, kem và đen sẽ làm ngày vui thêm trọn vẹn.</p>
              <div className="mt-7 flex gap-3">{['#173d78', '#8ba4cb', '#e7e2d8', '#26292e'].map((color) => <span key={color} className="h-8 w-8 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: color }} />)}</div>
            </motion.section>

            <div id="gift" className="relative py-12"><img src={floral} alt="" className="pointer-events-none absolute -left-28 -top-16 h-64 w-64 object-cover object-left-top opacity-45" /><GiftSection data={data} accent={accent} /></div>
            <div id="rsvp" className="py-12"><RsvpSection data={data} wishes={wishes} onAddWish={onAddWish} accent={accent} guestName={guestName} /></div>

            <motion.section {...fadeUp} className="px-8 py-14 text-left">
              <p className="text-[9px] uppercase tracking-[0.28em] opacity-45">Helpful details</p>
              <h2 className="font-display-luxury mt-2 text-3xl" style={{ color: accent }}>Stay &amp; travel</h2>
              <div className="mt-8 space-y-7 text-[10px] leading-5 opacity-65"><div><p className="font-display-luxury text-lg opacity-100">Hotels nearby</p><p>Chúng mình đã chuẩn bị một số gợi ý lưu trú thuận tiện gần địa điểm tổ chức.</p></div><div><p className="font-display-luxury text-lg opacity-100">Need a ride?</p><p>Hãy liên hệ với gia đình nếu bạn cần hỗ trợ di chuyển trong ngày cưới.</p></div><div><p className="font-display-luxury text-lg opacity-100">Questions &amp; answers</p><p>Mọi thông tin cần thiết đều có trong thiệp; chúng mình luôn sẵn lòng hỗ trợ bạn.</p></div></div>
            </motion.section>

            <motion.footer {...fadeUp} className="relative overflow-hidden px-8 pb-28 pt-20 text-center"><p className="text-[9px] uppercase tracking-[0.3em] opacity-45">Thank you</p><p className="font-serif-italic mt-4 text-sm opacity-55">With love</p><h2 className="font-display-luxury mt-5 text-4xl" style={{ color: accent }}>{data.groom.shortName}<br />&amp; {data.bride.shortName}</h2><img src={floral} alt="" className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 object-cover object-bottom opacity-25" /></motion.footer>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoReplicaInvitation;
