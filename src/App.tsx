import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  DANG_DAO_WEDDING_DATA,
  DEFAULT_WEDDING_DATA,
  DUC_HAU_WEDDING_DATA,
  StyleId,
  THEMES,
  WeddingData,
  WishItem,
} from './data/weddingData';
import { soundEngine } from './utils/soundEngine';
import { fetchCloudWishes, saveCloudWish } from './utils/cloudWishes';
import { AmbientCanvas } from './components/AmbientCanvas';
import { OpeningGate } from './components/OpeningGate';
import { HeroSection } from './components/HeroSection';
import { CoupleSection } from './components/CoupleSection';
import { LoveStorySection } from './components/LoveStorySection';
import { CountdownSection } from './components/CountdownSection';
import { EventsSection } from './components/EventsSection';
import { GallerySection } from './components/GallerySection';
import { RsvpWishesSection } from './components/RsvpWishesSection';
import { ConceptSwitcherDock } from './components/ConceptSwitcherDock';

const ThreeWeddingScene = lazy(() => import('./components/ThreeWeddingScene'));
const WhiteMinimalInvitation = lazy(() => import('./components/WhiteMinimalInvitation'));
const DangDaoMinimalInvitation = lazy(() => import('./components/DangDaoMinimalInvitation'));
const GardenEmeraldInvitation = lazy(() => import('./components/GardenEmeraldInvitation'));
const BurgundyCallaInvitation = lazy(() => import('./components/BurgundyCallaInvitation'));
const LotusVietnamInvitation = lazy(() => import('./components/LotusVietnamInvitation'));
const PorcelainBlueInvitation = lazy(() => import('./components/PorcelainBlueInvitation'));
const AdminGuestModal = lazy(() => import('./components/AdminGuestModal'));

gsap.registerPlugin(ScrollTrigger);

const WISHES_STORAGE_KEY = 'wedding_wishes_long_huyen_clean_v2';
const DANG_DAO_WISHES_STORAGE_KEY = 'wedding_wishes_dang_dao_v1';

function mergeUniqueWishes(...lists: WishItem[][]): WishItem[] {
  const seen = new Set<string>();
  const result: WishItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      if (!item || !item.name || !item.message) continue;
      // Khử trùng lặp theo cả id hoặc cặp (name + message)
      const dedupeKey = `${item.name.trim().toLowerCase()}::${item.message.trim().toLowerCase()}`;
      if (!seen.has(item.id) && !seen.has(dedupeKey)) {
        seen.add(item.id);
        seen.add(dedupeKey);
        result.push(item);
      }
    }
  }
  return result;
}

/**
 * Nhận diện phong cách từ các đường dẫn public độc lập:
 * - /fine-art -> fairytale (01. Thơ Mộng Fine Art)
 * - /vogue -> editorial (02. Tạp Chí Vogue)
 * - /starlight -> cinematic (03. Đêm Pháo Hoa 3D)
 * - /indochine -> indochine (04. Cung Đình Đông Dương)
 * - /minimal hoặc /tone-trang -> minimal (05. Tone Trắng Minimal)
 * - /garden hoặc /khu-vuon -> garden (06. Khu Vườn Xanh Ngọc)
 * - /calla hoặc /calla-do -> calla (07. Mẫu Thiệp Calla Đỏ)
 * - /lotus hoặc /hoa-sen -> lotus (08. Thiệp Hoa Sen Việt)
 * - /porcelain hoặc /hoa-xanh -> porcelain (09. Hoa Xanh Sứ Trắng)
 */
