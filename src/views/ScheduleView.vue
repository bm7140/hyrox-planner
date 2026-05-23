<template>
  <div>
    <div class="card">
      <h2>排班生成</h2>
      <div class="notice">规则：上2休2。Day1 上班第1天不可安排课程；Day2 上班第2天上午可安排课程但可能夜班；Day3/Day4 休息可安排课程。训练窗口默认 {{ store.data.profile.trainWindow }}。</div>
      <div class="grid" style="margin-top:12px">
        <div class="col-3"><label>起始日期</label><input type="date" v-model="startDate"></div>
        <div class="col-3"><label>起始周期日</label><select v-model="startCycleDay">
          <option :value="1">Day1</option><option :value="2">Day2</option><option :value="3">Day3</option><option :value="4">Day4</option>
        </select></div>
        <div class="col-3"><label>夜班规则</label><select v-model="nightMode">
          <option value="first">第一个 Day2 是夜班</option>
          <option value="second">第二个 Day2 是夜班</option>
          <option value="none">不自动排夜班</option>
        </select></div>
        <div class="col-3"><label>生成天数</label><input type="number" v-model.number="genDays"></div>
        <div class="col-12">
          <button class="green" @click="generateSchedule">生成并保存排班</button>
          <button class="secondary" @click="refreshList">刷新列表</button>
          <button class="secondary" @click="goToToday">回到今天</button>
        </div>
      </div>
    </div>
    <div class="card">
      <h2>排班列表 / 可二次调整</h2>
      <div v-if="dates.length" class="table-wrapper">
        <table>
          <thead><tr><th>日期</th><th>周期</th><th>工作状态</th><th>可安排课程</th><th>夜班</th><th>夜班负荷</th><th>训练窗口</th><th>状态/备注</th></tr></thead>
          <tbody><tr v-for="d in dates" :key="d">
            <td>{{ dateLabel(d) }}</td>
            <td><select @change="editSchedule(d, 'cycleDay', ($event.target).value)">
              <option v-for="n in [1,2,3,4]" :key="n" :value="n" :selected="getScheduleItem(d)?.cycleDay === n">Day{{ n }}</option>
            </select></td>
            <td>{{ getPhaseLabel(d) }}<div class="muted">{{ getScheduleItem(d)?.work ? "上班" : "休息" }}</div></td>
            <td><select @change="editSchedule(d, 'canTrain', ($event.target).value)">
              <option value="true" :selected="getScheduleItem(d)?.canTrain">可安排课程</option>
              <option value="false" :selected="!getScheduleItem(d)?.canTrain">不可安排课程</option>
            </select></td>
            <td><select @change="editSchedule(d, 'nightShift', ($event.target).value)">
              <option value="false" :selected="!getScheduleItem(d)?.nightShift">非夜班</option>
              <option value="true" :selected="getScheduleItem(d)?.nightShift">夜班</option>
            </select></td>
            <td>
              <span v-if="getScheduleItem(d)?.nightShift" class="pill orange">+{{ store.data.profile.nightShiftLoad || 45 }} ALU</span>
              <span v-else>-</span>
              <div class="muted">参数页可调</div>
            </td>
            <td><input :value="getScheduleItem(d)?.trainWindow || ''" @change="editSchedule(d, 'trainWindow', ($event.target).value)" placeholder="09:30-13:30"></td>
            <td>
              <span :class="`pill ${getTrainability(d).canTrain ? 'green' : 'gray'}`">{{ getTrainability(d).canTrain ? '可安排课程' : '不可安排课程' }}</span>
              <span v-if="getScheduleItem(d)?.nightShift" class="pill orange">夜班</span>
              <div class="muted">{{ getTrainability(d).reason }}</div>
              <input style="margin-top:6px" :value="getScheduleItem(d)?.note || ''" @change="editSchedule(d, 'note', ($event.target).value)" placeholder="备注">
            </td>
          </tr></tbody>
        </table>
      </div>
      <div v-else class="warn">从 {{ dateLabel(viewStart) }} 开始暂无排班，请先生成。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { todayStr, nowISO, addDays, dateLabel, nval, esc } from '../utils/helpers'

const store = useAppStore()

const startDate = ref(store.scheduleViewStart)
const startCycleDay = ref(1)
const nightMode = ref('none')
const genDays = ref(90)

const viewStart = computed(() => store.scheduleViewStart)

const dates = computed(() => {
  const start = store.scheduleViewStart || todayStr()
  return Array.from({ length: 180 }, (_, i) => addDays(start, i)).filter(d => store.data.schedule[d])
})

function getScheduleItem(d) {
  return store.normalizeScheduleItem(store.data.schedule[d])
}

function getPhaseLabel(d) {
  return store.phaseLabel(getScheduleItem(d))
}

function getTrainability(d) {
  return store.getTrainability(d)
}

function generateSchedule() {
  const start = startDate.value
  const startDay = startCycleDay.value
  const days = genDays.value
  const night = nightMode.value
  if (!start) return alert("请选择起始日期")
  if (!confirm("确认生成排班？将清空旧排班后重新生成。")) return

  const ts = nowISO()
  store.data.schedule = {}
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i)
    const cd = ((startDay - 1 + i) % 4) + 1
    const day2Index = Math.floor((startDay - 1 + i) / 4)
    let nightShift = false
    if (cd === 2) {
      if (night === "first") nightShift = day2Index % 2 === 0
      if (night === "second") nightShift = day2Index % 2 === 1
    }
    store.data.schedule[d] = store.scheduleTemplate(cd, nightShift, ts, "")
  }
  store.scheduleViewStart = start
  startDate.value = start
  store.saveData()
  alert("排班已生成并保存。")
}

function editSchedule(d, k, v) {
  let s = getScheduleItem(d) || store.scheduleTemplate(1, false)
  if (k === "cycleDay") {
    const oldNote = s.note || ""
    s = store.scheduleTemplate(nval(v, 1), false, nowISO(), oldNote)
  } else if (["work", "canTrain", "nightShift"].includes(k)) {
    s[k] = v === "true"
  } else {
    s[k] = v
  }
  if (!s.canTrain) s.trainWindow = ""
  else if (!s.trainWindow) s.trainWindow = store.data.profile.trainWindow
  s.updatedAt = nowISO()
  store.data.schedule[d] = s
  store.scheduleViewStart = d
  store.saveData()
}

function refreshList() {
  store.scheduleViewStart = startDate.value || todayStr()
}

function goToToday() {
  store.scheduleViewStart = todayStr()
  startDate.value = todayStr()
}
</script>
