import { defineConfig } from '@vue/cli-service'
import CompressionPlugin from 'compression-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'assets',
  productionSourceMap: false,
  
  css: {
    extract: true,
    sourceMap: false,
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
      args[0].title = '18K Chat'
      return args
    })

    // Optimize chunks
    config.optimization.splitChunks({
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
            return `vendor.${packageName.replace('@', '')}`
          }
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

    // Handle ES modules
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .include
      .add(/node_modules/)
      .end()
      .type('javascript/auto')
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
      },
      extensions: ['.mjs', '.js', '.jsx', '.vue', '.json'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
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
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: process.env.NODE_ENV === 'production',
              drop_debugger: true
            }
          }
        })
      ]
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
