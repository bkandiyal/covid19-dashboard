<template>
    <div id="home">
        <v-row>
          <v-col>
            <v-combobox v-model="country" :items="countries" label="Country">
            </v-combobox>
            <em><small>Last Updated: {{ currentDate }}</small></em>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card class="pa-4" tile>
              Total Confirmed: {{ totalConfirmed }}
            </v-card>
          </v-col>
          <v-col>
            <v-card class="pa-4" tile>
              Total Recovered: {{ totalRecovered }}
            </v-card>
          </v-col>
          <v-col>
            <v-card class="pa-4" tile>
              Total Deaths: {{ totalDeaths }}
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="country === 'World'">
          <v-col>
            <Chart id="top-confirmed-countries"
              type="horizontalBar" label="Top 10 Confirmed"
              :labels="top10Countries.confirmed.countries"
              :values="top10Countries.confirmed.values"
              color="rgba(255, 0, 0, 0.4)"
              border-color="rgba(255, 0, 0, 0.8)">
            </Chart>
          </v-col>

          <v-col>
            <Chart id="top-recovered-countries"
              type="horizontalBar" label="Top 10 Recovered"
              :labels="top10Countries.recovered.countries"
              :values="top10Countries.recovered.values"
              color="rgba(0, 255, 0, 0.4)"
              border-color="rgba(0, 255, 0, 0.8)">
            </Chart>
          </v-col>

          <v-col>
            <Chart id="top-deaths-countries"
              type="horizontalBar" label="Top 10 Deaths"
              :labels="top10Countries.deaths.countries"
              :values="top10Countries.deaths.values"
              color="rgba(0, 0, 100, 0.4)"
              border-color="rgba(0, 0, 100, 0.8)">
            </Chart>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <Chart id="trend-confirmed-countries"
              type="line" label="Trend Confirmed"
              :showControls="true"
              :labels="Object.keys(trend.confirmed)"
              :values="Object.values(trend.confirmed)"
              color="rgba(255, 0, 0, 0.4)"
              border-color="rgba(255, 0, 0, 0.8)">
            </Chart>
          </v-col>
          <v-col>
            <Chart id="trend-recovered-countries"
              type="line" label="Trend Recovered"
              :showControls="true"
              :labels="Object.keys(trend.recovered)"
              :values="Object.values(trend.recovered)"
              color="rgba(0, 255, 0, 0.4)"
              border-color="rgba(0, 255, 0, 0.8)">
            </Chart>
          </v-col>
          <v-col>
            <Chart id="trend-deaths-countries"
              type="line" label="Trend Deaths"
              :showControls="true"
              :labels="Object.keys(trend.deaths)"
              :values="Object.values(trend.deaths)"
              color="rgba(0, 0, 255, 0.4)"
              border-color="rgba(0, 0, 255, 0.8)">
            </Chart>
          </v-col>
        </v-row>
    </div>
</template>
<script>
import Chart from './Chart'
const zb = require('zebras')

export default {
  name: 'Home',
  props: ['raw'],
  components: {
    Chart
  },
  data: function () {
    return {
      currentDate: this.raw.confirmed.columns[this.raw.confirmed.columns.length - 1],
      country: 'World'
    }
  },
  methods: { },
  computed: {
    confirmed: function () {
      const t = { 'Country/Region': 'World', 'State/Province': '', Lat: '0', Long: '0' }
      for (let index = 4; index < this.raw.confirmed.columns.length; index++) {
        t[this.raw.confirmed.columns[index]] = zb.sum(zb.getCol(this.raw.confirmed.columns[index], this.raw.confirmed.data))
      }
      return this.raw.confirmed.data.concat([t])
    },
    recovered: function () {
      const t = { 'Country/Region': 'World', 'State/Province': '', Lat: '0', Long: '0' }
      for (let index = 4; index < this.raw.recovered.columns.length; index++) {
        t[this.raw.recovered.columns[index]] = zb.sum(zb.getCol(this.raw.recovered.columns[index], this.raw.recovered.data))
      }
      return this.raw.recovered.data.concat([t])
    },
    deaths: function () {
      const t = { 'Country/Region': 'World', 'State/Province': '', Lat: '0', Long: '0' }
      for (let index = 4; index < this.raw.deaths.columns.length; index++) {
        t[this.raw.deaths.columns[index]] = zb.sum(zb.getCol(this.raw.deaths.columns[index], this.raw.deaths.data))
      }
      return this.raw.deaths.data.concat([t])
    },
    countries: function () {
      const t = Object.keys(zb.groupBy(x => x['Country/Region'], this.raw.confirmed.data))
      t.push('World')
      return t
    },
    totalConfirmed: function () {
      if (this.countries.indexOf(this.country) === -1) return 0
      const t = zb.groupBy(x => x['Country/Region'], this.confirmed)
      return t[this.country][0][this.currentDate]
    },
    totalRecovered: function () {
      if (this.countries.indexOf(this.country) === -1) return 0
      const t = zb.groupBy(x => x['Country/Region'], this.recovered)
      return t[this.country][0][this.currentDate]
    },
    totalDeaths: function () {
      if (this.countries.indexOf(this.country) === -1) return 0
      const t = zb.groupBy(x => x['Country/Region'], this.deaths)
      return t[this.country][0][this.currentDate]
    },
    top10Countries: function () {
      const ret = { confirmed: {}, recovered: {}, deaths: {} }
      let t = zb.sortByCol('sum', 'dsc', zb.gbSum(this.currentDate, zb.groupBy(x => x['Country/Region'], this.confirmed)))
      t = t.slice(1, 11)
      ret.confirmed.values = zb.getCol('sum', t)
      ret.confirmed.countries = zb.getCol('group', t)

      t = zb.sortByCol('sum', 'dsc', zb.gbSum(this.currentDate, zb.groupBy(x => x['Country/Region'], this.recovered)))
      t = t.slice(1, 11)
      ret.recovered.values = zb.getCol('sum', t)
      ret.recovered.countries = zb.getCol('group', t)

      t = zb.sortByCol('sum', 'dsc', zb.gbSum(this.currentDate, zb.groupBy(x => x['Country/Region'], this.deaths)))
      t = t.slice(1, 11)
      ret.deaths.values = zb.getCol('sum', t)
      ret.deaths.countries = zb.getCol('group', t)

      return ret
    },
    trend: function () {
      const ret = { confirmed: [], recovered: [], deaths: [] }
      let t = zb.groupBy(x => x['Country/Region'], this.confirmed)[this.country][0]
      let cols = Object.keys(t)
      for (let index = 4; index < cols.length; index++) {
        const e = cols[index]
        ret.confirmed[e] = t[e]
      }

      t = zb.groupBy(x => x['Country/Region'], this.recovered)[this.country][0]
      cols = Object.keys(t)
      for (let index = 4; index < cols.length; index++) {
        const e = cols[index]
        ret.recovered[e] = t[e]
      }

      t = zb.groupBy(x => x['Country/Region'], this.deaths)[this.country][0]
      cols = Object.keys(t)
      for (let index = 4; index < cols.length; index++) {
        const e = cols[index]
        ret.deaths[e] = t[e]
      }
      return ret
    }
  }
}
</script>
<style>
  .badge-large {
    padding: 1em;
  }
</style>
