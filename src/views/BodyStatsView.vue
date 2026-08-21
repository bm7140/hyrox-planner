<template>
  <div>
    <div class="card"><h2>身体维度记录</h2>
      <div class="notice">记录体重、体脂率、肌肉量、围度等指标，追踪身体变化趋势。</div>
      <div class="grid" style="margin-top:12px">
        <div class="col-3"><label>日期</label><input type="date" v-model="bsDate"></div>
        <div class="col-3"><label>体重 kg</label><input type="number" step="0.1" v-model.number="form.weight"></div>
        <div class="col-3"><label>体脂率 %</label><input type="number" step="0.1" v-model.number="form.bodyFatPercent"></div>
        <div class="col-3"><label>体脂肪量 kg</label><input type="number" step="0.1" v-model.number="form.bodyFatMass"></div>
        <div class="col-3"><label>肌肉量 kg</label><input type="number" step="0.1" v-model.number="form.muscleMass"></div>
        <div class="col-3"><label>骨骼肌量 kg</label><input type="number" step="0.1" v-model.number="form.skeletalMuscleMass"></div>
        <div class="col-3"><label>胸围 cm</label><input type="number" step="0.1" v-model.number="form.chest"></div>
        <div class="col-3"><label>腰围 cm</label><input type="number" step="0.1" v-model.number="form.waist"></div>
        <div class="col-3"><label>臀围 cm</label><input type="number" step="0.1" v-model.number="form.hip"></div>
        <div class="col-3"><label>左大腿 cm</label><input type="number" step="0.1" v-model.number="form.leftThigh"></div>
        <div class="col-3"><label>右大腿 cm</label><input type="number" step="0.1" v-model.number="form.rightThigh"></div>
        <div class="col-3"><label>左小腿 cm</label><input type="number" step="0.1" v-model.number="form.leftCalf"></div>
        <div class="col-3"><label>右小腿 cm</label><input type="number" step="0.1" v-model.number="form.rightCalf"></div>
        <div class="col-3"><label>左上臂 cm</label><input type="number" step="0.1" v-model.number="form.leftArm"></div>
        <div class="col-3"><label>右上臂 cm</label><input type="number" step="0.1" v-model.number="form.rightArm"></div>
        <div class="col-3"><label>左前臂 cm</label><input type="number" step="0.1" v-model.number="form.leftForearm"></div>
        <div class="col-3"><label>右前臂 cm</label><input type="number" step="0.1" v-model.number="form.rightForearm"></div>
        <div class="col-3"><label>颈围 cm</label><input type="number" step="0.1" v-model.number="form.neck"></div>
        <div class="col-3"><label>备注</label><input v-model="form.note" placeholder="可选"></div>
        <div class="col-9" style="display:flex;align-items:end;gap:8px">
          <button class="green" @click="saveBodyStat">保存记录</button>
          <button class="danger" @click="deleteBodyStat">删除当天记录</button>
        </div>
      </div>
    </div>

    <div class="card"><h2>趋势图</h2>
      <div class="grid">
        <div class="col-3"><label>开始日期</label><input type="date" v-model="chartStart" @change="updateCharts"></div>
        <div class="col-3"><label>结束日期</label><input type="date" v-model="chartEnd" @change="updateCharts"></div>
        <div class="col-6" style="display:flex;align-items:end;gap:6px;flex-wrap:wrap">
          <button class="primary" @click="updateCharts">刷新</button>
          <button class="secondary" @click="setRange('1m')">1个月</button>
          <button class="secondary" @click="setRange('3m')">3个月</button>
          <button class="secondary" @click="setRange('1y')">1年</button>
        </div>
      </div>
      <div v-if="chartRows.length >= 2" style="margin-top:12px">
        <canvas ref="weightCanvas" width="600" height="280" style="width:100%;height:280px"></canvas>
        <div style="margin-top:12px">
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
            <span style="font-size:13px;color:#374151;align-self:center">身体成分图表显示：</span>
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
              <input type="checkbox" v-model="compShow.bodyFatPercent" @change="updateCharts"><span style="color:#dc2626">体脂率%</span>
            </label>
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
              <input type="checkbox" v-model="compShow.muscleMass" @change="updateCharts"><span style="color:#16a34a">肌肉量kg</span>
            </label>
            <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;user-select:none">
              <input type="checkbox" v-model="compShow.skeletalMuscleMass" @change="updateCharts"><span style="color:#7c3aed">骨骼肌量kg</span>
            </label>
          </div>
          <canvas ref="compCanvas" width="600" height="280" style="width:100%;height:280px"></canvas>
        </div>
        <canvas ref="circCanvas" width="600" height="280" style="width:100%;height:280px;margin-top:12px"></canvas>
      </div>
      <div v-else class="muted" style="margin-top:12px">需要至少2条记录才能绘制趋势图。</div>
    </div>

    <div class="card"><h2>历史记录</h2>
      <div v-if="chartRows.length" class="table-wrapper">
        <table>
          <thead>
            <tr><th>日期</th><th>体重</th><th>体脂率</th><th>体脂肪量</th><th>肌肉量</th><th>骨骼肌量</th><th>胸围</th><th>腰围</th><th>臀围</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="(v, d) in reversedRows" :key="d">
              <td>{{ d }}</td>
              <td>{{ v.weight || '-' }}</td><td>{{ v.bodyFatPercent || '-' }}</td><td>{{ v.bodyFatMass || '-' }}</td>
              <td>{{ v.muscleMass || '-' }}</td><td>{{ v.skeletalMuscleMass || '-' }}</td>
              <td>{{ v.chest || '-' }}</td><td>{{ v.waist || '-' }}</td><td>{{ v.hip || '-' }}</td>
              <td><button class="secondary" @click="loadForEdit(d)">编辑</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="muted">该区间暂无记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { todayStr, nowISO, nval, betweenDate } from '../utils/helpers'

