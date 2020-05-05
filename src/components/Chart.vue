<template>
    <div>
        <canvas :id="id"></canvas>
        <div v-show="showControls">
          <v-switch v-model="logarithmic" label="Log Scale" inset dense></v-switch>
          <v-radio-group mandatory :column="false" v-model="period">
            <v-radio label="Since Beginning" :value="0"/>
            <v-radio label="Last 30 Days" :value="30"/>
            <v-radio label="Last 7 Days" :value="7"/>
          </v-radio-group>
        </div>
    </div>
</template>
<script>
import Chart from 'chart.js'

export default {
  name: 'Chart',
  props: {
    id: String,
    type: String,
    labels: Array,
    values: Array,
    label: String,
    color: String,
    borderColor: String,
    borderWidth: String,
    showControls: { type: Boolean, default: false }
  },
  data: function () {
    return {
      chart: null,
      logarithmic: false,
      period: 0
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      const ctx = document.getElementById(this.id).getContext('2d')
      this.chart = new Chart(ctx, {
        type: this.type,
        data: {
          labels: (this.period === 0) ? this.labels : this.labels.slice(Math.max(this.labels.length - this.period, 1)),
          datasets: [{
            label: this.label,
            data: (this.period === 0) ? this.values : this.values.slice(Math.max(this.values.length - this.period, 1)),
            backgroundColor: this.color,
            borderColor: this.borderColor,
            borderWidth: this.borderWidth
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true
        }
      })
    })
  },
  watch: {
    labels: function (value) {
      this.chart.data.labels = (this.period === 0) ? value : value.slice(Math.max(value.length - this.period, 1))
      this.chart.update()
    },
    values: function (value) {
      this.chart.data.datasets[0].data = (this.period === 0) ? value : value.slice(Math.max(value.length - this.period, 1))
      this.chart.update()
    },
    logarithmic: function (value) {
      this.chart.options.scales = {
        yAxes: [{
          type: (value) ? 'logarithmic' : 'linear'
        }]
      }
      this.chart.update()
    },
    period: function (value) {
      this.chart.data.labels = (this.period === 0) ? this.labels : this.labels.slice(Math.max(this.labels.length - this.period, 1))
      this.chart.data.datasets[0].data = (this.period === 0) ? this.values : this.values.slice(Math.max(this.values.length - this.period, 1))
      this.chart.update()
    }
  }
}
</script>
