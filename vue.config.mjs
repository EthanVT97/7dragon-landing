import { defineConfig } from '@vue/cli-service'
import CompressionPlugin from 'compression-webpack-plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import pathBrowserify from 'path-browserify'
import osBrowserify from 'os-browserify/browser'
import cryptoBrowserify from 'crypto-browserify'
import streamBrowserify from 'stream-browserify'
import buffer from 'buffer'
import util from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    resolve: {
      fallback: {
        path: pathBrowserify,
        os: osBrowserify,
        crypto: cryptoBrowserify,
        stream: streamBrowserify,
        buffer: buffer,
        util: util,
        fs: false
      }
    },
    plugins: [
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.js$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser'
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
    // Configure HTML plugin
    config.plugin('html').tap(args => {
      args[0].meta = {
        ...args[0].meta,
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.m9asia.com;"
        }
      }
      args[0].favicon = path.resolve(__dirname, 'public/7Dlogo.jpg')
      args[0].title = '7Dragon Chat'
      return args
    })

    // Configure SASS
    const sassImplementation = await import('sass')
    config.module
      .rule('scss')
      .test(/\.scss$/)
      .use('sass-loader')
      .loader('sass-loader')
      .options({
        implementation: sassImplementation.default,
        sassOptions: {
          indentedSyntax: false
        }
      })
      .end()
  }
})
