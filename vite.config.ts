import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.app.json',
    }) 
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      // Múltiplos pontos de entrada
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        core: path.resolve(__dirname, 'src/core/index.ts'),
        vDataTable: path.resolve(__dirname, 'src/DatatableVue/index.ts'),
        vDataPage: path.resolve(__dirname, 'src/DataPageVue/index.ts'),
        iframeCommunicator: path.resolve(__dirname, 'src/iframeCommunicator/index.ts'),
        Pagination: path.resolve(__dirname, 'src/Pagination/index.ts'),
        toast: path.resolve(__dirname, 'src/toast/index.ts'),
      },
      // O nome é menos importante aqui, mas pode ser mantido
      name: 'VSistecFeatures',
      // Os formatos que você quer gerar
      formats: ['es'] // 'es' (ES Module) é o mais importante para Vite
    },
    rollupOptions: {
      external: ['vue', '@tabler/icons-vue', 'vuedraggable', 'v-required', 'pinia'],
      output: {
        // Garante que os arquivos de saída mantenham a estrutura de pastas
        entryFileNames: '[name].js',
        // Para o formato UMD, se você usar
        globals: {
          vue: 'Vue',
          '@tabler/icons-vue': 'TablerIconsVue'
        }
      }
    }
  }
})