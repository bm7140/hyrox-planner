<template>
  <div class="container">
    <h1 style="text-align:center">🏋️ HYROX 训练规划器 - 使用帮助</h1>

    <div class="card"><h2>🎯 新手入门指南</h2>
      <div class="box" style="background:#fef3c7;border-color:#fbbf24;padding:16px">
        <h4>👋 欢迎！</h4>
        <p>这个工具会根据你的<b>排班、睡眠、训练记录和身体状态</b>，自动帮你决定今天该练什么、练多猛。</p>
        <p>你只需要：<b>设置排班 → 打卡记录 → 首页看推荐 → 跟着练</b>。下面带你一步一步了解。</p>
      </div>
    </div>

    <div class="card"><h2>📊 三个需要知道的概念</h2>
      <div class="grid" style="gap:12px">
        <div class="col-4"><div class="box" style="background:#fef2f2;border-color:#fca5a5">
          <div style="font-size:32px;text-align:center">🔋</div>
          <h4>疲劳度</h4>
          <p style="font-size:13px">练得越多越累 → 疲劳分越高（0-100）。<br>疲劳高了就自动让你休息。</p>
        </div></div>
        <div class="col-4"><div class="box" style="background:#ecfdf5;border-color:#6ee7b7">
          <div style="font-size:32px;text-align:center">⚔️</div>
          <h4>战斗力</h4>
          <p style="font-size:13px">你今天能打多猛（0-100）。<br>睡得好+感觉好=战力高=推荐高强度。</p>
        </div></div>
        <div class="col-4"><div class="box" style="background:#eff6ff;border-color:#93c5fd">
          <div style="font-size:32px;text-align:center">🎯</div>
          <h4>训练角色</h4>
          <p style="font-size:13px">战力决定角色：<br>🔴高→HYROX  🟡中→力量  🟢低→Z2有氧  ⚪很低→休息</p>
        </div></div>
      </div>
    </div>

    <div class="card"><h2>🔄 计划是怎么生成的？</h2>
      <div class="box" style="background:#f0f9ff;border-color:#7dd3fc">
        <div style="font-family:monospace;font-size:14px;padding:12px">
          <p>📋 <b>读数据</b>（排班 + 昨晚睡眠 + 今天感觉 + 历史训练）</p>
          <p>  ↓</p>
          <p>📐 <b>算疲劳</b> → 你有多累？</p>
          <p>  ↓</p>
          <p>⚔️ <b>算战斗力</b> → 你今天能打多猛？</p>
          <p>  ↓</p>
          <p>🎯 <b>定角色</b> → 该练什么类型？</p>
          <p>  ↓</p>
          <p>🏆 <b>出方案</b> → 从课表里挑最好的课 + 自助训练</p>
        </div>
      </div>

      <div class="grid" style="gap:12px;margin-top:16px">
        <div class="col-4"><div class="box" style="background:#dcfce7;border-color:#22c55e;text-align:center">
          <h4>⭐ 方案A（推荐）</h4>
          <p style="font-size:13px">主课程 + 跑步/力量<br>预算够时再加一门课</p>
        </div></div>
        <div class="col-4"><div class="box" style="background:#fef3c7;border-color:#fbbf24;text-align:center">
          <h4>方案B（备选）</h4>
          <p style="font-size:13px">只做课程/力量<br>不跑步</p>
        </div></div>
        <div class="col-4"><div class="box" style="background:#dbeafe;border-color:#3b82f6;text-align:center">
          <h4>方案C（备选）</h4>
          <p style="font-size:13px">只跑步<br>不做课程/力量</p>
        </div></div>
      </div>

      <h4 style="margin-top:16px">⚡ 会自动避开的场景</h4>
      <div class="grid" style="gap:8px">
        <div class="col-6"><div class="box" style="padding:10px;font-size:13px">
          🦵 <b>私教练腿日</b>：自动跳过所有腿类课程和下肢力量，只留私教。备选方案给上肢力量或纯跑步。
        </div></div>
        <div class="col-6"><div class="box" style="padding:10px;font-size:13px">
          🏢 <b>上班第1天</b>：上午没法练，直接推荐休息。
        </div></div>
        <div class="col-6"><div class="box" style="padding:10px;font-size:13px">
          🤒 <b>生病/不适</b>：战力直接归零，只推荐休息恢复。
        </div></div>
        <div class="col-6"><div class="box" style="padding:10px;font-size:13px">
          📅 <b>明天练腿</b>：今天自动避开超高强度课程（如HYROX Complete）。
        </div></div>
      </div>
    </div>

    <div class="card"><h2>😴 睡眠对训练的影响</h2>
      <div class="box">
        <h4>💤 睡不够 = 战斗力打折</h4>
        <div style="font-family:monospace;margin:12px 0;padding:12px;background:#fef3c7;border-radius:8px">
          <p>睡眠罚分 = (目标睡眠 - 实际睡眠) × 每小时罚分</p>
        </div>
        <p>例如：目标7小时，实际5小时，每小时罚5分 → <b>罚10分</b>，疲劳增加10分</p>

        <h4 style="margin-top:16px">调整睡眠参数</h4>
        <param-row label="目标睡眠(小时)" v-model="params.sleepTargetHours" :default-val="7" step="0.5" :min="4" :max="12" />
        <param-row label="每小时罚分" v-model="params.sleepPenaltyPerHour" :default-val="5" :min="1" :max="20" />
        <div style="margin-top:12px"><button class="primary" style="padding:4px 16px;font-size:13px" @click="applySleep">应用以上参数</button></div>
      </div>
    </div>

    <div class="card"><h2>⚡ 疲劳是怎么算的？</h2>
      <details style="cursor:pointer">
        <summary style="font-weight:800;color:#374151;font-size:18px">📊 折叠查看详细参数（新手可跳过）</summary>
        <div class="box" style="background:#f0f9ff;border-color:#7dd3fc;margin-top:12px">
          <div class="grid" style="gap:12px;margin-bottom:12px">
            <div class="col-6"><div class="box" style="background:#fff;padding:12px">
              <h4>⚡ 短期疲劳（急性）</h4>
              <p style="font-size:13px">最近几天的训练有多累。恢复快，几天不练就没了。</p>
              <param-row label="衰减率" v-model="params.acuteDecayRate" :default-val="0.5" step="0.05" :min="0.1" :max="0.9" />
              <p class="muted" style="font-size:11px">数越大=疲劳消退越慢。新手恢复慢建议0.6-0.8</p>
              <param-row label="转换系数" v-model="params.acuteConversion" :default-val="0.2" step="0.05" :min="0.05" :max="0.5" />
              <p class="muted" style="font-size:11px">数越大=每次训练疲劳累积越快</p>
            </div></div>
            <div class="col-6"><div class="box" style="background:#fff;padding:12px">
              <h4>📅 长期疲劳（慢性）</h4>
              <p style="font-size:13px">几周甚至一个月的累积状态。变化慢，反映整体趋势。</p>
              <param-row label="映射系数" v-model="params.longTermMapFactor" :default-val="15" :min="5" :max="30" />
              <p class="muted" style="font-size:11px">数越大=长期疲劳影响越大</p>
              <param-row label="睡眠惩罚K" v-model="params.sleepPenaltyK" :default-val="0.15" step="0.01" :min="0" :max="0.5" />
              <p class="muted" style="font-size:11px">睡眠不足多久影响越大</p>
            </div></div>
          </div>
          <h4>疲劳权重</h4>
          <param-row label="短期权重" v-model="params.shortTermWeight" :default-val="0.7" step="0.1" :min="0" :max="1" />
          <param-row label="长期权重" v-model="params.longTermWeight" :default-val="0.3" step="0.1" :min="0" :max="1" />
          <p class="muted" style="font-size:11px">两个加一起应该=1。短期越高，最近训练影响越大。</p>
          <div style="margin-top:12px"><button class="primary" style="padding:4px 16px;font-size:13px" @click="applyFatigue">应用以上参数</button></div>
        </div>
      </details>
    </div>

    <div class="card"><h2>💪 战斗力与训练角色</h2>
      <div class="box">
        <div class="grid" style="gap:12px;margin-bottom:12px">
          <div class="col-6">
            <h4>你的感觉影响战力</h4>
            <table style="width:100%">
              <thead><tr><th>今天感觉</th><th>战力乘</th></tr></thead>
              <tbody>
                <tr><td>💪 很好</td><td>×1.2 ⬆</td></tr>
                <tr><td>😊 正常</td><td>×1.0</td></tr>
                <tr><td>😴 疲劳</td><td>×0.8 ⬇</td></tr>
                <tr><td>🥱 很疲劳</td><td>×0.6 ⬇</td></tr>
                <tr><td>🤒 生病</td><td>×0 🚫</td></tr>
              </tbody>
            </table>
          </div>
          <div class="col-6">
            <h4>战力决定了角色</h4>
            <table style="width:100%">
              <thead><tr><th>战力</th><th>角色</th></tr></thead>
              <tbody>
                <tr><td>≥ 70</td><td>🔴 HYROX 高强度</td></tr>
                <tr><td>50-69</td><td>🟡 力量训练</td></tr>
                <tr><td>30-49</td><td>🟢 Z2有氧</td></tr>
                <tr><td>&lt; 30</td><td>⚪ 恢复休息</td></tr>
                <tr><td>生病/不适</td><td>🚫 强制休息</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <h4>训练导向</h4>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button :class="profile.trainingOrientation === 'fatLoss' ? 'primary' : 'secondary'" @click="setOrientation('fatLoss')">🏃 减脂</button>
          <button :class="profile.trainingOrientation === 'hyrox' ? 'primary' : 'secondary'" @click="setOrientation('hyrox')">🏆 HYROX比赛</button>
        </div>
        <p class="muted" style="font-size:12px;margin-top:4px">当前：{{ profile.trainingOrientation === 'hyrox' ? '🏆 HYROX导向（偏向高强度和比赛专项）' : '🏃 减脂导向（偏向LSD燃脂跑）' }}</p>
      </div>
    </div>

    <div class="card"><h2>💰 训练预算</h2>
      <div class="box">
        <p style="font-size:14px">每天有个<b>体力预算</b>——战斗力越高，预算越多。推荐的课不能超过预算。</p>

        <param-row label="战力指数" v-model="params.combatPowerExponent" :default-val="1.5" step="0.1" :min="0.5" :max="3" />
        <p class="muted" style="font-size:12px">大于1时战力低预算更少。激进可设1.6-1.8，保守1.2-1.3</p>

        <h4 style="margin-top:12px">个人最大负荷</h4>
        <param-row label="窗口天数" v-model="params.personalMaxWindowDays" :default-val="28" :min="7" :max="90" />
        <p class="muted" style="font-size:12px">最近N天里你最累的一次有多累。数据不够时用855保底。</p>

        <h4 style="margin-top:12px">夜班折扣</h4>
        <param-row label="折扣系数" v-model="params.nightBudgetDiscount" :default-val="0.8" step="0.05" :min="0.5" :max="1" />
        <p class="muted" style="font-size:12px">夜班当天训练预算打折，0.8=打八折</p>

        <h4 style="margin-top:12px">力量重量系数</h4>
        <param-row label="重量系数" v-model="params.strengthWeightScale" :default-val="1.0" step="0.05" :min="0.3" :max="1.5" />
        <p class="muted" style="font-size:12px">全局缩放所有推荐重量。觉得推荐太重就调小（如0.6-0.7），太轻就调大。</p>
        <div style="margin-top:12px"><button class="primary" style="padding:4px 16px;font-size:13px" @click="applyBudget">应用以上参数</button></div>
      </div>
    </div>

    <div class="card"><h2>📦 智能课包设置</h2>
      <div class="box">
        <p style="font-size:14px">课包 = 系统帮你把当天能上的课组合在一起，不超过预算。</p>
        <param-row label="最多几门课" v-model="params.maxPackageCourses" :default-val="3" :min="1" :max="5" />

        <h4 style="margin-top:12px">过高强度保护</h4>
        <p style="font-size:13px">连续高强度课太多时自动刹车。</p>
        <param-row label="触发阈值" v-model="params.highIntensityProtectThreshold" :default-val="8" :min="1" :max="10" />
        <param-row label="允许疲劳值" v-model="params.protectAcceptableFatigue" :default-val="4" :min="1" :max="10" />
        <div style="margin-top:12px"><button class="primary" style="padding:4px 16px;font-size:13px" @click="applyPackage">应用以上参数</button></div>
      </div>
    </div>

    <div class="card"><h2>🏃 自助训练是什么？</h2>
      <div class="box">
        <p style="font-size:14px">没有课程的日子，或者体能还有余量时，系统会自动搭配自助训练——<b>跑步</b>或<b>力量</b>。不用你操心，全自动选最合适的。</p>

        <h4>🏃 三种跑步模式</h4>
        <div class="grid" style="gap:8px">
          <div class="col-4"><div class="box" style="background:#dcfce7;border-color:#22c55e;text-align:center">
            <h4>🐢 LSD 燃脂跑</h4>
            <p style="font-size:13px;color:#166534">慢跑65分钟 · 轻松<br>减脂日、恢复日的首选</p>
          </div></div>
          <div class="col-4"><div class="box" style="background:#fef3c7;border-color:#fbbf24;text-align:center">
            <h4>🐇 阈值间歇跑</h4>
            <p style="font-size:13px;color:#92400e">快跑50分钟 · 较累<br>比赛专项、耐力提升</p>
          </div></div>
          <div class="col-4"><div class="box" style="background:#fef2f2;border-color:#fca5a5;text-align:center">
            <h4>🚀 VO2max 冲刺</h4>
            <p style="font-size:13px;color:#991b1b">极限45分钟 · 很累<br>战力≥80且状态好才推</p>
          </div></div>
        </div>

        <h4 style="margin-top:16px">💪 五种力量模式</h4>
        <div class="grid" style="gap:8px">
          <div class="col-4"><div class="box" style="text-align:center;padding:10px">
            <h4>全身A</h4>
            <p style="font-size:12px">推+深蹲（腿）</p>
          </div></div>
          <div class="col-4"><div class="box" style="text-align:center;padding:10px">
            <h4>全身B</h4>
            <p style="font-size:12px">拉+RDL（腿）</p>
          </div></div>
          <div class="col-4"><div class="box" style="text-align:center;padding:10px">
            <h4>全身C</h4>
            <p style="font-size:12px">全身循环60分钟</p>
          </div></div>
          <div class="col-4"><div class="box" style="text-align:center;padding:10px">
            <h4>上肢主导</h4>
            <p style="font-size:12px">胸/肩/背/臂</p>
          </div></div>
          <div class="col-4"><div class="box" style="text-align:center;padding:10px">
            <h4>下肢主导</h4>
            <p style="font-size:12px">深蹲+后链+臀</p>
          </div></div>
          <div class="col-4"><div class="box" style="background:#fef3c7;text-align:center;padding:10px">
            <p style="font-size:12px;color:#92400e">🦵 练腿日自动跳过<br>带"腿"的力量模式</p>
          </div></div>
        </div>
      </div>
    </div>

    <div class="card"><h2>💡 新手建议</h2>
      <div class="grid">
        <div class="col-6"><div class="box" style="background:#dcfce7;border-color:#22c55e">
          <h4>🚀 想练得更猛？</h4>
          <ul style="font-size:13px">
            <li>衰减率 → 0.3-0.5</li>
            <li>战力指数 → 1.6-1.8</li>
            <li>夜班折扣 → 0.9</li>
            <li>导向选 HYROX</li>
          </ul>
        </div></div>
        <div class="col-6"><div class="box" style="background:#fef3c7;border-color:#fbbf24">
          <h4>🛌 想保守一点？</h4>
          <ul style="font-size:13px">
            <li>衰减率 → 0.6-0.8</li>
            <li>战力指数 → 1.2-1.3</li>
            <li>夜班折扣 → 0.7</li>
            <li>导向选 减脂</li>
          </ul>
        </div></div>
      </div>
    </div>

    <div class="card"><h2>❓ 常见问题</h2>
      <details style="cursor:pointer">
        <summary style="font-weight:800;color:#374151">战力很低为什么还推荐训练？</summary>
        <div class="box">
          <p>战力低于30时系统推的是"瑜伽拉伸"这种恢复活动，不是高强度训练。轻度活动有助于恢复。但如果选了"生病/不适"，战力直接归零，只让休息。</p>
        </div>
      </details>
      <details style="cursor:pointer">
        <summary style="font-weight:800;color:#374151">个人最大负荷是什么？</summary>
        <div class="box">
          <p>最近{{ profile.personalMaxWindowDays || 28 }}天里你训练最累那天的TL值。新人数据不够时默认855。数据够了就用实际值。</p>
        </div>
      </details>
      <details style="cursor:pointer">
        <summary style="font-weight:800;color:#374151">练腿日为什么少了一门课？</summary>
        <div class="box">
          <p>练腿日系统自动过滤所有腿类课程（循环训练、BodyPump、HYROX系列等），避免腿过度训练。瑜伽、TRX、BodyCombat等不受影响，仍可推荐。</p>
        </div>
      </details>
      <details style="cursor:pointer">
        <summary style="font-weight:800;color:#374151">额外课程什么时候会加？</summary>
        <div class="box">
          <p>方案A的主课确定后，如果今天的体力预算还有剩，就自动从剩余课程里挑一门最好的加上去。练腿日不会加腿类课程。</p>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { nval } from '../utils/helpers'
