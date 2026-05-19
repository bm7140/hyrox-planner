<template>
  <div>
    <div class="card"><h2>个人与心率参数</h2>
      <div class="grid">
        <div class="col-3"><label>体重 kg</label><input type="number" step="0.1" v-model.number="profile.bodyWeight"></div>
        <div class="col-3"><label>腰围 cm</label><input type="number" step="0.1" v-model.number="profile.waist"></div>
        <div class="col-3"><label>BMR kcal</label><input type="number" v-model.number="profile.bmr"></div>
        <div class="col-3"><label>步长 m</label><input type="number" step="0.01" v-model.number="profile.stepLengthM"></div>
        <div class="col-3"><label>乳酸阈值心率 LTHR</label><input type="number" v-model.number="profile.lthr"></div>
        <div class="col-3"><label>恢复区下限</label><input type="number" v-model.number="profile.recoveryHrLow"></div>
        <div class="col-3"><label>恢复区上限</label><input type="number" v-model.number="profile.recoveryHrHigh"></div>
        <div class="col-3"><label>Z2 下限</label><input type="number" v-model.number="profile.z2HrLow"></div>
        <div class="col-3"><label>Z2 上限</label><input type="number" v-model.number="profile.z2HrHigh"></div>
        <div class="col-3"><label>稳态下限</label><input type="number" v-model.number="profile.steadyHrLow"></div>
        <div class="col-3"><label>稳态上限</label><input type="number" v-model.number="profile.steadyHrHigh"></div>
        <div class="col-3"><label>阈值区下限</label><input type="number" v-model.number="profile.thresholdHrLow"></div>
        <div class="col-3"><label>阈值区上限</label><input type="number" v-model.number="profile.thresholdHrHigh"></div>
        <div class="col-12"><div class="notice">当前 CPET 乳酸阈值心率：<b>{{ profile.lthr }} bpm</b>。</div></div>
      </div>
    </div>
    <div class="card"><h2>工作、训练窗口与力量参数</h2>
      <div class="grid">
        <div class="col-3"><label>训练窗口</label><input v-model="profile.trainWindow"></div>
        <div class="col-3"><label>上班日额外消耗 kcal</label><input type="number" v-model.number="profile.workDayExtraKcal"></div>
        <div class="col-3"><label>夜班日额外消耗 kcal</label><input type="number" v-model.number="profile.nightShiftExtraKcal"></div>
        <div class="col-3"><label>休息日额外消耗 kcal</label><input type="number" v-model.number="profile.restDayExtraKcal"></div>
        <div class="col-3"><label>卧推参考 kg</label><input type="number" v-model.number="profile.bench"></div>
        <div class="col-3"><label>下拉/引体参考 kg</label><input type="number" v-model.number="profile.pull"></div>
        <div class="col-3"><label>深蹲参考 kg</label><input type="number" v-model.number="profile.squat"></div>
        <div class="col-3"><label>硬拉参考 kg</label><input type="number" v-model.number="profile.dead"></div>
        <div class="col-3"><label>重量系数</label><input type="number" step="0.05" min="0.3" max="1.5" v-model.number="profile.strengthWeightScale" placeholder="1.0"></div>
        <div class="col-3"><label>个人最大负荷窗口天</label><input type="number" min="7" max="90" v-model.number="profile.personalMaxWindowDays" placeholder="28"></div>
        <div class="col-6"><label>私教专项默认轮转顺序</label><input v-model="ptOrderStr"></div>
        <div class="col-6"><label>训练导向</label>
          <select v-model="profile.trainingOrientation">
            <option value="fatLoss">🏃 减脂导向（默认）</option>
            <option value="hyrox">🏆 HYROX比赛导向</option>
          </select>
        </div>
        <div class="col-12">
          <details style="cursor:pointer">
            <summary style="font-weight:800;color:#374151">⚙️ 高级疲劳调节（可选，留空使用默认值）</summary>
            <div class="grid" style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
              <div class="col-12"><h4>💤 睡眠与疲劳计算参数</h4></div>
              <div class="col-4"><label>夜班附加负荷 ALU</label><input type="number" v-model.number="profile.nightShiftLoad" placeholder="45"></div>
              <div class="col-4"><label>目标睡眠时长 h</label><input type="number" step="0.5" v-model.number="profile.sleepTargetHours" placeholder="7"></div>
              <div class="col-4"><label>睡眠惩罚系数 K</label><input type="number" step="0.01" v-model.number="profile.sleepPenaltyK" placeholder="0.15"></div>
              <div class="col-4"><label>战斗力指数（功率）</label><input type="number" step="0.1" v-model.number="profile.combatPowerExponent" placeholder="1.5"></div>
              <div class="col-4"><label>夜班预算折扣</label><input type="number" step="0.05" v-model.number="profile.nightBudgetDiscount" placeholder="0.8"></div>
              <div class="col-4"><label>最大套餐课程数</label><input type="number" v-model.number="profile.maxPackageCourses" placeholder="3"></div>
              <div class="col-4"><label>高强度保护阈值</label><input type="number" v-model.number="profile.highIntensityProtectThreshold" placeholder="8"></div>
              <div class="col-4"><label>保护接受疲劳值</label><input type="number" v-model.number="profile.protectAcceptableFatigue" placeholder="4"></div>
            </div>
            <div class="grid" style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
              <div class="col-12"><h4>⚡ 双组分疲劳模型参数</h4></div>
              <div class="col-4"><label>急性衰减率</label><input type="number" step="0.05" v-model.number="profile.acuteDecayRate" placeholder="0.5"></div>
              <div class="col-4"><label>急性转换系数</label><input type="number" step="0.05" v-model.number="profile.acuteConversion" placeholder="0.2"></div>
              <div class="col-4"><label>短期疲劳权重</label><input type="number" step="0.1" v-model.number="profile.shortTermWeight" placeholder="0.7"></div>
              <div class="col-4"><label>长期疲劳权重</label><input type="number" step="0.1" v-model.number="profile.longTermWeight" placeholder="0.3"></div>
              <div class="col-4"><label>长期疲劳映射系数</label><input type="number" v-model.number="profile.longTermMapFactor" placeholder="15"></div>
              <div class="col-4"><label>昨夜睡眠每小时罚分</label><input type="number" v-model.number="profile.sleepPenaltyPerHour" placeholder="5"></div>
            </div>
          </details>
        </div>
        <div class="col-12" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="primary" @click="saveProfile">保存参数</button>
          <button class="secondary" @click="resetProfile">一键重置个人参数</button>
          <button class="secondary" @click="resetPresets">一键重置课程参数</button>
        </div>
      </div>
    </div>
    <div class="card"><h2>课程强度与热量参数</h2>
      <div class="notice">这里可以修改课程默认时长、MET、RPE、HYROX价值和疲劳成本。门槛为可选项（留空则自动计算）。</div>
      <div class="table-wrapper"><table>
      <thead>
          <tr><th>课程</th><th>类型</th><th>时长</th><th>MET</th><th>RPE低</th><th>RPE高</th><th>HYROX</th><th>疲劳</th><th>门槛(可编辑)</th><th>自动计算</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(pr, name) in activePresets" :key="name">
            <td>{{ name }}</td><td>{{ pr.kind || '' }}</td>
            <td><input type="number" v-model.number="pr.duration"></td>
            <td><input type="number" step="0.1" v-model.number="pr.met"></td>
            <td><input type="number" v-model.number="pr.rpeMin"></td>
            <td><input type="number" v-model.number="pr.rpeMax"></td>
            <td><input type="number" v-model.number="pr.hyrox"></td>
            <td><input type="number" v-model.number="pr.fatigue"></td>
            <td><input type="number" v-model.number="pr.requiredCombat" placeholder="留空自动"></td>
            <td><span class="muted">{{ Math.min(100, (pr.met||5)*7 + (pr.fatigue||4)*2.5) }}</span></td>
            <td>
              <span v-if="name === '休息'" class="muted">不可删</span>
              <button v-else class="danger" style="padding:4px 8px;font-size:12px" @click="deleteClass(name)">删除</button>
            </td>
          </tr>
        </tbody>
      </table></div>
      <div style="margin-top:12px"><button class="green" @click="savePresets">保存课程参数</button></div>
      <hr>
      <h3>+ 添加自定义课程</h3>
      <div class="grid">
        <div class="col-4"><label>课程名称</label><input v-model="newClass.name" placeholder="例如：户外跑步"></div>
        <div class="col-2"><label>类型</label><select v-model="newClass.kind"><option value="团课">团课</option><option value="私教">私教</option><option value="自助">自助</option><option value="恢复">恢复</option></select></div>
        <div class="col-2"><label>时长(分)</label><input type="number" v-model.number="newClass.duration"></div>
        <div class="col-2"><label>MET</label><input type="number" step="0.1" v-model.number="newClass.met"></div>
        <div class="col-2"><label>标签</label><input v-model="newClass.tag" placeholder="自定义标签"></div>
      </div>
      <div class="grid" style="margin-top:8px">
        <div class="col-2"><label>RPE低</label><input type="number" v-model.number="newClass.rpeMin"></div>
        <div class="col-2"><label>RPE高</label><input type="number" v-model.number="newClass.rpeMax"></div>
        <div class="col-2"><label>HYROX价值</label><input type="number" v-model.number="newClass.hyrox"></div>
        <div class="col-2"><label>疲劳成本</label><input type="number" v-model.number="newClass.fatigue"></div>
        <div class="col-2"><label>门槛(可选)</label><input type="number" v-model.number="newClass.reqCombat" placeholder="留空自动"></div>
        <div class="col-2" style="display:flex;align-items:end"><button class="primary" @click="addCustomClass">添加课程</button></div>
      </div>
    </div>

    <div class="card">
      <h2>🏃 自助跑步参数</h2>
      <div class="notice">自定义不同跑步变体的时长、MET和疲劳值。留空或恢复默认。</div>
      <div class="table-wrapper"><table>
        <thead>
          <tr><th>变体</th><th>时长(分)</th><th>MET</th><th>RPE低</th><th>RPE高</th><th>疲劳</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(cfg, key) in selfTrainRun" :key="key">
            <td>{{ runVariantLabel(key) }}</td>
            <td><input type="number" v-model.number="cfg.duration" style="width:70px"></td>
            <td><input type="number" step="0.1" v-model.number="cfg.met" style="width:70px"></td>
            <td><input type="number" v-model.number="cfg.rpeMin" style="width:60px"></td>
            <td><input type="number" v-model.number="cfg.rpeMax" style="width:60px"></td>
            <td><input type="number" v-model.number="cfg.fatigue" style="width:60px"></td>
            <td><button class="secondary" style="padding:4px 8px;font-size:12px" @click="resetRunVariant(key)">重置</button></td>
          </tr>
        </tbody>
      </table></div>
    </div>

    <div class="card">
      <h2>💪 自助力量参数</h2>
      <div class="notice">自定义不同力量变体的时长、MET和疲劳值。留空或恢复默认。</div>
      <div class="table-wrapper"><table>
        <thead>
          <tr><th>变体</th><th>时长(分)</th><th>MET</th><th>RPE低</th><th>RPE高</th><th>疲劳</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(cfg, key) in selfTrainStrength" :key="key">
            <td>{{ strengthVariantLabel(key) }}</td>
            <td><input type="number" v-model.number="cfg.duration" style="width:70px"></td>
            <td><input type="number" step="0.1" v-model.number="cfg.met" style="width:70px"></td>
            <td><input type="number" v-model.number="cfg.rpeMin" style="width:60px"></td>
            <td><input type="number" v-model.number="cfg.rpeMax" style="width:60px"></td>
            <td><input type="number" v-model.number="cfg.fatigue" style="width:60px"></td>
            <td><button class="secondary" style="padding:4px 8px;font-size:12px" @click="resetStrengthVariant(key)">重置</button></td>
          </tr>
        </tbody>
      </table></div>
      <div style="margin-top:12px"><button class="green" @click="saveSelfTrain">保存自助训练参数</button> <button class="secondary" @click="resetSelfTrain">全部重置</button></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useAppStore } from '../stores/app'
