export const RUN_VARIANTS = {
  lsd: {
    label: "LSD 燃脂跑",
    labelShort: "LSD",
    duration: 65,
    met: 5.5,
    rpeMin: 4,
    rpeMax: 6,
    fatigue: 2,
    hrZone: "Z2",
    description: "长距离慢跑，脂肪氧化优势区"
  },
  threshold: {
    label: "阈值间歇跑",
    labelShort: "阈值间歇",
    duration: 50,
    met: 9.0,
    rpeMin: 7,
    rpeMax: 8,
    fatigue: 7,
    hrZone: "阈值",
    description: "乳酸阈值附近，提升有氧输出能力"
  },
  vo2max: {
    label: "VO2max 间歇",
    labelShort: "VO2max",
    duration: 45,
    met: 11.0,
    rpeMin: 8,
    rpeMax: 10,
    fatigue: 9,
    hrZone: "无氧",
    description: "最大摄氧量训练，高强度短间歇"
  }
}

export const RUN_VARIANT_KEYS = Object.keys(RUN_VARIANTS)

export const RUN_VARIANT_LABELS = {
  lsd: "LSD 燃脂跑",
  threshold: "阈值间歇跑",
  vo2max: "VO2max 间歇"
}

export const STRENGTH_VARIANTS = {
  fullA: {
    label: "全身A（推+下肢）",
    labelShort: "全身A",
    duration: 60,
    met: 6.5,
    rpeMin: 6,
    rpeMax: 7,
    fatigue: 5,
    focus: "",
    isLower: true,
    isUpper: false,
    isHybrid: false,
    description: "卧推复合 + 深蹲"
  },
  fullB: {
    label: "全身B（拉+后链）",
    labelShort: "全身B",
    duration: 60,
    met: 6.5,
    rpeMin: 6,
    rpeMax: 7,
    fatigue: 5,
    focus: "",
    isLower: true,
    isUpper: false,
    isHybrid: false,
    description: "划船复合 + RDL"
  },
  fullC: {
    label: "全身C（混合代谢）",
    labelShort: "全身C",
    duration: 60,
    met: 7.0,
    rpeMin: 7,
    rpeMax: 8,
    fatigue: 6,
    focus: "",
    isLower: false,
    isUpper: false,
    isHybrid: true,
    description: "全身循环，高代谢压力"
  },
  upper: {
    label: "上肢主导",
    labelShort: "上肢",
    duration: 60,
    met: 5.5,
    rpeMin: 6,
    rpeMax: 7,
    fatigue: 4,
    focus: "上肢",
    isLower: false,
    isUpper: true,
    isHybrid: false,
    description: "胸/肩/背/臂专项塑形"
  },
  lower: {
    label: "下肢主导",
    labelShort: "下肢",
    duration: 60,
    met: 6.0,
    rpeMin: 7,
    rpeMax: 8,
    fatigue: 6,
    focus: "腿",
    isLower: true,
    isUpper: false,
    isHybrid: false,
    description: "深蹲 + 后链 + 臀专项"
  }
}

export const STRENGTH_VARIANT_KEYS = Object.keys(STRENGTH_VARIANTS)

export const STRENGTH_VARIANT_LABELS = {
  fullA: "全身A（推+下肢）",
  fullB: "全身B（拉+后链）",
  fullC: "全身C（混合代谢）",
  upper: "上肢主导",
  lower: "下肢主导"
}

export const STRENGTH_VARIANT_ORDER = ["fullA", "fullB", "upper", "fullC", "lower"]

export const LOWER_DOMINANT_COURSES = [
  "HYROX Engine",
  "HYROX Power",
  "HYROX Complete",
  "战绳训练",
  "高能药球",
  "循环训练",
  "BodyCombat"
]

export const LOWER_DOMINANT_SELF_FOCUS = ["腿"]

export function getRunVariantParams(variantKey, profileSelfTrain) {
  if (profileSelfTrain && profileSelfTrain.runVariants && profileSelfTrain.runVariants[variantKey]) {
    return { ...RUN_VARIANTS[variantKey], ...profileSelfTrain.runVariants[variantKey] }
  }
  return RUN_VARIANTS[variantKey] || RUN_VARIANTS.lsd
}

export function getStrengthVariantParams(variantKey, profileSelfTrain) {
  if (profileSelfTrain && profileSelfTrain.strengthVariants && profileSelfTrain.strengthVariants[variantKey]) {
    return { ...STRENGTH_VARIANTS[variantKey], ...profileSelfTrain.strengthVariants[variantKey] }
  }
  return STRENGTH_VARIANTS[variantKey] || STRENGTH_VARIANTS.fullA
}

export const DEFAULT_SELF_TRAIN_PROFILE = {
  runVariants: {
    lsd: { duration: 65, met: 5.5, rpeMin: 4, rpeMax: 6, fatigue: 2 },
    threshold: { duration: 50, met: 9.0, rpeMin: 7, rpeMax: 8, fatigue: 7 },
    vo2max: { duration: 45, met: 11.0, rpeMin: 8, rpeMax: 10, fatigue: 9 }
  },
  strengthVariants: {
    fullA: { duration: 60, met: 6.5, rpeMin: 6, rpeMax: 7, fatigue: 5 },
    fullB: { duration: 60, met: 6.5, rpeMin: 6, rpeMax: 7, fatigue: 5 },
    fullC: { duration: 60, met: 7.0, rpeMin: 7, rpeMax: 8, fatigue: 6 },
    upper: { duration: 60, met: 5.5, rpeMin: 6, rpeMax: 7, fatigue: 4 },
    lower: { duration: 60, met: 6.0, rpeMin: 7, rpeMax: 8, fatigue: 6 }
  }
}
