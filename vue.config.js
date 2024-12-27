const { defineConfig } = require('@vue/cli-service');
const CompressionPlugin = require('compression-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = defineConfig({
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
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      fallback: {
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
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
    ]
  },

  chainWebpack: config => {
    // Add SASS loader
    config.module
      .rule('sass')
      .test(/\.sass$/)
      .use('sass-loader')
      .loader('sass-loader')
      .end();

    // Add file loader for images
    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
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
      });

    // Add source maps
    config
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('source-map')
      );

    // Optimize chunks
    config.optimization
      .splitChunks({
        chunks: 'all',
        cacheGroups: {
          libs: {
            name: 'chunk-libs',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          commons: {
            name: 'chunk-commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      });
  }
});
