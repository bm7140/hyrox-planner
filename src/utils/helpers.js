export function $(id) { return document.getElementById(id) }

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

export function nowISO() { return new Date().toISOString() }

export function nval(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d }

export function deepClone(o) { return JSON.parse(JSON.stringify(o)) }

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]))
}

export function sid(s) { return String(s).replace(/[^\w\u4e00-\u9fa5-]/g, "_") }

export function addDays(ds, n) {
  const d = new Date(ds + "T00:00:00")
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

export function daysBetween(a, b) {
  return Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 86400000)
}

export function diffDays(a, b) {
  return Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 86400000)
}

export function dateLabel(d) {
  const dt = new Date(d + "T00:00:00")
  return `${d} 周${["日","一","二","三","四","五","六"][dt.getDay()]}`
}

export function pill(t, c = "gray") { return `<span class="pill ${c}">${esc(t)}</span>` }

export function newerISO(a, b) {
  const ta = Date.parse(a || ""), tb = Date.parse(b || "")
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
  if (Number.isNaN(ta)) return -1
  if (Number.isNaN(tb)) return 1
  return ta - tb
}

export function normalizeCode(s) { return String(s || "").trim().toUpperCase().replace(/\s+/g, "-") }

export function betweenDate(d, s, e) { return d >= s && d <= e }

export function oldNameMap(name) {
  const m = {
    "HYROX": "HYROX Engine",
    "Strength": "自助力量",
    "Cross Training": "循环训练",
    "恢复/拉伸": "瑜伽静态拉伸",
    "跑步": "自助跑步",
    "单车": "Z2单车/椭圆机",
    "椭圆机": "Z2单车/椭圆机",
    "私教": "私教力量"
  }
  return m[name] || name
}
