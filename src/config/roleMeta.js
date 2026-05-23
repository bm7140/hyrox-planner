export const ROLE_META = {
  no_train: { label: "不可安排课程", deficit: 500, minIn: 1850, steps: 7000 },
  recovery: { label: "恢复/活动度", deficit: 400, minIn: 1900, steps: 7500 },
  z2: { label: "Z2有氧", deficit: 400, minIn: 2000, steps: 8500 },
  strength: { label: "力量专项", deficit: 300, minIn: 2150, steps: 9000 },
  hyrox: { label: "HYROX主训练", deficit: 250, minIn: 2250, steps: 9500 },
  complete: { label: "HYROX模拟赛", deficit: 100, minIn: 2450, steps: 10000 },
  conditioning: { label: "综合体能", deficit: 300, minIn: 2150, steps: 9000 },
  rest: { label: "完全休息", deficit: 500, minIn: 1850, steps: 6500 }
}
