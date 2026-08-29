import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
/* Serve public/<app>/index.html for "/<app>/" in dev.
 *
 * Netlify serves a directory's index.html automatically, so /watts/ works in
 * production. Vite's dev server does not — it falls through to the SPA
 * fallback and hands back the portfolio's own index.html, which makes every
 * project link look like it "restarts" the portfolio when you click it.
 * This only affects local testing, but a dev server that lies about routing
 * is worse than no dev server. */
function serveStaticApps() {
  return {
    name: 'serve-public-app-indexes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (url.endsWith('/') && url !== '/') {
          const candidate = path.join(process.cwd(), 'public', url, 'index.html');
          if (fs.existsSync(candidate)) {
            req.url = `${url}index.html`;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveStaticApps()],
  // PUDDL3 P4RTS components import each other as "@/components/puddl3/<slug>".
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Some vault components ship binary assets (3D models, fonts, textures) and
  // import them directly. Without this Rollup tries to parse them as JS and the
  // production build dies — dev never notices, because it lazy-loads.
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr', '**/*.exr', '**/*.fbx', '**/*.obj', '**/*.bin'],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't delete existing files
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})
