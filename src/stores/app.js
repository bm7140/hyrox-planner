import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import {
  todayStr, nowISO, nval, deepClone, esc, sid, addDays, daysBetween, diffDays,
  dateLabel, pill, newerISO, normalizeCode, betweenDate, oldNameMap
} from '../utils/helpers'
import { CLASS_PRESETS, CLASS_NAMES, LOG_TYPES } from '../config/classPresets'
import { VERSION, STORAGE_KEY } from '../config/constants'
import { DEFAULT_PROFILE } from '../config/defaultProfile'
import { ROLE_META } from '../config/roleMeta'
import { genMeals, calcMacros, calcHydration } from '../config/nutritionPresets'
import { useCalc } from '../composables/useCalc'
import { useStorage } from '../composables/useStorage'
import {
  RUN_VARIANTS, RUN_VARIANT_KEYS, STRENGTH_VARIANTS,
  STRENGTH_VARIANT_KEYS, STRENGTH_VARIANT_ORDER,
  LOWER_DOMINANT_COURSES, LOWER_DOMINANT_SELF_FOCUS,
  getRunVariantParams, getStrengthVariantParams,
  DEFAULT_SELF_TRAIN_PROFILE
} from '../config/selfTrainPresets'
import { getStrengthPlan } from '../config/strengthPlans'
import { RUN_PLANS } from '../config/runPlans'

