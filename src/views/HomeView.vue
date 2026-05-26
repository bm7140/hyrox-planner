<template>
  <div>
    <div class="card" style="background:linear-gradient(135deg,#1e40af,#111827);color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <h2 style="color:#fff">📅 今日训练计划 · {{ today }}</h2>
          <div style="font-size:14px;opacity:.8">{{ store.phaseLabel(schedule) }} · 训练窗口 {{ store.data.profile.trainWindow }}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <label style="color:#fff;font-size:14px;margin:0">今日状态</label>
          <select v-model="todayStatus" @change="onStatusChange" style="width:auto;padding:6px 10px;border-radius:8px;font-size:14px">
            <option value="">未记录</option><option value="很好">💪 很好</option><option value="正常">😊 正常</option>
            <option value="疲劳">😴 疲劳</option><option value="很疲劳">🥱 很疲劳</option><option value="生病/不适">🤒 不适</option>
          </select>
          <label style="color:#fff;font-size:14px;margin:0" v-if="!todaySleep">昨晚睡眠</label>
          <input v-if="!todaySleep" type="number" step="0.5" min="0" max="14" v-model.number="sleepVal" @keydown.enter="onSleepEnter" style="width:70px;padding:6px;border-radius:8px;font-size:14px" placeholder="h">
          <button v-if="!todaySleep" class="primary" style="padding:6px 12px;font-size:13px" @click="onSleepEnter">确定</button>
          <span v-else style="color:#fff;font-size:13px">😴 昨晚睡了 <b>{{ todaySleep }}</b> 小时</span>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
        <span :class="statusPill.color">{{ statusPill.text }}</span>
        <span :class="combatPill.color">{{ combatPill.text }}</span>
        <span :class="rolePill.color">{{ rolePill.text }}</span>
        <span :class="acwrPill.color">{{ acwrPill.text }}</span>
        <span class="pill" :style="plan.orientation === 'hyrox' ? 'background:#fff3e0;color:#e65100' : 'background:#e8f5e9;color:#2e7d32'">
          {{ plan.orientation === 'hyrox' ? '🏆 HYROX导向' : '🏃 减脂导向' }}
        </span>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px;background:rgba(255,255,255,.12);border-radius:12px;padding:12px">
          <div style="font-size:12px;opacity:.7">综合疲劳分</div>
          <div style="font-size:36px;font-weight:900">{{ fatigueVal }}<span style="font-size:18px">/100</span></div>
          <div :style="`height:6px;background:rgba(255,255,255,.2);border-radius:3px;margin:6px 0`"><div :style="`height:6px;width:${fatigueVal}%;background:linear-gradient(90deg,#f97316,#dc2626);border-radius:3px`"></div></div>
        </div>
        <div style="flex:1;min-width:140px;background:rgba(255,255,255,.12);border-radius:12px;padding:12px">
          <div style="font-size:12px;opacity:.7">战斗力 💪</div>
          <div style="font-size:36px;font-weight:900">{{ combatVal }}<span style="font-size:18px">/100</span></div>
          <div :style="`height:6px;background:rgba(255,255,255,.2);border-radius:3px;margin:6px 0`"><div :style="`height:6px;width:${combatVal}%;background:linear-gradient(90deg,#dc2626,#16a34a);border-radius:3px`"></div></div>
        </div>
        <div style="flex:1;min-width:140px;background:rgba(255,255,255,.12);border-radius:12px;padding:12px">
          <div style="font-size:12px;opacity:.7">日预算 ALU</div>
          <div style="font-size:36px;font-weight:900">{{ Math.round(budget) }}</div>
          <div class="muted" style="color:rgba(255,255,255,.6)">pmax {{ Math.round(personalMax) }}</div>
        </div>
        <div style="flex:1;min-width:140px;background:rgba(255,255,255,.12);border-radius:12px;padding:12px">
          <div style="font-size:12px;opacity:.7">7日AL/CL28</div>
          <div style="font-size:36px;font-weight:900">{{ Math.round(al7) }} / {{ Math.round(cl28) }}</div>
          <div class="muted" style="color:rgba(255,255,255,.6)">RS {{ rs.toFixed(2) }}</div>
        </div>
      </div>

      <details style="margin-top:12px;font-size:12px">
        <summary style="cursor:pointer;color:rgba(255,255,255,.7);font-weight:bold;user-select:none">📊 详细计算过程</summary>
        <div style="font-family:monospace;font-size:11px;background:rgba(0,0,0,.25);padding:8px;border-radius:6px;margin-top:4px;line-height:1.6;max-height:400px;overflow-y:auto;color:#e5e7eb">
          <div style="color:#fca5a5;font-weight:bold;margin-bottom:4px">⚡ 急性疲劳 = {{ fatigueDetail.acuteRaw }}(原始)/{{ fatigueDetail.acute }}(显示)</div>
          <div style="color:#9ca3af;margin-left:8px">算法：指数衰减加权，衰减率={{ fatigueDetail.decayRate }}，系数={{ fatigueDetail.conversion }}</div>
          <div style="color:#9ca3af;margin-left:8px">公式：acute = Σ DTL × {{ fatigueDetail.coef }} × {{ fatigueDetail.decayRate }}^day_gap</div>
          <div style="color:#9ca3af;margin-left:8px">回溯范围：约{{ fatigueDetail.backtrackDays }}天（权重&lt;0.5%停止）</div>
          <div style="border-top:1px solid rgba(255,255,255,.1);margin:6px 0"></div>
          <div style="color:#c4b5fd;font-weight:bold;margin-bottom:4px">📅 慢性疲劳 = {{ fatigueDetail.chronic }} (上限100)</div>
          <div style="color:#9ca3af;margin-left:8px">AL7(7天总负荷) = {{ fatigueDetail.al7 }} · CL28(28天慢性负荷) = {{ fatigueDetail.cl28 }}</div>
          <div style="color:#9ca3af;margin-left:8px">ACWR = AL7 / max(CL28,1) = {{ fatigueDetail.acwr }}</div>
          <div style="color:#9ca3af;margin-left:8px">RS = CL28 / ({{ fatigueDetail.personalMax }} × 7) = {{ fatigueDetail.rs }}</div>
          <div style="color:#9ca3af;margin-left:8px">OFS = 0.7 × ACWR + 0.3 × RS = {{ fatigueDetail.ofs }}</div>
          <div style="color:#9ca3af;margin-left:8px">恢复系数 = 1 + max(0, 7-avgSleep) × k = {{ fatigueDetail.recFactor }}</div>
          <div style="color:#9ca3af;margin-left:8px">慢性 = min(100, OFS × 恢复系数 × mapFactor({{ fatigueDetail.longTermMap }}))</div>
          <div style="border-top:1px solid rgba(255,255,255,.1);margin:6px 0"></div>
          <div style="color:#fde68a;font-weight:bold;margin-bottom:4px">😴 睡眠罚分 = {{ fatigueDetail.sleepPenalty }}</div>
          <div style="color:#9ca3af;margin-left:8px">昨晚睡眠 = {{ fatigueDetail.lastNightSleep }}h · 目标 = {{ fatigueDetail.sleepTarget }}h</div>
          <div style="color:#9ca3af;margin-left:8px">罚分 = max(0, ({{ fatigueDetail.sleepTarget }} - {{ fatigueDetail.lastNightSleep }}) × {{ fatigueDetail.penaltyPerHour }})</div>
          <div style="border-top:1px solid rgba(255,255,255,.1);margin:6px 0"></div>
          <div style="color:#93c5fd;font-weight:bold">总疲劳 = {{ fatigueDetail.shortWeight }} × 急性{{ fatigueDetail.acute }} + {{ fatigueDetail.longWeight }} × 慢性{{ fatigueDetail.chronic }} + 睡眠罚分{{ fatigueDetail.sleepPenalty }}</div>
          <div style="color:#93c5fd;margin-left:8px">= {{ fatigueDetail.acuteContrib }} + {{ fatigueDetail.chronicContrib }} + {{ fatigueDetail.sleepPenalty }} = {{ fatigueDetail.fatigue }}</div>
          <div style="border-top:1px solid rgba(255,255,255,.1);margin:6px 0"></div>
          <div style="color:#6ee7b7;font-weight:bold">💪 战斗力 = (100 - {{ fatigueDetail.fatigue }}) × 体感系数({{ fatigueDetail.feelingCoeff }})</div>
          <div style="color:#6ee7b7;margin-left:8px">= {{ fatigueDetail.base }} × {{ fatigueDetail.feelingCoeff }} = {{ fatigueDetail.combat }}</div>
        </div>
      </details>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <h3 style="margin:0">🎯 今日训练方案</h3>
        <div class="orientation-toggle">
          <button
            :class="['toggle-btn', plan.orientation === 'fatLoss' ? 'active' : '']"
            @click="setOrientation('fatLoss')"
          >🏃 减脂</button>
          <button
            :class="['toggle-btn', plan.orientation === 'hyrox' ? 'active' : '']"
            @click="setOrientation('hyrox')"
          >🏆 HYROX</button>
        </div>
      </div>

      <div class="combined-plan-grid">
        <div class="plan-card primary">
          <div class="plan-header">
            <span class="plan-title">⭐ 方案A（推荐）</span>
            <span class="pill purple" v-if="plan.orientationTag">{{ plan.orientationTag }}</span>
          </div>
          <p class="plan-reason">{{ plan.primaryReason }}</p>
          <div v-for="(item, i) in plan.primaryItems" :key="i" class="plan-item-card">
            <div class="plan-item-main">
              <span v-if="item.type === 'class'" class="pill blue">{{ item.plan.name }}</span>
              <span v-else-if="item.type === 'selfStrength'" class="pill green">{{ item.plan.name }}</span>
              <span v-else-if="item.type === 'selfRun'" class="pill orange">{{ item.plan.name }}</span>
              <span v-else class="pill gray">{{ item.plan.name }}</span>
              <span class="meta-text">{{ item.plan.duration }}分钟 · RPE {{ item.plan.rpeMin || item.plan.rpe }}-{{ item.plan.rpeMax || item.plan.rpe }}</span>
            </div>
            <div v-if="item.plan.items" class="plan-details">
              <div v-for="(detail, j) in item.plan.items" :key="j"><b>{{ detail[0] }}</b>: {{ detail[1] }}</div>
            </div>
          </div>
        </div>

        <div class="right-col">
          <div class="plan-card alt-section" v-if="plan.alternativePlans.length">
            <div class="plan-header"><span class="plan-title">备选方案</span></div>
            <div v-for="(alt, i) in plan.alternativePlans" :key="i" class="alt-item">
              <div class="alt-label">{{ alt.label }}</div>
              <div v-for="(item, j) in alt.items" :key="j" class="alt-plan-item">
                <div>
                  <span class="pill" :class="item.type==='class'?'blue':item.type==='selfStrength'?'green':item.type==='selfRun'?'orange':'gray'">{{ item.plan.name }}</span>
                  <span class="meta-text">{{ item.plan.duration }}分钟 · RPE {{ item.plan.rpeMin || item.plan.rpe }}-{{ item.plan.rpeMax || item.plan.rpe }}</span>
                </div>
                <div v-if="item.type === 'selfStrength' && item.plan.variant?.plan" class="alt-exercise-list">
                  <div class="alt-warmup">🏃 热身：{{ item.plan.variant.plan.warmup }}</div>
                  <div v-for="(ex, k) in item.plan.variant.plan.exercises" :key="k" class="alt-ex-line">
                    {{ ex.name }} {{ ex.sets }}×{{ ex.reps }} · {{ ex.weight }}
                  </div>
                  <div class="alt-cooldown">🧘 放松：{{ item.plan.variant.plan.cooldown }}</div>
                </div>
                <div v-else-if="item.type === 'selfRun' && item.plan.variant" class="alt-exercise-list">
                  <div class="alt-run-info">{{ item.plan.variant.label }} · 心率 {{ item.plan.variant.hrZone || '' }}</div>
                </div>
              </div>
              <span v-if="!alt.items.length" class="meta-text">--</span>
            </div>
          </div>
          <div v-else class="plan-card alt-section" style="text-align:center;color:var(--muted);padding:20px">无备选方案</div>
          <div class="plan-actions">
            <button class="plan-select-btn" @click="goToLog">开始训练</button>
            <button class="text-btn" @click="goToSelfTrain" v-if="hasSelf">查看自助训练 →</button>
          </div>
        </div>
      </div>
    </div>

