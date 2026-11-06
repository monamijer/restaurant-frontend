<template>
  <figure class="chart">
    <div class="chart__canvas" :class="`chart__canvas--${type}`">
      <canvas ref="canvas" role="img" :aria-label="label"></canvas>
    </div>
    <details class="chart__data">
      <summary>{{ $t('common.chart.showData') }}</summary>
      <table class="chart__table">
        <caption class="visually-hidden">{{ label }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ $t('common.chart.category') }}</th>
            <th v-for="set in data.datasets" :key="set.label" scope="col">{{ set.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(name, index) in data.labels" :key="name">
            <th scope="row">{{ name }}</th>
            <td v-for="set in data.datasets" :key="set.label">{{ set.data[index] }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>

<script>
import { mapState } from 'pinia'
import { Chart, registerables } from 'chart.js'
import { useUiStore } from '@/store/ui'

Chart.register(...registerables)

const PALETTE = ['--color-accent', '--color-info', '--color-success', '--color-warning', '--color-danger', '--color-text-muted']

export default {
  name: 'BaseChart',
  props: {
    type: { type: String, default: 'bar' },
    data: { type: Object, required: true },
    options: { type: Object, default: () => ({}) },
    label: { type: String, required: true },
  },
  computed: {
    ...mapState(useUiStore, ['theme']),
  },
  watch: {
    data: { handler() { this.render() }, deep: true },
    options: { handler() { this.render() }, deep: true },
    theme() { this.$nextTick(() => this.render()) },
  },
  mounted() {
    this.chart = null
    this.render()
  },
  beforeUnmount() {
    this.destroy()
  },
  methods: {
    token(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    },
    colors(count) {
      return Array.from({ length: count }, (_, i) => this.token(PALETTE[i % PALETTE.length]))
    },
    reducedMotion() {
      return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    },
    buildData() {
      const circular = this.type === 'doughnut'
      const palette = this.colors(circular ? this.data.labels.length : this.data.datasets.length)
      return {
        labels: this.data.labels,
        datasets: this.data.datasets.map((set, i) => ({
          borderRadius: circular ? 0 : 4,
          tension: 0.3,
          ...set,
          backgroundColor: set.backgroundColor || (circular ? palette : palette[i]),
          borderColor: set.borderColor || (circular ? this.token('--color-surface') : palette[i]),
        })),
      }
    },
    buildOptions() {
      const text = this.token('--color-text-muted')
      const grid = this.token('--color-border')
      const circular = this.type === 'doughnut'
      const base = {
        responsive: true,
        maintainAspectRatio: false,
        animation: this.reducedMotion() ? false : undefined,
        plugins: { legend: { display: circular || this.data.datasets.length > 1, labels: { color: text } } },
      }
      if (!circular) {
        base.scales = {
          x: { ticks: { color: text }, grid: { color: grid } },
          y: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
        }
      }
      return { ...base, ...this.options }
    },
    render() {
      if (!this.$refs.canvas) return
      this.destroy()
      try {
        this.chart = new Chart(this.$refs.canvas, { type: this.type, data: this.buildData(), options: this.buildOptions() })
      } catch {
        this.chart = null
      }
    },
    destroy() {
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    },
  },
}
</script>

<style scoped>
.chart { margin: 0; }
.chart__canvas { position: relative; height: 16rem; }
.chart__canvas--doughnut { height: 14rem; }
.chart__data { margin-top: var(--space-2); font-size: var(--text-sm); color: var(--color-text-muted); }
.chart__data summary { min-height: var(--target-size); display: flex; align-items: center; cursor: pointer; }
.chart__table { width: 100%; border-collapse: collapse; display: block; overflow-x: auto; }
.chart__table th, .chart__table td { padding: var(--space-2); text-align: left; border-bottom: 1px solid var(--color-border); }
</style>