import { deepClone, nowISO, nval, sid } from '../utils/helpers'
import { DEFAULT_PROFILE } from '../config/defaultProfile'
import { CLASS_PRESETS } from '../config/classPresets'
import { DEFAULT_SELF_TRAIN_PROFILE } from '../config/selfTrainPresets'

const store = useAppStore()
const profile = computed(() => store.data.profile)
const selfTrainRun = computed(() => {
  if (!store.data.profile.selfTrain) store.data.profile.selfTrain = deepClone(DEFAULT_SELF_TRAIN_PROFILE)
  return store.data.profile.selfTrain.runVariants
})
const selfTrainStrength = computed(() => {
  if (!store.data.profile.selfTrain) store.data.profile.selfTrain = deepClone(DEFAULT_SELF_TRAIN_PROFILE)
  return store.data.profile.selfTrain.strengthVariants
})

const RUN_VARIANT_LABELS = { lsd: 'LSD 燃脂跑', threshold: '阈值间歇跑', vo2max: 'VO2max 间歇' }
const STRENGTH_VARIANT_LABELS = { fullA: '全身A', fullB: '全身B', fullC: '全身C', upper: '上肢主导', lower: '下肢主导' }

function runVariantLabel(key) { return RUN_VARIANT_LABELS[key] || key }
function strengthVariantLabel(key) { return STRENGTH_VARIANT_LABELS[key] || key }

