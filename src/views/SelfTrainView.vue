<template>
  <div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <h2>📋 今日自助训练</h2>
        <div style="display:flex;gap:6px">
          <span :class="['pill', plan.orientation === 'hyrox' ? '' : 'green']">
            {{ plan.orientation === 'hyrox' ? '🏆 HYROX导向' : '🏃 减脂导向' }}
          </span>
          
        </div>
      </div>
    </div>

    <div v-if="plan?.role === 'no_train' || plan?.role === 'recovery'" class="card">
      <h3>🛌 今日安排</h3>
      <div class="box">
        <div v-for="(item, idx) in plan?.selfPlan?.items || []" :key="idx" style="margin-bottom:4px">
          <b>{{ item[0] }}</b>: {{ item[1] }}
        </div>
      </div>
    </div>

    <div v-else>
      <div class="card" v-if="showStrength">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <h3 style="margin:0">💪 自助力量</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="pill green">{{ selectedLabel }}</span>
          </div>
        </div>

        <div class="box">
          <div class="grid">
            <div class="col-4">
              <span class="muted">类型</span>
              <div><b>{{ selectedLabel }}</b></div>
            </div>
            <div class="col-4">
              <span class="muted">时长</span>
              <div><b>{{ strengthVariant?.duration || 60 }} 分钟</b></div>
            </div>
            <div class="col-4">
              <span class="muted">消耗</span>
              <div><b>MET {{ strengthVariant?.met || 6.5 }} · 疲劳{{ strengthVariant?.fatigue || 5 }}</b></div>
            </div>
          </div>
          <div v-if="strengthVariant?.reason" class="notice" style="margin-top:8px">{{ strengthVariant.reason }}</div>
        </div>

        <div style="margin-top:10px">
          <div class="muted" style="margin-bottom:6px;font-size:13px">选择力量方案</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button v-for="(vp, key) in STRENGTH_VARIANTS" :key="key"
              :class="['button', selectedStrengthVariant === key ? 'primary' : 'secondary', blockedStrengthKeys.includes(key) ? 'disabled' : '']"
              :disabled="blockedStrengthKeys.includes(key)"
              :title="blockedStrengthKeys.includes(key) ? strengthBlockReason : ''"
              style="padding:5px 12px;font-size:12px"
              @click="selectStrength(key)">{{ vp.labelShort }}</button>
          </div>
          <div v-if="blockedStrengthKeys.length" class="warn" style="margin-top:6px;font-size:12px">
            ⚠ {{ strengthBlockReason }} — {{ blockedStrengthKeys.map(k => STRENGTH_VARIANTS[k].labelShort).join('、') }}自动跳过，推荐选{{ STRENGTH_VARIANTS[selectedStrengthVariant]?.labelShort }}
          </div>
        </div>

        <hr>
        <div class="muted" style="margin-bottom:4px;font-size:12px;cursor:pointer;user-select:none" @click="expandedStrength = !expandedStrength">
          {{ expandedStrength ? '▲ 收起动作详情' : '▼ 查看动作详情' }}
        </div>

        <div v-if="expandedStrength && strengthPlan" class="box">
          <div class="good" style="font-size:13px;margin-bottom:8px"><b>🏃 热身</b>: {{ strengthPlan.warmup }}</div>

          <div style="margin-bottom:12px"><b>🎯 训练动作</b></div>
          <div v-for="(ex, idx) in strengthPlan.exercises" :key="idx" class="box" style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">
              <b>{{ ex.name }}</b>
              <span class="pill blue">{{ ex.sets }}组 × {{ ex.reps }}</span>
            </div>
            <div class="grid" style="margin-top:4px;font-size:12px">
              <div class="col-4"><span class="muted">重量</span> {{ ex.weight || '自重' }}</div>
              <div class="col-4"><span class="muted">休息</span> {{ ex.rest }}</div>
              <div class="col-4"><span class="muted">RPE</span> {{ ex.rpe }}</div>
            </div>
            <div class="muted" style="font-size:12px;margin-top:4px">{{ ex.tip }}</div>
          </div>

          <div v-if="strengthPlan.coreFinisher" style="margin-bottom:8px">
            <b>🔥 核心收尾</b>
            <div v-for="(core, idx) in strengthPlan.coreFinisher" :key="idx" class="muted" style="font-size:13px;margin-left:8px">
              {{ core.name }}: {{ core.sets }}组 × {{ core.reps }}
            </div>
          </div>

          <div class="muted" style="font-size:13px"><b>🧘 放松</b>: {{ strengthPlan.cooldown }}</div>
        </div>
      </div>

      <div class="card" v-if="showRun">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <h3 style="margin:0">🏃 自助跑步</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="pill blue">{{ selectedRunLabel }}</span>
          </div>
        </div>

        <div class="box">
          <div class="grid">
            <div class="col-4">
              <span class="muted">类型</span>
              <div><b>{{ selectedRunLabel }}</b></div>
            </div>
            <div class="col-4">
              <span class="muted">时长</span>
              <div><b>{{ runVariant?.duration || 65 }} 分钟</b></div>
            </div>
            <div class="col-4">
              <span class="muted">消耗</span>
              <div><b>MET {{ runVariant?.met || 5.5 }} · 疲劳{{ runVariant?.fatigue || 2 }}</b></div>
            </div>
          </div>
          <div v-if="runVariant?.reason" class="notice" style="margin-top:8px">{{ runVariant.reason }}</div>
        </div>

        <div style="margin-top:10px">
          <div class="muted" style="margin-bottom:6px;font-size:13px">选择跑步方案</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button v-for="(vp, key) in RUN_VARIANTS" :key="key"
              :class="['button', selectedRunVariant === key ? 'primary' : 'secondary']"
              style="padding:5px 12px;font-size:12px"
              @click="selectedRunVariant = key">{{ vp.labelShort }}</button>
          </div>
        </div>

        <hr>
        <div class="muted" style="margin-bottom:4px;font-size:12px;cursor:pointer;user-select:none" @click="expandedRun = !expandedRun">
          {{ expandedRun ? '▲ 收起跑步详情' : '▼ 查看跑步详情' }}
        </div>

        <div v-if="expandedRun && runPlan" class="box">
          <div class="good" style="font-size:13px;margin-bottom:8px"><b>🏃 热身</b>: {{ runPlan.warmup }}</div>

          <div style="margin-bottom:8px"><b>🎯 主项</b></div>
          <div class="box" style="font-size:13px">
            <div>{{ runPlan.main.description }}</div>
            <div class="good" style="margin-top:6px;font-size:14px">{{ runPlan.main.hrRange }}</div>
            <div class="muted">RPE: {{ runPlan.main.rpe }}</div>
            <div v-if="runPlan.main.keyRule" class="warn" style="margin-top:6px">{{ runPlan.main.keyRule }}</div>
          </div>

          <div v-if="runPlan.main.templates" style="margin-top:10px">
            <b>可选模板</b>
            <div v-for="(tmpl, idx) in runPlan.main.templates" :key="idx" class="box" style="margin-top:6px;font-size:13px">
              <div><b>{{ tmpl.name }}</b></div>
              <div class="blue-text">{{ tmpl.intervals }}</div>
              <div class="muted">组间: {{ tmpl.rest }} · 总时长: {{ tmpl.total }}</div>
            </div>
          </div>

          <div class="muted" style="font-size:13px;margin-top:10px"><b>🧘 缓和</b>: {{ runPlan.cooldown }}</div>

          <div v-if="runPlan.notes" style="margin-top:10px">
            <b>📝 注意事项</b>
            <ul style="margin:4px 0 0 18px;font-size:12px;color:var(--muted);line-height:1.6">
              <li v-for="(note, idx) in runPlan.notes" :key="idx">{{ note }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="text-align:center">
      <button class="primary" style="padding:12px 36px;font-size:15px" @click="goToLog">📝 直接去打卡</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { STRENGTH_VARIANTS, RUN_VARIANTS } from '../config/selfTrainPresets'

const store = useAppStore()

const plan = computed(() => store.makePlan(store.currentToday))
const strengthVariant = computed(() => plan.value?.selfPlan?.variant)

const selectedStrengthVariant = ref('fullA')
const selectedRunVariant = ref('lsd')
const expandedStrength = ref(false)
const expandedRun = ref(false)

const showStrength = computed(() => {
  const role = plan.value?.role
  return role !== 'no_train' && role !== 'recovery'
})

const showRun = computed(() => {
  const role = plan.value?.role
  return role !== 'no_train' && role !== 'recovery'
})

const roleLabel = computed(() => {
  const role = plan.value?.role
  const m = { strength: '力量日', hyrox: '综合训练日', z2: '有氧日', recovery: '恢复日', no_train: '休息日' }
  return m[role] || role || ''
})

const selectedLabel = computed(() => STRENGTH_VARIANTS[selectedStrengthVariant.value]?.label || '全身A')
const selectedRunLabel = computed(() => RUN_VARIANTS[selectedRunVariant.value]?.label || 'LSD 燃脂跑')

const lowerConflict = computed(() => store.getRecentLowerDominant(store.currentToday, 2))
const blockedStrengthKeys = computed(() => {
  if (!lowerConflict.value.length) return []
  return Object.entries(STRENGTH_VARIANTS)
    .filter(([, vp]) => vp.isLower)
    .map(([key]) => key)
})
const strengthBlockReason = computed(() => {
  if (!lowerConflict.value.length) return ''
  return `近2天有下肢主导训练（${lowerConflict.value[0].activity}）`
})

function selectStrength(key) {
  if (blockedStrengthKeys.value.includes(key)) return
  selectedStrengthVariant.value = key
}

watch(() => blockedStrengthKeys.value, (keys) => {
  if (keys.includes(selectedStrengthVariant.value)) {
    const available = Object.keys(STRENGTH_VARIANTS).filter(k => !keys.includes(k))
    if (available.length) selectedStrengthVariant.value = available[0]
  }
}, { immediate: true })

const strengthPlan = computed(() => store.getStrengthPlan(selectedStrengthVariant.value, store.data.profile))
const runPlan = computed(() => store.RUN_PLANS[selectedRunVariant.value] || null)

const runVariant = computed(() => {
  const key = selectedRunVariant.value
  return RUN_VARIANTS[key] ? { key, ...RUN_VARIANTS[key], reason: '' } : null
})

function goToLog() {
  store.switchTab('log')
}

watch(() => strengthVariant.value?.key, (newKey) => {
  if (newKey) selectedStrengthVariant.value = newKey
})

watch(() => plan.value?.selfPlan?.variant?.key, (newKey) => {
  if (newKey) selectedRunVariant.value = newKey
})
</script>

<style scoped>
.blue-text { color: var(--blue); font-weight: 500; }
.button.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}
</style>
