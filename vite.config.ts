import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'


export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    dedupe: [
      'vue',
      '@tabler/icons-vue',
      'vuedraggable',
      'v-required',
      'pinia',
      'vue-toastification'
    ]
  },
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist'
    })
  ],
  build: {
    lib: {
      // Múltiplos pontos de entrada
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        core: resolve(__dirname, 'src/core/index.ts'),
        vDataTable: resolve(__dirname, 'src/DatatableVue/index.ts'),
        vDataPage: resolve(__dirname, 'src/DataPageVue/index.ts'),
        vDataAgenda: resolve(__dirname, 'src/DataAgenda/index.ts'),
        iframeCommunicator: resolve(__dirname, 'src/iframeCommunicator/index.ts'),
        Pagination: resolve(__dirname, 'src/Pagination/index.ts'),
        toast: resolve(__dirname, 'src/toast/index.ts'),
        Modals: resolve(__dirname, 'src/Modals/index.ts'),
        DashboardComponents: resolve(__dirname, 'src/DashboardComponents/index.ts'),
        UploadArquivos: resolve(__dirname, 'src/UploadArquivos/index.ts'),
        Midia: resolve(__dirname, 'src/Midia/index.ts'),
      },
      name: 'VSistecFeatures',
      formats: ['es'] // 'es' (ES Module) é o mais importante para Vite
    },
    rollupOptions: {
      // Dependências externas que não devem ser incluídas no bundle final
      external: [
        'vue',
        '@tabler/icons-vue',
        'vuedraggable',
        'v-required',
        'pinia',
        'vue-toastification',
        /^v-required\/.*/
      ],
      output: {
        entryFileNames: '[name].js',
        globals: {
          vue: 'Vue',
          '@tabler/icons-vue': 'TablerIconsVue',
          'v-required': 'vRequired'
        },
        exports: 'named'
      }
    }
  }
})