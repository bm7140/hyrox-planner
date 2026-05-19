<template>
  <div>
    <div class="card"><h2>训练与饮食打卡</h2>
      <div class="notice">支持当天打卡、补打过去日期、修改过去记录。一天可以记录多个训练内容。可记录佳明手表热量。</div>
      <div class="grid" style="margin-top:12px">
        <div class="col-3"><label>日期</label><input type="date" v-model="logDate" @change="loadExisting"></div>
        <div class="col-3"><label>完成情况</label><select v-model="logDone"><option :value="true">已完成/有训练</option><option :value="false">未完成/休息</option></select></div>
        <div class="col-3"><label>体重 kg</label><input type="number" step="0.1" v-model.number="form.weight"></div>
        <div class="col-3"><label>腰围 cm</label><input type="number" step="0.1" v-model.number="form.waist"></div>
        <div class="col-3"><label>昨日睡眠 h</label><input type="number" step="0.5" v-model.number="form.sleepHours"></div>
        <div class="col-3"><label>状态</label><select v-model="form.status">
          <option value="">未记录</option>
          <option v-for="s in ['很好','正常','疲劳','很疲劳','生病/不适']" :key="s" :value="s">{{ s }}</option>
        </select></div>
        <div class="col-3"><label>实际步数</label><input type="number" step="100" v-model.number="form.steps"></div>
        <div class="col-3"><label>实际摄入 kcal</label><input type="number" step="50" v-model.number="form.caloriesIn"></div>
        <div class="col-12"><label>备注</label><input v-model="form.note" placeholder="如夜班、疲劳、训练感受、饮食执行情况等"></div>
      </div>
      <div class="box" style="margin-top:12px">
        <h3>训练内容明细</h3>
        <div class="grid">
          <div class="col-3"><label>训练类型</label><select v-model="newAct.type" @change="fillActDefaults">
            <option v-for="t in logTypes" :key="t" :value="t">{{ t }}</option>
          </select></div>
          <div class="col-3" v-if="showRunVariant"><label>跑步类型</label>
            <select v-model="newAct.variant">
              <option value="">自动</option>
              <option value="lsd">LSD 燃脂跑</option>
              <option value="threshold">阈值间歇跑</option>
              <option value="vo2max">VO2max 间歇</option>
            </select>
          </div>
          <div class="col-3" v-if="showStrengthVariant"><label>力量模式</label>
            <select v-model="newAct.variant">
              <option value="">自动</option>
              <option value="fullA">全身A（推+下肢）</option>
              <option value="fullB">全身B（拉+后链）</option>
              <option value="fullC">全身C（混合代谢）</option>
              <option value="upper">上肢主导</option>
              <option value="lower">下肢主导</option>
            </select>
          </div>
          <div class="col-2"><label>专项</label><select v-model="newAct.focus">
            <option value="">无</option><option v-for="f in ['胸','背','腿','肩']" :key="f" :value="f">{{ f }}</option>
          </select></div>
          <div class="col-2"><label>分钟</label><input type="number" step="5" v-model.number="newAct.min"></div>
          <div class="col-2"><label>RPE</label><input type="number" min="1" max="10" v-model.number="newAct.rpe"></div>
          <div class="col-2"><label>距离 km</label><input type="number" step="0.1" v-model.number="newAct.distanceKm" placeholder="跑步/步行距离"></div>
          <div class="col-2"><label>佳明热量 kcal</label><input type="number" step="1" v-model.number="newAct.garminKcal" placeholder="手表记录"></div>
          <div class="col-3"><label>备注</label><input v-model="newAct.note" placeholder="可选"></div>
          <div class="col-2"><label>力量训练量 kg</label><input type="number" step="100" v-model.number="newAct.ton"></div>
          <div class="col-2"><label>Wall Ball 次</label><input type="number" step="5" v-model.number="newAct.wallBall"></div>
          <div class="col-2"><label>Carry m</label><input type="number" step="10" v-model.number="newAct.carry"></div>
          <div class="col-2"><label>Row m</label><input type="number" step="50" v-model.number="newAct.row"></div>
          <div class="col-2"><label>SkiErg m</label><input type="number" step="50" v-model.number="newAct.ski"></div>
          <div class="col-12"><button class="green" @click="addActivity">添加训练内容</button></div>
        </div>
        <div v-if="activityDraft.length" class="box">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>类型</th><th>专项</th><th>跑法/模式</th><th>分钟</th><th>RPE</th><th>距离km</th><th>佳明kcal</th><th>训练量</th><th>WB</th><th>Carry</th><th>Row</th><th>Ski</th><th>TL</th><th>备注</th><th>操作</th></tr>
              </thead>
              <tbody>
                <tr v-for="(a, i) in activityDraft" :key="i">
                  <td>{{ a.type }}</td><td>{{ a.focus || '-' }}</td><td>{{ variantLabel(a.type, a.variant) }}</td><td>{{ a.min }}</td><td>{{ a.rpe }}</td>
                  <td>{{ a.distanceKm || 0 }}</td><td>{{ a.garminKcal || 0 }}</td><td>{{ a.ton || 0 }}</td>
                  <td>{{ a.wallBall || 0 }}</td><td>{{ a.carry || 0 }}</td><td>{{ a.row || 0 }}</td><td>{{ a.ski || 0 }}</td>
                  <td>{{ calcItemTL(a) }}</td>
                  <td>{{ a.note || '' }}</td><td><button class="danger" @click="removeActivity(i)">删除</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="good"><b>汇总：</b>{{ summary.totalMin }} 分钟；平均RPE {{ summary.avgRpe || '-' }}；距离 {{ summary.distanceKm }} km；佳明热量 {{ summary.totalGarminKcal || 0 }} kcal；TL {{ summary.totalTL }}</div>
        </div>
        <div v-else class="muted">暂无训练内容。</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="primary" @click="saveLog">保存打卡</button>
        <button class="secondary" @click="addPlannedActivity">把今日计划加入打卡草稿</button>
        <button class="secondary" @click="clearActivityDraft">清空训练草稿</button>
        <button class="danger" @click="deleteLog">删除当天打卡</button>
      </div>

      <div v-if="previewFatigue !== null" style="margin-top:12px;padding:12px;border-radius:8px" :style="`background:${previewFatigue < 40 ? '#dcfce7' : previewFatigue <= 70 ? '#ffedd5' : '#fee2e2'};border:1px solid ${previewFatigue < 40 ? '#bbf7d0' : previewFatigue <= 70 ? '#fed7aa' : '#fecaca'}`">
        <b>🔮 明日疲劳预测：</b><span style="font-size:20px;font-weight:900" :style="`color:${previewFatigue < 40 ? '#16a34a' : previewFatigue <= 70 ? '#f97316' : '#dc2626'}`">{{ previewFatigue }}/100</span>
        <span class="muted">（假设今晚睡眠{{ store.data.profile.predictSleepHours || 6.5 }}h）</span>
        <div class="muted" style="font-size:12px;margin-top:4px">⚡急性 {{ Math.round(previewDetail.previewAcute) }} + 📅慢性 {{ Math.round(previewDetail.previewChronic) }}{{ previewDetail.previewSleepPenalty > 0 ? ' + 😴睡眠罚分' + Math.round(previewDetail.previewSleepPenalty) : '' }}</div>
        <details style="margin-top:12px">
          <summary style="font-weight:800;color:#374151;cursor:pointer">📝 计算过程（点击展开）</summary>
          <div class="box" style="background:#f0f9ff;border-color:#7dd3fc;margin-top:8px">
            <h4>📊 训练负荷计算</h4>
            <p>今日累计训练负荷 TL = <b>{{ nval(Math.round(previewDetail.previewDTL), 0) }}</b></p>
            <p v-if="store.data.schedule[logDate]?.nightShift" class="muted">含夜班附加负荷 +{{ nval(store.data.profile.nightShiftLoad, 45) }}</p>
            <h4>⚡ 急性疲劳计算</h4>
            <p>今日急性疲劳原始值 = {{ nval(previewDetail.acuteRaw, 0) }}</p>
            <p>换算系数 = {{ nval(previewDetail.conversion, 0) }} × 100 / ({{ nval(previewDetail.personalMax, 1) }} × 0.5) = <b>{{ nval(previewDetail.coef, 0) }}</b></p>
            <p>第1步 今日新增贡献：{{ nval(Math.round(previewDetail.previewDTL), 0) }} × {{ nval(previewDetail.coef, 0) }} = <b>{{ nval(previewDetail.newLoadContrib, 0) }}</b></p>
            <p>第2步 加总：{{ nval(previewDetail.acuteRaw, 0) }} + {{ nval(previewDetail.newLoadContrib, 0) }} = <b>{{ nval(previewDetail.sumBeforeDecay, 0) }}</b></p>
            <p>第3步 衰减至明天：{{ nval(previewDetail.sumBeforeDecay, 0) }} × {{ nval(previewDetail.decayRate, 0) }} = <b>{{ nval(previewDetail.acuteAfterDecay, 0) }}</b></p>
            <p>明日急性疲劳 = min(100, {{ nval(previewDetail.acuteAfterDecay, 0) }}) = <b>{{ nval(previewDetail.previewAcute, 0) }}</b></p>
            <h4>📈 慢性疲劳计算</h4>
            <p>AL7(7天负荷) = {{ nval(previewDetail.newAL7, 0) }} · CL28(28天慢性负荷) = {{ nval(previewDetail.newCL28, 0) }}</p>
            <p>ACWR = {{ nval(previewDetail.newAL7, 0) }} / {{ Math.max(nval(previewDetail.newCL28, 0), 1).toFixed(1) }} = {{ nval(previewDetail.newACWR, 0) }}</p>
            <p>RS = {{ nval(previewDetail.newCL28, 0).toFixed(1) }} / ({{ nval(previewDetail.personalMax, 1) }} × 7) = {{ nval(previewDetail.newRS, 0) }}</p>
            <p>OFS = 0.7 × {{ nval(previewDetail.newACWR, 0) }} + 0.3 × {{ nval(previewDetail.newRS, 0) }} = {{ nval(previewDetail.newOFS, 0) }}</p>
            <p>慢性疲劳 = min(100, {{ nval(previewDetail.newOFS, 0) }} × {{ nval(previewDetail.mapFactor, 0) }}) = {{ nval(previewDetail.previewChronic, 0) }}</p>
            <h4>💤 睡眠罚分</h4>
            <p>等效睡眠小时 = {{ nval(previewDetail.predictSleepHours, 0) }}h</p>
            <p>目标睡眠 = {{ nval(previewDetail.sleepTarget, 0) }}h，每小时罚分 = {{ nval(previewDetail.penaltyPerHour, 0) }}分</p>
            <p>罚分 = ({{ nval(previewDetail.sleepTarget, 0) }} - {{ nval(previewDetail.predictSleepHours, 0) }}) × {{ nval(previewDetail.penaltyPerHour, 0) }} = {{ nval(previewDetail.previewSleepPenalty, 0) }}</p>
            <h4>🎯 最终计算</h4>
            <p>总疲劳 = {{ nval(previewDetail.shortWeight, 0) }}(短期) × {{ nval(previewDetail.previewAcute, 0) }} + {{ nval(previewDetail.longWeight, 0) }}(长期) × {{ nval(previewDetail.previewChronic, 0) }} + {{ nval(previewDetail.previewSleepPenalty, 0) }}(睡眠) = {{ previewFatigue }}</p>
            <p>= {{ nval(previewDetail.acuteContrib, 0) }} + {{ nval(previewDetail.chronicContrib, 0) }} + {{ nval(previewDetail.previewSleepPenalty, 0) }} = <b>{{ previewFatigue }}</b></p>
          </div>
        </details>
      </div>
    </div>

    <div class="card" v-if="logCalPreview"><h2>当天计划与热量预览</h2>
      <div class="grid">
        <div class="col-6"><div class="box"><h3>计划热量</h3>
          <table><thead></thead><tbody>
            <tr><td>基础代谢</td><td><b>{{ store.data.profile.bmr }} kcal</b></td></tr>
            <tr><td>计划训练消耗</td><td>{{ logPlanEnergy.planned.exercise }} kcal</td></tr>
            <tr><td>计划EPOC</td><td>{{ logPlanEnergy.planned.epoc }} kcal</td></tr>
            <tr><td>计划步数</td><td>{{ logPlanEnergy.planned.steps }} 步 / {{ logPlanEnergy.planned.stepsK }} kcal</td></tr>
            <tr><td>工作/夜班修正</td><td>{{ logPlanEnergy.planned.extra }} kcal</td></tr>
            <tr><td>估算TDEE</td><td><b>{{ logPlanEnergy.planned.tdee }} kcal</b></td></tr>
            <tr><td>建议缺口</td><td>{{ logPlanEnergy.planned.deficit }} kcal</td></tr>
            <tr><td>建议摄入</td><td><b>{{ logPlanEnergy.planned.targetIn }} kcal</b></td></tr>
          </tbody></table>
        </div></div>
        <div class="col-6"><div class="box"><h3>实际热量</h3>
          <table v-if="logPlanEnergy.actual"><thead></thead><tbody>
            <tr><td>实际训练</td><td>{{ logPlanEnergy.actual.sum?.totalMin || 0 }} 分钟 / RPE {{ logPlanEnergy.actual.sum?.avgRpe || '-' }}</td></tr>
            <tr><td>训练消耗</td><td>{{ logPlanEnergy.actual.exercise }} kcal<span v-if="logPlanEnergy.actual.sum?.totalGarminKcal" class="pill green" style="margin-left:4px">含佳明</span></td></tr>
            <tr><td>EPOC</td><td>{{ logPlanEnergy.actual.epoc }} kcal</td></tr>
            <tr><td>原始步数</td><td>{{ logPlanEnergy.actual.steps || '-' }}</td></tr>
            <tr><td>修正步数</td><td>{{ logPlanEnergy.actual.correctedSteps || '-' }} / {{ logPlanEnergy.actual.stepsK }} kcal</td></tr>
            <tr><td>实际TDEE</td><td><b>{{ logPlanEnergy.actual.tdee }} kcal</b></td></tr>
            <tr><td>实际摄入</td><td>{{ logPlanEnergy.actual.caloriesIn || '-' }}</td></tr>
            <tr><td>实际缺口</td><td>{{ logPlanEnergy.actual.deficit === null ? '-' : logPlanEnergy.actual.deficit + ' kcal' }}</td></tr>
          </tbody></table>
          <div v-else class="muted">尚未打卡。未来日期不会用计划值冒充实际消耗。</div>
        </div></div>
      </div>
      <div class="box" style="margin-top:12px">
        <h3>三餐建议，按早饭后、午饭前训练安排</h3>
        <p><b>目标摄入：</b>{{ logMeal.kcal }} kcal 左右</p>
        <p><b>早餐：</b>{{ logMeal.breakfast }}</p>
        <p><b>训练前加餐：</b>{{ logMeal.snack }}</p>
        <p><b>午餐：</b>{{ logMeal.lunch }}</p>
        <p><b>晚餐：</b>{{ logMeal.dinner }}</p>
        <p v-if="logMeal.night"><b>夜班建议：</b>{{ logMeal.night }}</p>
        <p class="muted">{{ logMeal.hr }}</p>
      </div>
    </div>

    <div class="card"><h2>最近14天打卡</h2>
      <div v-if="Object.keys(recentLogs).length" class="table-wrapper"><table>
        <thead>
          <tr><th>日期</th><th>体重</th><th>昨日睡眠</th><th>步数</th><th>训练</th><th>汇总</th><th>消耗</th><th>摄入</th><th>缺口</th><th>备注</th></tr>
        </thead>
        <tbody>
          <tr v-for="(log, d) in recentLogs" :key="d">
            <td>{{ d }}</td><td>{{ log.weight || '-' }}</td><td>{{ log.sleepHours || '-' }}</td><td>{{ log.steps || '-' }}</td>
            <td><span v-for="(a, i) in calc.getActivitiesFromLog(log, store.data.presets)" :key="i" class="pill blue">
            {{ a.type }}{{ a.focus ? '/' + a.focus : '' }}{{ a.variant ? '·' + variantLabel(a.type, a.variant) : '' }} {{ a.min }}分
          </span></td>
            <td>{{ calc.summarizeActivities(calc.getActivitiesFromLog(log, store.data.presets), store.data.presets).totalMin }}分</td>
            <td>{{ recentEnergyData[d]?.tdee || '-' }}</td><td>{{ log.caloriesIn || '-' }}</td><td>{{ recentEnergyData[d]?.deficit !== null && recentEnergyData[d]?.deficit !== undefined ? recentEnergyData[d].deficit + ' kcal' : '-' }}</td><td>{{ log.note || '' }}</td>
          </tr>
        </tbody>
      </table></div>
      <div v-else class="muted">暂无打卡</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useCalc } from '../composables/useCalc'