const store = useAppStore()

const bsDate = ref(todayStr())
const chartStart = ref("2000-01-01")
const chartEnd = ref("2099-12-31")
const weightCanvas = ref(null)
const compCanvas = ref(null)
const circCanvas = ref(null)

const compShow = reactive({
  bodyFatPercent: true,
  muscleMass: true,
  skeletalMuscleMass: true
})

const form = reactive({
  weight: 0, bodyFatPercent: 0, bodyFatMass: 0, muscleMass: 0, skeletalMuscleMass: 0,
  chest: 0, waist: 0, hip: 0,
  leftThigh: 0, rightThigh: 0, leftCalf: 0, rightCalf: 0,
  leftArm: 0, rightArm: 0, leftForearm: 0, rightForearm: 0,
  neck: 0, note: ""
})

const today = todayStr()
const todayStat = computed(() => store.data.bodyStats?.[today] || {})

onMounted(() => {
  Object.assign(form, {
    weight: todayStat.value.weight || 0,
    bodyFatPercent: todayStat.value.bodyFatPercent || 0,
    bodyFatMass: todayStat.value.bodyFatMass || 0,
    muscleMass: todayStat.value.muscleMass || 0,
    skeletalMuscleMass: todayStat.value.skeletalMuscleMass || 0,
    chest: todayStat.value.chest || 0,
    waist: todayStat.value.waist || 0,
    hip: todayStat.value.hip || 0,
    leftThigh: todayStat.value.leftThigh || 0,
    rightThigh: todayStat.value.rightThigh || 0,
    leftCalf: todayStat.value.leftCalf || 0,
    rightCalf: todayStat.value.rightCalf || 0,
    leftArm: todayStat.value.leftArm || 0,
    rightArm: todayStat.value.rightArm || 0,
    leftForearm: todayStat.value.leftForearm || 0,
    rightForearm: todayStat.value.rightForearm || 0,
    neck: todayStat.value.neck || 0,
    note: todayStat.value.note || ""
  })
  nextTick(() => updateCharts())
})

const chartRows = computed(() => {
  return Object.entries(store.data.bodyStats || {})
    .filter(([d]) => betweenDate(d, chartStart.value || "2000-01-01", chartEnd.value || "2099-12-31"))
    .sort((a, b) => a[0].localeCompare(b[0]))
})

