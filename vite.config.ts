import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from "rollup-plugin-visualizer";
import svgLoader from "vite-svg-loader";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: "test.html", //分析图生成的文件名
      open:true //如果存在本地服务端口，将在打包后自动展示
    }),
    svgLoader(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      "/minio-img/test": {
        target: "https://pic-1323823245.cos.ap-shanghai.myqcloud.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minio-img\/test/, ""),
      },
    },
  },
})
