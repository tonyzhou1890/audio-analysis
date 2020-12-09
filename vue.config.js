module.exports = {
  publicPath: './',
  configureWebpack: {
    externals: process.env.NODE_ENV === 'production' ? {
      vue: 'Vue'
    } : {}
  },
  productionSourceMap: false
}
