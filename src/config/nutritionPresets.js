export const MACRO_TARGETS = {
  no_train:     { protein: 1.6, carb: 2.0, fat: 0.8, label: "休息日" },
  recovery:     { protein: 1.8, carb: 2.2, fat: 0.8, label: "恢复日" },
  rest:         { protein: 1.6, carb: 2.0, fat: 0.8, label: "完全休息" },
  z2:           { protein: 1.6, carb: 3.5, fat: 0.8, label: "Z2有氧日" },
  strength:     { protein: 2.0, carb: 3.0, fat: 0.8, label: "力量日" },
  hyrox:        { protein: 1.8, carb: 4.5, fat: 0.8, label: "HYROX日" },
  complete:     { protein: 1.8, carb: 5.0, fat: 0.7, label: "模拟赛日" },
  conditioning: { protein: 1.8, carb: 4.0, fat: 0.8, label: "体能日" }
}

export const HYDRATION = {
  base: 35,
  per30min: 150
}

export function calcMacros(role, bw, targetKcal) {
  const t = MACRO_TARGETS[role] || MACRO_TARGETS.rest
  const pG = Math.round(bw * t.protein)
  const cG = Math.round(bw * t.carb)
  const fG = Math.round(bw * t.fat)
  const pK = pG * 4
  const cK = cG * 4
  const fK = fG * 9
  const totalK = pK + cK + fK
  return { proteinG: pG, carbG: cG, fatG: fG, proteinKcal: pK, carbKcal: cK, fatKcal: fK, totalMacroKcal: totalK, roleLabel: t.label }
}

export function calcHydration(bw, durationMin) {
  const base = bw * 35
  const extra = Math.floor(durationMin / 30) * 150
  return { base, extra, total: base + extra }
}

export function genMeals(role, orientation, targetKcal, bw, deficit) {
  const isHigh = ["hyrox", "complete", "conditioning"].includes(role)
  const isStrength = role === "strength"
  const isZ2 = role === "z2"
  const isRecovery = ["recovery", "rest", "no_train"].includes(role)

  const kcal = targetKcal
  const macros = calcMacros(role, bw, targetKcal)
  const bSplit = Math.round(isRecovery ? kcal * 0.28 : isStrength ? kcal * 0.25 : isHigh ? kcal * 0.25 : kcal * 0.28)

  let breakfast, postWorkout, lunch, dinner

  if (isHigh || isZ2 || (isStrength && !isRecovery)) {
    breakfast = {
      label: "练前早餐（轻量快碳+少量蛋白）",
      time: "训练前60-90分钟",
      examples: [
        "燕麦50g煮牛奶 + 鸡蛋1个 + 香蕉1根",
        "全麦面包2片 + 花生酱半勺 + 香蕉1根 + 鸡蛋1个",
        "小米粥1碗 + 鸡蛋1个 + 蓝莓50g"
      ],
      roughly: `${bSplit} kcal`,
      note: "易消化、低纤维、不要吃撑。空腹训练会降强度。"
    }
    postWorkout = {
      label: "练后恢复餐",
      time: "训练结束后30分钟内",
      examples: [
        "蛋白粉1勺 + 香蕉1根 + 燕麦40g（或牛奶250ml）",
        "鸡蛋2个 + 全麦面包2片 + 香蕉1根 + 蜂蜜5g",
        "希腊酸奶200g + 燕麦40g + 蓝莓"
      ],
      roughly: `${Math.round(kcal * 0.18)} kcal`,
      note: "蛋白质+快碳 1:3~4，把握30分钟黄金窗口。"
    }
  } else {
    breakfast = {
      label: "早餐（均衡）",
      time: "起床后1小时内",
      examples: [
        "鸡蛋2个 + 燕麦40g + 苹果1个 + 小青菜100g",
        "鸡胸肉80g + 全麦面包1片 + 牛油果半个 + 番茄",
        "希腊酸奶200g + 燕麦40g + 蓝莓 + 核桃15g"
      ],
      roughly: `${bSplit} kcal`,
      note: "蛋白质充足，碳水按饥饿感调整。"
    }
    postWorkout = null
  }

  lunch = {
    label: "午餐",
    time: "12:00-13:30",
    examples: [
      "鸡胸肉150g + 杂粮饭" + (isHigh || isStrength ? "200g" : isRecovery ? "100g" : "150g") + " + 西兰花200g + 橄榄油",
      "鱼/虾200g + 红薯" + (isHigh || isStrength ? "250g" : isRecovery ? "150g" : "200g") + " + 菠菜200g",
      "瘦牛肉120g + 荞麦面80g + 黄瓜1根 + 番茄炒蛋",
      "猪里脊120g + 杂粮饭150g + 菌菇类150g"
    ],
    roughly: `${Math.round(kcal * 0.32)} kcal`,
    note: isHigh || isStrength ? "训练后正餐，主食要给足。出汗多补钠钾（汤/电解质）。" : isRecovery ? "蛋白质和蔬菜优先，主食适中。" : "蛋白质和蔬菜优先，主食适中，维持热量缺口。"
  }

  dinner = {
    label: "晚餐",
    time: "18:00-19:30",
    examples: [
      "鸡胸肉150g + 杂粮饭" + (isHigh || isStrength ? "150g" : "100g") + " + 西兰花200g + 紫菜蛋花汤",
      "老豆腐200g + 红薯/紫薯150g + 菠菜200g + 芝麻酱",
      (isRecovery ? "鱼/虾200g" : "鸡胸肉150g") + " + 燕麦40g + 菌菇类150g",
      "猪里脊120g + 冬瓜汤 + 胡萝卜150g" + (isHigh ? " + 杂粮饭100g" : "")
    ],
    roughly: `${Math.round(kcal * 0.22)} kcal`,
    note: isRecovery ? "控制总量，蛋白质和蔬菜为主，不再加额外碳水。睡前3小时不进食。" : isHigh || isStrength ? "蛋白质优先+适量碳水，帮助夜间恢复。睡前3小时不进食。" : "按白天剩余热量调整，避免高油零食。睡前3小时不进食。"
  }

  const nightShift = {
    label: "夜班加餐（可选）",
    time: "夜班期间",
    examples: [
      "低脂高蛋白：酸奶+坚果+香蕉",
      "鸡胸肉丸+全麦面包+水果",
      "蛋白粉+牛奶+燕麦片"
    ],
    roughly: "200-300 kcal",
    note: "避免泡面、炸物、奶茶和下班后暴食。"
  }

  let snackNote = ""
  if (isHigh || isStrength || isZ2) {
    snackNote = "如果早餐距训练超过2小时，练前30分钟可加香蕉/能量胶/面包片一份"
  }

  return { macros, breakfast, postWorkout, lunch, dinner, nightShift, snackNote }
}