function detectInitialRouteStyle(): {
  style: StyleId;
  isLockedSingleStyle: boolean;
  isDangDaoProduct: boolean;
} {
  if (typeof window === 'undefined') {
    return { style: 'fairytale', isLockedSingleStyle: false, isDangDaoProduct: false };
  }

  const pathname = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const queryStyle = params.get('style')?.toLowerCase();
  const queryCustomer = params.get('customer')?.toLowerCase();

  // Sản phẩm nhân bản từ Style 5 cho khách hàng Đoàn Hải Đăng & Nguyễn Anh Đào
  if (
    pathname.includes('/hai-dang-anh-dao') ||
    pathname.includes('/dang-dao') ||
    pathname.includes('/anh-dao-hai-dang') ||
    queryStyle === 'dang-dao' ||
    queryStyle === 'hai-dang-anh-dao' ||
    queryCustomer === 'dang-dao' ||
    queryCustomer === 'hai-dang-anh-dao'
  ) {
    return { style: 'minimal', isLockedSingleStyle: true, isDangDaoProduct: true };
  }

  // Style 1: Fine Art
  if (
    pathname.includes('/fine-art') ||
    pathname.includes('/style-1') ||
    queryStyle === 'fairytale' ||
    queryStyle === 'fine-art' ||
    queryStyle === '1'
  ) {
    return { style: 'fairytale', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 2: Vogue Editorial
  if (
    pathname.includes('/vogue') ||
    pathname.includes('/editorial') ||
    pathname.includes('/style-2') ||
    queryStyle === 'editorial' ||
    queryStyle === 'vogue' ||
    queryStyle === '2'
  ) {
    return { style: 'editorial', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 3: Starlight Cinematic
  if (
    pathname.includes('/starlight') ||
    pathname.includes('/cinematic') ||
    pathname.includes('/style-3') ||
    queryStyle === 'cinematic' ||
    queryStyle === 'starlight' ||
    queryStyle === '3'
  ) {
    return { style: 'cinematic', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 4: Indochine Đông Dương
  if (
    pathname.includes('/indochine') ||
    pathname.includes('/style-4') ||
    queryStyle === 'indochine' ||
    queryStyle === '4'
  ) {
    return { style: 'indochine', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 5: Minimal Tone Trắng (Template gốc Thành Long & Thanh Huyền)
  if (
    pathname.includes('/minimal') ||
    pathname.includes('/tone-trang') ||
    pathname.includes('/style-5') ||
    queryStyle === 'minimal' ||
    queryStyle === 'tone-trang' ||
    queryStyle === '5'
  ) {
    return { style: 'minimal', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 6: Forest Emerald Garden (Khu Vườn Xanh Ngọc)
  if (
    pathname.includes('/garden') ||
    pathname.includes('/khu-vuon') ||
    pathname.includes('/style-6') ||
    queryStyle === 'garden' ||
    queryStyle === 'khu-vuon' ||
    queryStyle === 'style-6' ||
    queryStyle === '6'
  ) {
    return { style: 'garden', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 7: Burgundy Calla Lily (Mẫu Thiệp Calla Đỏ)
  if (
    pathname.includes('/calla') ||
    pathname.includes('/calla-do') ||
    pathname.includes('/style-7') ||
    queryStyle === 'calla' ||
    queryStyle === 'calla-do' ||
    queryStyle === 'style-7' ||
    queryStyle === '7'
  ) {
    return { style: 'calla', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 8: Vietnamese Lotus Poetry (Mẫu thiệp hoa sen Việt Nam)
  if (
    pathname.includes('/lotus') ||
    pathname.includes('/hoa-sen') ||
    pathname.includes('/style-8') ||
    queryStyle === 'lotus' ||
    queryStyle === 'hoa-sen' ||
    queryStyle === 'style-8' ||
    queryStyle === '8'
  ) {
    return { style: 'lotus', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  // Style 9: Porcelain Blue Garden (Mẫu phong bì nơ & hoa xanh sứ trắng)
  if (
    pathname.includes('/porcelain') ||
    pathname.includes('/hoa-xanh') ||
    pathname.includes('/style-9') ||
    queryStyle === 'porcelain' ||
    queryStyle === 'hoa-xanh' ||
    queryStyle === 'style-9' ||
    queryStyle === '9'
  ) {
    return { style: 'porcelain', isLockedSingleStyle: true, isDangDaoProduct: false };
  }

  return { style: 'fairytale', isLockedSingleStyle: false, isDangDaoProduct: false };
}

export function App() {
  const [routeConfig] = useState(detectInitialRouteStyle);
  const [styleId, setStyleId] = useState<StyleId>(routeConfig.style);
  const [isLockedSingleStyle] = useState<boolean>(routeConfig.isLockedSingleStyle);
  const [isDangDaoProduct] = useState<boolean>(routeConfig.isDangDaoProduct);
  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [weddingData, setWeddingData] = useState<WeddingData>(() => {
    if (routeConfig.isDangDaoProduct) {
      return DANG_DAO_WEDDING_DATA;
    }
    if (
      routeConfig.style === 'garden' ||
      routeConfig.style === 'calla' ||
      routeConfig.style === 'lotus' ||
      routeConfig.style === 'porcelain'
    ) {
      return DUC_HAU_WEDDING_DATA;
    }
    return DEFAULT_WEDDING_DATA;
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  const activeWishesStorageKey = isDangDaoProduct ? DANG_DAO_WISHES_STORAGE_KEY : WISHES_STORAGE_KEY;

  // Thanh tiến trình cuộn cập nhật trực tiếp qua GPU transform scaleX (0 React re-render khi cuộn)
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const maxScrollRef = useRef<number>(1);

  // Khởi tạo lời chúc từ localStorage (không tự động sinh dữ liệu mẫu/test)
  const [wishes, setWishes] = useState<WishItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('wedding_wishes_long_huyen_persistent_v1');
        const raw = window.localStorage.getItem(
          routeConfig.isDangDaoProduct ? DANG_DAO_WISHES_STORAGE_KEY : WISHES_STORAGE_KEY
        );
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return mergeUniqueWishes(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [guestName, setGuestName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const guest = params.get('guest');
      if (guest && guest.trim()) return guest.trim();
    }
    return 'Bạn & Người Thương';
  });

  // Cập nhật tiêu đề và bài hát nền theo sản phẩm khách hàng hoặc template gốc
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = isDangDaoProduct
        ? 'THƯ MỜI CƯỚI HẢI ĐĂNG & ANH ĐÀO'
        : styleId === 'garden' || styleId === 'calla' || styleId === 'lotus' || styleId === 'porcelain'
          ? 'THƯ MỜI CƯỚI HUY ĐỨC & PHAN HẬU'
          : 'THƯ MỜI CƯỚI THÀNH LONG & THANH HUYỀN';
    }
    if (styleId === 'lotus') {
      soundEngine.setPreferredTrackId('template-08-video');
    } else if (styleId === 'porcelain') {
      soundEngine.setPreferredTrackId('template-09-video');
    } else if (isDangDaoProduct) {
      soundEngine.setPreferredTrackId('ta-la-cua-nhau');
    } else {
      soundEngine.setPreferredTrackId(null);
    }
  }, [isDangDaoProduct, styleId]);

  const activeCloudNamespace = isDangDaoProduct ? 'dd26' : 'lh26';

  // Tải ngầm các chunk khác khi rảnh nếu đang ở chế độ xem tất cả các style
  useEffect(() => {
    if (isLockedSingleStyle || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      import('./components/WhiteMinimalInvitation');
      import('./components/GardenEmeraldInvitation');
      import('./components/BurgundyCallaInvitation');
      import('./components/LotusVietnamInvitation');
      import('./components/PorcelainBlueInvitation');
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isLockedSingleStyle]);

  // Đồng bộ lời chúc theo namespace từng cặp đôi
  const localWishesEndpoint = isDangDaoProduct ? '/api/wishes?customer=dang-dao' : '/api/wishes';

  useEffect(() => {
    let isMounted = true;

    fetchCloudWishes(activeCloudNamespace)
      .then((cloudList) => {
        if (!isMounted || cloudList.length === 0) return;
        setWishes((prev) => {
          const merged = mergeUniqueWishes(cloudList, prev);
          try {
            window.localStorage.setItem(activeWishesStorageKey, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      })
      .catch(() => {});

    fetch(localWishesEndpoint)
      .then((res) => (res.ok ? res.json() : null))
      .then((serverWishes) => {
        if (!isMounted || !Array.isArray(serverWishes)) return;
        setWishes((prev) => {
          const merged = mergeUniqueWishes(prev, serverWishes);
          try {
            window.localStorage.setItem(activeWishesStorageKey, JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeCloudNamespace, activeWishesStorageKey, localWishesEndpoint]);

  // Tự động kích hoạt nhạc ở cú chạm đầu tiên nếu trình duyệt chặn autoplay khi thiệp tự mở
  useEffect(() => {
    const unlockAudioOnFirstGesture = () => {
      if (!soundEngine.getIsPlaying()) {
        soundEngine.startMusic();
        setIsMusicPlaying(true);
      }
      window.removeEventListener('pointerdown', unlockAudioOnFirstGesture);
      window.removeEventListener('touchstart', unlockAudioOnFirstGesture);
    };

    window.addEventListener('pointerdown', unlockAudioOnFirstGesture, { passive: true });
    window.addEventListener('touchstart', unlockAudioOnFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudioOnFirstGesture);
      window.removeEventListener('touchstart', unlockAudioOnFirstGesture);
    };
  }, []);

  // Theo dõi chiều cao trang bằng ResizeObserver và cập nhật thanh progress bằng GPU scaleX (0 layout thrashing)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMaxScroll = () => {
      maxScrollRef.current = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };

    updateMaxScroll();

    let rafPending = false;
    const updateProgressDom = () => {
      rafPending = false;
      if (!progressBarRef.current) return;
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScrollRef.current));
      progressBarRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };

    const onScroll = () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateProgressDom);
      }
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateMaxScroll);
      ro.observe(document.documentElement);
    }

    window.addEventListener('resize', updateMaxScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgressDom();

    return () => {
      window.removeEventListener('resize', updateMaxScroll);
      window.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, [styleId, isGateOpen]);

  // Chỉ khởi chạy Lenis smoothWheel trên máy tính (pointer: fine) ở các Style 1–4 có ScrollTrigger;
  // Trên điện thoại cảm ứng dùng 100% Native 120Hz Hardware Scroll siêu mượt!
  const isScrollyStyle =
    styleId !== 'minimal' &&
    styleId !== 'garden' &&
    styleId !== 'calla' &&
    styleId !== 'lotus' &&
    styleId !== 'porcelain';

  useEffect(() => {
    if (!isScrollyStyle || typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
    if (!isFinePointer) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, [isScrollyStyle]);

  useEffect(() => {
    if (!isScrollyStyle) return;
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 320);
    return () => clearTimeout(timer);
  }, [isScrollyStyle, styleId, isGateOpen]);

  const handleUnlockGate = useCallback(() => {
    setIsGateOpen((prev) => {
      if (prev) return prev;
      soundEngine.playOpenChime();
      soundEngine.startMusic();
      setIsMusicPlaying(true);
      setTimeout(() => {
        window.triggerWeddingFireworks?.(6);
      }, 300);
      return true;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    const playing = soundEngine.toggleMusic();
    setIsMusicPlaying(playing);
  }, []);

  const handleStartMusicIfNotPlaying = useCallback(() => {
    if (!soundEngine.getIsPlaying()) {
      soundEngine.startMusic();
      setIsMusicPlaying(true);
    }
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setIsAdminModalOpen(true);
  }, []);

  // Lưu lời chúc vĩnh viễn vào Cloud KV + LocalStorage + Backend API
  const handleAddWish = useCallback((newWish: WishItem) => {
    setWishes((prev) => {
      const updated = mergeUniqueWishes([newWish], prev);
      try {
        window.localStorage.setItem(activeWishesStorageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    saveCloudWish(newWish, activeCloudNamespace).catch(() => {});

    fetch(localWishesEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWish),
    }).catch(() => {});
  }, [activeCloudNamespace, activeWishesStorageKey, localWishesEndpoint]);

  // Cập nhật thông tin khách mời từ Admin (sửa tên, RSVP, lời chúc)
  const handleUpdateWish = useCallback((updatedWish: WishItem) => {
    setWishes((prev) => {
      const next = prev.map((w) => (w.id === updatedWish.id ? updatedWish : w));
      try {
        window.localStorage.setItem(activeWishesStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [activeWishesStorageKey]);

  // Xóa khách mời khỏi danh sách từ Admin
  const handleDeleteWish = useCallback((id: string) => {
    setWishes((prev) => {
      const next = prev.filter((w) => w.id !== id);
      try {
        window.localStorage.setItem(activeWishesStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [activeWishesStorageKey]);

  const handleResetDefault = useCallback(() => {
    setWeddingData(
      isDangDaoProduct
        ? DANG_DAO_WEDDING_DATA
        : styleId === 'garden' || styleId === 'calla' || styleId === 'lotus' || styleId === 'porcelain'
        ? DUC_HAU_WEDDING_DATA
        : DEFAULT_WEDDING_DATA
    );
    setGuestName('Bạn & Người Thương');
  }, [isDangDaoProduct, styleId]);

  const handleSelectStyle = useCallback((id: StyleId) => {
    setStyleId(id);
    if (id === 'garden' || id === 'calla' || id === 'lotus' || id === 'porcelain') {
      setWeddingData(DUC_HAU_WEDDING_DATA);
    } else {
      setWeddingData(DEFAULT_WEDDING_DATA);
    }
    if (id === 'minimal' || id === 'garden' || id === 'calla' || id === 'lotus' || id === 'porcelain') {
      setIsGateOpen(true);
    }
  }, []);

  const theme = THEMES[styleId];

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme.bgPrimary} ${theme.textPrimary}`}>
      {/* Thanh tiến trình cuộn trang mảnh ở đỉnh màn hình (GPU scaleX, 0 React re-render) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-black/15 pointer-events-none overflow-hidden">
        <div
          ref={progressBarRef}
          style={{
            transform: 'scaleX(0)',
            backgroundColor: theme.accentHex,
          }}
          className="h-full w-full origin-left will-change-transform shadow-[0_0_10px_rgba(251,191,36,0.85)]"
        />
      </div>

      {/* PHONG CÁCH 05 (TONE TRẮNG MINIMAL) HOẶC SẢN PHẨM NHÂN BẢN ĐOÀN HẢI ĐĂNG & NGUYỄN ANH ĐÀO */}
      {styleId === 'minimal' ? (
        isDangDaoProduct ? (
          <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
            <DangDaoMinimalInvitation
              data={weddingData}
              wishes={wishes}
              onAddWish={handleAddWish}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              guestName={guestName}
              onOpenAdmin={handleOpenAdmin}
              onStartMusic={handleStartMusicIfNotPlaying}
            />
          </Suspense>
        ) : (
          <>
            <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
              <WhiteMinimalInvitation
                data={weddingData}
                wishes={wishes}
                onAddWish={handleAddWish}
                isMusicPlaying={isMusicPlaying}
                onToggleMusic={handleToggleMusic}
                guestName={guestName}
                onOpenAdmin={handleOpenAdmin}
                onStartMusic={handleStartMusicIfNotPlaying}
              />
            </Suspense>
            {!isLockedSingleStyle && (
              <ConceptSwitcherDock
                styleId={styleId}
                onSelectStyle={handleSelectStyle}
                isMusicPlaying={isMusicPlaying}
                onToggleMusic={handleToggleMusic}
                onReplayGate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                data={weddingData}
                onUpdateData={setWeddingData}
                guestName={guestName}
                onUpdateGuestName={setGuestName}
                onResetDefault={handleResetDefault}
                hideStyleSwitcher={isLockedSingleStyle}
              />
            )}
          </>
        )
      ) : styleId === 'garden' ? (
        /* PHONG CÁCH 06: FOREST EMERALD GARDEN (VIDEO 1 - ĐỨC & HẬU) */
        <>
          <Suspense fallback={<div className="min-h-screen bg-[#152418]" />}>
            <GardenEmeraldInvitation
              data={weddingData}
              wishes={wishes}
              onAddWish={handleAddWish}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              guestName={guestName}
              onOpenAdmin={handleOpenAdmin}
              onStartMusic={handleStartMusicIfNotPlaying}
            />
          </Suspense>
          {!isLockedSingleStyle && (
            <ConceptSwitcherDock
              styleId={styleId}
              onSelectStyle={handleSelectStyle}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              onReplayGate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data={weddingData}
              onUpdateData={setWeddingData}
              guestName={guestName}
              onUpdateGuestName={setGuestName}
              onResetDefault={handleResetDefault}
              hideStyleSwitcher={isLockedSingleStyle}
            />
          )}
        </>
      ) : styleId === 'calla' ? (
        /* PHONG CÁCH 07: BURGUNDY CALLA LILY (VIDEO 2 - ĐỨC & HẬU) */
        <>
          <Suspense fallback={<div className="min-h-screen bg-[#240811]" />}>
            <BurgundyCallaInvitation
              data={weddingData}
              wishes={wishes}
              onAddWish={handleAddWish}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              guestName={guestName}
              onOpenAdmin={handleOpenAdmin}
              onStartMusic={handleStartMusicIfNotPlaying}
            />
          </Suspense>
          {!isLockedSingleStyle && (
            <ConceptSwitcherDock
              styleId={styleId}
              onSelectStyle={handleSelectStyle}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              onReplayGate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data={weddingData}
              onUpdateData={setWeddingData}
              guestName={guestName}
              onUpdateGuestName={setGuestName}
              onResetDefault={handleResetDefault}
              hideStyleSwitcher={isLockedSingleStyle}
            />
          )}
        </>
      ) : styleId === 'lotus' ? (
        /* PHONG CÁCH 08: THIỆP HOA SEN VIỆT NAM (VIDEO MẪU 1 - DỮ LIỆU STYLE 7) */
        <>
          <Suspense fallback={<div className="min-h-screen bg-[#FBFAF5]" />}>
            <LotusVietnamInvitation
              data={weddingData}
              wishes={wishes}
              onAddWish={handleAddWish}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              guestName={guestName}
              onOpenAdmin={handleOpenAdmin}
              onStartMusic={handleStartMusicIfNotPlaying}
            />
          </Suspense>
          {!isLockedSingleStyle && (
            <ConceptSwitcherDock
              styleId={styleId}
              onSelectStyle={handleSelectStyle}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              onReplayGate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data={weddingData}
              onUpdateData={setWeddingData}
              guestName={guestName}
              onUpdateGuestName={setGuestName}
              onResetDefault={handleResetDefault}
              hideStyleSwitcher={isLockedSingleStyle}
            />
          )}
        </>
      ) : styleId === 'porcelain' ? (
        /* PHONG CÁCH 09: PHONG BÌ NƠ & HOA XANH SỨ TRẮNG (VIDEO MẪU 2 - DỮ LIỆU STYLE 7) */
        <>
          <Suspense fallback={<div className="min-h-screen bg-[#F7F7F4]" />}>
            <PorcelainBlueInvitation
              data={weddingData}
              wishes={wishes}
              onAddWish={handleAddWish}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              guestName={guestName}
              onOpenAdmin={handleOpenAdmin}
              onStartMusic={handleStartMusicIfNotPlaying}
            />
          </Suspense>
          {!isLockedSingleStyle && (
            <ConceptSwitcherDock
              styleId={styleId}
              onSelectStyle={handleSelectStyle}
              isMusicPlaying={isMusicPlaying}
              onToggleMusic={handleToggleMusic}
              onReplayGate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data={weddingData}
              onUpdateData={setWeddingData}
              guestName={guestName}
              onUpdateGuestName={setGuestName}
              onResetDefault={handleResetDefault}
              hideStyleSwitcher={isLockedSingleStyle}
            />
          )}
        </>
      ) : (
        <>
          {/* LỚP 1: CẢNH 3D WEBGL THỜI GIAN THỰC (CẶP NHẪN CƯỚI VÀNG KIM 3D & THIÊN HÀ SAO 3D) */}
          <Suspense fallback={null}>
            <ThreeWeddingScene styleId={styleId} paused={!isGateOpen} />
          </Suspense>

          {/* LỚP 2: ĐỘNG CƠ PHÁO HOA & HẠT BAY ĐẶC TRƯNG CHO TỪNG PHONG CÁCH */}
          <AmbientCanvas styleId={styleId} />

          {/* Màn hình Mở Thiệp Tự Động */}
          <OpeningGate
            isOpen={isGateOpen}
            onUnlock={handleUnlockGate}
            styleId={styleId}
            onSelectStyle={handleSelectStyle}
            data={weddingData}
            guestName={guestName}
            hideStyleSwitcher={isLockedSingleStyle}
            onOpenAdmin={handleOpenAdmin}
          />

          {/* Nội dung chính với hiệu ứng 3D Scrollytelling tối ưu Mobile-First */}
          <main className="relative z-20">
            <HeroSection styleId={styleId} data={weddingData} guestName={guestName} />
            <CoupleSection styleId={styleId} data={weddingData} />
            <CountdownSection styleId={styleId} data={weddingData} />
            <EventsSection styleId={styleId} data={weddingData} />
            <LoveStorySection styleId={styleId} data={weddingData} />
            <GallerySection styleId={styleId} data={weddingData} />
            <RsvpWishesSection
              styleId={styleId}
              data={weddingData}
              wishes={wishes}
              onAddWish={handleAddWish}
              guestName={guestName}
            />
          </main>

          {/* Dynamic Island Music Player & Thanh Điều Khiển */}
          <ConceptSwitcherDock
            styleId={styleId}
            onSelectStyle={handleSelectStyle}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            onReplayGate={() => setIsGateOpen(false)}
            data={weddingData}
            onUpdateData={setWeddingData}
            guestName={guestName}
            onUpdateGuestName={setGuestName}
            onResetDefault={handleResetDefault}
            hideStyleSwitcher={isLockedSingleStyle}
          />
        </>
      )}

      {/* Modal Quản Trị Khách Mời & RSVP (Chỉ tải khi mở) */}
      {isAdminModalOpen && (
        <Suspense fallback={null}>
          <AdminGuestModal
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
            wishes={wishes}
            onAddWish={handleAddWish}
            onUpdateWish={handleUpdateWish}
            onDeleteWish={handleDeleteWish}
            adminPassword={isDangDaoProduct ? 'chucmunghanhphuc' : undefined}
            authStorageKey={isDangDaoProduct ? 'wedding_admin_auth_dang_dao_v1' : undefined}
            coupleLabel={isDangDaoProduct ? 'Đoàn Hải Đăng & Nguyễn Anh Đào' : undefined}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
