import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Compression from 'vite-plugin-compression'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Compression(),
    AutoImport({
      resolvers: [
        ElementPlusResolver()
      ]
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver()
      ]
    }),
    Icons({
      autoInstall: true,
      compiler: 'vue3'
    })
  ]
})