function resetRunVariant(key) {
  const defaults = DEFAULT_SELF_TRAIN_PROFILE.runVariants[key]
  if (defaults) {
    store.data.profile.selfTrain.runVariants[key] = deepClone(defaults)
  }
}

function resetStrengthVariant(key) {
  const defaults = DEFAULT_SELF_TRAIN_PROFILE.strengthVariants[key]
  if (defaults) {
    store.data.profile.selfTrain.strengthVariants[key] = deepClone(defaults)
  }
}

function saveSelfTrain() {
  store.saveData()
  alert("自助训练参数已保存")
}

function resetSelfTrain() {
  if (!confirm("确定重置所有自助训练参数为默认值？")) return
  store.data.profile.selfTrain = deepClone(DEFAULT_SELF_TRAIN_PROFILE)
  store.saveData()
  alert("自助训练参数已重置为默认值")
}

const ptOrderStr = ref((store.data.profile.ptOrder || ["胸", "背", "腿", "肩"]).join(","))

const activePresets = computed(() => {
  const p = {}
  Object.entries(store.data.presets || CLASS_PRESETS).forEach(([k, v]) => {
    if (k !== '_updatedAt') p[k] = v
  })
  return p
})

const newClass = reactive({
  name: '', kind: '团课', duration: 60, met: 5, rpeMin: 5, rpeMax: 7, hyrox: 3, fatigue: 4, tag: 'custom', reqCombat: null
})

