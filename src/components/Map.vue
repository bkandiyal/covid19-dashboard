<template>
    <div id="world-map">
      <em><small>Date: {{ currentDate }}</small></em>
      <v-row no-gutters>
        <v-col cols="1" style="max-width:2em">
          <v-btn icon @click="animate()" v-if="!animationRunning"><v-icon dense>play_circle_filled</v-icon></v-btn>
          <v-btn icon @click="animate()" v-if="animationRunning"><v-icon dense>pause_circle_filled</v-icon></v-btn>
        </v-col>
        <v-col cols="11">
          <v-slider v-model="dateIdx" :max="Math.max(dates.length - 1, 0)" :min="0"></v-slider>
        </v-col>
      </v-row>
      <canvas id="mapCanvas"></canvas>
    </div>
</template>
<script>
import Chart from 'chart.js'
import axios from 'axios'
const ChartGeo = require('chartjs-chart-geo')
const zb = require('zebras')

export default {
  name: 'Map',
  props: ['raw'],
  data: () => ({
    type: 'confirmed',
    countries: null,
    chart: null,
    dateIdx: 0,
    timer: null,
    animateIcon: 'play_circle_filled',
    animationRunning: false
  }),
  mounted: function () {
    this.$nextTick(() => {
      this.dateIdx = this.dates.length - 1
      const ctx = document.getElementById('mapCanvas').getContext('2d')
      this.chart = new Chart(ctx, {
        type: 'choropleth',
        data: {
          datasets: [{
            label: this.label
          }]
        },
        options: {
          outlineBorderWidth: 1,
          showOutline: true,
          showGraticule: true,
          legend: {
            display: false
          },
          scale: {
            projection: 'geoEquirectangular'
          },
          geo: {
            colorScale: {
              display: true,
              interpolate: 'reds',
              missing: '#ffffff'
            }
          }
        }
      })
      axios.all([
        axios.get('https://unpkg.com/world-atlas/countries-110m.json')
      ]).then(axios.spread((c) => {
        c = c.data
        this.countries = ChartGeo.topojson.feature(c, c.objects.countries).features
        this.chart.data.datasets[0].outline = this.countries
        this.chart.update()
      }))
    })
  },
  computed: {
    dates: function () {
      const ret = this.raw[this.type].columns.slice(4, this.raw[this.type].columns.length)
      return ret
    },
    countriesGroup: function () {
      return zb.groupBy(x => x['Country/Region'], this.raw[this.type].data)
    },
    values: function () {
      if (this.countries == null) return []
      let t = zb.gbSum(this.currentDate, this.countriesGroup)
      console.log('Current Date: ' + this.currentDate)
      t = zb.addCol('country', zb.getCol('group', t), t)
      t = zb.addCol('value', zb.getCol('sum', t), t)
      t = zb.dropCol('group', t)
      t = zb.dropCol('sum', t)
      for (const e in t) {
        let name = t[e].country.replace(/\*/g, '')
        if (name === 'US') {
          name = 'United States of America'
        }
        t[e].feature = this.countries.find((d) => d.properties.name === name)
      }
      return t
    },
    labels: function () {
      if (this.values.length === 0) return []
      const t = zb.getCol('country', this.values)
      return t
    },
    currentDate: function () {
      console.log('DateIdx: ' + this.dateIdx)
      return this.dates[this.dateIdx]
    }
  },
  watch: {
    values: function (value) {
      this.chart.data.datasets[0].data = value
      this.chart.data.labels = this.labels
      this.chart.update()
    }
  },
  methods: {
    animate: function () {
      if (this.animationRunning) {
        this.animationRunning = false
        clearInterval(this.timer)
        return
      }
      this.animteIcon = 'pause_circle_filled'
      this.animationRunning = true
      this.timer = setInterval(function () {
        if (this.dateIdx + 1 <= this.dates.length - 1) {
          this.dateIdx += 1
        } else {
          this.animationRunning = false
          clearInterval(this.timer)
        }
      }.bind(this), 500)
    }
  }
}
</script>