<div class="card">
      <h3>🍽️ 饮食计划</h3>
      <div class="box">
        <div class="grid" style="gap:16px">
          <div class="col-6">
            <h4>📊 消耗与目标</h4>
            <div class="kcal-summary" style="display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap">
              <div class="kcal-badge blue">TDEE <b>{{ energy.planned.tdee }}</b> kcal</div>
              <div class="kcal-badge green">目标摄入 <b>{{ energy.planned.targetIn }}</b> kcal</div>
              <div class="kcal-badge yellow">缺口 <b>{{ energy.planned.deficit }}</b> kcal</div>
            </div>
            <p style="font-size:14px;margin:2px 0">基础代谢 {{ store.data.profile.bmr }} + 训练 {{ energy.planned.exercise }} + EPOC {{ energy.planned.epoc }} + 步行{{ energy.planned.stepsK }}<span v-if="schedule?.work"> + 工作{{ energy.planned.extra }}</span></p>
          </div>
          <div class="col-6">
            <h4>🎯 宏量营养素目标</h4>
            <div class="macro-bar" style="margin-bottom:8px">
              <span class="pill" style="background:#ef4444;color:#fff;font-size:12px">蛋白质 {{ meal.macros.proteinG }}g</span>
              <span class="pill" style="background:#f59e0b;color:#fff;font-size:12px">碳水 {{ meal.macros.carbG }}g</span>
              <span class="pill" style="background:#3b82f6;color:#fff;font-size:12px">脂肪 {{ meal.macros.fatG }}g</span>
            </div>
            <p class="muted" style="font-size:12px">≈ {{ meal.macros.proteinKcal }} + {{ meal.macros.carbKcal }} + {{ meal.macros.fatKcal }} = <b>{{ meal.macros.totalMacroKcal }} kcal</b> · 角色：{{ meal.macros.roleLabel }}</p>
            <h4 style="margin-top:12px">💧 补水目标</h4>
            <p style="font-size:14px">基础 {{ meal.water.base }}ml<span v-if="meal.water.extra"> + 运动 {{ meal.water.extra }}ml</span> = <b>约 {{ (meal.water.total / 1000).toFixed(1) }}L</b></p>
          </div>
        </div>

        <hr style="margin:14px 0">

        <h4>🍳 四餐规划（早上训练）</h4>
        <div class="meal-cards" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
          <template v-for="m in ['breakfast','postWorkout','lunch','dinner']" :key="m">
            <div class="meal-card" v-if="meal.meals[m]" :class="{ wide: m === 'lunch' || m === 'dinner' }">
              <div class="meal-head">
                <span class="meal-label">{{ meal.meals[m].label }}</span>
                <span class="pill gray" style="font-size:11px">{{ meal.meals[m].time }}</span>
                <span class="pill" style="font-size:11px;background:#dbeafe;color:#1e40af">{{ meal.meals[m].roughly }}</span>
              </div>
              <ul class="meal-examples">
                <li v-for="(ex, ei) in meal.meals[m].examples.slice(0, 2)" :key="ei">{{ ex }}</li>
              </ul>
              <p class="muted" style="font-size:11px;margin:2px 0 0">{{ meal.meals[m].note }}</p>
            </div>
          </template>
        </div>

        <div v-if="meal.meals.snackNote" class="box" style="background:#fef3c7;border-color:#fbbf24;margin-top:10px;padding:8px 12px;font-size:13px">
          ⏰ {{ meal.meals.snackNote }}
        </div>

        <div v-if="meal.nightShift && meal.meals.nightShift" class="box" style="background:#ede9fe;border-color:#c4b5fd;margin-top:8px;padding:8px 12px;font-size:13px">
          <b>🌙 夜班：{{ meal.meals.nightShift.label }}</b><br>
          {{ meal.meals.nightShift.examples[0] }} · {{ meal.meals.nightShift.roughly }} · {{ meal.meals.nightShift.note }}
        </div>

        <div v-if="energy.actual" class="grid" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">
          <div class="col-12"><h4>实际打卡数据</h4></div>
          <div class="col-3">运动消耗 {{ energy.actual.exercise }} kcal</div>
          <div class="col-3">步数 {{ energy.actual.steps }}</div>
          <div class="col-3">实际TDEE {{ energy.actual.tdee }} kcal</div>
          <div class="col-3">
            摄入 <span :class="energy.actual.caloriesIn > energy.actual.tdee ? 'bad' : 'good'">{{ energy.actual.caloriesIn }}</span>
            <span v-if="energy.actual.deficit !== null"> · 缺口 {{ energy.actual.deficit }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>🗓️ 未来 {{ totalDays }}天整体预览</h3>
      <div class="grid">
        <div class="col-3"><label>预览天数</label><input type="number" v-model="totalDays" @change="refreshHome" min="1" max="30"></div>
        <div class="col-3"><label>详情天数</label><input type="number" v-model="detailDays" @change="refreshHome" min="0" max="30"></div>
        <div class="col-3"><label>详情偏移</label><input v-model="detOffsets" @change="refreshHome" placeholder="0,1,2,3"></div>
        <div class="col-3" style="display:flex;align-items:end"><button class="primary" @click="applyDetailSettings">应用显示设置</button></div>
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:12px">
        <button class="primary" style="padding:6px 20px" @click="openDayPicker('compact', 7)">7天预览</button>
        <button class="primary" style="padding:6px 20px" @click="openDayPicker('compact', 14)">14天预览</button>
        <button class="primary" style="padding:6px 20px" @click="openDayPicker('compact', 30)">30天预览</button>
      </div>
      <hr>

      <div v-for="(p, d) in allPlans" :key="d">
        <div :class="`box ${d === today ? 'good' : ''}`">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <div>
              <b>{{ dateLabel(d) }}</b>
              <span v-if="!p.trainability.canTrain" class="pill gray">休息</span>
              <span v-else class="pill green">可安排课程</span>
              <span v-if="p.schedule?.nightShift" class="pill orange">夜班</span>
              <span v-if="p.orientation === 'hyrox'" class="pill" style="background:#fff3e0;color:#e65100">🏆</span>
              <span v-else class="pill" style="background:#e8f5e9;color:#2e7d32">🏃</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <span class="pill blue">{{ p.roleLabel }}</span>
              <span v-if="p.classPlan" class="pill blue" style="font-size:11px">{{ p.classPlan.name }}</span>
              <span v-else class="pill green">{{ p.selfPlan?.name || '休息' }}</span>
              <span v-if="p.selfPlan?.variantKey" class="pill orange" style="font-size:11px">{{ p.selfPlan?.variant?.labelShort }}</span>
            </div>
          </div>
          <div v-if="isDetailDay(d)" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">
            <div v-if="p.classPlan">
              <b>课程</b>: {{ p.classPlan.name }}{{ p.classPlan.focus ? `（${p.classPlan.focus}）` : '' }} · {{ p.classPlan.duration }}分钟 · RPE {{ p.classPlan.rpeMin ?? p.classPlan.rpe }}-{{ p.classPlan.rpeMax ?? p.classPlan.rpe }}
            </div>
            <div v-if="p.selfPlan">
              <b>自助</b>: {{ p.selfPlan.name }}{{ p.selfPlan.variantKey ? ` · ${p.selfPlan.variant?.labelShort}` : '' }} · {{ p.selfPlan.duration }}分钟 · RPE {{ p.selfPlan.rpeMin ?? p.selfPlan.rpe }}-{{ p.selfPlan.rpeMax ?? p.selfPlan.rpe }}
            </div>
            <div class="muted" style="margin-top:4px">
              疲劳 {{ Math.round(calc.calcFatigueScore(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets)) }} · 战力 {{ Math.round(calc.calcCombatPower(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets)) }} · 预算 {{ Math.round(calc.getDailyBudget(d, store.data.logs, store.data.schedule, store.data.profile, store.data.presets)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { useCalc } from '../composables/useCalc'
import { todayStr, dateLabel, addDays, nval } from '../utils/helpers'

const store = useAppStore()
const calc = useCalc()

const today = computed(() => store.currentToday || todayStr())
const todayStatus = ref(store.data.logs[today.value]?.status || '')
const sleepVal = ref('')
const totalDays = ref(store.data.profile.homeTotalDays ?? (store.data.profile?.homeTotalDays ?? 7))
const detailDays = ref(store.data.profile.homeDetailDays ?? (store.data.profile?.homeDetailDays ?? 4))
const detOffsets = ref(store.data.profile.homeDetailOffsets ?? (store.data.profile?.homeDetailOffsets ?? "0,1,2,3"))

const schedule = computed(() => store.normalizeScheduleItem(store.data.schedule[today.value]))
const todaySleep = computed(() => store.data.logs[today.value]?.sleepHours || 0)
const fatigueVal = computed(() => Math.round(calc.calcFatigueScore(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets)))
const combatVal = computed(() => Math.round(calc.calcCombatPower(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets)))

const plan = computed(() => store.makePlan(today.value))
const energy = computed(() => plan.value.energy)
const meal = computed(() => {
  const primaryPlan = plan.value.primaryItems?.[0]?.plan || plan.value.selfPlan
  return store.mealAdvice(primaryPlan, plan.value.energy, schedule.value)
})
const budget = computed(() => calc.getDailyBudget(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))
const personalMax = computed(() => calc.getPersonalMax(store.data.logs, store.data.profile, store.data.presets))
const al7 = computed(() => calc.getAL7(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))
const cl28 = computed(() => calc.getCL28(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))
const acwr = computed(() => calc.calcACWR(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))
const rs = computed(() => calc.calcRS(today.value, store.data.logs, store.data.schedule, store.data.profile, store.data.presets))

const hasSelf = computed(() => !!plan.value.selfPlan)

function setOrientation(ori) {
  store.data.profile.trainingOrientation = ori
  store.saveData()
}

function goToLog() {
  store.switchTab('log')
}

function goToSelfTrain() {
  store.switchTab('selftrain')
}

function goToClasses() {
  store.switchTab('classes')
}

const fatigueDetail = computed(() => {
  const d = today.value
  const l = store.data.logs
  const s = store.data.schedule
  const p = store.data.profile
  const pr = store.data.presets
  const acuteRaw = calc.getAcuteFatigue(d, l, s, p, pr, true)
  const acute = calc.getAcuteFatigue(d, l, s, p, pr)
  const chronic = calc.getChronicFatigue(d, l, s, p, pr)
  const al7 = calc.getAL7(d, l, s, p, pr)
  const cl28 = calc.getCL28(d, l, s, p, pr)
  const acwr = calc.calcACWR(d, l, s, p, pr)
  const rs = calc.calcRS(d, l, s, p, pr)
  const ofs = calc.calcOFS(d, l, s, p, pr)
  const recFactor = calc.calcRecoveryFactor(d, l, p)
  const longTermMap = nval(p.longTermMapFactor, 15)
  const sleepPenalty = calc.calcSleepPenalty(d, l, p)
  const avgSleep = calc.getAvgSleep7(d, l, p)
  const lastNightSleep = calc.getLastNightSleep(d, l, p)
  const sleepTarget = nval(p.sleepTargetHours, 7)
  const penaltyPerHour = nval(p.sleepPenaltyPerHour, 5)
  const shortWeight = nval(p.shortTermWeight, 0.7)
  const longWeight = nval(p.longTermWeight, 0.3)
  const acuteContrib = Math.round(shortWeight * acute * 10) / 10
  const chronicContrib = Math.round(longWeight * chronic * 10) / 10
  const fatigue = calc.calcFatigueScore(d, l, s, p, pr)
  const feelingCoeff = calc.getFeelingCoefficient(d, l, p)
  const base = 100 - fatigue
  const combat = calc.calcCombatPower(d, l, s, p, pr)
  const personalMax = calc.getPersonalMax(l, p, pr)
  const coef = nval(p.acuteConversion, 0.2) * 100 / (personalMax * 0.5)
  const decayRate = nval(p.acuteDecayRate, 0.5)
  const conversion = nval(p.acuteConversion, 0.2)
  return {
    acuteRaw: Math.round(acuteRaw * 10) / 10,
    acute: Math.round(acute * 10) / 10,
    chronic: Math.round(chronic * 10) / 10,
    al7: Math.round(al7), cl28: Math.round(cl28),
    acwr: Math.round(acwr * 100) / 100,
    rs: Math.round(rs * 100) / 100,
    ofs: Math.round(ofs * 100) / 100,
    recFactor: Math.round(recFactor * 100) / 100,
    longTermMap,
    sleepPenalty: Math.round(sleepPenalty * 10) / 10,
    avgSleep: Math.round(avgSleep * 10) / 10,
    lastNightSleep: Math.round(lastNightSleep * 10) / 10,
    sleepTarget,
    penaltyPerHour,
    shortWeight, longWeight,
    acuteContrib, chronicContrib,
    fatigue: Math.round(fatigue),
    feelingCoeff: Math.round(feelingCoeff * 100) / 100,
    base: Math.round(base * 10) / 10,
    combat: Math.round(combat),
    personalMax: Math.round(personalMax),
    coef: Math.round(coef * 10000) / 10000,
    decayRate: Math.round(decayRate * 100) / 100,
    conversion: Math.round(conversion * 100) / 100,
    backtrackDays: Math.ceil(Math.log(0.005) / Math.log(decayRate))
  }
})

const statusPill = computed(() => {
  const s = todayStatus.value
  if (!s) return { color: 'pill', text: '状态未设置' }
  const m = { '很好': 'green', '正常': 'blue', '疲劳': 'orange', '很疲劳': 'red', '生病/不适': 'red' }
  return { color: `pill ${m[s] || 'gray'}`, text: s }
})

const combatPill = computed(() => {
  const c = combatVal.value
  if (c >= 70) return { color: 'pill green', text: `战力 ${c}` }
  if (c >= 50) return { color: 'pill blue', text: `战力 ${c}` }
  if (c >= 30) return { color: 'pill orange', text: `战力 ${c}` }
  return { color: 'pill red', text: `战力 ${c}` }
})

const rolePill = computed(() => {
  const r = plan.value.role
  const m = { no_train: 'gray', recovery: 'purple', z2: 'blue', strength: 'green', hyrox: 'red', conditioning: 'orange', rest: 'gray' }
  return { color: `pill ${m[r] || 'gray'}`, text: store.roleLabel(r) }
})

const acwrPill = computed(() => {
  const v = acwr.value
  if (v > 1.5) return { color: 'pill red', text: `ACWR ${v.toFixed(2)}⚠` }
  if (v > 1.3) return { color: 'pill orange', text: `ACWR ${v.toFixed(2)}` }
  return { color: 'pill green', text: `ACWR ${v.toFixed(2)}` }
})

function roleLabel(role) {
  const m = { no_train: '不可安排课程', recovery: '恢复', z2: 'Z2有氧', strength: '力量', hyrox: 'HYROX', conditioning: '综合体能', rest: '完全休息' }
  return m[role] || role
}

function isDetailDay(d) {
  const offsets = (detOffsets.value || "0,1,2,3").split(/[,，\s]+/).map(x => nval(x.trim(), 0)).filter(x => !isNaN(x))
  const idx = offsets.indexOf(diffFromToday(d))
  const topN = nval(detailDays.value, 4)
  return idx >= 0 && idx < topN
}

function diffFromToday(d) {
  const t = new Date(today.value + "T00:00:00")
  const dd = new Date(d + "T00:00:00")
  return Math.round((dd - t) / 86400000)
}

const allPlans = computed(() => {
  const result = {}
  for (let i = 1; i <= totalDays.value; i++) {
    const d = addDays(today.value, i)
    const p = store.makePlan(d)
    result[d] = { ...p, roleLabel: roleLabel(p.role) }
  }
  return result
})

function onStatusChange() {
  store.setTodayStatus(todayStatus.value)
}

function onSleepEnter() {
  const v = nval(sleepVal.value, 0)
  if (v <= 0) return
  store.setTodaySleep(v)
  sleepVal.value = ''
}

function refreshHome() {}

function applyDetailSettings() {
  store.data.profile.homeTotalDays = nval(totalDays.value, 7)
  store.data.profile.homeDetailDays = nval(detailDays.value, 4)
  store.data.profile.homeDetailOffsets = detOffsets.value
  store.saveData()
}

function openDayPicker(type, days) {
  totalDays.value = days
  refreshHome()
}
</script>

<style scoped>
.orientation-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg);
  border-radius: 10px;
  padding: 3px;
}

.toggle-btn {
  padding: 4px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--blue);
  color: #fff;
  font-weight: 600;
}

.combined-plan-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: stretch;
}

