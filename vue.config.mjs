import { defineConfig } from '@vue/cli-service'
import CompressionPlugin from 'compression-webpack-plugin'

export default defineConfig({
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
          content: "default-src 'self'; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
        }
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

    // Add compression in production
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
      .test(/\.(png|jpe?g|gif|webp|avif)$/i)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash:8].[ext]'
          }
        }
      })
      .end()

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
        limit: 4096,
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
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      minimize: true
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false
          }
        }
      ]
    }
  }
})
