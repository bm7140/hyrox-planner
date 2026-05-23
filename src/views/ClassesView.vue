<template>
  <div>
    <div class="card"><h2>未来课表</h2>
      <div class="notice">填写你未来可选择的团课或私教。计划生成时会优先选择这些课；没有合适课程时再推荐自助训练。</div>
      <div class="grid" style="margin-top:12px">
        <div class="col-3"><label>起始日期</label><input type="date" v-model="startDate"></div>
        <div class="col-9" style="display:flex;align-items:end;gap:8px;flex-wrap:wrap">
          <button class="primary" @click="refresh">刷新日期</button>
          <button class="green" @click="saveClassesForm">保存当前14天课表</button>
          <button class="danger" @click="clearClassesRange">清空这14天</button>
        </div>
      </div>
    </div>
    
    <div class="card"><h2>批量课表设置</h2>
      <div class="notice">适合这种情况：未来很多天都可以约私教力量，或者固定某几天都有 HYROX / 瑜伽 / 普拉提。</div>
      <div class="grid" style="margin-top:12px">
        <div class="col-3"><label>批量开始日期</label><input type="date" v-model="bulkStart"></div>
        <div class="col-3"><label>批量结束日期</label><input type="date" v-model="bulkEnd"></div>
        <div class="col-3"><label>应用方式</label><select v-model="bulkMode"><option value="add">追加到已有课表</option><option value="replace">替换当天课表</option><option value="remove">从当天课表移除</option></select></div>
        <div class="col-3"><label>应用日期</label><select v-model="bulkFilter"><option value="all">范围内所有日期</option><option value="trainable">仅可安排课程日</option><option value="rest">仅休息日 Day3/Day4</option><option value="work2">仅上班第2天 Day2</option><option value="noNight">排除夜班日</option></select></div>
      </div>
      <div class="box"><h3>选择要批量应用的课程</h3>
        <div class="grid">
          <div v-for="c in classOptions" :key="c" class="col-3">
            <label><input type="checkbox" :value="c" v-model="bulkSelected" style="width:auto"> {{ c }}</label>
            <div class="muted">{{ classPresetBrief(c) }}</div>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="green" @click="applyBulkClasses">批量应用</button>
          <button class="secondary" @click="bulkSelectOnly('私教力量')">只选私教力量</button>
          <button class="secondary" @click="bulkSelectPreset('hyrox')">选择HYROX相关</button>
          <button class="secondary" @click="bulkSelectPreset('recovery')">选择恢复类</button>
          <button class="secondary" @click="bulkClearSelect">清空批量选择</button>
        </div>
      </div>
      <div class="box"><h3>快捷操作</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="primary" @click="quickAddPrivateToTrainable(14)">未来14天可安排课程日加入私教力量</button>
          <button class="primary" @click="quickAddPrivateToTrainable(30)">未来30天可安排课程日加入私教力量</button>
          <button class="secondary" @click="copyOneDayClassesToRange">把某一天课表复制到日期范围</button>
        </div>
      </div>
    </div>

    <div v-for="d in days" :key="d" class="card">
      <h3>{{ dateLabel(d) }} <span :class="`pill ${getTrainability(d).canTrain ? 'green' : 'gray'}`">{{ getPhaseLabel(d) }}</span><span v-if="getScheduleItem(d)?.nightShift" class="pill orange">夜班</span></h3>
      <div class="muted">{{ getTrainability(d).reason }}</div>
      <div class="grid" style="margin-top:10px">
        <div v-for="c in classOptions" :key="c" class="col-3">
          <label><input type="checkbox" :checked="isClassSelected(d, c)" @change="toggleClass(d, c)" style="width:auto"> {{ c }}</label>
          <div class="muted">{{ classPresetBrief(c) }} / 门槛:{{ Math.round(calc.getRequiredCombat(c, store.data.presets)) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { useCalc } from '../composables/useCalc'
import { todayStr, nowISO, addDays, dateLabel, sid, diffDays } from '../utils/helpers'

const store = useAppStore()
const calc = useCalc()

const startDate = ref(store.classViewStart || todayStr())
const bulkStart = ref(todayStr())
const bulkEnd = ref(addDays(todayStr(), 29))
const bulkMode = ref('add')
const bulkFilter = ref('all')
const bulkSelected = ref([])

const classOptions = computed(() => {
  return store.getClassNames().filter(x => !["休息", "自助力量", "自助跑步", "Z2单车/椭圆机", "快走/坡走"].includes(x))
})

const days = computed(() => {
  const start = startDate.value || todayStr()
  return Array.from({ length: 14 }, (_, i) => addDays(start, i))
})

function classPresetBrief(c) {
  const p = calc.classPreset(c, store.data.presets)
  return `${p.kind || ''} / ${p.duration}分钟 / RPE ${p.rpeMin}-${p.rpeMax}`
}

function isClassSelected(d, c) {
  return store.getClassesForDate(d).includes(c)
}

function toggleClass(d, c) {
  const current = store.getClassesForDate(d)
  const next = current.includes(c) ? current.filter(x => x !== c) : [...current, c]
  store.setClassesForDate(d, next)
}

function getScheduleItem(d) { return store.normalizeScheduleItem(store.data.schedule[d]) }
function getPhaseLabel(d) { return store.phaseLabel(getScheduleItem(d)) }
function getTrainability(d) { return store.getTrainability(d) }

function refresh() {
  store.classViewStart = startDate.value || todayStr()
}

function saveClassesForm() {
  const start = startDate.value || todayStr()
  const ts = nowISO()
  for (let i = 0; i < 14; i++) {
    const d = addDays(start, i)
    store.setClassesForDate(d, store.getClassesForDate(d), ts)
  }
  store.classViewStart = start
  store.saveData()
  alert("课表已保存")
}

function clearClassesRange() {
  if (!confirm("确定清空这14天课表？")) return
  const start = startDate.value || todayStr()
  const ts = nowISO()
  for (let i = 0; i < 14; i++) store.setClassesForDate(addDays(start, i), [], ts)
  store.saveData()
}

function datePassBulkFilter(d) {
  const s = store.normalizeScheduleItem(store.data.schedule[d])
  const tr = store.getTrainability(d)
  if (bulkFilter.value === "all") return true
  if (bulkFilter.value === "trainable") return !!tr.canTrain
  if (bulkFilter.value === "rest") return s && (s.workPhase === "rest1" || s.workPhase === "rest2")
  if (bulkFilter.value === "work2") return s && s.workPhase === "work2"
  if (bulkFilter.value === "noNight") return !s?.nightShift
  return true
}

function applyBulkClasses() {
  const start = bulkStart.value, end = bulkEnd.value
  if (!start || !end) return alert("请选择批量开始和结束日期")
  if (end < start) return alert("结束日期不能早于开始日期")
  if (!bulkSelected.value.length) return alert("请至少选择一个要批量应用的课程")
  const totalDays = diffDays(end, start) + 1
  if (totalDays > 180 && !confirm(`你选择了 ${totalDays} 天，范围较大，确定继续？`)) return
  let changed = 0
  const ts = nowISO()
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i)
    if (!datePassBulkFilter(d)) continue
    const old = store.getClassesForDate(d)
    let next = []
    if (bulkMode.value === "replace") next = [...bulkSelected.value]
    else if (bulkMode.value === "remove") next = old.filter(x => !bulkSelected.value.includes(x))
    else next = Array.from(new Set([...old, ...bulkSelected.value]))
    store.setClassesForDate(d, next, ts)
    changed++
  }
  store.saveData()
  store.classViewStart = start
  alert(`批量完成：影响 ${changed} 天。`)
}

