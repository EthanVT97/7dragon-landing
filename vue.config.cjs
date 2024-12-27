const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/_variables" as *;`
      }
    }
  },
  chainWebpack: config => {
    // Add security headers
    config.plugin('html').tap(args => {
      args[0].meta = {
        ...args[0].meta,
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
        },
        'X-Content-Type-Options': { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
        'X-Frame-Options': { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
        'X-XSS-Protection': { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
      }
      args[0].favicon = 'public/18klogo.jpg'
      return args
    })

    // Optimize chunks
    config.optimization.splitChunks({
      chunks: 'all',
      cacheGroups: {
        vendors: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'initial'
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'async',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    })

    // Optimize font awesome
    config.module
      .rule('font-awesome')
      .test(/\.(woff|woff2|eot|ttf|svg)(\?.*)?$/)
      .include
      .add(/fontawesome-free/)
      .end()
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 8192,
        name: 'fonts/[name].[hash:8].[ext]'
      })
  },
  configureWebpack: {
    resolve: {
      fallback: {
        path: false,
        fs: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false
      }
    },
    performance: {
      hints: 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      minimize: true,
      minimizer: [
        `...`,
        new (require('css-minimizer-webpack-plugin'))(),
      ]
    }
  }
})