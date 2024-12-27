import { defineConfig } from '@vue/cli-service'
import CompressionPlugin from 'compression-webpack-plugin'

export default defineConfig({
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'assets',
  productionSourceMap: false,
  
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },

  configureWebpack: {
    plugins: [
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.js$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000
      }
    }
  },

  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].meta = {
        ...args[0].meta,
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.m9asia.com;"
        }
      }
      args[0].favicon = 'public/7Dlogo.jpg'
      args[0].title = '7Dragon Chat'
      return args
    })
  }
})
