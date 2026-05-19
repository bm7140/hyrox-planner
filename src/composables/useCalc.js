import { nval, addDays, todayStr, nowISO, oldNameMap } from '../utils/helpers'
import { CLASS_PRESETS } from '../config/classPresets'
import { ROLE_META } from '../config/roleMeta'
import { RUN_VARIANTS, STRENGTH_VARIANTS } from '../config/selfTrainPresets'

export function useCalc() {
  function classPreset(name, presets) {
    const defaults = CLASS_PRESETS[name] || CLASS_PRESETS["其他"] || {
      duration: 60, met: 5, rpeMin: 5, rpeMax: 7, tag: "other", fatigue: 4, hyrox: 3
    }
    const user = (presets || CLASS_PRESETS)?.[name]
    if (!user) return defaults
    return { ...defaults, ...user }
  }

  function getActivityMeta(a, presets) {
    const base = classPreset(a.type, presets)
    if (!a.variant) return base
    if (a.type === '自助跑步') {
      const vp = RUN_VARIANTS[a.variant]
      if (vp) return { ...base, met: vp.met, duration: vp.duration, rpeMin: vp.rpeMin, rpeMax: vp.rpeMax, fatigue: vp.fatigue }
    }
    if (a.type === '自助力量') {
      const vp = STRENGTH_VARIANTS[a.variant]
      if (vp) return { ...base, met: vp.met, duration: vp.duration, rpeMin: vp.rpeMin, rpeMax: vp.rpeMax, fatigue: vp.fatigue }
    }
    return base
  }

  function getClassNames(presets) {
    const p = presets || CLASS_PRESETS
    return Object.keys(p).filter(k => k !== '_updatedAt')
  }

  function getLogTypes(presets) {
    return getClassNames(presets).filter(x => x !== "休息").concat(["其他"])
  }

  function calcTL(activities, presets) {
    if (!activities || !activities.length) return 0
    return activities.reduce((sum, a) => {
      const p = getActivityMeta(a, presets)
      const met = nval(p.met, 5)
      const minutes = nval(a.min, 0)
      const rpe = nval(a.rpe, (p.rpeMin + p.rpeMax) / 2)
      const add = nval(minutes, 0) * nval(met, 5) * (nval(rpe, 0) / 10)
      return sum + nval(add, 0)
    }, 0)
  }

  function getWorkAddition(d, schedule, profile) {
    const yesterday = addDays(d, -1)
    const yesterdaySchedule = schedule[yesterday]
    if (yesterdaySchedule?.nightShift) return nval(profile.nightShiftLoad, 45)
    return 0
  }

  function calcDTL(d, logs, schedule, profile, presets) {
    const log = logs[d]
    if (!log) return 0
    const acts = getActivitiesFromLog(log, presets)
    const tl = calcTL(acts, presets)
    const workAdd = getWorkAddition(d, schedule, profile)
    return tl + workAdd
  }

  function getPersonalMax(logs, profile, presets) {
    const defaultMax = 855
    const windowDays = nval(profile.personalMaxWindowDays, 28)
    const cutoffDate = addDays(todayStr(), -windowDays)
    let maxTL = 0
    Object.keys(logs || {}).forEach(d => {
      if (d < cutoffDate) return
      const log = logs[d]
      if (!log) return
      const acts = getActivitiesFromLog(log, presets)
      const tl = calcTL(acts, presets)
      if (tl > maxTL) maxTL = tl
    })
    if (maxTL === 0) return defaultMax
    const totalLogDays = Object.keys(logs || {}).filter(d => logs[d]).length
    if (totalLogDays < windowDays) return Math.max(defaultMax, maxTL)
    return maxTL
  }

  function getAL7(d, logs, schedule, profile, presets) {
    let sum = 0
    for (let i = 1; i <= 7; i++) {
      sum += calcDTL(addDays(d, -i), logs, schedule, profile, presets)
    }
    return sum
  }

  function getCL28(d, logs, schedule, profile, presets) {
    const windowDays = 28
    let sum = 0, validDays = 0
    for (let i = 1; i <= windowDays; i++) {
      const date = addDays(d, -i)
      if (logs[date]) {
        const dtl = calcDTL(date, logs, schedule, profile, presets)
        sum += dtl
        validDays++
      }
    }
    if (validDays === 0) return 0
    if (validDays < windowDays) return (sum / validDays) * 7
    return sum / 4
  }

  function calcACWR(d, logs, schedule, profile, presets) {
    const al7 = getAL7(d, logs, schedule, profile, presets)
    const cl28 = getCL28(d, logs, schedule, profile, presets)
    return al7 / Math.max(cl28, 1)
  }

  function calcRS(d, logs, schedule, profile, presets) {
    const cl28 = getCL28(d, logs, schedule, profile, presets)
    const personalMax = getPersonalMax(logs, profile, presets)
    return cl28 / (personalMax * 7)
  }

  function calcOFS(d, logs, schedule, profile, presets) {
    const acwr = calcACWR(d, logs, schedule, profile, presets)
    const rs = calcRS(d, logs, schedule, profile, presets)
    return 0.7 * acwr + 0.3 * rs
  }

  function getAvgSleep7(d, logs, profile) {
    let sum = 0
    for (let i = 1; i <= 7; i++) {
      const log = logs[addDays(d, -i)]
      const sleep = nval(log?.sleepHours, 0)
      sum += sleep || 7
    }
    return sum / 7
  }

  function calcRecoveryFactor(d, logs, profile) {
    const avgSleep = getAvgSleep7(d, logs, profile)
    const k = nval(profile.sleepPenaltyK, 0.15)
    return 1 + Math.max(0, 7 - avgSleep) * k
  }

  function getAcuteFatigue(d, logs, schedule, profile, presets, raw) {
    const decayRate = nval(profile.acuteDecayRate, 0.5)
    const conversion = nval(profile.acuteConversion, 0.2)
    const personalMax = getPersonalMax(logs, profile, presets)
    const coef = conversion * 100 / (personalMax * 0.5)
    let acute = 0, weight = decayRate
    for (let offset = 1; offset <= 365; offset++) {
      if (weight < 0.005) break
      const date = addDays(d, -offset)
      const log = logs && logs[date]
      if (log) {
        const dtl = calcDTL(date, logs, schedule, profile, presets)
        acute += dtl * coef * weight
      }
      weight *= decayRate
    }
    return raw ? acute : Math.min(100, acute)
  }

  function getChronicFatigue(d, logs, schedule, profile, presets) {
    const ofs = calcOFS(d, logs, schedule, profile, presets)
    const recFactor = calcRecoveryFactor(d, logs, profile)
    const mapFactor = nval(profile.longTermMapFactor, 15)
    return Math.min(100, ofs * recFactor * mapFactor)
  }

  function getLastNightSleep(d, logs, profile) {
    const log = logs[d]
    return log?.sleepHours || nval(profile.sleepTargetHours, 7)
  }

  function calcSleepPenalty(d, logs, profile) {
    const sleepTarget = nval(profile.sleepTargetHours, 7)
    const lastNightSleep = getLastNightSleep(d, logs, profile)
    const penaltyPerHour = nval(profile.sleepPenaltyPerHour, 5)
    return Math.max(0, (sleepTarget - lastNightSleep) * penaltyPerHour)
  }

  function calcFatigueScore(d, logs, schedule, profile, presets) {
    const acute = getAcuteFatigue(d, logs, schedule, profile, presets)
    const chronic = getChronicFatigue(d, logs, schedule, profile, presets)
    const shortWeight = nval(profile.shortTermWeight, 0.7)
    const longWeight = nval(profile.longTermWeight, 0.3)
    const sleepPenalty = calcSleepPenalty(d, logs, profile)
    return Math.min(100, shortWeight * acute + longWeight * chronic + sleepPenalty)
  }

  function getFeelingCoefficient(d, logs, profile) {
    const log = logs[d]
    const status = log?.status || "正常"
    const baseMap = {
      "很好": 1.2, "正常": 1.0, "疲劳": 0.8, "很疲劳": 0.6, "生病/不适": 0.0
    }
    let coeff = baseMap[status] || 1.0
    return Math.max(0, coeff)
  }

  function calcCombatPower(d, logs, schedule, profile, presets) {
    const fatigue = calcFatigueScore(d, logs, schedule, profile, presets)
    const feeling = getFeelingCoefficient(d, logs, profile)
    const base = 100 - fatigue
    return Math.max(0, Math.min(100, base * feeling))
  }

  function getRequiredCombat(className, presets) {
    const p = classPreset(className, presets)
    if (p.requiredCombat != null) return p.requiredCombat
    const met = nval(p.met, 5)
    const fatigue = nval(p.fatigue, 4)
    return Math.min(100, met * 7 + fatigue * 2.5)
  }

  function getDailyBudget(d, logs, schedule, profile, presets) {
    const combat = calcCombatPower(d, logs, schedule, profile, presets)
    const power = nval(profile.combatPowerExponent, 1.5)
    const personalMax = getPersonalMax(logs, profile, presets)
    const f = Math.max(0.2, Math.pow(combat / 100, power))
    let budget = personalMax * f
    const s = schedule[d]
    if (s?.nightShift) {
      const discount = nval(profile.nightBudgetDiscount, 0.8)
      budget *= discount
    }
    return budget
  }

  function getClassesForDate(d, classes) {
    return normalizeClassRecord(classes?.[d]).items
  }

  function normalizeClassRecord(v) {
    if (!v) return { items: [], updatedAt: "" }
    if (Array.isArray(v)) {
      return { items: v.filter(Boolean), updatedAt: "" }
    }
    if (Array.isArray(v.items)) {
      return { items: v.items.filter(Boolean), updatedAt: v.updatedAt || "" }
    }
    return { items: [], updatedAt: "" }
  }

  function getActivitiesFromLog(log, presets) {
    if (!log) return []
    if (Array.isArray(log.activities)) return log.activities.map(a => normalizeActivity(a, presets)).filter(a => a.type && a.type !== "休息")
    if (log.actualType && log.actualType !== "未训练") {
      return [normalizeActivity({
        type: log.actualType, focus: log.privateFocus, min: log.actualMinutes,
        rpe: log.actualRpe, distanceKm: log.distanceKm ?? log.runKm,
        ton: log.tonnage, wallBall: log.wallBall, carry: log.carry, garminKcal: log.garminKcal,
        variant: log.variant || ""
      }, presets)]
    }
    return []
  }

  function normalizeActivity(a, presets) {
    const type = oldNameMap(a?.type || a?.name || "")
    const p = classPreset(type, presets)
    return {
      type: type || "其他",
      focus: a?.focus || a?.privateFocus || "",
      min: nval(a?.min || a?.minutes || a?.actualMinutes || p.duration, 0),
      rpe: nval(a?.rpe || a?.actualRpe || Math.round((p.rpeMin + p.rpeMax) / 2), 0),
      distanceKm: nval(a?.distanceKm ?? a?.run ?? a?.runKm, 0),
      ton: nval(a?.ton ?? a?.tonnage, 0),
      wallBall: nval(a?.wallBall ?? a?.wb, 0),
      carry: nval(a?.carry, 0),
      row: nval(a?.row, 0),
      ski: nval(a?.ski, 0),
      garminKcal: nval(a?.garminKcal, 0),
      note: a?.note || "",
      variant: a?.variant || ""
    }
  }

  function summarizeActivities(acts, presets) {
    const arr = (acts || []).map(a => normalizeActivity(a, presets)).filter(a => a.type && a.type !== "休息")
    const totalMin = arr.reduce((s, a) => s + nval(a.min), 0)
    const rpeDen = arr.reduce((s, a) => s + (a.min > 0 ? a.min : 0), 0)
    const avgRpe = rpeDen ? +(arr.reduce((s, a) => s + nval(a.rpe) * nval(a.min), 0) / rpeDen).toFixed(1) : 0
    return {
      activities: arr, totalMin, avgRpe,
      distanceKm: +arr.reduce((s, a) => s + nval(a.distanceKm), 0).toFixed(1),
      ton: Math.round(arr.reduce((s, a) => s + nval(a.ton), 0)),
      wallBall: Math.round(arr.reduce((s, a) => s + nval(a.wallBall), 0)),
      carry: Math.round(arr.reduce((s, a) => s + nval(a.carry), 0)),
      row: Math.round(arr.reduce((s, a) => s + nval(a.row), 0)),
      ski: Math.round(arr.reduce((s, a) => s + nval(a.ski), 0)),
      totalGarminKcal: Math.round(arr.reduce((s, a) => s + nval(a.garminKcal), 0)),
      totalTL: Math.round(calcTL(arr, presets)),
      main: arr.slice().sort((a, b) => nval(b.min) - nval(a.min))[0]?.type || "休息",
      privateFocus: arr.find(a => a.type === "私教力量" && a.focus)?.focus || ""
    }
  }

  function isHighIntensityType(t, presets) {
    const p = classPreset(t, presets)
    return ["hiit", "wallball", "conditioning", "hyroxPower", "hyroxEngine", "hyroxSimulation"].includes(p.tag) || nval(p.rpeMin) >= 7
  }

  function isStrengthType(t, presets) {
    const p = classPreset(t, presets)
    return ["ptStrength", "selfStrength", "strengthEndurance", "functional"].includes(p.tag) || ["私教力量", "自助力量", "BodyPump", "TRX功能性训练"].includes(t)
  }

  function nextPrivateFocus(d, logs, profile, presets) {
    const order = Array.isArray(profile.ptOrder) && profile.ptOrder.length ? profile.ptOrder : ["胸", "背", "腿", "肩"]
    const rows = Object.entries(logs || {}).filter(([date]) => date < d).sort((a, b) => b[0].localeCompare(a[0]))
    for (const [, log] of rows) {
      const pt = getActivitiesFromLog(log, presets).find(a => a.type === "私教力量" && a.focus)
      if (pt) {
        const idx = order.indexOf(pt.focus)
        return order[(idx + 1 + order.length) % order.length] || order[0]
      }
    }
    return order[0]
  }

  function rpeFactor(rpe) {
    rpe = nval(rpe, 0)
    if (rpe <= 5) return .9
    if (rpe <= 7) return 1
    if (rpe === 8) return 1.06
    return 1.12
  }

  function exerciseKcal(type, min, rpe, profile, presets, garminKcal = 0, variant = "") {
    if (nval(garminKcal, 0) > 0) return nval(garminKcal, 0)
    const p = getActivityMeta({ type, variant }, presets)
    const bw = nval(profile.bodyWeight, 84)
    return Math.round(nval(p.met, 5) * 3.5 * bw / 200 * nval(min, 0) * rpeFactor(rpe))
  }

  function calcEpoc(met, exerciseKcal) {
    const m = nval(met, 0)
    if (m <= 0 || exerciseKcal <= 0) return 0
    let ratio = 0.05
    if (m >= 10) ratio = 0.15
    else if (m >= 8) ratio = 0.12
    else if (m >= 5) ratio = 0.08
    return Math.round(exerciseKcal * ratio)
  }

  function epocFromActivity(type, min, rpe, profile, presets, garminKcal = 0, variant = "") {
    const p = getActivityMeta({ type, variant }, presets)
    const exKcal = exerciseKcal(type, min, rpe, profile, presets, garminKcal, variant)
    return calcEpoc(p.met, exKcal)
  }

  function stepKcal(steps, profile) {
    const bw = nval(profile.bodyWeight, 84)
    const km = nval(steps, 0) * nval(profile.stepLengthM, .75) / 1000
    return Math.round(km * bw * .5)
  }

  function correctedSteps(rawSteps, totalDistanceKm, stepLengthM) {
    const steps = nval(rawSteps, 0)
    const distKm = nval(totalDistanceKm, 0)
    const sl = nval(stepLengthM, 0.75)
    if (steps <= 0 || distKm <= 0 || sl <= 0) return steps
    const exerciseSteps = Math.round((distKm * 1000) / sl)
    return Math.max(0, steps - exerciseSteps)
  }

  function workExtraKcal(s, profile) {
    if (!s) return 0
    if (s.nightShift) return nval(profile.nightShiftExtraKcal, 180)
    if (s.work) return nval(profile.workDayExtraKcal, 120)
    return nval(profile.restDayExtraKcal, 0)
  }

  function predictNextDayAcute(d, logs, schedule, profile, presets) {
    const acuteRaw = getAcuteFatigue(d, logs, schedule, profile, presets, true)
    const decayRate = nval(profile.acuteDecayRate, 0.5)
    const conversion = nval(profile.acuteConversion, 0.2)
    const personalMax = getPersonalMax(logs, profile, presets)
    const coef = conversion * 100 / (personalMax * 0.5)
    const todayDTL = calcDTL(d, logs, schedule, profile, presets)
    return Math.min(100, Math.round(((acuteRaw + todayDTL * coef) * decayRate) * 10) / 10)
  }

  function predictNextDayChronic(d, logs, schedule, profile, presets) {
    const todayLog = logs[d]
    const todayActs = todayLog ? getActivitiesFromLog(todayLog, presets) : []
    const todayTL = calcTL(todayActs, presets)
    const workAdd = getWorkAddition(d, schedule, profile)
    const todayDTL = todayTL + workAdd
    const tomorrow = addDays(d, 1)
    const windowDays = 28
    let clSum = 0, clValidDays = 0
    for (let i = 1; i <= windowDays; i++) {
      const date = addDays(tomorrow, -i)
      if (date >= d) { clSum += todayDTL; clValidDays++ }
      else if (logs[date]) { clSum += calcDTL(date, logs, schedule, profile, presets); clValidDays++ }
    }
    const newCL28 = clValidDays === 0 ? 0 : clValidDays < windowDays ? (clSum / clValidDays) * 7 : clSum / 4
    let al7Sum = todayDTL
    for (let i = 1; i <= 6; i++) al7Sum += calcDTL(addDays(d, -i), logs, schedule, profile, presets)
    const newAL7 = al7Sum
    const newACWR = newAL7 / Math.max(newCL28, 1)
    const newRS = newCL28 / (getPersonalMax(logs, profile, presets) * 7)
    const newOFS = 0.7 * newACWR + 0.3 * newRS
    const mapFactor = nval(profile.longTermMapFactor, 15)
    return Math.min(100, Math.round((newOFS * mapFactor) * 10) / 10)
  }

  function predictNextDaySleepPenalty(d, logs, profile) {
    const sleepTarget = nval(profile.sleepTargetHours, 7)
    const predictSleepHours = nval(profile.predictSleepHours, 6.5)
    const penaltyPerHour = nval(profile.sleepPenaltyPerHour, 5)
    return Math.max(0, (sleepTarget - predictSleepHours) * penaltyPerHour)
  }

  function predictNextDayFatigue(d, logs, schedule, profile, presets) {
    const acute = predictNextDayAcute(d, logs, schedule, profile, presets)
    const chronic = predictNextDayChronic(d, logs, schedule, profile, presets)
    const shortWeight = nval(profile.shortTermWeight, 0.7)
    const longWeight = nval(profile.longTermWeight, 0.3)
    const sleepPenalty = predictNextDaySleepPenalty(d, logs, profile)
    return Math.min(100, Math.round((shortWeight * acute + longWeight * chronic + sleepPenalty) * 10) / 10)
  }

  function calcPreviewFatigueDetailed(d, logs, schedule, profile, presets, draftActs) {
    const previewTL = calcTL((draftActs || []).filter(a => a.type && a.type !== "休息"), presets)
    const workAdd = getWorkAddition(d, schedule, profile)
    const previewDTL = nval(previewTL, 0) + nval(workAdd, 0)

    const tomorrow = addDays(d, 1)
    const windowDays = 28
    let clSum = 0, clValidDays = 0
    for (let i = 1; i <= windowDays; i++) {
      const date = addDays(tomorrow, -i)
      if (date >= d) { clSum += previewDTL; clValidDays++ }
      else if (logs[date]) { clSum += calcDTL(date, logs, schedule, profile, presets); clValidDays++ }
    }
    const newCL28 = clValidDays === 0 ? 0 : clValidDays < windowDays ? (clSum / clValidDays) * 7 : clSum / 4
    let al7Sum = previewDTL
    for (let i = 1; i <= 6; i++) al7Sum += calcDTL(addDays(d, -i), logs, schedule, profile, presets)
    const newAL7 = Math.round(al7Sum * 10) / 10

    const newACWR = Math.round(newAL7 / Math.max(newCL28, 1) * 100) / 100
    const personalMax = getPersonalMax(logs, profile, presets)
    const newRS = Math.round(newCL28 / (personalMax * 7) * 100) / 100
    const newOFS = Math.round((0.7 * newACWR + 0.3 * newRS) * 100) / 100
    const mapFactor = nval(profile.longTermMapFactor, 15)

    const acuteRaw = getAcuteFatigue(d, logs, schedule, profile, presets, true)
    const decayRate = nval(profile.acuteDecayRate, 0.5)
    const conversion = nval(profile.acuteConversion, 0.2)
    const coef = conversion * 100 / (personalMax * 0.5)
    const newLoadContrib = Math.round(previewDTL * coef * 10) / 10
    const sumBeforeDecay = Math.round((acuteRaw + newLoadContrib) * 10) / 10
    const acuteAfterDecay = Math.round((sumBeforeDecay * decayRate) * 10) / 10
    const previewAcute = Math.min(100, acuteAfterDecay)
    const previewChronic = Math.round(Math.min(100, newOFS * mapFactor))
    const sleepTarget = nval(profile.sleepTargetHours, 7)
    const predictSleepHours = nval(profile.predictSleepHours, 6.5)
    const penaltyPerHour = nval(profile.sleepPenaltyPerHour, 5)
    const previewSleepPenalty = Math.max(0, (sleepTarget - predictSleepHours) * penaltyPerHour)
    const shortWeight = nval(profile.shortTermWeight, 0.7)
    const longWeight = nval(profile.longTermWeight, 0.3)
    const acuteContrib = Math.round(shortWeight * previewAcute * 10) / 10
    const chronicContrib = Math.round(longWeight * previewChronic * 10) / 10
    const total = Math.min(100, Math.round((shortWeight * previewAcute + longWeight * previewChronic + previewSleepPenalty) * 10) / 10)

    return {
      total,
      breakdown: {
        previewDTL: Math.round(previewDTL),
        previewAcute, previewChronic, previewSleepPenalty,
        acuteContrib, chronicContrib, acuteRaw: Math.round(acuteRaw * 10) / 10,
        newLoadContrib, sumBeforeDecay, acuteAfterDecay, coef: Math.round(coef * 10000) / 10000,
        decayRate, conversion, newAL7, newCL28: Math.round(newCL28 * 10) / 10,
        newACWR, newRS, newOFS, mapFactor, personalMax,
        shortWeight, longWeight, sleepTarget, predictSleepHours, penaltyPerHour
      }
    }
  }

  return {
    classPreset, getClassNames, getLogTypes, calcTL, getWorkAddition, calcDTL,
    getPersonalMax, getAL7, getCL28, calcACWR, calcRS, calcOFS,
    getAvgSleep7, calcRecoveryFactor, getAcuteFatigue, getChronicFatigue,
    getLastNightSleep, calcSleepPenalty, calcFatigueScore, getFeelingCoefficient, calcCombatPower,
    getRequiredCombat, getDailyBudget, getClassesForDate,
    normalizeClassRecord, getActivitiesFromLog, normalizeActivity, summarizeActivities,
    isHighIntensityType, isStrengthType, nextPrivateFocus,
    rpeFactor, exerciseKcal, calcEpoc, epocFromActivity, stepKcal, correctedSteps, workExtraKcal,
    predictNextDayAcute, predictNextDayChronic, predictNextDaySleepPenalty, predictNextDayFatigue,
    calcPreviewFatigueDetailed
  }
}
