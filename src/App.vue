<template>
  <header>
    <div class="wrap">
      <h1>HYROX 训练饮食计划器 V{{ displayVersion }}</h1>
      <p>综合训练规划与管理工具：智能排班 · 双组分疲劳模型 · 训练负荷追踪 · 每日打卡 · 明日疲劳预测 · 热量与饮食建议 · 身体维度记录 · 云端同步</p>
    </div>
  </header>
  <main>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: store.activeTab === tab.id }"
        @click="store.switchTab(tab.id)"
      >{{ tab.label }}</button>
    </div>

    <HomeView v-if="store.activeTab === 'home'" />
    <ScheduleView v-if="store.activeTab === 'schedule'" />
    <ClassesView v-if="store.activeTab === 'classes'" />
    <LogView v-if="store.activeTab === 'log'" />
    <SelfTrainView v-if="store.activeTab === 'selftrain'" />
    <StatsView v-if="store.activeTab === 'stats'" />
    <BodyStatsView v-if="store.activeTab === 'bodyStats'" />
    <ProfileView v-if="store.activeTab === 'profile'" />
    <HelpView v-if="store.activeTab === 'help'" />
    <SyncView v-if="store.activeTab === 'sync'" />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from './stores/app'
import { VERSION } from './config/constants'
import HomeView from './views/HomeView.vue'
import ScheduleView from './views/ScheduleView.vue'
import ClassesView from './views/ClassesView.vue'
import LogView from './views/LogView.vue'
import StatsView from './views/StatsView.vue'
import BodyStatsView from './views/BodyStatsView.vue'
import ProfileView from './views/ProfileView.vue'
import HelpView from './views/HelpView.vue'
import SyncView from './views/SyncView.vue'
import SelfTrainView from './views/SelfTrainView.vue'

const store = useAppStore()

const displayVersion = computed(() => {
  const parts = VERSION.split('.')
  return parts[2] === '0' ? `${parts[0]}.${parts[1]}` : VERSION
})

const tabs = [
  { id: 'home', label: '首页' },
  { id: 'schedule', label: '排班' },
  { id: 'classes', label: '课表' },
  { id: 'log', label: '打卡' },
  { id: 'selftrain', label: '自训' },
  { id: 'stats', label: '统计' },
  { id: 'bodyStats', label: '身体' },
  { id: 'profile', label: '参数' },
  { id: 'help', label: '帮助' },
  { id: 'sync', label: '同步' }
]
</script>
