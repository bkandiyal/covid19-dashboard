import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import Home from './components/Home'
import Map from './components/Map'
import About from './components/About'
import vuetify from './plugins/vuetify'

const d3 = require('d3')
const zb = require('zebras')

Vue.config.productionTip = false

Vue.use(VueRouter)

var DATA = {
  confirmed: {},
  recovered: {},
  deaths: {}
}

Promise.all([
  d3.csv('/data/time_series_covid19_confirmed_global.csv'),
  d3.csv('/data/time_series_covid19_recovered_global.csv'),
  d3.csv('/data/time_series_covid19_deaths_global.csv')
]).then((values) => {
  DATA.confirmed.data = zb.parseNums(values[0].columns.slice(4), values[0])
  DATA.confirmed.columns = values[0].columns

  DATA.recovered.data = zb.parseNums(values[1].columns.slice(4), values[1])
  DATA.recovered.columns = values[1].columns

  DATA.deaths.data = zb.parseNums(values[2].columns.slice(4), values[2])
  DATA.deaths.columns = values[2].columns

  loadVue()
}).catch((error) => {
  console.log(error)
})

function loadVue () {
  const routes = [
    { name: 'home', path: '/', component: Home, props: { raw: { confirmed: DATA.confirmed, recovered: DATA.recovered, deaths: DATA.deaths } } },
    { name: 'map', path: '/map', component: Map, props: { raw: { confirmed: DATA.confirmed, recovered: DATA.recovered, deaths: DATA.deaths } } },
    { name: 'about', path: '/about', component: About }
  ]
  const router = new VueRouter({ routes })
  new Vue({
    router,
    render: h => h(App),
    vuetify,
    mounted: function () { }
  }).$mount('#app')
}
