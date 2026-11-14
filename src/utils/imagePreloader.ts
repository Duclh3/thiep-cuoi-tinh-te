const decodedImageCache = new Set<string>();

interface PreloadOptions {
  delayMs?: number;
  concurrency?: number;
}

/**
 * Tải ngầm theo hàng đợi ưu tiên thấp và giải mã trước (async GPU/background decode)
 * để khi người dùng mở thiệp và vuốt xuống không bị khựng khung hình do giải mã JPEG lớn.
 */
export function preloadAndDecodeImages(
  urls: Array<string | undefined | null>,
  options: PreloadOptions = {}
): () => void {
  if (typeof window === 'undefined') return () => {};

  const { delayMs = 450, concurrency = 2 } = options;
  const queue = Array.from(
    new Set(urls.filter((u): u is string => Boolean(u && !decodedImageCache.has(u))))
  );

  if (queue.length === 0) return () => {};

  let cancelled = false;
  let cursor = 0;

  const loadSingle = (src: string): Promise<void> =>
    new Promise((resolve) => {
      if (cancelled || decodedImageCache.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.decoding = 'async';

      const finish = () => {
        decodedImageCache.add(src);
        resolve();
      };

      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(finish).catch(finish);
        } else {
          finish();
        }
      };
      img.onerror = () => resolve();
      img.src = src;
    });

  const startWorkers = () => {
    if (cancelled) return;
    const workerCount = Math.min(concurrency, queue.length);
    for (let w = 0; w < workerCount; w++) {
      const runNext = (): void => {
        if (cancelled || cursor >= queue.length) return;
        const nextUrl = queue[cursor++];
        loadSingle(nextUrl).then(() => {
          if (!cancelled) {
            // Nhường 1 nhịp khung hình giữa các lần decode để giữ 60fps tuyệt đối
            window.setTimeout(runNext, 24);
          }
        });
      };
      runNext();
    }
  };

  const timerId = window.setTimeout(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    if (typeof ric === 'function') {
      ric(startWorkers, { timeout: 800 });
    } else {
      startWorkers();
    }
  }, delayMs);

  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
  };
}