function saveProfile() {
  store.data.profile = {
    ...store.data.profile,
    bodyWeight: nval(store.data.profile.bodyWeight, 84),
    waist: nval(store.data.profile.waist, 0),
    bmr: nval(store.data.profile.bmr, 1749),
    stepLengthM: nval(store.data.profile.stepLengthM, .75),
    lthr: nval(store.data.profile.lthr, 162),
    trainingOrientation: store.data.profile.trainingOrientation || "fatLoss",
    recoveryHrLow: nval(store.data.profile.recoveryHrLow, 105),
    recoveryHrHigh: nval(store.data.profile.recoveryHrHigh, 125),
    z2HrLow: nval(store.data.profile.z2HrLow, 126),
    z2HrHigh: nval(store.data.profile.z2HrHigh, 145),
    steadyHrLow: nval(store.data.profile.steadyHrLow, 146),
    steadyHrHigh: nval(store.data.profile.steadyHrHigh, 154),
    thresholdHrLow: nval(store.data.profile.thresholdHrLow, 155),
    thresholdHrHigh: nval(store.data.profile.thresholdHrHigh, 162),
    trainWindow: store.data.profile.trainWindow || "09:30-13:30",
    workDayExtraKcal: nval(store.data.profile.workDayExtraKcal, 120),
    nightShiftExtraKcal: nval(store.data.profile.nightShiftExtraKcal, 180),
    restDayExtraKcal: nval(store.data.profile.restDayExtraKcal, 0),
    bench: nval(store.data.profile.bench, 60),
    pull: nval(store.data.profile.pull, 50),
    squat: nval(store.data.profile.squat, 80),
    dead: nval(store.data.profile.dead, 80),
    strengthWeightScale: nval(store.data.profile.strengthWeightScale, 1.0),
    personalMaxWindowDays: nval(store.data.profile.personalMaxWindowDays, 28),
    nightShiftLoad: nval(store.data.profile.nightShiftLoad, 45),
    sleepTargetHours: nval(store.data.profile.sleepTargetHours, 7),
    sleepPenaltyK: nval(store.data.profile.sleepPenaltyK, 0.15),
    combatPowerExponent: nval(store.data.profile.combatPowerExponent, 1.5),
    nightBudgetDiscount: nval(store.data.profile.nightBudgetDiscount, 0.8),
    maxPackageCourses: nval(store.data.profile.maxPackageCourses, 3),
    highIntensityProtectThreshold: nval(store.data.profile.highIntensityProtectThreshold, 8),
    protectAcceptableFatigue: nval(store.data.profile.protectAcceptableFatigue, 4),
    acuteDecayRate: nval(store.data.profile.acuteDecayRate, 0.5),
    acuteConversion: nval(store.data.profile.acuteConversion, 0.2),
    shortTermWeight: nval(store.data.profile.shortTermWeight, 0.7),
    longTermWeight: nval(store.data.profile.longTermWeight, 0.3),
    longTermMapFactor: nval(store.data.profile.longTermMapFactor, 15),
    sleepPenaltyPerHour: nval(store.data.profile.sleepPenaltyPerHour, 5),
    ptOrder: ptOrderStr.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean)
  }
  store.saveData()
  alert("参数已保存")
}