function bulkClearSelect() { bulkSelected.value = [] }
function bulkSelectOnly(name) { bulkSelected.value = [name] }
function bulkSelectPreset(type) {
  bulkSelected.value = type === "hyrox" ? ["HYROX Engine", "HYROX Power", "HYROX Complete", "循环训练", "战绳训练", "高能药球"]
    : type === "recovery" ? ["瑜伽静态拉伸", "普拉提核心"] : []
}

function quickAddPrivateToTrainable(days) {
  const start = todayStr(), ts = nowISO()
  let changed = 0
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i)
    if (!store.getTrainability(d).canTrain) continue
    store.setClassesForDate(d, [...new Set([...store.getClassesForDate(d), "私教力量"])], ts)
    changed++
  }
  store.saveData()
  store.classViewStart = start
  alert(`已给未来 ${days} 天内 ${changed} 个可安排课程日加入"私教力量"。`)
}

function copyOneDayClassesToRange() {
  const source = prompt("请输入要复制的源日期，例如 2026-05-09：", todayStr())
  if (!source) return
  const sourceItems = store.getClassesForDate(source)
  if (!sourceItems.length) return alert("源日期没有已选择课程，无法复制。")
  const start = prompt("请输入复制开始日期：", source)
  if (!start) return
  const end = prompt("请输入复制结束日期：", addDays(start, 13))
  if (!end || end < start) return alert("结束日期不能早于开始日期")
  const onlyTrainable = confirm("是否只复制到可安排课程日？")
  const totalDays = diffDays(end, start) + 1
  if (totalDays > 180 && !confirm(`你选择了 ${totalDays} 天，范围较大，确定继续？`)) return
  const ts = nowISO()
  let changed = 0
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i)
    if (onlyTrainable && !store.getTrainability(d).canTrain) continue
    store.setClassesForDate(d, sourceItems, ts)
    changed++
  }
  store.saveData()
  store.classViewStart = start
  alert(`已把 ${source} 课表复制到 ${changed} 天。`)
}
</script>