import { todayStr, nowISO, nval, oldNameMap } from '../utils/helpers'
import { RUN_VARIANTS, STRENGTH_VARIANTS } from '../config/selfTrainPresets'

const store = useAppStore()
const calc = useCalc()

const logDate = ref(store.logViewDate || todayStr())
const logDone = ref(true)
const form = reactive({ weight: 0, waist: 0, sleepHours: 0, status: '', steps: 0, caloriesIn: 0, note: '' })
const activityDraft = ref([])
const newAct = reactive({ type: '循环训练', focus: '', min: 60, rpe: 7, distanceKm: 0, garminKcal: 0, note: '', ton: 0, wallBall: 0, carry: 0, row: 0, ski: 0, variant: '' })

const logTypes = computed(() => store.getLogTypes())

const showRunVariant = computed(() => newAct.type === '自助跑步')
const showStrengthVariant = computed(() => newAct.type === '自助力量')

function variantLabel(type, variant) {
  if (!variant) return '-'
  if (type === '自助跑步') {
    return RUN_VARIANTS[variant]?.labelShort || variant
  }
  if (type === '自助力量') {
    return STRENGTH_VARIANTS[variant]?.labelShort || variant
  }
  return variant || '-'
}

const summary = computed(() => calc.summarizeActivities(activityDraft.value, store.data.presets))