import ParamRow from '../components/ParamRow.vue'

const store = useAppStore()
const profile = computed(() => store.data.profile)

const params = reactive({
  sleepTargetHours: nval(store.data.profile.sleepTargetHours, 7),
  sleepPenaltyPerHour: nval(store.data.profile.sleepPenaltyPerHour, 5),
  acuteDecayRate: nval(store.data.profile.acuteDecayRate, 0.5),
  acuteConversion: nval(store.data.profile.acuteConversion, 0.2),
  longTermMapFactor: nval(store.data.profile.longTermMapFactor, 15),
  sleepPenaltyK: nval(store.data.profile.sleepPenaltyK, 0.15),
  shortTermWeight: nval(store.data.profile.shortTermWeight, 0.7),
  longTermWeight: nval(store.data.profile.longTermWeight, 0.3),
  combatPowerExponent: nval(store.data.profile.combatPowerExponent, 1.5),
  personalMaxWindowDays: nval(store.data.profile.personalMaxWindowDays, 28),
  nightBudgetDiscount: nval(store.data.profile.nightBudgetDiscount, 0.8),
  strengthWeightScale: nval(store.data.profile.strengthWeightScale, 1.0),
  maxPackageCourses: nval(store.data.profile.maxPackageCourses, 3),
  highIntensityProtectThreshold: nval(store.data.profile.highIntensityProtectThreshold, 8),
  protectAcceptableFatigue: nval(store.data.profile.protectAcceptableFatigue, 4)
})

function batchApply(keys, defaults) {
  keys.forEach(([key, def]) => {
    const val = nval(params[key], def)
    params[key] = val
    store.data.profile[key] = val
  })
  store.saveData()
}

function applySleep() {
  batchApply([
    ['sleepTargetHours', 7],
    ['sleepPenaltyPerHour', 5]
  ])
}

function applyFatigue() {
  batchApply([
    ['acuteDecayRate', 0.5],
    ['acuteConversion', 0.2],
    ['longTermMapFactor', 15],
    ['sleepPenaltyK', 0.15],
    ['shortTermWeight', 0.7],
    ['longTermWeight', 0.3]
  ])
}

function applyBudget() {
  batchApply([
    ['combatPowerExponent', 1.5],
    ['personalMaxWindowDays', 28],
    ['nightBudgetDiscount', 0.8],
    ['strengthWeightScale', 1.0]
  ])
}

function applyPackage() {
  batchApply([
    ['maxPackageCourses', 3],
    ['highIntensityProtectThreshold', 8],
    ['protectAcceptableFatigue', 4]
  ])
}

function setOrientation(ori) {
  store.data.profile.trainingOrientation = ori
  store.saveData()
}
</script>