const reversedRows = computed(() => {
  return Object.fromEntries([...chartRows.value].reverse())
})

function saveBodyStat() {
  const d = bsDate.value || todayStr()
  if (!store.data.bodyStats) store.data.bodyStats = {}
  store.data.bodyStats[d] = {
    weight: nval(form.weight, 0),
    bodyFatPercent: nval(form.bodyFatPercent, 0),
    bodyFatMass: nval(form.bodyFatMass, 0),
    muscleMass: nval(form.muscleMass, 0),
    skeletalMuscleMass: nval(form.skeletalMuscleMass, 0),
    chest: nval(form.chest, 0),
    waist: nval(form.waist, 0),
    hip: nval(form.hip, 0),
    leftThigh: nval(form.leftThigh, 0), rightThigh: nval(form.rightThigh, 0),
    leftCalf: nval(form.leftCalf, 0), rightCalf: nval(form.rightCalf, 0),
    leftArm: nval(form.leftArm, 0), rightArm: nval(form.rightArm, 0),
    leftForearm: nval(form.leftForearm, 0), rightForearm: nval(form.rightForearm, 0),
    neck: nval(form.neck, 0), note: form.note || "",
    updatedAt: nowISO()
  }
  chartStart.value = "2000-01-01"
  store.saveData()
  nextTick(() => updateCharts())
  alert("身体维度已保存")
}

function deleteBodyStat() {
  const d = bsDate.value || todayStr()
  if (!confirm(`确定删除 ${d} 的身体维度记录？`)) return
  delete store.data.bodyStats[d]
  store.saveData()
  nextTick(() => updateCharts())
}

