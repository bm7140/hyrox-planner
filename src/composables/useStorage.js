import { ref } from 'vue'
import { nowISO, deepClone, addDays, todayStr, nval, newerISO, oldNameMap, normalizeCode, betweenDate } from '../utils/helpers'
import { VERSION, STORAGE_KEY, OLD_KEYS, SYNC_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/constants'
import { CLASS_PRESETS } from '../config/classPresets'
import { DEFAULT_PROFILE } from '../config/defaultProfile'
import { useCalc } from './useCalc'

export function useStorage() {
  const {
    classPreset, getActivitiesFromLog, summarizeActivities, normalizeActivity
  } = useCalc()

  const syncCode = ref(localStorage.getItem(SYNC_KEY) || "")
  const cloudRevision = ref(0)
  const isSyncing = ref(false)
  const isFirstSessionCompleted = ref(sessionStorage.getItem("hyrox_first_sync_completed") === "true")
  const autoSyncEnabled = ref(false)

  const supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) ?
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

  function defaultData() {
    return {
      meta: { version: VERSION, updatedAt: nowISO() },
      profile: deepClone(DEFAULT_PROFILE),
      presets: deepClone(CLASS_PRESETS),
      schedule: {},
      classes: {},
      logs: {},
      bodyStats: {}
    }
  }

  function scheduleTemplate(cycleDay, nightShift = false, updatedAt = "", note = "") {
    const cd = nval(cycleDay, 1)
    if (cd === 1) return { cycleDay: 1, workPhase: "work1", work: true, canTrain: false, nightShift: false, trainWindow: "", note, updatedAt }
    if (cd === 2) return { cycleDay: 2, workPhase: "work2", work: true, canTrain: true, nightShift: !!nightShift, trainWindow: DEFAULT_PROFILE.trainWindow, note, updatedAt }
    if (cd === 3) return { cycleDay: 3, workPhase: "rest1", work: false, canTrain: true, nightShift: false, trainWindow: DEFAULT_PROFILE.trainWindow, note, updatedAt }
    return { cycleDay: 4, workPhase: "rest2", work: false, canTrain: true, nightShift: false, trainWindow: DEFAULT_PROFILE.trainWindow, note, updatedAt }
  }

  function normalizeScheduleItem(x) {
    if (!x) return null
    if (x.workPhase) {
      return {
        cycleDay: nval(x.cycleDay, 1), workPhase: x.workPhase, work: !!x.work,
        canTrain: !!x.canTrain, nightShift: !!x.nightShift,
        trainWindow: x.canTrain ? (x.trainWindow || DEFAULT_PROFILE.trainWindow) : "",
        note: x.note || "", updatedAt: x.updatedAt || ""
      }
    }
    const cd = ((nval(x.cycleDay || x.day, 1) - 1) % 4) + 1
    return scheduleTemplate(cd, !!x.nightShift, x.updatedAt || "", x.note || "")
  }

  function normalizeClassRecord(v) {
    if (!v) return { items: [], updatedAt: "" }
    if (Array.isArray(v)) {
      return { items: v.map(oldNameMap).filter(Boolean), updatedAt: "" }
    }
    if (Array.isArray(v.items)) {
      return {
        items: v.items.map(it => {
          if (typeof it === "string") return oldNameMap(it)
          if (it && it.name) return oldNameMap(it.name)
          return ""
        }).filter(Boolean),
        updatedAt: v.updatedAt || ""
      }
    }
    return { items: [], updatedAt: "" }
  }

  function normalizeBodyStatRecord(v) {
    if (!v) return { weight: 0, bodyFatPercent: 0, bodyFatMass: 0, muscleMass: 0, skeletalMuscleMass: 0, chest: 0, waist: 0, hip: 0, leftThigh: 0, rightThigh: 0, leftCalf: 0, rightCalf: 0, leftArm: 0, rightArm: 0, leftForearm: 0, rightForearm: 0, neck: 0, note: "", updatedAt: "" }
    return {
      weight: nval(v.weight, 0), bodyFatPercent: nval(v.bodyFatPercent, 0),
      bodyFatMass: nval(v.bodyFatMass, 0), muscleMass: nval(v.muscleMass, 0),
      skeletalMuscleMass: nval(v.skeletalMuscleMass, 0), chest: nval(v.chest, 0),
      waist: nval(v.waist, 0), hip: nval(v.hip, 0),
      leftThigh: nval(v.leftThigh, 0), rightThigh: nval(v.rightThigh, 0),
      leftCalf: nval(v.leftCalf, 0), rightCalf: nval(v.rightCalf, 0),
      leftArm: nval(v.leftArm, 0), rightArm: nval(v.rightArm, 0),
      leftForearm: nval(v.leftForearm, 0), rightForearm: nval(v.rightForearm, 0),
      neck: nval(v.neck, 0), note: v.note || "", updatedAt: v.updatedAt || ""
    }
  }

  function mergeData(obj) {
    const d = defaultData()
    const s = obj || {}
    d.meta = { ...d.meta, ...(s.meta || {}), version: VERSION }
    d.profile = { ...d.profile, ...(s.profile || {}) }
    if (!Array.isArray(d.profile.ptOrder) || !d.profile.ptOrder.length) d.profile.ptOrder = ["胸", "背", "腿", "肩"]
    d.presets = { ...deepClone(CLASS_PRESETS), ...(s.presets || {}) }
    if (s.presets && s.presets._updatedAt) {
      d.presets._updatedAt = s.presets._updatedAt
    } else if (!d.presets._updatedAt) {
      d.presets._updatedAt = ""
    }
    Object.entries(s.schedule || {}).forEach(([k, v]) => {
      const item = normalizeScheduleItem(v)
      if (item) d.schedule[k] = item
    })
    Object.entries(s.classes || {}).forEach(([k, v]) => {
      const r = normalizeClassRecord(v)
      d.classes[k] = { items: r.items, updatedAt: r.updatedAt || "" }
    })
    Object.entries(s.logs || {}).forEach(([k, v]) => {
      const acts = getActivitiesFromLog(v, d.presets)
      const sum = summarizeActivities(acts, d.presets)
      d.logs[k] = {
        ...(v || {}),
        done: v?.done !== false,
        weight: nval(v?.weight, 0), waist: nval(v?.waist, 0),
        sleepHours: nval(v?.sleepHours, 0), status: v?.status || "",
        steps: nval(v?.steps, 0), caloriesIn: nval(v?.caloriesIn, 0),
        note: v?.note || "", activities: sum.activities,
        actualType: sum.main, actualMinutes: sum.totalMin,
        actualRpe: sum.avgRpe || nval(v?.actualRpe, 0),
        privateFocus: sum.privateFocus || v?.privateFocus || "",
        distanceKm: sum.distanceKm, tonnage: sum.ton,
        wallBall: sum.wallBall, carry: sum.carry,
        row: sum.row, ski: sum.ski,
        garminKcal: sum.totalGarminKcal || nval(v?.garminKcal, 0),
        updatedAt: v?.updatedAt || ""
      }
    })
    Object.entries(s.bodyStats || {}).forEach(([k, v]) => {
      d.bodyStats[k] = normalizeBodyStatRecord(v)
    })
    return d
  }

  function loadInitialData() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try { return mergeData(JSON.parse(raw)) }
      catch (e) { console.error("Failed to parse localStorage data:", e) }
    }
    for (const k of OLD_KEYS) {
      const old = localStorage.getItem(k)
      if (old) { try { return mergeData(JSON.parse(old)) } catch (e) {} }
    }
    return defaultData()
  }

  function saveLocalOnly(data) {
    data.meta = { ...(data.meta || {}), version: VERSION, updatedAt: nowISO() }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error("saveLocalOnly failed:", e)
    }
  }

  function ensureSyncedSettingsShape(data) {
    if (!data.profile) data.profile = {}
    if (data.profile.homeTotalDays == null) data.profile.homeTotalDays = 7
    if (data.profile.homeDetailDays == null) data.profile.homeDetailDays = 4
    if (data.profile.homeDetailOffsets == null) data.profile.homeDetailOffsets = "0,1,2,3"
    if (!data.bodyStats) data.bodyStats = {}
  }

  function saveData(data) {
    ensureSyncedSettingsShape(data)
    saveLocalOnly(data)
  }

  function mergeDateMapByUpdatedAt(localMap = {}, cloudMap = {}, normalizer = x => x) {
    const out = {}
    const keys = new Set([...Object.keys(localMap || {}), ...Object.keys(cloudMap || {})])
    keys.forEach(k => {
      const l = normalizer(localMap[k])
      const c = normalizer(cloudMap[k])
      if (!l && c) { out[k] = c; return }
      if (l && !c) { out[k] = l; return }
      if (!l && !c) return
      const cmp = newerISO(l.updatedAt, c.updatedAt)
      out[k] = cmp >= 0 ? l : c
    })
    return out
  }

  function mergeLogsByUpdatedAt(localLogs = {}, cloudLogs = {}) {
    const out = {}
    const keys = new Set([...Object.keys(localLogs || {}), ...Object.keys(cloudLogs || {})])
    keys.forEach(k => {
      const l = localLogs[k], c = cloudLogs[k]
      if (!l && c) { out[k] = c; return }
      if (l && !c) { out[k] = l; return }
      if (!l && !c) return
      const cmp = newerISO(l.updatedAt, c.updatedAt)
      out[k] = cmp >= 0 ? l : c
    })
    return out
  }

  function hasUsefulContent(x) {
    return !!(Object.keys(x?.schedule || {}).length ||
      Object.keys(x?.classes || {}).length ||
      Object.keys(x?.logs || {}).length ||
      Object.keys(x?.bodyStats || {}).length)
  }

  function smartMergeData(localRaw, cloudRaw) {
    const local = mergeData(localRaw || {})
    const cloud = mergeData(cloudRaw || {})
    const merged = defaultData()
    merged.meta = {
      version: VERSION,
      updatedAt: newerISO(local.meta?.updatedAt, cloud.meta?.updatedAt) >= 0 ? local.meta?.updatedAt : cloud.meta?.updatedAt
    }
    merged.profile = newerISO(local.meta?.updatedAt, cloud.meta?.updatedAt) >= 0
      ? { ...DEFAULT_PROFILE, ...cloud.profile, ...local.profile }
      : { ...DEFAULT_PROFILE, ...local.profile, ...cloud.profile }
    if (!Array.isArray(merged.profile.ptOrder) || !merged.profile.ptOrder.length) merged.profile.ptOrder = ["胸", "背", "腿", "肩"]
    const localPresetTime = local.presets?._updatedAt || ""
    const cloudPresetTime = cloud.presets?._updatedAt || ""
    const useLocal = newerISO(localPresetTime, cloudPresetTime) >= 0
    const newerPresets = useLocal ? local.presets : cloud.presets
    const olderPresets = useLocal ? cloud.presets : local.presets
    merged.presets = {
      ...deepClone(CLASS_PRESETS), ...olderPresets, ...newerPresets,
      _updatedAt: newerPresets._updatedAt || olderPresets._updatedAt || ""
    }
    merged.schedule = mergeDateMapByUpdatedAt(local.schedule, cloud.schedule, normalizeScheduleItem)
    merged.classes = mergeDateMapByUpdatedAt(local.classes, cloud.classes, normalizeClassRecord)
    merged.logs = mergeLogsByUpdatedAt(local.logs, cloud.logs)
    merged.bodyStats = mergeDateMapByUpdatedAt(local.bodyStats, cloud.bodyStats, normalizeBodyStatRecord)
    return mergeData(merged)
  }

  return {
    syncCode, cloudRevision, isSyncing, isFirstSessionCompleted, autoSyncEnabled, supabaseClient,
    defaultData, scheduleTemplate, normalizeScheduleItem, normalizeClassRecord, normalizeBodyStatRecord,
    mergeData, loadInitialData, saveLocalOnly, saveData, ensureSyncedSettingsShape,
    mergeDateMapByUpdatedAt, mergeLogsByUpdatedAt, hasUsefulContent, smartMergeData
  }
}