const recentLogs = computed(() => {
  const entries = Object.entries(store.data.logs || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14)
  return Object.fromEntries(entries)
})

const recentEnergyData = computed(() => {
  const result = {}
  for (const [d] of Object.entries(recentLogs.value)) {
    const po = store.makePlan(d)
    const e = store.estimateEnergy(d, po?.plan || {}, store.normalizeScheduleItem(store.data.schedule?.[d]))
    if (e?.actual) result[d] = e.actual
  }
  return result
})

const previewResult = computed(() => {
  if (!activityDraft.value.length) return null
  return calc.calcPreviewFatigueDetailed(logDate.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets, activityDraft.value)
})

const previewFatigue = computed(() => previewResult.value?.total ?? null)
const previewDetail = computed(() => previewResult.value?.breakdown || {})

const logPlan = computed(() => store.makePlan(logDate.value))
const logPlanEnergy = computed(() => store.estimateEnergy(logDate.value, logPlan.value?.plan || {}, store.normalizeScheduleItem(store.data.schedule[logDate.value])))
const logMeal = computed(() => store.mealAdvice(logPlan.value?.plan || {}, logPlanEnergy.value, store.normalizeScheduleItem(store.data.schedule[logDate.value])))
const logCalPreview = computed(() => logPlan.value && logPlan.value.plan && logPlan.value.plan.name !== '休息')

