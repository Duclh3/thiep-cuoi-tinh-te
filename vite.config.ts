import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const wishesFilePath = path.resolve(__dirname, 'data/wishes.json')
const wishesDirPath = path.resolve(__dirname, 'data')

export default defineConfig(({ command }) => ({
  base: process.env.VERCEL ? '/' : command === 'build' ? '/thiep-cuoi-tinh-te/' : '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'vendor-three'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'vendor-scroll'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
        },
      },
    },
  },
  server: {
    watch: {
      // Chỉ bỏ qua file JSON lưu lời chúc trong thư mục gốc data/, KHÔNG bỏ qua src/data/
      ignored: [
        `${wishesDirPath}/**`,
        path.resolve(__dirname, 'promo-videos') + '/**',
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'wedding-wishes-persistence-api',
      configureServer(server) {
        // Bỏ theo dõi file wishes.json khỏi Chokidar watcher của Vite
        server.watcher.unwatch(wishesFilePath)
        server.watcher.unwatch(path.dirname(wishesFilePath))

        server.middlewares.use('/api/wishes', (req, res) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          const urlObj = new URL(req.url || '/', 'http://localhost')
          const customer = urlObj.searchParams.get('customer')
          const safeCustomer = customer ? customer.replace(/[^a-z0-9-]/gi, '') : ''
          const targetFile = safeCustomer
            ? path.resolve(__dirname, `data/wishes-${safeCustomer}.json`)
            : wishesFilePath

          if (req.method === 'GET') {
            try {
              const raw = fs.existsSync(targetFile)
                ? fs.readFileSync(targetFile, 'utf-8')
                : '[]'
              res.statusCode = 200
              res.end(raw)
            } catch {
              res.statusCode = 200
              res.end('[]')
            }
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const newWish = JSON.parse(body)
                const current = fs.existsSync(targetFile)
                  ? JSON.parse(fs.readFileSync(targetFile, 'utf-8'))
                  : []
                const updated = [newWish, ...current]
                fs.mkdirSync(path.dirname(targetFile), { recursive: true })
                fs.writeFileSync(targetFile, JSON.stringify(updated, null, 2), 'utf-8')
                res.statusCode = 200
                res.end(JSON.stringify(updated))
              } catch {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Invalid wish payload' }))
              }
            })
            return
          }

          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
        })
      },
    },
    {
      name: 'wedding-customer-routes-html',
      closeBundle() {
        const distDir = path.resolve(__dirname, 'dist')
        const indexHtmlPath = path.join(distDir, 'index.html')
        if (!fs.existsSync(indexHtmlPath)) return

        const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8')
        const ogImageUrl = process.env.VERCEL
          ? 'https://thiep-cuoi-tinh-te.vercel.app/images/dang-dao/og-thumbnail.jpg'
          : 'https://duclh3.github.io/thiep-cuoi-tinh-te/images/dang-dao/og-thumbnail.jpg'

        const dangDaoHtml = baseHtml
          .replaceAll(
            'THƯ MỜI CƯỚI THÀNH LONG &amp; THANH HUYỀN',
            'THƯ MỜI CƯỚI ĐOÀN HẢI ĐĂNG &amp; NGUYỄN ANH ĐÀO'
          )
          .replaceAll(
            'Thiệp Mời Cưới Thành Long &amp; Thanh Huyền',
            'Thiệp Mời Cưới Đoàn Hải Đăng &amp; Nguyễn Anh Đào'
          )
          .replaceAll(
            'Thư mời cưới Thành Long &amp; Thanh Huyền — 28.11.2026',
            'Thư mời cưới Đoàn Hải Đăng &amp; Nguyễn Anh Đào — 29.11.2026'
          )
          .replaceAll(
            'Chúng mình sắp về chung một nhà! Sự hiện diện của bạn là niềm vinh dự lớn đối với gia đình và tụi mình...',
            'Trân trọng kính mời bạn đến dự lễ thành hôn của Đoàn Hải Đăng &amp; Nguyễn Anh Đào — 29.11.2026.'
          )
          .replaceAll(
            'https://duclh3.github.io/thiep-cuoi-tinh-te/images/og-thumbnail.jpg',
            ogImageUrl
          )

        const ducHauHtml = baseHtml
          .replaceAll(
            'THƯ MỜI CƯỚI THÀNH LONG &amp; THANH HUYỀN',
            'THƯ MỜI CƯỚI HUY ĐỨC &amp; PHAN HẬU'
          )
          .replaceAll(
            'Thiệp Mời Cưới Thành Long &amp; Thanh Huyền',
            'Thiệp Mời Cưới Huy Đức &amp; Phan Hậu'
          )
          .replaceAll(
            'Thư mời cưới Thành Long &amp; Thanh Huyền — 28.11.2026',
            'Thư mời cưới Huy Đức &amp; Phan Hậu — 03.03.2027'
          )
          .replaceAll(
            'Chúng mình sắp về chung một nhà! Sự hiện diện của bạn là niềm vinh dự lớn đối với gia đình và tụi mình...',
            'Trân trọng kính mời bạn đến dự lễ thành hôn của Huy Đức &amp; Phan Hậu — 03.03.2027.'
          )
          .replaceAll(
            'https://duclh3.github.io/thiep-cuoi-tinh-te/images/og-thumbnail.jpg',
            'https://duclh3.github.io/thiep-cuoi-tinh-te/images/duc-hau/DSC_7927.jpg?og=20261119-2'
          )
          .replace(
            'property="og:image:width" content="1200"',
            'property="og:image:width" content="1440"'
          )
          .replace(
            'property="og:image:height" content="630"',
            'property="og:image:height" content="957"'
          )

        for (const routeDir of ['hai-dang-anh-dao', 'dang-dao']) {
          const targetDir = path.join(distDir, routeDir)
          fs.mkdirSync(targetDir, { recursive: true })
          fs.writeFileSync(path.join(targetDir, 'index.html'), dangDaoHtml, 'utf-8')
        }

        // GitHub Pages không có SPA fallback. Xuất index.html cho mọi đường dẫn
        // đã được App nhận diện để link trực tiếp /hoa-sen, /hoa-xanh... không 404.
        const defaultStyleRoutes = [
          'fine-art',
          'vogue',
          'editorial',
          'starlight',
          'cinematic',
          'indochine',
          'minimal',
          'tone-trang',
          'style-1',
          'style-2',
          'style-3',
          'style-4',
          'style-5',
        ]
        const ducHauStyleRoutes = [
          'garden',
          'khu-vuon',
          'calla',
          'calla-do',
          'lotus',
          'hoa-sen',
          'porcelain',
          'hoa-xanh',
          'style-6',
          'style-7',
          'style-8',
          'style-9',
        ]

        for (const routeDir of defaultStyleRoutes) {
          const targetDir = path.join(distDir, routeDir)
          fs.mkdirSync(targetDir, { recursive: true })
          fs.writeFileSync(path.join(targetDir, 'index.html'), baseHtml, 'utf-8')
        }

        for (const routeDir of ducHauStyleRoutes) {
          const targetDir = path.join(distDir, routeDir)
          fs.mkdirSync(targetDir, { recursive: true })
          fs.writeFileSync(path.join(targetDir, 'index.html'), ducHauHtml, 'utf-8')
        }
      },
    },
  ],
}))
