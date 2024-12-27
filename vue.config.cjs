const { defineConfig } = require('@vue/cli-service')
const CompressionPlugin = require('compression-webpack-plugin')

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
      cacheGroups: {
        defaultVendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: 'initial'
        },
        common: {
          name: 'chunk-common',
          minChunks: 2,
          priority: -20,
          chunks: 'initial',
          reuseExistingChunk: true
        }
      }
    })

    // Add compression
    if (process.env.NODE_ENV === 'production') {
      config.plugin('compression').use(CompressionPlugin, [{
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8
      }])
    }

    // Optimize images
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        bypassOnDebug: true,
        mozjpeg: {
          progressive: true,
          quality: 65
        },
        optipng: {
          enabled: false
        },
        pngquant: {
          quality: [0.65, 0.90],
          speed: 4
        },
        gifsicle: {
          interlaced: false
        },
        webp: {
          quality: 75
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