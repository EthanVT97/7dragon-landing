const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/_variables.scss";`
      }
    }
  },
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      // Add CSP headers
      args[0].meta = {
        ...args[0].meta,
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
        }
      }
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
          chunks: 'all'
        }
      }
    })
  },
  // Configure module resolution
  configureWebpack: {
    resolve: {
      fallback: {
        "path": false,
        "fs": false,
        "os": false,
        "crypto": false,
        "stream": false,
        "buffer": false
      }
    }
  }
})