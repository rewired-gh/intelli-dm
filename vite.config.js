import { defineConfig, } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver, } from 'unplugin-vue-components/resolvers';
import { VitePWA, } from 'vite-plugin-pwa';
import Compression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePWA(),
    vue(),
    Compression(),
    AutoImport({
      resolvers: [ElementPlusResolver(),],
    },),
    Components({
      resolvers: [ElementPlusResolver(),],
    },),
  ],
},);
