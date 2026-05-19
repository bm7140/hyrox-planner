<template>
  <div>
    <div class="card"><h2>同步码同步</h2>
      <div class="notice">
        同步码用于多设备共享同一份训练、排班、课表、打卡和身体维度数据。<br>
        <b>新同步逻辑：</b><br>
        1. 首次打开自动从云端拉取数据，覆盖本地<br>
        2. 之后本地修改会自动同步到云端<br>
        3. 仍可使用手动同步按钮进行操作
      </div>
      <div :class="syncCode ? 'box ok' : 'box warn'" style="margin-top:12px">
        <span :class="supabaseClient ? 'pill green' : 'pill orange'">{{ supabaseClient ? 'Supabase已配置' : 'Supabase未配置，仅本地可用' }}</span>
        <br>
        {{ syncCode ? `已绑定同步码：<b>${escapeHtml(syncCode)}</b>` : '未绑定同步码' }}
        <br>
        本地更新时间：{{ localTime }}
        <br v-if="syncStatus">
        <b>{{ syncStatus }}</b>
      </div>
      <div class="grid">
        <div class="col-6"><label>同步码</label><input v-model="syncCodeInput" placeholder="例如 HYROX-2026"></div>
        <div class="col-6" style="display:flex;align-items:end;gap:8px;flex-wrap:wrap">
          <button class="primary" @click="bindSyncCode">绑定并智能同步</button>
          <button class="secondary" @click="unbindSyncCode">解除绑定</button>
        </div>
        <div class="col-12" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="green" @click="smartSync">智能同步</button>
          <button class="secondary" @click="pullCloud">只从云端拉取</button>
          <button class="orange" @click="pushCloud(true)">只上传本机</button>
        </div>
      </div>
    </div>
    <div class="card"><h2>备份与导入</h2>
      <div class="grid">
        <div class="col-6"><label>导出数据</label><textarea v-model="exportText" placeholder="点击导出后显示 JSON"></textarea><button class="primary" @click="exportData">导出并复制</button></div>
        <div class="col-6"><label>导入数据</label><textarea v-model="importText" placeholder="粘贴 JSON 数据"></textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="green" @click="importData">智能合并导入</button>
            <button class="orange" @click="replaceData">完全替换导入</button>
          </div>
        </div>
        <div class="col-12"><button class="danger" @click="clearData">清空本地数据</button></div>
      </div>
    </div>
    <div class="card"><h2>Supabase 配置提示</h2><div class="warn">当前使用旧版兼容同步方式：<b>pull_planner_by_code</b> 和 <b>push_planner_by_code</b> 两个 RPC 函数。</div></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/app'
import { normalizeCode, nowISO, deepClone, newerISO, esc } from '../utils/helpers'
import { useStorage } from '../composables/useStorage'
import { CLASS_PRESETS } from '../config/classPresets'

const store = useAppStore()
const storage = useStorage()

const syncCodeInput = ref(store.syncCode)
const syncCode = computed(() => store.syncCode)
const supabaseClient = computed(() => store.supabaseClient)
const syncStatus = ref('')
const exportText = ref('')
const importText = ref('')

const localTime = computed(() => {
  return store.data.meta?.updatedAt ? new Date(store.data.meta.updatedAt).toLocaleString() : '无'
})

function escapeHtml(s) { return esc(s) }

async function pullRaw() {
  if (!store.supabaseClient) throw new Error("未配置 Supabase")
  if (!store.syncCode) throw new Error("未绑定同步码")
  const { data: rows, error } = await store.supabaseClient.rpc("pull_planner_by_code", { p_code: store.syncCode })
  if (error) throw error
  return rows && rows.length ? rows[0] : null
}

async function pushRaw() {
  if (!store.supabaseClient) throw new Error("未配置 Supabase")
  if (!store.syncCode) throw new Error("未绑定同步码")
  const { data: rows, error } = await store.supabaseClient.rpc("push_planner_by_code", {
    p_code: store.syncCode,
    p_state: storage.mergeData(store.data)
  })
  if (error) throw error
  return rows && rows.length ? rows[0] : null
}