function resetProfile() {
  if (!confirm("确定重置个人参数？课程参数、排班、课表、打卡不会清空。")) return
  store.data.profile = deepClone(DEFAULT_PROFILE)
  ptOrderStr.value = ["胸", "背", "腿", "肩"].join(",")
  store.saveData()
}

function savePresets() {
  store.data.presets._updatedAt = nowISO()
  store.saveData()
  alert("课程参数已保存")
}

function resetPresets() {
  if (!confirm("确定重置所有课程强度、MET、RPE预设？将恢复所有已删除的预设课程。")) return
  store.data.presets = deepClone(CLASS_PRESETS)
  store.saveData()
  alert("课程参数已重置为默认值")
}

function addCustomClass() {
  const name = (newClass.name || "").trim()
  if (!name) return alert("请输入课程名称")
  if (store.data.presets[name]) return alert("课程名称已存在")
  store.data.presets[name] = {
    kind: newClass.kind, duration: newClass.duration, met: newClass.met,
    rpeMin: newClass.rpeMin, rpeMax: newClass.rpeMax,
    hyrox: newClass.hyrox, fatigue: newClass.fatigue, tag: newClass.tag || name,
    requiredCombat: newClass.reqCombat
  }
  store.data.presets._updatedAt = nowISO()
  store.saveData()
  newClass.name = ''
  alert("自定义课程「" + name + "」已添加")
}

function deleteClass(name) {
  if (!name || name === "休息") return alert("该课程不可删除")
  if (!confirm("确定删除课程「" + name + "」？")) return
  const next = {}
  Object.keys(store.data.presets).forEach(k => {
    if (k !== name && k !== '_updatedAt') next[k] = store.data.presets[k]
  })
  next._updatedAt = nowISO()
  store.data.presets = next
  store.saveData()
  alert("课程「" + name + "」已删除")
}
</script>