function loadForEdit(d) {
  const v = store.data.bodyStats?.[d]
  if (!v) return alert("未找到该日期记录")
  bsDate.value = d
  Object.assign(form, {
    weight: v.weight || 0,
    bodyFatPercent: v.bodyFatPercent || 0,
    bodyFatMass: v.bodyFatMass || 0,
    muscleMass: v.muscleMass || 0,
    skeletalMuscleMass: v.skeletalMuscleMass || 0,
    chest: v.chest || 0,
    waist: v.waist || 0,
    hip: v.hip || 0,
    leftThigh: v.leftThigh || 0, rightThigh: v.rightThigh || 0,
    leftCalf: v.leftCalf || 0, rightCalf: v.rightCalf || 0,
    leftArm: v.leftArm || 0, rightArm: v.rightArm || 0,
    leftForearm: v.leftForearm || 0, rightForearm: v.rightForearm || 0,
    neck: v.neck || 0, note: v.note || ""
  })
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function setRange(period) {
  const today = new Date()
  let start = new Date()
  if (period === '1m') start.setMonth(start.getMonth() - 1)
  else if (period === '3m') start.setMonth(start.getMonth() - 3)
  else if (period === '1y') start.setFullYear(start.getFullYear() - 1)
  chartStart.value = start.toISOString().split('T')[0]
  chartEnd.value = today.toISOString().split('T')[0]
  nextTick(() => updateCharts())
}

function updateCharts() {
  const rows = chartRows.value
  if (rows.length < 2) return
  nextTick(() => {
    drawLineChart(weightCanvas.value, rows, ["weight"], ["体重 kg"], ["#2563eb"])
    // 根据勾选状态过滤身体成分图表的字段
    const compFields = []
    const compLabels = []
    const compColors = []
    if (compShow.bodyFatPercent) { compFields.push("bodyFatPercent"); compLabels.push("体脂率%"); compColors.push("#dc2626") }
    if (compShow.muscleMass) { compFields.push("muscleMass"); compLabels.push("肌肉量kg"); compColors.push("#16a34a") }
    if (compShow.skeletalMuscleMass) { compFields.push("skeletalMuscleMass"); compLabels.push("骨骼肌量kg"); compColors.push("#7c3aed") }
    if (compFields.length > 0) {
      drawLineChart(compCanvas.value, rows, compFields, compLabels, compColors)
    } else {
      // 清空画布
      const ctx = compCanvas.value?.getContext("2d")
      if (ctx && compCanvas.value) {
        const w = compCanvas.value.width / (window.devicePixelRatio || 1)
        const h = 280
        ctx.fillStyle = "#fff"
        ctx.fillRect(0, 0, w * (window.devicePixelRatio || 1), h * (window.devicePixelRatio || 1))
        ctx.fillStyle = "#6b7280"
        ctx.font = "14px -apple-system,sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("请至少选择一项指标", w / 2, h / 2)
      }
    }
    drawLineChart(circCanvas.value, rows, ["chest", "waist", "hip"], ["胸围cm", "腰围cm", "臀围cm"], ["#2563eb", "#f97316", "#16a34a"])
  })
}

function drawLineChart(canvas, rows, fields, labels, colors) {
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  let rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) rect = { width: 600, height: 280 }
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = 280 * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = 280
  const pad = { top: 15, right: 30, bottom: 50, left: 50 }
  const pw = w - pad.left - pad.right, ph = h - pad.top - pad.bottom

  let minVal = Infinity, maxVal = -Infinity
  const validRows = []
  rows.forEach(([date, v]) => {
    const values = fields.map(f => nval(v[f], 0))
    if (values.some(val => val > 0)) {
      validRows.push([date, v])
      values.forEach(val => { if (val > 0 && val < minVal) minVal = val; if (val > maxVal) maxVal = val })
    }
  })
  if (validRows.length === 0) {
    ctx.fillStyle = "#6b7280"; ctx.font = "14px -apple-system,sans-serif"; ctx.textAlign = "center"
    ctx.fillText("无有效数据", w / 2, h / 2)
    return
  }
  const range = maxVal - minVal || 1
  minVal = Math.floor(minVal - range * 0.08)
  maxVal = Math.ceil(maxVal + range * 0.08)
  const valRange = maxVal - minVal

  const xPos = i => pad.left + (i / Math.max(validRows.length - 1, 1)) * pw
  const yPos = v => pad.top + ph - ((v - minVal) / valRange) * ph

  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h)

  for (let i = 0; i <= 5; i++) {
    const val = minVal + (valRange / 5) * i, y = yPos(val)
    ctx.strokeStyle = "#f3f4f6"; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke()
    ctx.fillStyle = "#6b7280"; ctx.font = "10px -apple-system,sans-serif"; ctx.textAlign = "right"
    ctx.fillText(Math.round(val), pad.left - 5, y + 3)
  }
  ctx.textAlign = "center"
  const step = Math.max(1, Math.floor(validRows.length / 8))
  validRows.forEach(([date], i) => {
    if (i % step === 0 || i === validRows.length - 1) ctx.fillText(date.slice(5), xPos(i), h - pad.bottom + 16)
  })

  fields.forEach((field, fi) => {
    ctx.strokeStyle = colors[fi]; ctx.lineWidth = 2
    ctx.beginPath(); let started = false
    validRows.forEach(([, v], i) => {
      const val = nval(v[field], 0)
      if (val <= 0) return
      const x = xPos(i), y = yPos(val)
      if (!started) { ctx.moveTo(x, y); started = true } else ctx.lineTo(x, y)
    })
    ctx.stroke()
    validRows.forEach(([, v], i) => {
      const val = nval(v[field], 0)
      if (val <= 0) return
      ctx.fillStyle = colors[fi]; ctx.beginPath(); ctx.arc(xPos(i), yPos(val), 3, 0, Math.PI * 2); ctx.fill()
    })
  })

  const lx = pad.left, ly = pad.top - 2
  labels.forEach((label, fi) => {
    const ox = fi * 90
    ctx.strokeStyle = colors[fi]; ctx.fillStyle = colors[fi]
    ctx.beginPath(); ctx.moveTo(lx + ox, ly + 5); ctx.lineTo(lx + ox + 16, ly + 5); ctx.stroke()
    ctx.beginPath(); ctx.arc(lx + ox + 8, ly + 5, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "#111827"; ctx.textAlign = "left"; ctx.fillText(label, lx + ox + 20, ly + 9)
  })
}
</script>
