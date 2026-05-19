export const CLASS_PRESETS = {
  "循环训练": { kind: "团课", duration: 60, met: 8.5, rpeMin: 7, rpeMax: 10, tag: "hiit", hyrox: 8, fatigue: 8, isLeg: true },
  "战绳训练": { kind: "团课", duration: 60, met: 8.5, rpeMin: 7, rpeMax: 10, tag: "hiit", hyrox: 7, fatigue: 8, isLeg: false },
  "高能药球": { kind: "团课", duration: 60, met: 8.3, rpeMin: 7, rpeMax: 10, tag: "wallball", hyrox: 8, fatigue: 8, isLeg: false },
  "BodyCombat": { kind: "团课", duration: 60, met: 7.5, rpeMin: 7, rpeMax: 9, tag: "conditioning", hyrox: 6, fatigue: 7, isLeg: false },
  "BodyPump": { kind: "团课", duration: 60, met: 6.2, rpeMin: 6, rpeMax: 8, tag: "strengthEndurance", hyrox: 6, fatigue: 6, isLeg: true },
  "HYROX Power": { kind: "团课", duration: 60, met: 8.2, rpeMin: 7, rpeMax: 10, tag: "hyroxPower", hyrox: 9, fatigue: 8, isLeg: true },
  "HYROX Engine": { kind: "团课", duration: 60, met: 8.8, rpeMin: 7, rpeMax: 10, tag: "hyroxEngine", hyrox: 9, fatigue: 8, isLeg: true },
  "HYROX Complete": { kind: "团课", duration: 90, met: 9.5, rpeMin: 8, rpeMax: 10, tag: "hyroxSimulation", hyrox: 10, fatigue: 10, isLeg: true },
  "TRX功能性训练": { kind: "团课", duration: 60, met: 6.8, rpeMin: 6, rpeMax: 8, tag: "functional", hyrox: 7, fatigue: 6, isLeg: false },
  "普拉提核心": { kind: "团课", duration: 60, met: 3.5, rpeMin: 4, rpeMax: 6, tag: "core", hyrox: 4, fatigue: 3, isLeg: false },
  "瑜伽静态拉伸": { kind: "团课", duration: 60, met: 2.5, rpeMin: 2, rpeMax: 4, tag: "mobility", hyrox: 2, fatigue: 1, isLeg: false },
  "私教力量": { kind: "私教", duration: 60, met: 6.0, rpeMin: 6, rpeMax: 8, tag: "ptStrength", hyrox: 7, fatigue: 6, isLeg: false },
  "自助力量": { kind: "自助", duration: 60, met: 5.8, rpeMin: 6, rpeMax: 8, tag: "selfStrength", hyrox: 6, fatigue: 5, isLeg: false },
  "自助跑步": { kind: "自助", duration: 45, met: 8.0, rpeMin: 5, rpeMax: 8, tag: "run", hyrox: 7, fatigue: 6, isLeg: false },
  "Z2单车/椭圆机": { kind: "自助", duration: 45, met: 5.5, rpeMin: 4, rpeMax: 6, tag: "z2", hyrox: 5, fatigue: 3, isLeg: false },
  "快走/坡走": { kind: "自助", duration: 45, met: 3.8, rpeMin: 3, rpeMax: 5, tag: "walk", hyrox: 3, fatigue: 2, isLeg: false },
  "休息": { kind: "恢复", duration: 0, met: 0, rpeMin: 0, rpeMax: 0, tag: "rest", hyrox: 0, fatigue: 0, isLeg: false }
}

export const CLASS_NAMES = Object.keys(CLASS_PRESETS)
export const LOG_TYPES = CLASS_NAMES.filter(x => x !== "休息").concat(["其他"])