async function bindSyncCode() {
  const code = normalizeCode(syncCodeInput.value || "")
  if (!code) return alert("请输入同步码")
  store.syncCode = code
  localStorage.setItem("hyrox_training_planner_sync_code", store.syncCode)
  syncStatus.value = "正在从云端拉取数据..."
  try {
    const row = await pullRaw()
    if (row && row.state) {
      store.cloudRevision = Number(row.revision || 0)
      Object.assign(store.data, storage.mergeData(row.state || {}))
      store.saveLocalOnly()
      syncStatus.value = "已绑定同步码并拉取云端数据。"
      alert("已绑定同步码，云端数据已拉取")
    } else {
      syncStatus.value = "已绑定同步码，云端暂无数据。"
      alert("已绑定同步码，云端暂无数据")
    }
  } catch (e) {
    alert("拉取失败：" + e.message)
    syncStatus.value = "绑定成功，但拉取失败：" + e.message
  }
  store.isFirstSessionCompleted = true
  sessionStorage.setItem("hyrox_first_sync_completed", "true")
  store.autoSyncEnabled = true
}

function unbindSyncCode() {
  if (!confirm("确定解除本机同步码绑定？不会删除云端数据。")) return
  store.syncCode = ""
  store.cloudRevision = 0
  localStorage.removeItem("hyrox_training_planner_sync_code")
  syncCodeInput.value = ""
  syncStatus.value = "已解除绑定。"
}

async function pullCloud() {
  if (!store.syncCode) { alert("请先绑定同步码"); return }
  try {
    syncStatus.value = "正在从云端拉取..."
    const row = await pullRaw()
    if (!row) { syncStatus.value = "云端暂无数据。"; alert("云端暂无数据"); return }
    store.cloudRevision = Number(row.revision || 0)
    Object.assign(store.data, storage.mergeData(row.state || {}))
    store.saveLocalOnly()
    syncStatus.value = "已从云端拉取。"
    store.isFirstSessionCompleted = true
    sessionStorage.setItem("hyrox_first_sync_completed", "true")
    store.autoSyncEnabled = true
    alert("已拉取云端数据")
  } catch (e) {
    alert("拉取失败：" + e.message)
    syncStatus.value = "拉取失败：" + e.message
  }
}

async function pushCloud(ask = true) {
  if (!store.syncCode) { alert("请先绑定同步码"); return }
  if (ask && !confirm("确定上传本机数据到云端？建议优先使用智能同步。")) return
  try {
    syncStatus.value = "正在上传..."
    const row = await pushRaw()
    if (row) store.cloudRevision = Number(row.revision || 0)
    syncStatus.value = "已上传。"
    if (ask) alert("已上传")
  } catch (e) {
    alert("上传失败：" + e.message)
    syncStatus.value = "上传失败：" + e.message
  }
}

async function smartSync() {
  if (!store.syncCode) { alert("请先绑定同步码"); store.switchTab("sync"); return }
  try {
    syncStatus.value = "正在智能同步..."
    const row = await pullRaw()
    if (!row) {
      await pushCloud(false)
      syncStatus.value = "云端无数据，已上传本机。"
      return
    }
    store.cloudRevision = Number(row.revision || 0)
    const cloudState = storage.mergeData(row.state || {})
    const merged = storage.smartMergeData(store.data, cloudState)
    if (!storage.hasUsefulContent(merged) && storage.hasUsefulContent(cloudState)) {
      throw new Error("异常空合并结果，已阻止覆盖。")
    }
    Object.assign(store.data, merged)
    store.saveLocalOnly()
    const pushed = await pushRaw()
    if (pushed) store.cloudRevision = Number(pushed.revision || 0)
    syncStatus.value = "智能同步完成。"
  } catch (e) {
    alert("智能同步失败：" + e.message)
    syncStatus.value = "智能同步失败：" + e.message
  }
}

function exportData() {
  const txt = JSON.stringify(store.data, null, 2)
  exportText.value = txt
  navigator.clipboard?.writeText(txt).catch(() => {})
  alert("数据已导出，并尝试复制到剪贴板。")
}

function importData() {
  try {
    const obj = JSON.parse(importText.value || "")
    const imported = storage.mergeData(obj)
    const merged = storage.smartMergeData(store.data, imported)
    Object.assign(store.data, merged)
    store.saveData()
    alert("导入成功。")
  } catch (e) { alert("导入失败：" + e.message) }
}

function replaceData() {
  try {
    if (!confirm("确定用导入内容完全替换本地数据？建议先导出备份。")) return
    Object.assign(store.data, storage.mergeData(JSON.parse(importText.value || "")))
    store.saveData()
    alert("已替换本地数据。")
  } catch (e) { alert("替换失败：" + e.message) }
}

function clearData() {
  if (confirm("确定清空本地数据？云端不会立刻清空。")) {
    localStorage.removeItem("hyrox_planner_v431")
    Object.assign(store.data, storage.defaultData())
    store.activityDraft = []
    alert("本地已清空。")
  }
}
</script>