export const useAppStore = defineStore('app', () => {
  const calc = useCalc()
  const storage = useStorage()

  const data = reactive(storage.loadInitialData())

  if (!data.profile.selfTrain) {
    data.profile.selfTrain = deepClone(DEFAULT_SELF_TRAIN_PROFILE)
  }

  const scheduleViewStart = ref(todayStr())
  const classViewStart = ref(todayStr())
  const logViewDate = ref(todayStr())
  const bodyStatsViewStart = ref(todayStr())
  const currentToday = ref(todayStr())
  const midnightTimer = ref(null)
  const activityDraft = ref([])
  const activeTab = ref('home')

  const syncCode = ref(localStorage.getItem('hyrox_training_planner_sync_code') || '')
  const cloudRevision = ref(0)
  const isSyncing = ref(false)
  const isFirstSessionCompleted = ref(sessionStorage.getItem("hyrox_first_sync_completed") === "true")
  const autoSyncEnabled = ref(false)

  const supabaseClient = (() => {
    try {
      if (window.supabase) {
        return window.supabase.createClient(
          'https://xoqgcbxrnewwfulslnfi.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcWdjYnhybmV3d2Z1bHNsbmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjA3MTMsImV4cCI6MjA5MzczNjcxM30.nMh1yGtTvnhNo3FgHkeSZOjVBJsyCb5qUfYwVLWaDSM'
        )
      }
    } catch(e) {}
    return null
  })()

  let autoPushTimer = null
  let autoPushPending = false

  function getClassNames() {
    return calc.getClassNames(data.presets)
  }

  function getLogTypes() {
    return calc.getLogTypes(data.presets)
  }

  function getClassesForDate(d) {
    return calc.getClassesForDate(d, data.classes)
  }

  function setClassesForDate(d, items, ts = nowISO()) {
    data.classes[d] = { items: Array.from(new Set((items || []).map(oldNameMap).filter(Boolean))), updatedAt: ts }
  }

  function saveLocalOnly() {
    data.meta = { ...(data.meta || {}), version: VERSION, updatedAt: nowISO() }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch(e) {}
  }

  async function pushToCloud() {
    if (!supabaseClient || !syncCode.value) return
    try {
      const { data: rows, error } = await supabaseClient.rpc("push_planner_by_code", {
        p_code: syncCode.value,
        p_state: storage.mergeData(data)
      })
      if (error) throw error
      if (rows && rows.length) cloudRevision.value = Number(rows[0].revision || 0)
    } catch(e) {
      console.warn("auto push failed:", e.message)
    }
  }

  function scheduleAutoPush() {
    if (!autoSyncEnabled.value || !supabaseClient || !syncCode.value) return
    autoPushPending = true
    if (autoPushTimer) clearTimeout(autoPushTimer)
    autoPushTimer = setTimeout(() => {
      autoPushPending = false
      pushToCloud()
    }, 2000)
  }

  function saveData() {
    saveLocalOnly()
    scheduleAutoPush()
  }

  async function pullFromCloud() {
    if (!supabaseClient || !syncCode.value) return null
    try {
      const { data: rows, error } = await supabaseClient.rpc("pull_planner_by_code", { p_code: syncCode.value })
      if (error) throw error
      return rows && rows.length ? rows[0] : null
    } catch(e) {
      console.warn("pull from cloud failed:", e.message)
      return null
    }
  }

  async function initAutoSync() {
    if (isFirstSessionCompleted.value) return
    if (!syncCode.value || !supabaseClient) return

    isSyncing.value = true
    try {
      const row = await pullFromCloud()
      if (row && row.state) {
        cloudRevision.value = Number(row.revision || 0)
        const cloudState = storage.mergeData(row.state || {})
        Object.assign(data, cloudState)
        saveLocalOnly()
      }
      isFirstSessionCompleted.value = true
      sessionStorage.setItem("hyrox_first_sync_completed", "true")
      autoSyncEnabled.value = true
    } catch(e) {
      console.warn("init auto sync failed:", e.message)
    } finally {
      isSyncing.value = false
    }
  }

  function normalizeScheduleItem(x) {
    if (!x) return null
    if (x.workPhase) {
      return {
        cycleDay: nval(x.cycleDay, 1), workPhase: x.workPhase, work: !!x.work,
        canTrain: !!x.canTrain, nightShift: !!x.nightShift,
        trainWindow: x.canTrain ? (x.trainWindow || data.profile.trainWindow) : "",
        note: x.note || "", updatedAt: x.updatedAt || ""
      }
    }
    const cd = ((nval(x.cycleDay || x.day, 1) - 1) % 4) + 1
    return scheduleTemplate(cd, !!x.nightShift, x.updatedAt || "", x.note || "")
  }

  function scheduleTemplate(cycleDay, nightShift = false, updatedAt = "", note = "") {
    const cd = nval(cycleDay, 1)
    if (cd === 1) return { cycleDay: 1, workPhase: "work1", work: true, canTrain: false, nightShift: false, trainWindow: "", note, updatedAt }
    if (cd === 2) return { cycleDay: 2, workPhase: "work2", work: true, canTrain: true, nightShift: !!nightShift, trainWindow: data.profile.trainWindow, note, updatedAt }
    if (cd === 3) return { cycleDay: 3, workPhase: "rest1", work: false, canTrain: true, nightShift: false, trainWindow: data.profile.trainWindow, note, updatedAt }
    return { cycleDay: 4, workPhase: "rest2", work: false, canTrain: true, nightShift: false, trainWindow: data.profile.trainWindow, note, updatedAt }
  }

  function phaseLabel(s) {
    if (!s) return "未排班"
    const m = { work1: "上班第1天", work2: "上班第2天", rest1: "休息第1天", rest2: "休息第2天" }
    return m[s.workPhase] || `Day${s.cycleDay}`
  }

  function roleLabel(role) { return ROLE_META[role]?.label || role }

  function getTrainability(d) {
    const s = normalizeScheduleItem(data.schedule[d])
    if (!s) return { canTrain: false, reason: "未排班", window: "", nightShift: false }
    if (!s.canTrain) return { canTrain: false, reason: "上班第1天，上午不可安排课程", window: "", nightShift: false }
    if (s.nightShift) return { canTrain: true, reason: "上午可安排课程，但当天夜班，建议降级控制强度", window: s.trainWindow || data.profile.trainWindow, nightShift: true }
    return { canTrain: true, reason: "上午09:30-13:30可安排课程", window: s.trainWindow || data.profile.trainWindow, nightShift: false }
  }

  function decideRole(d, s, tr) {
    const combat = calc.calcCombatPower(d, data.logs, data.schedule, data.profile, data.presets)
    if (!s) return "no_train"
    if (!tr.canTrain) return "no_train"
    const todayLog = data.logs[d]
    const todayStatus = todayLog?.status || "正常"
    if (todayStatus === "生病/不适") return "recovery"
    if (combat < 30) return "recovery"
    if (combat < 50) return "z2"
    if (s.workPhase === "work2") {
      if (combat >= 70) return "hyrox"
      return "strength"
    }
    if (s.workPhase === "work1") {
      if (combat >= 70) return "hyrox"
      if (combat >= 50) return "strength"
      return "z2"
    }
    if (s.workPhase === "rest1") {
      if (combat >= 70) return "hyrox"
      if (combat >= 50) return "strength"
      return "z2"
    }
    if (s.workPhase === "rest2") {
      if (combat >= 70) return "hyrox"
      if (combat >= 50) return "strength"
      if (combat >= 30) return "z2"
      return "recovery"
    }
    return "recovery"
  }

  function classScoreForRole(name, role, d) {
    const p = calc.classPreset(name, data.presets)
    const combat = calc.calcCombatPower(d, data.logs, data.schedule, data.profile, data.presets)
    const required = calc.getRequiredCombat(name, data.presets)
    const budget = calc.getDailyBudget(d, data.logs, data.schedule, data.profile, data.presets)
    const itemALU = p.duration * p.met * ((p.rpeMin + p.rpeMax) / 2 / 10)
    if (required > combat) return -100
    if (itemALU > budget) return -100
    let score = 50
    if (role === "no_train" || role === "rest") {
      if (name === "瑜伽静态拉伸") score += 30
      if (name === "普拉提核心") score += 20
      return score
    }
    if (role === "recovery") {
      if (["瑜伽静态拉伸", "普拉提核心", "快走/坡走"].includes(name)) score += 30
      if (p.fatigue <= 3) score += 10
    }
    if (role === "z2") {
      if (["Z2单车/椭圆机", "快走/坡走", "自助跑步"].includes(name)) score += 30
      if (["瑜伽静态拉伸", "普拉提核心"].includes(name)) score += 10
    }
    if (role === "strength") {
      if (name === "私教力量") score += 40
      if (["BodyPump", "TRX功能性训练", "自助力量"].includes(name)) score += 20
    }
    if (role === "hyrox") {
      if (["HYROX Engine", "HYROX Power", "循环训练", "高能药球", "战绳训练", "BodyCombat", "TRX功能性训练"].includes(name)) score += 30
      if (name === "HYROX Complete") score += combat >= 80 ? 20 : -30
      if (name === "私教力量") score += 15
    }
    if (role === "conditioning") {
      if (["循环训练", "BodyCombat", "BodyPump", "TRX功能性训练", "战绳训练"].includes(name)) score += 30
      if (["HYROX Engine", "HYROX Power"].includes(name)) score += 20
    }
    if (name === "私教力量" && role !== "strength") {
      score += 15
    }
    score += nval(p.hyrox, 0) * 0.5
    return score
  }

  function selectBestClass(d, role, available) {
    const scored = (available || []).map(name => ({ name, score: classScoreForRole(name, role, d) }))
      .sort((a, b) => b.score - a.score)
    return scored[0]?.name || ""
  }

  function hasPrivateLegOnDate(d) {
    // 判断某个日期是否有私教练腿（从课表或打卡记录）
    const log = data.logs[d]
    if (log) {
      const activities = calc.getActivitiesFromLog(log, data.presets)
      for (const act of activities) {
        if (act.type === "私教力量" && act.focus === "腿") {
          return true
        }
      }
    }
    const classes = getClassesForDate(d)
    if (classes.includes("私教力量")) {
      const nextFocus = calc.nextPrivateFocus(d, data.logs, data.profile, data.presets)
      return nextFocus === "腿"
    }
    return false
  }

  function getRecentLowerDominant(d, daysBack = 2) {
    const results = []
    for (let i = 1; i <= daysBack; i++) {
      const targetDate = addDays(todayStr(), -i)
      const log = data.logs[targetDate]
      if (!log) continue
      const activities = calc.getActivitiesFromLog(log, data.presets)
      for (const act of activities) {
        if (LOWER_DOMINANT_COURSES.includes(act.type)) {
          results.push({ date: targetDate, activity: act.type })
        }
        if (act.type === "私教力量" && LOWER_DOMINANT_SELF_FOCUS.includes(act.focus)) {
          results.push({ date: targetDate, activity: `私教力量(${act.focus})` })
        }
        if (LOWER_DOMINANT_COURSES.includes(act.type)) {
          results.push({ date: targetDate, activity: act.type })
        }
      }
    }
    return results
  }

  function getRecentRunVariant(d, variantKey, daysBack) {
    for (let i = 1; i <= daysBack; i++) {
      const targetDate = addDays(todayStr(), -i)
      const log = data.logs[targetDate]
      if (!log) continue
      const activities = calc.getActivitiesFromLog(log, data.presets)
      for (const act of activities) {
        if (act.type === "自助跑步" && act.variant === variantKey) return true
      }
    }
    return false
  }

  function getRecentStrengthVariant(d, variantKey, daysBack) {
    for (let i = 1; i <= daysBack; i++) {
      const targetDate = addDays(todayStr(), -i)
      const log = data.logs[targetDate]
      if (!log) continue
      const activities = calc.getActivitiesFromLog(log, data.presets)
      for (const act of activities) {
        if (act.type === "自助力量" && act.variant === variantKey) return true
      }
    }
    return false
  }

  function selectStrengthVariant(d, role) {
    const orientation = data.profile.trainingOrientation || "fatLoss"
    const recentLower = getRecentLowerDominant(d, 2)
    const hasRecentLower = recentLower.length > 0
    const candidates = [...STRENGTH_VARIANT_KEYS]
    const filtered = candidates.filter(vKey => {
      const vp = STRENGTH_VARIANTS[vKey]
      if (vp.isLower && hasRecentLower) return false
      return true
    })
    const available = filtered.length > 0 ? filtered : candidates
    const scored = available.map(vKey => {
      let score = 50
      const vp = STRENGTH_VARIANTS[vKey]
      const recent = getRecentStrengthVariant(d, vKey, 2)
      if (recent) score -= 30
      if (vp.isLower) score += 5
      if (vp.isUpper) score += 5
      if (vp.isHybrid) score += 3
      if (role === "strength" && (vp.isLower || vp.isUpper)) score += 10
      if (role === "hyrox" && !vp.isUpper) score += 5
      return { key: vKey, score, vp }
    }).sort((a, b) => b.score - a.score)
    const selected = scored[0]?.key || "fullA"
    const selectedVp = STRENGTH_VARIANTS[selected]
    let reason = ""
    if (hasRecentLower && !selectedVp.isLower) {
      reason = `近2天有下肢主导训练（${recentLower[0].activity}），跳过大负荷下肢训练`
    } else if (recentLower.length > 0) {
      reason = "无下肢冲突，按轮转推荐"
    } else {
      reason = "无近期下肢训练记录"
    }
    const params = getStrengthVariantParams(selected, data.profile.selfTrain)
    return {
      key: selected,
      label: selectedVp.label,
      labelShort: selectedVp.labelShort,
      description: selectedVp.description,
      reason,
      duration: params.duration,
      met: params.met,
      rpeMin: params.rpeMin,
      rpeMax: params.rpeMax,
      fatigue: params.fatigue,
      plan: getStrengthPlan(selected, data.profile)
    }
  }

  function selectRunVariant(d, role) {
    const orientation = data.profile.trainingOrientation || "fatLoss"
    const combat = calc.calcCombatPower(d, data.logs, data.schedule, data.profile, data.presets)
    const tr = getTrainability(d)
    const todayLog = data.logs[d]
    const todayStatus = todayLog?.status || "正常"
    const orientation_ = orientation

    const scored = RUN_VARIANT_KEYS.map(vKey => {
      let score = 50
      const vp = RUN_VARIANTS[vKey]
      const params = getRunVariantParams(vKey, data.profile.selfTrain)

      if (params.fatigue > combat * 0.5 && combat < 40) return { key: vKey, score: -100, reason: "战力不足，淘汰" }
      if (vKey !== "lsd" && combat < 60) return { key: vKey, score: -100, reason: "战力低于60，不适合高强度间歇" }
      if (vKey === "vo2max" && combat < 80) return { key: vKey, score: -100, reason: "战力低于80，不适合VO2max" }
      if (todayStatus === "疲劳" || todayStatus === "很疲劳") {
        if (vKey === "vo2max") return { key: vKey, score: -100, reason: "状态疲劳，淘汰VO2max" }
        if (vKey === "threshold") return { key: vKey, score: score - 20, reason: "状态疲劳，降分" }
        if (vKey === "lsd") return { key: vKey, score: score + 15, reason: "状态疲劳，适合低强度" }
      }
      if (tr.nightShift) {
        if (vKey !== "lsd") return { key: vKey, score: -100, reason: "夜班日，仅适合LSD" }
        return { key: vKey, score: score + 10, reason: "夜班日，适合LSD" }
      }
      if (vKey === "vo2max") {
        const hasRecent = getRecentRunVariant(d, "vo2max", 10)
        if (hasRecent) return { key: vKey, score: -100, reason: "近10天已有VO2max，淘汰" }
        if (combat < 85) return { key: vKey, score: score - 10, reason: "战力85以下，VO2max降分" }
        score += 15
        if (orientation_ === "hyrox") score += 10
      }
      if (vKey === "threshold") {
        const hasRecentThreshold = getRecentRunVariant(d, "threshold", 4)
        if (hasRecentThreshold) {
          score -= 15
        } else {
          score += 15
        }
        if (orientation_ === "hyrox") score += 10
        if (combat >= 70) score += 10
        if (combat < 50) score += 10
      }
      if (vKey === "lsd") {
        const hasRecentThreshold = getRecentRunVariant(d, "threshold", 7)
        if (hasRecentThreshold) {
          score += 10
        }
        const hasRecentVO2 = getRecentRunVariant(d, "vo2max", 7)
        if (hasRecentVO2) score += 5
        const recentLSDs = RUN_VARIANT_KEYS.map(vk => getRecentRunVariant(d, vk, 7))
        const allRecent = recentLSDs.every((v, i) => i === 0 || !v)
        if (allRecent && orientation_ === "fatLoss") {
          score -= 5
        }
        if (orientation_ === "fatLoss") score += 25
        if (combat >= 50 && combat < 70) score += 5
      }
      return { key: vKey, score, reason: "" }
    }).filter(x => x.score > -50).sort((a, b) => b.score - a.score)

    const selected = scored[0]?.key || "lsd"
    const params = getRunVariantParams(selected, data.profile.selfTrain)
    const runPlan = RUN_PLANS[selected]
    let reason = scored[0]?.reason || ""
    if (!reason) {
      if (selected === "lsd") reason = orientation_ === "fatLoss" ? "减脂导向，默认LSD" : "低强度首选"
      if (selected === "threshold") reason = "战力/状态适宜，适合阈值训练"
      if (selected === "vo2max") reason = "战力充沛，适合冲击VO2max"
    }

    return {
      key: selected,
      label: RUN_VARIANTS[selected].label,
      labelShort: RUN_VARIANTS[selected].labelShort,
      description: RUN_VARIANTS[selected].description,
      hrZone: RUN_VARIANTS[selected].hrZone,
      reason,
      duration: params.duration,
      met: params.met,
      rpeMin: params.rpeMin,
      rpeMax: params.rpeMax,
      fatigue: params.fatigue,
      plan: runPlan
    }
  }

  function selfPlanForRole(d, role, s) {
    if (role === "no_train") return {
      name: "休息", role, focus: "", duration: 0, rpe: 0, variant: null, variantKey: null,
      items: [["安排", "不安排正式训练"], ["活动", "6000-8000步 + 10分钟拉伸"], ["原因", s ? "上班第1天，上午无法训练" : "未排班"]]
    }
    if (role === "recovery") return {
      name: "瑜伽静态拉伸", role, focus: "", duration: 30, rpe: 3, variant: null, variantKey: null,
      items: [["主项", "静态拉伸/活动度 20-30分钟"], ["心率", `恢复区 ${data.profile.recoveryHrLow}-${data.profile.recoveryHrHigh} bpm`], ["目标", "促进恢复，不制造额外疲劳"]]
    }
    if (role === "z2") return {
      name: "Z2单车/椭圆机", role, focus: "", duration: 45, rpe: 5, variant: null, variantKey: null,
      items: [["主项", "单车/椭圆机/坡走 40-60分钟"], ["心率", `Z2 ${data.profile.z2HrLow}-${data.profile.z2HrHigh} bpm`], ["目标", "减脂与有氧基础，不要冲到阈值"]]
    }
    const isStrength = role === "strength"
    const isHyrox = role === "hyrox"
    const isConditioning = role === "conditioning"
    const isRunType = isHyrox || isConditioning

    if (isRunType) {
      const runVariant = selectRunVariant(d, role)
      const runPlan = runVariant.plan
      return {
        name: "自助跑步",
        role,
        focus: "",
        duration: runVariant.duration,
        rpeMin: runVariant.rpeMin, rpeMax: runVariant.rpeMax,
        rpe: Math.round((runVariant.rpeMin + runVariant.rpeMax) / 2),
        variantKey: runVariant.key,
        variant: runVariant,
        items: [
          ["类型", runVariant.label],
          ["时长", `${runVariant.duration}分钟`],
          ["心率", getRunHRDisplay(runVariant)],
          ["消耗", "MET " + runVariant.met],
          ["理由", runVariant.reason]
        ]
      }
    }

    if (isStrength) {
      const strengthVariant = selectStrengthVariant(d, role)
      const sp = strengthVariant.plan
      return {
        name: "自助力量",
        role,
        focus: strengthVariant.key,
        duration: strengthVariant.duration,
        rpeMin: strengthVariant.rpeMin, rpeMax: strengthVariant.rpeMax,
        rpe: Math.round((strengthVariant.rpeMin + strengthVariant.rpeMax) / 2),
        variantKey: strengthVariant.key,
        variant: strengthVariant,
        items: [
          ["类型", strengthVariant.label],
          ["时长", `${strengthVariant.duration}分钟`],
          ["强度", `RPE ${strengthVariant.rpeMin}-${strengthVariant.rpeMax}，保留1-3次余力`],
          ["消耗", "MET " + strengthVariant.met],
          ["理由", strengthVariant.reason]
        ]
      }
    }
    return {
      name: "瑜伽静态拉伸", role, focus: "", duration: 30, rpe: 3, variant: null, variantKey: null,
      items: [["主项", "静态拉伸/活动度 20-30分钟"], ["心率", `恢复区 ${data.profile.recoveryHrLow}-${data.profile.recoveryHrHigh} bpm`]]
    }
  }

  function getRunHRDisplay(runVariant) {
    const z2Low = data.profile.z2HrLow
    const z2High = data.profile.z2HrHigh
    const lthr = data.profile.lthr
    const thrLow = data.profile.thresholdHrLow
    const thrHigh = data.profile.thresholdHrHigh
    if (runVariant.key === "lsd") return `${z2Low}-${z2High} bpm（Z2，脂肪氧化区）`
    if (runVariant.key === "threshold") return `${thrLow}-${lthr} bpm（阈值区，hard但能维持）`
    if (runVariant.key === "vo2max") return `${lthr}+ bpm（无氧区，极限配速）`
    return `${z2Low}-${z2High} bpm`
  }

  function buildClassPlan(name, role, d, s) {
    const p = calc.classPreset(name, data.presets)
    const focus = name === "私教力量" ? calc.nextPrivateFocus(d, data.logs, data.profile, data.presets) : ""
    let hr = ""
    if (["瑜伽静态拉伸", "普拉提核心"].includes(name)) hr = `恢复区 ${data.profile.recoveryHrLow}-${data.profile.recoveryHrHigh} bpm`
    else if (["Z2单车/椭圆机", "快走/坡走"].includes(name)) hr = `Z2 ${data.profile.z2HrLow}-${data.profile.z2HrHigh} bpm`
    else if (["HYROX Engine", "HYROX Power"].includes(name)) hr = `大部分 ${data.profile.steadyHrLow}-${data.profile.steadyHrHigh}，短时间 ${data.profile.thresholdHrLow}-${data.profile.thresholdHrHigh}，避免长期超过 ${data.profile.lthr}`
    else if (name === "HYROX Complete") hr = `可短时间超过 ${data.profile.lthr}，但注意配速；前后安排恢复`
    else hr = `如心率持续超过 ${data.profile.lthr} 且无法回落，请主动降强度`
    return {
      name, role, focus, duration: p.duration, rpeMin: p.rpeMin, rpeMax: p.rpeMax, rpe: Math.round((p.rpeMin + p.rpeMax) / 2),
      items: [
        ["课程", `${name}${focus ? `（${focus}专项）` : ""} ${p.duration}分钟`],
        ["强度", `RPE ${p.rpeMin}-${p.rpeMax}`],
        ["心率", hr],
        ["说明", s?.nightShift ? "当天夜班，建议保守完成，不要硬顶。" : "优先选择已有课程/私教。"]
      ]
    }
  }

  function estimateEnergy(d, plan, s) {
    const role = plan.role || "rest"
    const meta = ROLE_META[role] || ROLE_META.rest
    let plannedSteps = nval(meta.steps, 8000)
    let ex = calc.exerciseKcal(plan.name, plan.duration, plan.rpe, data.profile, data.presets, 0, plan.variantKey || "")
    if (plan.variantKey && plan.variant) {
      ex = calc.exerciseKcal(plan.name, plan.variant.duration, Math.round((plan.variant.rpeMin + plan.variant.rpeMax) / 2), data.profile, data.presets, 0, plan.variantKey)
    }
    let epocP = 0
    if (plan.variantKey && plan.variant) {
      epocP = calc.calcEpoc(plan.variant.met, ex)
    } else {
      epocP = calc.calcEpoc(calc.classPreset(plan.name, data.presets).met, ex)
    }
    const stepsK = calc.stepKcal(plannedSteps, data.profile)
    const extra = calc.workExtraKcal(s, data.profile)
    const tdee = Math.round(nval(data.profile.bmr, 1749) + ex + epocP + stepsK + extra)
    const targetIn = Math.max(nval(meta.minIn, 1900), tdee - nval(meta.deficit, 400))
    const log = data.logs[d]
    let actual = null
    if (log && diffDays(d, todayStr()) <= 0) {
      const acts = calc.getActivitiesFromLog(log, data.presets)
      let exA = 0, epocA = 0
      acts.forEach(a => {
        exA += calc.exerciseKcal(a.type, a.min, a.rpe, data.profile, data.presets, a.garminKcal, a.variant || "")
        epocA += calc.epocFromActivity(a.type, a.min, a.rpe, data.profile, data.presets, a.garminKcal, a.variant || "")
      })
      const sum = calc.summarizeActivities(acts, data.presets)
      const rawSteps = nval(log.steps, 0)
      const corrSteps = calc.correctedSteps(rawSteps, sum.distanceKm, nval(data.profile.stepLengthM, 0.75))
      const stepsAK = calc.stepKcal(corrSteps, data.profile)
      const tdeeA = Math.round(nval(data.profile.bmr, 1749) + exA + epocA + stepsAK + extra)
      const inA = nval(log.caloriesIn, 0)
      actual = { sum, exercise: exA, epoc: epocA, steps: rawSteps, correctedSteps: corrSteps, stepsK: stepsAK, tdee: tdeeA, caloriesIn: inA, deficit: inA ? Math.round(tdeeA - inA) : null }
    }
    return {
      planned: { steps: plannedSteps, exercise: ex, epoc: epocP, stepsK, extra, tdee, targetIn, deficit: meta.deficit, minIn: meta.minIn },
      actual
    }
  }

  function mealAdvice(plan, energy, s) {
    const role = plan.role || "rest"
    const orientation = data.profile.trainingOrientation || "fatLoss"
    const bw = nval(data.profile.bodyWeight, 84)
    const kcal = energy.planned.targetIn
    const deficit = energy.planned.deficit
    const duration = plan.duration || 60
    const lthr = data.profile.lthr

    const macros = calcMacros(role, bw, kcal)
    const water = calcHydration(bw, duration)
    const meals = genMeals(role, orientation, kcal, bw, deficit)

    const isHigh = ["hyrox", "complete", "conditioning"].includes(role)
    const selfRun = role === "hyrox" || role === "conditioning"
    const z2 = role === "z2"
    const recovery = ["recovery", "rest", "no_train"].includes(role)

    let hr = selfRun ? `心率提醒：${getRunHRDisplay(plan.variant || { key: "lsd" })}。` : isHigh ? `心率提醒：训练大部分控制在 ${data.profile.steadyHrLow}-${data.profile.steadyHrHigh} bpm，短时间可到 ${data.profile.thresholdHrLow}-${data.profile.thresholdHrHigh}，避免长时间超过 LTHR ${lthr}。` : z2 ? `心率提醒：Z2 控制在 ${data.profile.z2HrLow}-${data.profile.z2HrHigh} bpm。` : recovery ? `心率提醒：恢复区 ${data.profile.recoveryHrLow}-${data.profile.recoveryHrHigh} bpm。` : `心率提醒：力量训练以RPE为主，组间避免长期顶到 LTHR ${lthr} 以上。`

    return { kcal, macros, water, meals, hr, nightShift: s?.nightShift }
  }

  function makePlan(d) {
    const s = normalizeScheduleItem(data.schedule[d])
    const tr = getTrainability(d)
    const role = decideRole(d, s, tr)
    const available = getClassesForDate(d)
    const combat = calc.calcCombatPower(d, data.logs, data.schedule, data.profile, data.presets)
    const budget = calc.getDailyBudget(d, data.logs, data.schedule, data.profile, data.presets)
    const maxCourses = nval(data.profile.maxPackageCourses, 3)
    const orientation = data.profile.trainingOrientation || "fatLoss"

    const tomorrowHasPrivateLeg = hasPrivateLegOnDate(addDays(d, 1))

    let primaryItems = []
    let primaryReason = ""
    let alternativePlans = []
    let hasSpecifiedAlts = false
    let selected = ""
    let classPlan = null
    const hasPrivateTraining = available.includes("私教力量")
    const selfPlanRole = hasPrivateTraining ? "hyrox" : (tr.canTrain ? role : "hyrox")
    let selfPlan = selfPlanForRole(d, selfPlanRole, s)

    if (!tr.canTrain) {
      primaryItems = [{ type: "selfStrength", plan: selfPlanForRole(d, "strength", s) }, { type: "selfRun", plan: selfPlan }]
      primaryReason = s ? "上班第1天，上午不可安排课程，推荐自助训练" : "未排班，不可安排课程，推荐自助训练"
    } else {
      let totalALU = 0
      let totalTime = 0
      let courseCount = 0

      if (available.includes("私教力量")) {
        const pp = calc.classPreset("私教力量", data.presets)
        const alu = pp.duration * pp.met * ((pp.rpeMin + pp.rpeMax) / 2 / 10)
        if (totalALU + alu <= budget && totalTime + pp.duration <= 240) {
          primaryItems.push({ type: "class", plan: buildClassPlan("私教力量", role, d, s) })
          totalALU += alu
          totalTime += pp.duration
          courseCount++
        }
      }

      const allCandidates = [...new Set([...available, "自助力量", "自助跑步", "Z2单车/椭圆机", "快走/坡走"])]
      const filteredCandidates = allCandidates.filter(name => {
        if (name === "私教力量") return false
        if (name === "自助力量" && available.includes("私教力量")) return false
        const reqCombat = calc.getRequiredCombat(name, data.presets)
        if (reqCombat > combat) return false
        if (tomorrowHasPrivateLeg) {
          const p = calc.classPreset(name, data.presets)
          if (p.isLeg && name !== "自助跑步") return false
        }
        return true
      })

      const scored = filteredCandidates.map(name => {
        const p = calc.classPreset(name, data.presets)
        let value = 0
        if (orientation === "hyrox") {
          value = nval(p.hyrox, 0) * 0.6 + nval(p.met, 5) * 0.4
        } else {
          value = nval(p.met, 5) * 10
        }
        return { name, value, p }
      }).sort((a, b) => b.value - a.value)

      for (const item of scored) {
        if (courseCount >= maxCourses) break
        const itemALU = item.p.duration * item.p.met * ((item.p.rpeMin + item.p.rpeMax) / 2 / 10)
        const itemTime = item.p.duration
        if (totalALU + itemALU > budget) continue
        if (totalTime + itemTime > 240) continue

        totalALU += itemALU
        totalTime += itemTime
        courseCount++

        if (item.name === "自助力量") {
          primaryItems.push({ type: "selfStrength", plan: selfPlanForRole(d, "strength", s) })
        } else if (item.name === "自助跑步") {
          primaryItems.push({ type: "selfRun", plan: selfPlanForRole(d, "hyrox", s) })
        } else {
          primaryItems.push({ type: "class", plan: buildClassPlan(item.name, role, d, s) })
          if (!selected) selected = item.name
        }
      }

      if (primaryItems.length === 0) {
        primaryItems = [{ type: "selfRun", plan: selfPlanForRole(d, "z2", s) }]
        primaryReason = "预算较低，推荐低强度有氧"
      } else {
        const classCount = primaryItems.filter(x => x.type === "class").length
        const hasStrength = primaryItems.some(x => x.type === "selfStrength" || (x.type === "class" && x.plan.name === "私教力量"))
        const hasRun = primaryItems.some(x => x.type === "selfRun")
        
        let parts = []
        if (classCount > 0) parts.push(`${classCount}门课程`)
        if (hasStrength) parts.push("力量训练")
        if (hasRun) parts.push("跑步")
        
        primaryReason = `状态不错，推荐${parts.join("+")}（总负荷 ${Math.round(totalALU)} / 预算 ${Math.round(budget)}）`
      }
    }

    if (!hasSpecifiedAlts) {
      alternativePlans.push({
        label: "方案B：只保留力量/课程（去掉跑步）",
        items: primaryItems.filter(x => x.type !== "selfRun")
      })
      alternativePlans.push({
        label: "方案C：只跑步（去掉力量/课程）",
        items: primaryItems.filter(x => x.type !== "selfStrength" && x.type !== "class")
      })
    }

    classPlan = primaryItems.find(x => x.type === "class")?.plan || null
    let targetPlan = primaryItems.find(x => x.plan && x.type !== "rest")?.plan || selfPlan
    const energy = estimateEnergy(d, targetPlan, s)

    let orientationTag = ""
    if (selfPlan.variantKey === "lsd") orientationTag = "减脂推荐"
    if (selfPlan.variantKey === "threshold") orientationTag = orientation === "hyrox" ? "比赛专项" : "耐力提升"
    if (selfPlan.variantKey === "vo2max") orientationTag = "天花板冲击"
    if (selfPlan.variantKey && ["fullA", "fullB", "fullC"].includes(selfPlan.variantKey)) orientationTag = orientation === "fatLoss" ? "全身减脂" : "全身基础"
    if (selfPlan.variantKey === "upper") orientationTag = "上肢塑形"
    if (selfPlan.variantKey === "lower") orientationTag = "下肢强化"

    return {
      date: d, schedule: s, trainability: tr, role,
      available, selected,
      classPlan,
      selfPlan,
      orientation,
      orientationTag,
      energy,
      primaryItems,
      primaryReason,
      alternativePlans
    }
  }



  function setTodayStatus(val) {
    if (!val) return
    const d = todayStr()
    if (!data.logs[d]) data.logs[d] = {}
    data.logs[d].status = val
    data.logs[d].updatedAt = nowISO()
    saveData()
  }

  function setTodaySleep(sleep) {
    if (sleep <= 0) return
    const d = todayStr()
    if (!data.logs[d]) data.logs[d] = {}
    data.logs[d].sleepHours = sleep
    data.logs[d].updatedAt = nowISO()
    saveData()
  }

  function switchTab(id) {
    activeTab.value = id
  }

  initAutoSync()

  return {
    data, scheduleViewStart, classViewStart, logViewDate, bodyStatsViewStart,
    currentToday, midnightTimer, activityDraft, activeTab, syncCode, cloudRevision,
    isSyncing, isFirstSessionCompleted, autoSyncEnabled, supabaseClient,
    getClassNames, getLogTypes, getClassesForDate, setClassesForDate,
    saveLocalOnly, saveData, scheduleTemplate, normalizeScheduleItem,
    phaseLabel, roleLabel, getTrainability, makePlan,
    estimateEnergy, mealAdvice,
    classScoreForRole, selectBestClass,
    selectRunVariant, selectStrengthVariant,
    selfPlanForRole, buildClassPlan,
    getStrengthPlan, RUN_PLANS, RUN_VARIANTS, STRENGTH_VARIANTS,
    getRecentLowerDominant, hasPrivateLegOnDate,
    setTodayStatus, setTodaySleep, switchTab,
    initAutoSync, pushToCloud, pullFromCloud, scheduleAutoPush
  }
})