function loadExisting() {
  const d = logDate.value
  store.logViewDate = d
  const log = store.data.logs[d] || {}
  logDone.value = log.done !== false
  form.weight = log.weight || 0
  form.waist = log.waist || 0
  form.sleepHours = log.sleepHours || 0
  form.status = log.status || ''
  form.steps = log.steps || 0
  form.caloriesIn = log.caloriesIn || 0
  form.note = log.note || ''
  activityDraft.value = calc.getActivitiesFromLog(log, store.data.presets)
}

function calcItemTL(a) {
  return calc.calcTL([a], store.data.presets)
}

function fillActDefaults() {
  const t = newAct.type
  if (!t) return
  const p = calc.classPreset(t, store.data.presets)
  newAct.min = p.duration || 60
  newAct.rpe = Math.round((nval(p.rpeMin, 5) + nval(p.rpeMax, 7)) / 2)
  if (t === "私教力量" && !newAct.focus) {
    newAct.focus = calc.nextPrivateFocus(logDate.value || todayStr(), store.data.logs, store.data.profile, store.data.presets)
  }
  if (t === "自助跑步") {
    const variant = store.selectRunVariant(logDate.value || todayStr(), 'hyrox')
    newAct.variant = variant.key || 'lsd'
    newAct.min = variant.duration
    newAct.rpe = Math.round((variant.rpeMin + variant.rpeMax) / 2)
  }
  if (t === "自助力量") {
    const variant = store.selectStrengthVariant(logDate.value || todayStr(), 'strength')
    newAct.variant = variant.key || 'fullA'
    newAct.min = variant.duration
    newAct.rpe = Math.round((variant.rpeMin + variant.rpeMax) / 2)
  }
}