.plan-card.primary {
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

@media (max-width: 700px) {
  .combined-plan-grid {
    grid-template-columns: 1fr;
  }
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-actions .plan-select-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: var(--blue);
  color: white;
  transition: opacity 0.2s;
  text-align: center;
}

.plan-actions .plan-select-btn:hover {
  opacity: 0.85;
}

.plan-actions .text-btn {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 14px;
  background: var(--card);
  color: var(--blue);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.plan-actions .text-btn:hover {
  background: var(--blue);
  color: white;
  border-color: var(--blue);
}

.plan-card {
  background: var(--bg);
  border-radius: 12px;
  padding: 14px;
}

.plan-card.alt-section {
  min-width: 0;
}

.plan-reason {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 12px;
  margin-top: 4px;
}

.plan-item-card {
  margin-bottom: 12px;
}

.plan-item-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 15px;
}

.plan-item-main .pill {
  font-size: 13px;
  padding: 3px 10px;
}

.meta-text {
  color: var(--muted);
  font-size: 15px;
  margin-left: 2px;
}

.plan-details {
  margin-top: 8px;
  padding: 12px 14px;
  background: var(--bg);
  border-radius: 8px;
  border: 1px solid var(--line);
  font-size: 15px;
  color: var(--text);
  line-height: 1.7;
}

.plan-details b {
  color: var(--text);
  font-weight: 600;
  display: inline-block;
  min-width: 36px;
}

.alt-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.alt-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.alt-label {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 6px;
  color: var(--text);
}

.alt-plan-item {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 6px;
  margin-left: 4px;
  font-size: 15px;
}

.alt-plan-item .meta-text {
  color: var(--muted);
  font-size: 14px;
}

.alt-plan-item .pill {
  font-size: 13px;
  padding: 3px 10px;
}

.alt-exercise-list {
  margin-top: 6px;
  margin-left: 4px;
  padding: 10px 12px;
  background: var(--bg);
  border-radius: 8px;
  border: 1px solid var(--line);
  font-size: 14px;
  color: var(--text);
  line-height: 1.7;
}

.alt-warmup, .alt-cooldown {
  font-size: 13px;
  color: #78716c;
}

.alt-ex-line {
  padding: 2px 0;
  font-size: 14px;
}

.alt-run-info {
  font-size: 14px;
  color: var(--text);
}

.plan-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.plan-title {
  font-weight: 600;
  font-size: 16px;
}

.orientation-tag {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  background: #f3e5f5;
  color: #7b1fa2;
}

.orientation-tag.self-tag {
  background: #e8f5e9;
  color: #2e7d32;
}

.kcal-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  min-width: 100px;
}
.kcal-badge.blue { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
.kcal-badge.green { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.kcal-badge.yellow { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
.kcal-badge b { display: block; font-size: 18px; margin-top: 2px; }

.meal-cards { }
.meal-card {
  flex: 1 1 calc(50% - 5px);
  min-width: 200px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
}
.meal-card.wide { flex: 1 1 100%; }
.meal-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.meal-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}
.meal-examples {
  margin: 0;
  padding-left: 16px;
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}
.meal-examples li { margin-bottom: 2px; }

</style>
