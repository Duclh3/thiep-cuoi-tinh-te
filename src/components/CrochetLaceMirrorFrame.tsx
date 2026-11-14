import React, { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { decorAsset } from './VintageFloralArtwork';

interface CrochetLaceMirrorFrameProps {
  theme?: 'emerald' | 'burgundy';
  children: React.ReactNode;
}

const circleArc = (cx: number, cy: number, r: number) =>
  `M ${(cx - r).toFixed(1)} ${cy.toFixed(1)} a ${r} ${r} 0 1 0 ${(r * 2).toFixed(1)} 0 a ${r} ${r} 0 1 0 ${(-r * 2).toFixed(1)} 0 `;

export const CrochetLaceMirrorFrame: React.FC<CrochetLaceMirrorFrameProps> = React.memo(
  ({ theme = 'emerald', children }) => {
    const isEmerald = theme === 'emerald';
    const frameRef = useRef<HTMLDivElement | null>(null);
    const isNearViewport = useInView(frameRef, { margin: '140px 0px' });

    // Tính toán 1 lần duy nhất và gộp toàn bộ 290 lỗ thêu ren thành 1 SVG <path> duy nhất (giảm 97% DOM nodes)
    const { outerLacePath, midLacePath, eyeletFlowersPath, pearlDrapesRight, pearlDrapesLeft } =
      useMemo(() => {
        const cx = 220;
        const cy = 345;
        const rxOuter = 202;
        const ryOuter = 320;
        const rxMid = 190;
        const ryMid = 307;
        const n = 58;

        let dOuter = '';
        let dMid = '';
        let dEyelets = '';

        for (let i = 0; i < n; i++) {
          const t1 = (i / n) * 2 * Math.PI;
          const t2 = ((i + 1) / n) * 2 * Math.PI;
          const tm = (t1 + t2) / 2;

          // Cánh sò ren lớp ngoài cùng
          const ox1 = cx + rxOuter * Math.cos(t1);
          const oy1 = cy + ryOuter * Math.sin(t1);
          const ox2 = cx + rxOuter * Math.cos(t2);
          const oy2 = cy + ryOuter * Math.sin(t2);
          const oxm = cx + (rxOuter + 13) * Math.cos(tm);
          const oym = cy + (ryOuter + 13) * Math.sin(tm);

          if (i === 0) dOuter += `M ${ox1.toFixed(1)} ${oy1.toFixed(1)} `;
          dOuter += `Q ${oxm.toFixed(1)} ${oym.toFixed(1)} ${ox2.toFixed(1)} ${oy2.toFixed(1)} `;

          // Cánh sò ren lớp thứ hai bên trong
          const mx1 = cx + rxMid * Math.cos(t1);
          const my1 = cy + ryMid * Math.sin(t1);
          const mx2 = cx + rxMid * Math.cos(t2);
          const my2 = cy + ryMid * Math.sin(t2);
          const mxm = cx + (rxMid + 7.5) * Math.cos(tm);
          const mym = cy + (ryMid + 7.5) * Math.sin(tm);

          if (i === 0) dMid += `M ${mx1.toFixed(1)} ${my1.toFixed(1)} `;
          dMid += `Q ${mxm.toFixed(1)} ${mym.toFixed(1)} ${mx2.toFixed(1)} ${my2.toFixed(1)} `;

          // Cụm lỗ thêu hoa 4 cánh trên từng múi ren (gộp vào 1 compound path siêu nhẹ)
          const fx = cx + (rxOuter + 2.8) * Math.cos(tm);
          const fy = cy + (ryOuter + 2.8) * Math.sin(tm);
          dEyelets += circleArc(fx, fy, 1.2);
          for (let k = 0; k < 4; k++) {
            const pa = tm + (k * Math.PI) / 2;
            dEyelets += circleArc(fx + 2.7 * Math.cos(pa), fy + 2.7 * Math.sin(pa), 1.05);
          }
        }
        dOuter += 'Z';
        dMid += 'Z';

        const rightStrand = [
          { x: 374, y: 66, r: 5.4 },
          { x: 391, y: 62, r: 5.4 },
          { x: 407, y: 70, r: 5.4 },
          { x: 416, y: 86, r: 5.2 },
          { x: 414, y: 104, r: 5.0 },
          { x: 405, y: 121, r: 4.8 },
          { x: 399, y: 138, r: 4.6 },
          { x: 401, y: 155, r: 4.4 },
          { x: 407, y: 172, r: 4.2 },
        ];

        const leftStrand = [
          { x: 40, y: 505, r: 4.6 },
          { x: 28, y: 520, r: 4.8 },
          { x: 24, y: 538, r: 5.0 },
          { x: 30, y: 556, r: 5.2 },
          { x: 42, y: 572, r: 5.2 },
          { x: 56, y: 587, r: 5.0 },
          { x: 64, y: 605, r: 4.8 },
          { x: 60, y: 623, r: 4.6 },
          { x: 48, y: 638, r: 4.4 },
        ];

        return {
          outerLacePath: dOuter,
          midLacePath: dMid,
          eyeletFlowersPath: dEyelets,
          pearlDrapesRight: rightStrand,
          pearlDrapesLeft: leftStrand,
        };
      }, []);

    return (
      <motion.div
        ref={frameRef}
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full max-w-[442px] sm:max-w-[468px] select-none transform-gpu"
      >
        <motion.div
          animate={isNearViewport ? { y: [0, -4, 0] } : { y: 0 }}
          transition={
            isNearViewport
              ? { duration: 5.8, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          className="relative w-full will-change-transform"
        >
          {/* LỚP NỀN SVG KHUNG GƯƠNG VẢI REN THÊU LỖ & NGỌC TRAI (Dùng gradient shadow nội tại thay vì CSS filter drop-shadow) */}
          <svg
            viewBox="0 0 440 690"
            className="w-full h-auto"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <radialGradient id={`mirrorAmbientShadow-${theme}`} cx="50%" cy="50%" r="50%">
                <stop offset="62%" stopColor="rgba(0,0,0,0.095)" />
                <stop offset="86%" stopColor="rgba(0,0,0,0.035)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>

              <radialGradient id={`mirrorCenterPaper-${theme}`} cx="45%" cy="35%" r="72%">
                <stop offset="0%" stopColor={isEmerald ? '#FDFDFB' : '#FFFDFD'} />
                <stop offset="70%" stopColor={isEmerald ? '#F9F8F3' : '#FCF5F7'} />
                <stop offset="100%" stopColor={isEmerald ? '#F2EFE8' : '#F6EAEF'} />
              </radialGradient>

              <radialGradient id={`pearlBead-${theme}`} cx="32%" cy="28%" r="68%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="30%" stopColor="#FFFFFF" />
                <stop offset="68%" stopColor={isEmerald ? '#F4F6F2' : '#FAF0F4'} />
                <stop offset="100%" stopColor={isEmerald ? '#BCC5B8' : '#C9AAB7'} />
              </radialGradient>
            </defs>

            {/* Bóng đổ mềm chuẩn Oval không dùng CSS filter */}
            <ellipse
              cx="220"
              cy="360"
              rx="224"
              ry="346"
              fill={`url(#mirrorAmbientShadow-${theme})`}
            />

            {/* TRANG TRÍ GÓC NGOÀI: Dải ruy-băng ren mềm (Style 6) hoặc Chuỗi ngọc trai 3D (Style 7) */}
            {isEmerald ? (
              <g opacity="0.88">
                <path
                  d="M 380 175 C 398 140 386 88 424 62"
                  fill="none"
                  stroke="#EAE8E1"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  d="M 380 175 C 398 140 386 88 424 62"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="10"
                  strokeDasharray="2,4"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 515 C 40 555 48 606 14 626"
                  fill="none"
                  stroke="#EAE8E1"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 515 C 40 555 48 606 14 626"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="10"
                  strokeDasharray="2,4"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              <g>
                {pearlDrapesRight.map((p, idx) => (
                  <g key={`pr-${idx}`}>
                    <circle cx={p.x + 1} cy={p.y + 2.2} r={p.r} fill="rgba(80,20,35,0.14)" />
                    <circle cx={p.x} cy={p.y} r={p.r} fill={`url(#pearlBead-${theme})`} />
                  </g>
                ))}
                {pearlDrapesLeft.map((p, idx) => (
                  <g key={`pl-${idx}`}>
                    <circle cx={p.x + 1} cy={p.y + 2.2} r={p.r} fill="rgba(80,20,35,0.14)" />
                    <circle cx={p.x} cy={p.y} r={p.r} fill={`url(#pearlBead-${theme})`} />
                  </g>
                ))}
              </g>
            )}

            {/* 1. LỚP BÈO VẢI REN LỚN NGOÀI CÙNG */}
            <path
              d={outerLacePath}
              fill={isEmerald ? '#FDFCF9' : '#FFFDFE'}
              stroke={isEmerald ? '#E2DFD7' : '#ECDCE2'}
              strokeWidth="1.1"
            />

            {/* 2. CÁC BÔNG HOA LỖ THÊU KIM TRÊN BÈO REN (1 compound path duy nhất) */}
            <path
              d={eyeletFlowersPath}
              fill={isEmerald ? '#DCD8CE' : '#E5CFD7'}
              opacity="0.82"
            />

            {/* 3. LỚP BÈO REN THỨ HAI XẾP TẦNG MỀM MẠI */}
            <path
              d={midLacePath}
              fill="#FFFFFF"
              stroke={isEmerald ? '#E7E4DC' : '#EFE0E6'}
              strokeWidth="1"
            />

            {/* 4. LÒNG KHUNG OVAL GIẤY MỸ THUẬT RỘNG RÃI Ở TÂM */}
            <ellipse
              cx="220"
              cy="345"
              rx="181"
              ry="297"
              fill={`url(#mirrorCenterPaper-${theme})`}
              stroke={isEmerald ? '#DDD9CE' : '#E8D5DC'}
              strokeWidth="1.2"
            />

            {/* Đường chỉ chần tinh tế sát mép trong ren */}
            <ellipse
              cx="220"
              cy="345"
              rx="175"
              ry="291"
              fill="none"
              stroke={isEmerald ? 'rgba(92,122,82,0.22)' : 'rgba(138,40,65,0.2)'}
              strokeWidth="0.85"
            />
          </svg>

          {/* CÀNH HOA CALLA THẬT ĐẶT NGHIÊNG ÔM VIỀN DƯỚI BÊN PHẢI GƯƠNG */}
          <img
            src={
              isEmerald
                ? decorAsset('white-calla-single.png')
                : decorAsset('burgundy-calla-single.png')
            }
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            className="pointer-events-none select-none absolute -bottom-3 right-2.5 sm:right-3.5 w-28 sm:w-34 z-20 object-contain rotate-[12deg] drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)] transform-gpu"
          />

          {/* LỚP ÁNH SÁNG LƯỚT QUA MẶT GƯƠNG MƯỢT MÀ (Chỉ chạy khi trong vùng nhìn thấy) */}
          <div className="pointer-events-none absolute inset-x-10 inset-y-12 rounded-[50%/46%] overflow-hidden">
            {isNearViewport && (
              <motion.div
                animate={{ x: ['-130%', '230%'] }}
                transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/45 to-transparent -skew-x-12 will-change-transform"
              />
            )}
          </div>

          {/* NỘI DUNG CHÍNH NẰM TRỌN BÊN TRONG KHUNG GƯƠNG RỘNG RÃI */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-11 sm:px-14 py-12 sm:py-14 text-center z-10">
            {children}
          </div>
        </motion.div>
      </motion.div>
    );
  }
);
