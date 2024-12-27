import { defineConfig } from '@vue/cli-service'

export default defineConfig({
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/_variables.scss";`
      }
    }
  },
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].favicon = 'public/18klogo.jpg'
      return args
    })

    // Split vendors for better caching
    config.optimization.splitChunks({
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 1
        }
      }
    })
  },
  configureWebpack: {
    performance: {
      hints: 'warning',
      maxEntrypointSize: 1024 * 1024, // 1MB
      maxAssetSize: 1024 * 1024
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      minimize: true
    },
    resolve: {
      fallback: {
        path: false,
        os: false,
        crypto: false
      }
    }
  }
})