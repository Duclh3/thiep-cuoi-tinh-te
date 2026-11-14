import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { StyleId, THEMES } from '../data/weddingData';

interface ThreeWeddingSceneProps {
  styleId: StyleId;
  paused?: boolean;
}

export const ThreeWeddingScene: React.FC<ThreeWeddingSceneProps> = ({
  styleId,
  paused = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef<boolean>(paused);
  const resumeLoopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) {
      resumeLoopRef.current?.();
    }
  }, [paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const theme = THEMES[styleId];
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 9.5;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: dpr < 1.5,
        powerPreference: 'high-performance',
        stencil: false,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(dpr);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Nhóm 3D trung tâm: Cặp Nhẫn Cưới Vàng Kim Lồng Nhau + Viên Kim Cương
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const ringColor = new THREE.Color(theme.accentHex);
    const secondaryColor = new THREE.Color(theme.secondaryHex);

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: ringColor,
      metalness: 0.88,
      roughness: 0.18,
      emissive: ringColor,
      emissiveIntensity: 0.14,
    });
    materials.push(goldMaterial);

    const roseGoldMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.82,
      roughness: 0.22,
      emissive: ringColor,
      emissiveIntensity: 0.1,
    });
    materials.push(roseGoldMaterial);

    // Kim cương bắt sáng đơn luồng (Single-pass PBR) — loại bỏ multi-pass transmission buffer nặng gấp đôi
    const diamondMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.24,
      roughness: 0.04,
      transparent: true,
      opacity: 0.92,
      emissive: 0xfff3d1,
      emissiveIntensity: 0.42,
    });
    materials.push(diamondMaterial);

    const diamondCoreMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.85,
    });
    materials.push(diamondCoreMat);

    // Nhẫn Chú Rể
    const groomRingGeo = new THREE.TorusGeometry(1.35, 0.085, 24, 72);
    geometries.push(groomRingGeo);
    const groomRing = new THREE.Mesh(groomRingGeo, goldMaterial);
    groomRing.position.set(-0.55, 0.15, 0);
    groomRing.rotation.set(0.65, 0.4, 0.2);
    mainGroup.add(groomRing);

    // Nhẫn Cô Dâu (Lồng vào nhẫn Chú Rể + Đính Kim Cương)
    const brideRingGroup = new THREE.Group();
    const brideRingGeo = new THREE.TorusGeometry(1.18, 0.072, 24, 72);
    geometries.push(brideRingGeo);
    const brideRing = new THREE.Mesh(brideRingGeo, roseGoldMaterial);
    brideRingGroup.add(brideRing);

    // Viên Kim Cương đa giác trên đỉnh nhẫn Cô Dâu
    const diamondGeo = new THREE.OctahedronGeometry(0.24, 1);
    const diamondCoreGeo = new THREE.OctahedronGeometry(0.13, 0);
    geometries.push(diamondGeo, diamondCoreGeo);

    const diamond = new THREE.Mesh(diamondGeo, diamondMaterial);
    diamond.position.set(0, 1.32, 0);
    diamond.scale.set(1, 1.25, 1);
    const diamondCore = new THREE.Mesh(diamondCoreGeo, diamondCoreMat);
    diamond.add(diamondCore);
    brideRingGroup.add(diamond);

    brideRingGroup.position.set(0.55, -0.15, 0.25);
    brideRingGroup.rotation.set(-0.55, -0.35, -0.2);
    mainGroup.add(brideRingGroup);

    // Vòng Hào Quang Thiên Hà Mảnh Xung Quanh
    const haloGeo = new THREE.TorusGeometry(3.2, 0.012, 12, 96);
    geometries.push(haloGeo);
    const haloMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.28,
    });
    materials.push(haloMat);
    const haloRing = new THREE.Mesh(haloGeo, haloMat);
    haloRing.rotation.x = Math.PI / 2.6;
    mainGroup.add(haloRing);

    // Hệ thống Hạt Sáng 3D (3D Starfield & Floating Dust)
    const particleCount = width < 768 ? 220 : 300;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometries.push(starsGeo);
    const starsMat = new THREE.PointsMaterial({
      color: ringColor,
      size: 0.075,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    materials.push(starsMat);
    const starSystem = new THREE.Points(starsGeo, starsMat);
    scene.add(starSystem);

    // Hệ thống Ánh Sáng 3D
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xfff0c2, 4.5, 25);
    pointLight1.position.set(4, 5, 6);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffb6c1, 3.2, 25);
    pointLight2.position.set(-5, -4, 5);
    scene.add(pointLight2);

    // Tương tác Cuộn Trang & Chạm Tay (Touch / Mouse)
    let targetRotX = 0;
    let targetRotY = 0;
    let scrollY = window.scrollY;

    const handlePointerMove = (clientX: number, clientY: number) => {
      targetRotY = (clientX / width - 0.5) * 0.9;
      targetRotX = (clientY / height - 0.5) * 0.6;
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    let frameId = 0;
    const clock = new THREE.Clock();

    // Render sẵn 1 frame đầu tiên để buffer không trống khi vừa mở cổng
    renderer.render(scene, camera);

    const animate = () => {
      if (pausedRef.current || document.hidden) {
        frameId = 0;
        clock.stop();
        return;
      }

      if (!clock.running) {
        clock.start();
      }

      const elapsed = clock.getElapsedTime();
      const scrollFactor = scrollY * 0.0022;

      mainGroup.rotation.y +=
        (targetRotY + scrollFactor + elapsed * 0.32 - mainGroup.rotation.y) * 0.06;
      mainGroup.rotation.x +=
        (targetRotX + Math.sin(elapsed * 0.5) * 0.18 - mainGroup.rotation.x) * 0.06;

      mainGroup.position.y = Math.sin(elapsed * 1.1) * 0.25;
      diamond.rotation.y = elapsed * 1.8;
      haloRing.rotation.z = elapsed * 0.4;

      starSystem.rotation.y = elapsed * 0.05 + scrollFactor * 0.25;
      starSystem.position.y = (scrollY * 0.004) % 4;

      pointLight1.position.x = Math.cos(elapsed * 0.9) * 5;
      pointLight1.position.y = Math.sin(elapsed * 0.9) * 5;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const resumeIfActive = () => {
      if (!pausedRef.current && !document.hidden && frameId === 0) {
        frameId = requestAnimationFrame(animate);
      }
    };

    resumeLoopRef.current = resumeIfActive;
    document.addEventListener('visibilitychange', resumeIfActive);
    resumeIfActive();

    return () => {
      resumeLoopRef.current = null;
      if (frameId) cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', resumeIfActive);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, [styleId]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-15 opacity-65 transform-gpu"
      aria-hidden="true"
    />
  );
};
export default ThreeWeddingScene;