fillActDefaults()

function addActivity() {
  const a = calc.normalizeActivity({
    type: newAct.type, focus: newAct.focus, min: newAct.min, rpe: newAct.rpe,
    distanceKm: newAct.distanceKm, garminKcal: newAct.garminKcal,
    ton: newAct.ton, wallBall: newAct.wallBall, carry: newAct.carry,
    row: newAct.row, ski: newAct.ski, note: newAct.note,
    variant: newAct.variant || undefined
  })
  if (!a.type) return alert("请选择训练类型")
  activityDraft.value.push(a)
}

function removeActivity(i) { activityDraft.value.splice(i, 1) }

function clearActivityDraft() {
  if (!confirm("确定清空当前训练草稿？")) return
  activityDraft.value = []
}

function addPlannedActivity() {
  const d = logDate.value
  const p = store.makePlan(d).plan
  if (p.name === "休息") return alert("今天计划是休息，不添加训练内容。")
  activityDraft.value.push(calc.normalizeActivity({ type: p.name, focus: p.focus, min: p.duration, rpe: p.rpe }))
}

function saveLog() {
  const d = logDate.value
  const sum = summary.value
  store.data.logs[d] = {
    ...(store.data.logs[d] || {}),
    done: logDone.value,
    weight: nval(form.weight, 0), waist: nval(form.waist, 0),
    sleepHours: nval(form.sleepHours, 0), status: form.status,
    steps: nval(form.steps, 0), caloriesIn: nval(form.caloriesIn, 0),
    note: form.note, activities: sum.activities,
    actualType: sum.main, actualMinutes: sum.totalMin,
    actualRpe: sum.avgRpe || 0, privateFocus: sum.privateFocus,
    distanceKm: sum.distanceKm, tonnage: sum.ton,
    wallBall: sum.wallBall, carry: sum.carry, row: sum.row, ski: sum.ski,
    garminKcal: sum.totalGarminKcal,
    updatedAt: nowISO()
  }
  store.logViewDate = d
  store.saveData()
  alert("打卡已保存")
}

function deleteLog() {
  const d = logDate.value
  if (!confirm("确定删除当天打卡？")) return
  delete store.data.logs[d]
  activityDraft.value = []
  store.saveData()
}

onMounted(() => {
  loadExisting()
})
</script>
