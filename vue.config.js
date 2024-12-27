const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import "@/assets/styles/_variables.scss";
        `
      }
    }
  },
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = '၁၈ကရက် ချက်'
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
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify/browser"),
        crypto: require.resolve("crypto-browserify"),
      }
    }
  }
})
