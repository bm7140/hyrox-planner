// Inline the minimal helpers and classPresets for testing
function nval(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d }
function addDays(ds, n) {
  const d = new Date(ds + "T00:00:00")
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}
function nowISO() { return new Date().toISOString() }
function oldNameMap(name) {
  const m = { "HYROX":"HYROX Engine","Strength":"自助力量","Cross Training":"循环训练","恢复/拉伸":"瑜伽静态拉伸","跑步":"自助跑步","单车":"Z2单车/椭圆机","椭圆机":"Z2单车/椭圆机","私教":"私教力量" }
  return m[name] || name
}

const CLASS_PRESETS = {
  "循环训练": { kind:"团课",duration:60,met:8.5,rpeMin:7,rpeMax:10,tag:"hiit",hyrox:8,fatigue:8 },
  "战绳训练": { kind:"团课",duration:60,met:8.5,rpeMin:7,rpeMax:10,tag:"hiit",hyrox:7,fatigue:8 },
  "高能药球": { kind:"团课",duration:60,met:8.3,rpeMin:7,rpeMax:10,tag:"wallball",hyrox:8,fatigue:8 },
  "BodyCombat": { kind:"团课",duration:60,met:7.5,rpeMin:7,rpeMax:9,tag:"conditioning",hyrox:6,fatigue:7 },
  "BodyPump": { kind:"团课",duration:60,met:6.2,rpeMin:6,rpeMax:8,tag:"strengthEndurance",hyrox:6,fatigue:6 },
  "HYROX Power": { kind:"团课",duration:60,met:8.2,rpeMin:7,rpeMax:10,tag:"hyroxPower",hyrox:9,fatigue:8 },
  "HYROX Engine": { kind:"团课",duration:60,met:8.8,rpeMin:7,rpeMax:10,tag:"hyroxEngine",hyrox:9,fatigue:8 },
  "HYROX Complete": { kind:"团课",duration:90,met:9.5,rpeMin:8,rpeMax:10,tag:"hyroxSimulation",hyrox:10,fatigue:10 },
  "TRX功能性训练": { kind:"团课",duration:60,met:6.8,rpeMin:6,rpeMax:8,tag:"functional",hyrox:7,fatigue:6 },
  "普拉提核心": { kind:"团课",duration:60,met:3.5,rpeMin:4,rpeMax:6,tag:"core",hyrox:4,fatigue:3 },
  "瑜伽静态拉伸": { kind:"团课",duration:60,met:2.5,rpeMin:2,rpeMax:4,tag:"mobility",hyrox:2,fatigue:1 },
  "私教力量": { kind:"私教",duration:60,met:6.0,rpeMin:6,rpeMax:8,tag:"ptStrength",hyrox:7,fatigue:6 },
  "自助力量": { kind:"自助",duration:60,met:5.8,rpeMin:6,rpeMax:8,tag:"selfStrength",hyrox:6,fatigue:5 },
  "自助跑步": { kind:"自助",duration:45,met:8.0,rpeMin:5,rpeMax:8,tag:"run",hyrox:7,fatigue:6 },
  "Z2单车/椭圆机": { kind:"自助",duration:45,met:5.5,rpeMin:4,rpeMax:6,tag:"z2",hyrox:5,fatigue:3 },
  "快走/坡走": { kind:"自助",duration:45,met:3.8,rpeMin:3,rpeMax:5,tag:"walk",hyrox:3,fatigue:2 },
  "休息": { kind:"恢复",duration:0,met:0,rpeMin:0,rpeMax:0,tag:"rest",hyrox:0,fatigue:0 },
  "其他": { kind:"未知",duration:60,met:5,rpeMin:5,rpeMax:7,tag:"other",hyrox:3,fatigue:4 }
}

// === Minified useCalc ===
function classPreset(name, presets) {
  const p = presets || CLASS_PRESETS
  return p?.[name] || CLASS_PRESETS[name] || CLASS_PRESETS["其他"]
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
    note: a?.note || ""
  }
}

function calcTL(activities, presets) {
  if (!activities || !activities.length) return 0
  return activities.reduce((sum, a) => {
    const p = classPreset(a.type, presets)
    const met = nval(p.met, 5)
    const minutes = nval(a.min, 0)
    const rpe = nval(a.rpe, (p.rpeMin + p.rpeMax) / 2)
    const add = nval(minutes, 0) * nval(met, 5) * (nval(rpe, 0) / 10)
    console.log('[calcTL] type=', a.type, 'min=', a.min, 'rpe=', a.rpe, 'p.duration=', p.duration, 'met=', met, 'add=', add)
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
  const tl = calcTL(getActivitiesFromLog(log, presets), presets)
  const workAdd = getWorkAddition(d, schedule, profile)
  return tl + workAdd
}

function getActivitiesFromLog(log, presets) {
  if (!log) return []
  if (Array.isArray(log.activities)) return log.activities.map(a => normalizeActivity(a, presets)).filter(a => a.type && a.type !== "休息")
  if (log.actualType && log.actualType !== "未训练") {
    return [normalizeActivity({
      type: log.actualType, focus: log.privateFocus, min: log.actualMinutes,
      rpe: log.actualRpe, distanceKm: log.distanceKm ?? log.runKm,
      ton: log.tonnage, wallBall: log.wallBall, carry: log.carry, garminKcal: log.garminKcal
    }, presets)]
  }
  return []
}

// === THE TEST ===
const d = '2026-05-16'
const logs = {}
const schedule = {}
const profile = {
  bodyWeight: 84, stepLengthM: 0.75, bmr: 1749,
  acuteDecayRate: 0.5, acuteConversion: 0.2,
  shortTermWeight: 0.7, longTermWeight: 0.3,
  longTermMapFactor: 15, sleepTargetHours: 7,
  predictSleepHours: 6.5, sleepPenaltyPerHour: 5,
  personalMaxWindowDays: 28,
  nightShiftLoad: 45
}

// Test 1: normalizeActivity with undefined presets (like addActivity does)
const draftAct1 = normalizeActivity({
  type: '循环训练', focus: '', min: 60, rpe: 7,
  distanceKm: 0, garminKcal: 0, note: '', ton: 0,
  wallBall: 0, carry: 0, row: 0, ski: 0
}, undefined)
console.log('=== Test 1: normalizeActivity(undef presets) ===')
console.log('Result:', JSON.stringify(draftAct1))
console.log('TL:', calcTL([draftAct1], undefined))

// Test 2: normalizeActivity with CLASS_PRESETS
const draftAct2 = normalizeActivity({
  type: '循环训练', focus: '', min: 60, rpe: 7,
  distanceKm: 0, garminKcal: 0, note: '', ton: 0,
  wallBall: 0, carry: 0, row: 0, ski: 0
}, CLASS_PRESETS)
console.log('\n=== Test 2: normalizeActivity(CLASS_PRESETS) ===')
console.log('Result:', JSON.stringify(draftAct2))
console.log('TL:', calcTL([draftAct2], CLASS_PRESETS))

// Test 3: calcTL with undefined presets directly (simulating calcPreviewFatigueDetailed)
console.log('\n=== Test 3: calcPreview with undef presets ===')
console.log('TL:', calcTL([draftAct1], undefined))

// Test 4: calcTL with CLASS_PRESETS
console.log('\n=== Test 4: calcPreview with CLASS_PRESETS ===')
console.log('TL:', calcTL([draftAct1], CLASS_PRESETS))
