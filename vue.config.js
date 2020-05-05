module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/bkandiyal/covid19-dashboard/' : '/',
  transpileDependencies: [
    'vuetify'
  ]
}
