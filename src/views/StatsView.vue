<template>
  <div>
    <div class="card"><h2>训练统计</h2>
      <div class="grid">
        <div class="col-3"><label>开始日期</label><input type="date" v-model="stStart" @change="refreshStats"></div>
        <div class="col-3"><label>结束日期</label><input type="date" v-model="stEnd" @change="refreshStats"></div>
        <div class="col-6" style="display:flex;align-items:end;gap:6px;flex-wrap:wrap">
          <button class="secondary" @click="setStRange('7d')">7天</button>
          <button class="secondary" @click="setStRange('14d')">14天</button>
          <button class="secondary" @click="setStRange('1m')">1个月</button>
          <button class="secondary" @click="setStRange('3m')">3个月</button>
        </div>
      </div>
      <div class="grid" style="margin-top:12px">
        <div class="col-3"><div class="box"><div class="muted">训练天数</div><span style="font-size:28px;font-weight:900;color:#2563eb">{{ stats.trainDays }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">总训练分钟</div><span style="font-size:28px;font-weight:900;color:#16a34a">{{ stats.totalMin }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">训练类型数</div><span style="font-size:28px;font-weight:900;color:#f97316">{{ stats.typeCount }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">总距离 km</div><span style="font-size:28px;font-weight:900;color:#7c3aed">{{ stats.totalDistance }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">总负荷</div><span style="font-size:28px;font-weight:900;color:#dc2626">{{ Math.round(stats.totalTL) }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">平均TL</div><span style="font-size:28px;font-weight:900;color:#9333ea">{{ Math.round(stats.avgTL) }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">总Wall Ball</div><span style="font-size:28px;font-weight:900;color:#0891b2">{{ stats.totalWallBall }}</span></div></div>
        <div class="col-3"><div class="box"><div class="muted">总Row m</div><span style="font-size:28px;font-weight:900;color:#db2777">{{ stats.totalRow }}</span></div></div>
      </div>
    </div>

    <div class="card"><h2>个人最大负荷</h2>
      <div class="muted" style="margin-bottom:8px">窗口期：最近 {{ store.data.profile.personalMaxWindowDays || 28 }} 天 · 当前个人最大负荷 = <b style="font-size:18px;color:#7c3aed">{{ Math.round(personalMax) }}</b> ALU</div>
      <div v-if="personalMaxRows.length" class="table-wrapper" style="max-height:400px;overflow-y:auto">
        <table>
          <thead><tr><th>日期</th><th>周几</th><th>日负荷 TL</th><th>占比</th><th style="width:100%">负荷条</th></tr></thead>
          <tbody>
            <tr v-for="r in personalMaxRows" :key="r.date" :class="{ 'box': r.isMax, 'good': r.isMax }">
              <td>{{ r.date }}</td><td>{{ r.dayOfWeek }}</td>
              <td><b>{{ Math.round(r.tl) }}</b></td>
              <td>{{ r.pct }}%</td>
              <td><div :style="`height:8px;border-radius:4px;background:${r.isMax?'#7c3aed':'#d1d5db'};width:${r.barPct}%`" :title="r.isMax ? '最高' : ''"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="muted">窗口期内暂无训练记录，使用默认值 855 ALU</div>
    </div>

    <div class="card"><h2>各训练类型分布</h2>
      <div v-if="typeCounts.length" class="table-wrapper">
        <table>
          <thead>
            <tr><th>训练类型</th><th>次数</th><th>总分钟</th><th>占比</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in typeCounts" :key="t.type">
              <td>{{ t.type }}</td><td>{{ t.count }}</td><td>{{ t.totalMin }}</td>
              <td>{{ (t.totalMin / Math.max(stats.totalMin, 1) * 100).toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="muted">该区间暂无训练记录</div>
    </div>

    <div class="card"><h2>负荷趋势图</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="tl" checked @change="drawLoadChart"><span style="color:#7c3aed">🏋️ 训练负荷 TL</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="min" checked @change="drawLoadChart"><span style="color:#2563eb">⏱️ 分钟</span>
        </label>
      </div>
      <div v-if="chartRows.length >= 2">
        <canvas ref="loadCanvas" width="600" height="300"></canvas>
      </div>
      <div v-else class="muted">需要至少2天训练记录</div>
    </div>

    <div class="card"><h2>疲劳趋势图</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="acute" checked @change="redrawFatigue"><span style="color:#ef4444">⚡急性疲劳</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="chronic" @change="redrawFatigue"><span style="color:#8b5cf6">📅慢性疲劳</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="dtl" checked @change="redrawFatigue"><span style="color:#f59e0b">🏋️每日负荷</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="acwr" @change="redrawFatigue"><span style="color:#06b6d4">📊急慢性比ACWR</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="rs" @change="redrawFatigue"><span style="color:#84cc16">📐相对饱和度RS</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="ofs" @change="redrawFatigue"><span style="color:#14b8a6">📈综合疲劳OFS</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="combat" @change="redrawFatigue"><span style="color:#2563eb">💪战斗力</span>
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
          <input type="checkbox" value="fatigue" @change="redrawFatigue"><span style="color:#dc2626">🔥总疲劳分</span>
        </label>
      </div>
      <div v-if="fatigueRows.length >= 2">
        <canvas ref="fatigueCanvas" width="600" height="340"></canvas>
      </div>
      <div v-else class="muted">需要至少2天数据</div>
    </div>
    <div class="card"><h2>热量趋势图</h2>
      <div v-if="calChartData.length >= 2">
        <div class="table-wrapper" style="margin-bottom:16px">
          <table><tbody>
            <tr><td>估算总消耗</td><td>{{ Math.round(calSummary.totalTdee) }} kcal</td></tr>
            <tr><td>记录摄入总量</td><td>{{ calSummary.totalIn || '-' }} kcal</td></tr>
            <tr><td>总热量缺口</td><td>{{ calSummary.defDays ? Math.round(calSummary.totalDef) + ' kcal' : '-' }}</td></tr>
            <tr><td>平均每日缺口</td><td>{{ calSummary.defDays ? Math.round(calSummary.totalDef / calSummary.defDays) + ' kcal' : '-' }}</td></tr>
          </tbody></table>
        </div>
        <canvas ref="calCanvas" width="600" height="320"></canvas>
      </div>
      <div v-else class="muted">该区间暂无热量数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { useCalc } from '../composables/useCalc'
import { todayStr, nval, betweenDate, addDays } from '../utils/helpers'

const store = useAppStore()
const calc = useCalc()

const stStart = ref(addDays(todayStr(), -28))
const stEnd = ref(todayStr())
const loadCanvas = ref(null)
const fatigueCanvas = ref(null)
const calCanvas = ref(null)

const filteredLogs = computed(() => {
  return Object.entries(store.data.logs || {}).filter(([d]) =>
    betweenDate(d, stStart.value, stEnd.value) && store.data.logs[d]?.done !== false
  )
})

const stats = computed(() => {
  const entries = filteredLogs.value
  const trainDays = entries.length
  let totalMin = 0, totalTL = 0, totalDistance = 0, totalWallBall = 0, totalRow = 0
  const typeMap = {}
  entries.forEach(([d, log]) => {
    const acts = calc.getActivitiesFromLog(log, store.data.presets)
    acts.forEach(a => {
      totalMin += nval(a.min, 0)
      totalDistance += nval(a.distanceKm, 0)
      totalWallBall += nval(a.wallBall, 0)
      totalRow += nval(a.row, 0)
      const tl = nval(a.min, 0) * nval(calc.classPreset(a.type, store.data.presets).met, 5) * nval(a.rpe, 0) / 10
      totalTL += tl
      if (!typeMap[a.type]) typeMap[a.type] = { count: 0, totalMin: 0 }
      typeMap[a.type].count++
      typeMap[a.type].totalMin += nval(a.min, 0)
    })
  })
  return {
    trainDays, totalMin, totalTL, avgTL: trainDays ? totalTL / trainDays : 0,
    totalDistance: +totalDistance.toFixed(1), totalWallBall, totalRow,
    typeCount: Object.keys(typeMap).length, typeMap
  }
})

const typeCounts = computed(() => {
  return Object.entries(stats.value.typeMap || {}).map(([type, v]) => ({ type, ...v }))
    .sort((a, b) => b.totalMin - a.totalMin)
})

const personalMax = computed(() => calc.getPersonalMax(store.data.logs, store.data.profile, store.data.presets))

const weekDayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
const personalMaxRows = computed(() => {
  const windowDays = nval(store.data.profile.personalMaxWindowDays, 28)
  const cutoffDate = addDays(todayStr(), -windowDays)
  const rows = []
  Object.keys(store.data.logs || {}).forEach(d => {
    if (d < cutoffDate) return
    const log = store.data.logs[d]
    if (!log) return
    const acts = calc.getActivitiesFromLog(log, store.data.presets)
    const tl = calc.calcTL(acts, store.data.presets)
    if (tl > 0) {
      const dayOfWeek = weekDayLabels[new Date(d + "T00:00:00").getDay()]
      rows.push({ date: d, dayOfWeek, tl })
    }
  })
  rows.sort((a, b) => b.date.localeCompare(a.date))
  const maxTL = Math.max(...rows.map(r => r.tl), 1)
  return rows.map(r => ({
    ...r,
    pct: Math.round(r.tl / maxTL * 100),
    barPct: Math.round(r.tl / Math.max(personalMax.value, 1) * 100),
    isMax: r.tl >= maxTL
  }))
})

const chartRows = computed(() => {
  return Object.entries(store.data.logs || {}).filter(([d]) =>
    betweenDate(d, stStart.value, stEnd.value) && store.data.logs[d]?.done !== false
  ).map(([d, log]) => {
    const acts = calc.getActivitiesFromLog(log, store.data.presets)
    const tl = acts.reduce((s, a) => s + nval(a.min) * nval(calc.classPreset(a.type, store.data.presets).met, 5) * nval(a.rpe) / 10, 0)
    return [d, { min: acts.reduce((s, a) => s + nval(a.min), 0), tl }]
  }).sort((a, b) => a[0].localeCompare(b[0]))
})

const fatigueRows = computed(() => {
  const allDates = Object.keys(store.data.schedule || {})
    .filter(d => betweenDate(d, stStart.value, stEnd.value))
    .sort()
  return allDates.map(d => {
    const acute = Math.round(calc.getAcuteFatigue(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets) * 10) / 10
    const chronic = Math.round(calc.getChronicFatigue(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets) * 10) / 10
    const dtl = Math.round(calc.calcDTL(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets) * 10) / 10
    const acwr = Math.round(calc.calcACWR(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets) * 100) / 100
    const rs = Math.round(calc.calcRS(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets) * 100) / 100
    const ofs = Math.round(calc.calcOFS(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets) * 100) / 100
    const combat = Math.round(calc.calcCombatPower(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))
    const fatigue = Math.round(calc.calcFatigueScore(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))
    return [d, { date: d, acute, chronic, dtl, acwr, rs, ofs, combat, fatigue }]
  })
})

const calChartData = computed(() => {
  const entries = filteredLogs.value
  const result = []
  entries.forEach(([d]) => {
    const po = store.makePlan(d)
    const e = store.estimateEnergy(d, po?.plan || {}, store.normalizeScheduleItem(store.data.schedule?.[d]))
    if (e?.actual) {
      result.push({
        date: d,
        tdee: e.actual.tdee,
        caloriesIn: e.actual.caloriesIn || 0,
        deficit: e.actual.deficit || 0
      })
    }
  })
  return result.sort((a, b) => a.date.localeCompare(b.date))
})

const calSummary = computed(() => {
  const data = calChartData.value
  let totalTdee = 0, totalIn = 0, totalDef = 0, defDays = 0
  data.forEach(d => {
    totalTdee += d.tdee
    if (d.caloriesIn) {
      totalIn += d.caloriesIn
      totalDef += d.deficit
      defDays++
    }
  })
  return { totalTdee, totalIn, totalDef, defDays }
})

function setStRange(period) {
  const end = todayStr()
  let start = end
  if (period === '7d') start = addDays(end, -6)
  else if (period === '14d') start = addDays(end, -13)
  else if (period === '1m') start = addDays(end, -29)
  else if (period === '3m') start = addDays(end, -89)
  stStart.value = start
  stEnd.value = end
  nextTick(() => refreshStats())
}

function refreshStats() {
  nextTick(() => {
    drawLoadChart()
    drawFatigueChart()
    drawCalChart()
  })
}

const loadParamConfig = {
  tl: { label: "训练负荷 TL", color: "#7c3aed", getVal: v => v.tl, ceil: 50, padVal: 50, min: 100 },
  min: { label: "分钟", color: "#2563eb", getVal: v => v.min, ceil: 30, padVal: 30, min: 60 }
}

function getSelectedLoadParams(canvas) {
  const container = canvas?.closest('.card')
  const checkboxes = container?.querySelectorAll('input[type=checkbox][value]') || []
  const selected = []
  checkboxes.forEach(cb => { if (cb.checked && loadParamConfig[cb.value]) selected.push(cb.value) })
  return selected
}

function drawLoadChart() {
  const rows = chartRows.value
  const canvas = loadCanvas.value
  if (!canvas || rows.length < 2) return
  const selected = getSelectedLoadParams(canvas)
  if (!selected.length) return
  const ctx = canvas.getContext("2d")
  let rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) rect = { width: 600, height: 300 }
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = 300 * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = 300
  const pad = { top: 15, right: 40, bottom: 55, left: 50 }
  const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom

  const activeVals = selected.map(p => {
    const cfg = loadParamConfig[p]
    let max = 0
    rows.forEach(([, v]) => { const val = cfg.getVal(v); if (val > max) max = val })
    max = Math.ceil(max / cfg.ceil) * cfg.ceil + cfg.padVal
    if (max === 0) max = cfg.min
    return { key: p, ...cfg, max, yPos: v => pad.top + ph - (cfg.getVal(v) / max) * ph }
  })
  const firstActive = activeVals[0]

  const xPos = i => pad.left + (i / Math.max(rows.length - 1, 1)) * pw

  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h)

  for (let i = 0; i <= 5; i++) {
    const val = (firstActive.max / 5) * i, y = firstActive.yPos({ tl: val, min: val })
    ctx.strokeStyle = "#f3f4f6"; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke()
    ctx.fillStyle = "#6b7280"; ctx.font = "10px -apple-system,sans-serif"; ctx.textAlign = "right"
    ctx.fillText(Math.round(val), pad.left - 5, y + 3)
  }
  const step = Math.max(1, Math.floor(rows.length / 10))
  ctx.textAlign = "center"
  rows.forEach(([date], i) => {
    if (i % step === 0 || i === rows.length - 1) ctx.fillText(date.slice(5), xPos(i), h - pad.bottom + 16)
  })

  activeVals.forEach(av => {
    ctx.strokeStyle = av.color; ctx.lineWidth = 2; ctx.beginPath()
    rows.forEach(([, v], i) => {
      const x = xPos(i), y = av.yPos(v)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()
    rows.forEach(([, v], i) => {
      ctx.fillStyle = av.color; ctx.beginPath(); ctx.arc(xPos(i), av.yPos(v), 3, 0, Math.PI * 2); ctx.fill()
    })
  })

  let lx = pad.left
  activeVals.forEach(av => {
    ctx.strokeStyle = av.color; ctx.fillStyle = av.color
    ctx.beginPath(); ctx.moveTo(lx, 8); ctx.lineTo(lx + 16, 8); ctx.stroke(); ctx.beginPath(); ctx.arc(lx + 8, 8, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#111827"; ctx.textAlign = "left"; ctx.fillText(av.label, lx + 20, 12)
    lx += 20 + ctx.measureText(av.label).width + 16
  })
}

const paramConfig = {
  acute: { label: "急性疲劳", color: "#ef4444" },
  chronic: { label: "慢性疲劳", color: "#8b5cf6" },
  dtl: { label: "每日负荷", color: "#f59e0b" },
  acwr: { label: "ACWR", color: "#06b6d4" },
  rs: { label: "RS", color: "#84cc16" },
  ofs: { label: "OFS", color: "#14b8a6" },
  combat: { label: "战斗力", color: "#2563eb" },
  fatigue: { label: "总疲劳分", color: "#dc2626" }
}

function redrawFatigue() {
  nextTick(() => drawFatigueChart())
}

function drawFatigueChart() {
  const rows = fatigueRows.value
  const canvas = fatigueCanvas.value
  if (!canvas || rows.length < 2) return
  const ctx = canvas.getContext("2d")

  const selectedParams = []
  const container = canvas.closest('.card')
  const checkboxes = container?.querySelectorAll('input[type=checkbox]') || []
  checkboxes.forEach(cb => { if (cb.checked && paramConfig[cb.value]) selectedParams.push(cb.value) })

  let rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    canvas.style.width = "100%"
    canvas.style.height = "340px"
    rect = { width: 600, height: 340 }
  }
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = 340 * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = 340

  if (!selectedParams.length) {
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = "#6b7280"
    ctx.font = "14px -apple-system,sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("请选择至少一个参数", w / 2, 170)
    return
  }

  const pad = { top: 40, right: 60, bottom: 55, left: 60 }
  const pw = w - pad.left - pad.right
  const ph = h - pad.top - pad.bottom

  let minVal = Infinity, maxVal = -Infinity
  rows.forEach(([, v]) => {
    selectedParams.forEach(p => {
      const val = v[p]
      if (val != null && !isNaN(val) && val < minVal) minVal = val
      if (val != null && !isNaN(val) && val > maxVal) maxVal = val
    })
  })
  if (!isFinite(minVal) || !isFinite(maxVal)) { minVal = 0; maxVal = 100 }
  if (minVal === maxVal) { minVal -= 10; maxVal += 10 }
  const range = maxVal - minVal
  minVal = minVal - range * 0.05
  maxVal = maxVal + range * 0.05
  const valRange = maxVal - minVal

  const xPos = i => pad.left + (i / Math.max(rows.length - 1, 1)) * pw
  const yPos = v => pad.top + ph - ((v - minVal) / valRange) * ph

  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, w, h)

  const gridLines = 6
  ctx.strokeStyle = "#f3f4f6"
  ctx.lineWidth = 1
  ctx.fillStyle = "#6b7280"
  ctx.font = "10px -apple-system,sans-serif"
  ctx.textAlign = "right"
  for (let i = 0; i <= gridLines; i++) {
    const val = minVal + (valRange / gridLines) * i
    const y = yPos(val)
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke()
    const label = val >= 100 ? Math.round(val) : val >= 10 ? val.toFixed(1) : val.toFixed(2)
    ctx.fillText(label, pad.left - 6, y + 4)
  }

  ctx.textAlign = "center"
  const labelStep = Math.max(1, Math.floor(rows.length / 10))
  ctx.font = "10px -apple-system,sans-serif"
  rows.forEach(([date], i) => {
    if (i % labelStep === 0 || i === rows.length - 1) {
      ctx.fillText(date.slice(5), xPos(i), h - pad.bottom + 18)
    }
  })

  selectedParams.forEach(p => {
    const cfg = paramConfig[p]
    ctx.strokeStyle = cfg.color
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false
    rows.forEach(([, v], i) => {
      const val = v[p]
      if (val == null || isNaN(val)) return
      const x = xPos(i), y = yPos(val)
      if (!started) { ctx.moveTo(x, y); started = true }
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    rows.forEach(([, v], i) => {
      const val = v[p]
      if (val == null || isNaN(val)) return
      ctx.fillStyle = cfg.color
      ctx.beginPath(); ctx.arc(xPos(i), yPos(val), 2.5, 0, Math.PI * 2); ctx.fill()
    })
  })

  let legendX = pad.left
  ctx.font = "12px -apple-system,sans-serif"
  selectedParams.forEach(p => {
    const cfg = paramConfig[p]
    ctx.fillStyle = cfg.color
    ctx.fillRect(legendX, pad.top - 28, 14, 12)
    ctx.fillStyle = "#374151"
    ctx.textAlign = "left"
    ctx.fillText(cfg.label, legendX + 18, pad.top - 18)
    legendX += ctx.measureText(cfg.label).width + 32
  })

  const todayIdx = rows.findIndex(([d]) => d === todayStr())
  if (todayIdx >= 0) {
    const tx = xPos(todayIdx)
    ctx.strokeStyle = "rgba(156,163,175,0.4)"
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(tx, pad.top); ctx.lineTo(tx, pad.top + ph); ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawCalChart() {
  const data = calChartData.value
  const canvas = calCanvas.value
  if (!canvas || data.length < 2) return
  const ctx = canvas.getContext("2d")

  let rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    canvas.style.width = "100%"
    canvas.style.height = "320px"
    rect = { width: 600, height: 320 }
  }
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = 320 * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = 320

  let maxVal = 0, minDef = Infinity
  data.forEach(d => {
    if (d.tdee > maxVal) maxVal = d.tdee
    if (d.caloriesIn > maxVal) maxVal = d.caloriesIn
    if (d.deficit < minDef) minDef = d.deficit
  })
  if (maxVal === 0) maxVal = 2000
  maxVal = Math.ceil(maxVal / 200) * 200 + 200
  const minDefFloor = Math.floor((minDef < 0 ? minDef : 0) / 200) * 200 - 200
  const valRange = maxVal - minDefFloor

  const pad = { top: 15, right: 40, bottom: 60, left: 50 }
  const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom
  const zeroY = pad.top + ph - ((0 - minDefFloor) / valRange) * ph

  const xPos = i => pad.left + (i / Math.max(data.length - 1, 1)) * pw
  const yPos = v => pad.top + ph - ((v - minDefFloor) / valRange) * ph

  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h)

  for (let i = 0; i <= 5; i++) {
    const val = minDefFloor + (valRange / 5) * i
    const y = yPos(val)
    ctx.strokeStyle = "#f3f4f6"; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke()
    ctx.fillStyle = "#6b7280"; ctx.font = "10px -apple-system,sans-serif"; ctx.textAlign = "right"
    ctx.fillText(Math.round(val), pad.left - 5, y + 3)
  }
  if (zeroY >= pad.top && zeroY <= pad.top + ph) {
    ctx.strokeStyle = "#d1d5db"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(pad.left + pw, zeroY); ctx.stroke()
  }

  const step = Math.max(1, Math.floor(data.length / 10))
  ctx.textAlign = "center"
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) ctx.fillText(d.date.slice(5), xPos(i), h - pad.bottom + 16)
  })

  const barGroupW = Math.max(8, pw / data.length * 0.6)
  const barW = barGroupW / 2
  data.forEach((d, i) => {
    const cx = xPos(i)
    const x1 = cx - barGroupW / 2
    const y1 = yPos(d.tdee)
    const bh1 = zeroY - y1
    ctx.fillStyle = "rgba(37,99,235,0.7)"
    ctx.fillRect(x1, y1, barW, Math.max(0, bh1))

    if (d.caloriesIn > 0) {
      const x2 = cx
      const y2 = yPos(d.caloriesIn)
      const bh2 = zeroY - y2
      ctx.fillStyle = "rgba(22,163,74,0.7)"
      ctx.fillRect(x2, y2, barW, Math.max(0, bh2))
    }
  })

  if (data.some(d => d.deficit !== 0)) {
    ctx.strokeStyle = "#f97316"; ctx.lineWidth = 2; ctx.beginPath()
    data.forEach((d, i) => {
      const x = xPos(i), y = yPos(d.deficit)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()
    data.forEach((d, i) => {
      if (!d.deficit || d.deficit === 0) return
      ctx.fillStyle = "#f97316"; ctx.beginPath()
      ctx.arc(xPos(i), yPos(d.deficit), 3, 0, Math.PI * 2); ctx.fill()
    })
  }

  const lx = pad.left
  ctx.fillStyle = "rgba(37,99,235,0.7)"
  ctx.fillRect(lx, 5, 10, 10)
  ctx.fillStyle = "#111827"; ctx.textAlign = "left"; ctx.fillText("TDEE消耗", lx + 14, 14)

  ctx.fillStyle = "rgba(22,163,74,0.7)"
  ctx.fillRect(lx + 80, 5, 10, 10)
  ctx.fillText("摄入", lx + 94, 14)

  ctx.strokeStyle = "#f97316"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx + 140, 10); ctx.lineTo(lx + 156, 10); ctx.stroke()
  ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.arc(lx + 148, 10, 3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = "#111827"; ctx.fillText("缺口", lx + 160, 14)
}

onMounted(() => {
  nextTick(() => refreshStats())
})
</script>
