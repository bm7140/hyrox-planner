function calc12RM(p, sc) { return Math.round(p * 1.2 / 1.4 * sc / 2.5) * 2.5 }
function calc15RM(p, sc) { return Math.round(p * 1.2 / 1.5 * sc / 2.5) * 2.5 }
function calc18RM(p, sc) { return Math.round(p * 1.2 / 1.6 * sc / 2.5) * 2.5 }
function calc20RM(p, sc) { return Math.round(p * 1.2 / 1.667 * sc / 2.5) * 2.5 }
function dumbbell(p, rep, sc) {
  const fns = { 12: calc12RM, 15: calc15RM, 18: calc18RM, 20: calc20RM }
  const fn = fns[rep] || calc15RM
  const total = fn(p, sc)
  return Math.round(total / 2 / 2.5) * 2.5
}
function singleDumbbell(p, rep, sc) {
  const fns = { 12: calc12RM, 15: calc15RM, 18: calc18RM, 20: calc20RM }
  const fn = fns[rep] || calc15RM
  return Math.round(fn(p, sc) / 2.5) * 2.5
}
function barbell(p, rep, sc) {
  const fns = { 12: calc12RM, 15: calc15RM, 18: calc18RM, 20: calc20RM }
  const fn = fns[rep] || calc15RM
  return fn(p, sc)
}

function goblet(p, sc) {
  return Math.round(p * 0.3 * sc / 2.5) * 2.5
}

export function formatWeight(p, ref, rep, type, sc) {
  const v = p?.[ref] || 0
  if (!v) return ""
  if (type === "dumbbell") return `单边${dumbbell(v, rep, sc)}kg`
  if (type === "single") return `单个${singleDumbbell(v, rep, sc)}kg`
  if (type === "barbell") return `${barbell(v, rep, sc)}kg`
  if (type === "goblet") return `单个${goblet(v, sc)}kg`
  return ""
}

function w(p, ref, rep, type, sc) { return formatWeight(p, ref, rep, type, sc) }

export function getStrengthPlan(key, profile) {
  const p = profile || {}
  const scale = p.strengthWeightScale ?? 1
  const sw = (pr, ref, rep, type) => w(pr, ref, rep, type, scale)
  const plans = {
    fullA: {
      label: "全身A（推+下肢）",
      warmup: "5-8分钟：慢速跳绳/原地高抬腿 + 肩胛激活 + 徒手深蹲热身",
      cooldown: "5分钟：股四头肌拉伸 + 小腿拉伸 + 胸部拉伸",
      exercises: [
        { name: "哑铃卧推", sets: 3, reps: "15", rest: "60-90秒", rpe: "6-7",
          weight: sw(p, "bench", 15, "dumbbell"), tip: "控制离心，下放2秒，推起时呼气" },
        { name: "哑铃高脚杯深蹲", sets: 3, reps: "20", rest: "60秒", rpe: "6-7",
          weight: sw(p, "squat", 20, "goblet"), tip: "双手抱一个哑铃在胸前，膝盖外展蹲到大腿与地面平行" },
        { name: "坐姿哑铃推举", sets: 3, reps: "15", rest: "60秒", rpe: "6-7",
          weight: sw(p, "bench", 15, "dumbbell"), tip: "核心收紧，推到手臂伸直但不锁死" },
        { name: "哑铃箭步蹲", sets: 3, reps: "12/侧", rest: "90秒", rpe: "7",
          weight: sw(p, "squat", 12, "dumbbell"), tip: "后腿膝盖接近但不触地，重心压在前脚跟" },
        { name: "俯卧撑", sets: 3, reps: "最大次数（目标15+）", rest: "60秒", rpe: "7-8",
          weight: "自重", tip: "全程身体一条直线，不塌腰" },
        { name: "哑铃农夫行走", sets: 3, reps: "30米", rest: "60秒", rpe: "6-7",
          weight: sw(p, "squat", 12, "dumbbell"), tip: "握紧拳头，肩膀后收，走稳不走快" }
      ],
      coreFinisher: [
        { name: "平板支撑", sets: 3, reps: "45秒", rest: "45秒" },
        { name: "死虫式", sets: 3, reps: "10/侧", rest: "45秒" }
      ]
    },
    fullB: {
      label: "全身B（拉+后链）",
      warmup: "5-8分钟：肩部绕环 + 猫牛式脊柱激活 + 徒手RDL摇摆",
      cooldown: "5分钟：背部拉伸 + 腘绳肌拉伸 + 臀肌拉伸",
      exercises: [
        { name: "杠铃划船", sets: 3, reps: "15", rest: "90秒", rpe: "7",
          weight: sw(p, "pull", 15, "barbell"), tip: "俯身约45度，拉到小腹位置，夹肩胛骨" },
        { name: "罗马尼亚硬拉", sets: 3, reps: "15", rest: "90秒", rpe: "7",
          weight: sw(p, "dead", 15, "barbell"), tip: "髋铰链模式，杠铃沿腿下放，感受腘绳肌拉伸" },
        { name: "高位下拉/助力引体", sets: 3, reps: "15", rest: "90秒", rpe: "7",
          weight: sw(p, "pull", 15, "barbell"), tip: "下拉时挺胸，肘关节向下向后走" },
        { name: "反向飞鸟", sets: 3, reps: "18", rest: "60秒", rpe: "6",
          weight: sw(p, "pull", 18, "dumbbell"), tip: "拇指向上，肩胛骨主动后收，肘关节保持微屈" },
        { name: "哑铃臀桥", sets: 3, reps: "20", rest: "60秒", rpe: "7",
          weight: sw(p, "dead", 20, "dumbbell"), tip: "顶峰收缩夹紧臀部，核心全程收紧不拱腰" },
        { name: "悬垂举腿/卷腹", sets: 3, reps: "15", rest: "60秒", rpe: "6-7",
          weight: "自重", tip: "举腿时骨盆后倾，下放时控制速度" }
      ],
      coreFinisher: [
        { name: "侧平板支撑", sets: 3, reps: "30秒/侧", rest: "45秒" },
        { name: "鸟狗式", sets: 3, reps: "10/侧", rest: "45秒" }
      ]
    },
    fullC: {
      label: "全身C（混合代谢）",
      warmup: "8-10分钟：动态拉伸 + 2组10次徒手深蹲推举 + 2组俯卧撑",
      cooldown: "5分钟：全身拉伸，重点下肢后链和髋屈肌",
      exercises: [
        { name: "哑铃硬拉+划船复合", sets: 3, reps: "15", rest: "90秒", rpe: "7-8",
          weight: sw(p, "dead", 15, "dumbbell"), tip: "硬拉起身→划船→还原，连续流畅成一组" },
        { name: "哑铃推举+深蹲复合", sets: 3, reps: "12", rest: "90秒", rpe: "7-8",
          weight: sw(p, "bench", 12, "dumbbell"), tip: "哑铃肩上→下蹲站起→推举→还原" },
        { name: "助力引体/高位下拉", sets: 3, reps: "最大次数（目标12+）", rest: "90秒", rpe: "7-8",
          weight: sw(p, "pull", 12, "barbell"), tip: "每次拉到下巴过杠" },
        { name: "登山者", sets: 3, reps: "40秒", rest: "60秒", rpe: "8-9",
          weight: "自重", tip: "膝盖尽量靠近胸部，速度越快越好" },
        { name: "哑铃摆荡", sets: 3, reps: "20", rest: "60秒", rpe: "7-8",
          weight: sw(p, "dead", 20, "dumbbell"), tip: "屈髋蓄力，髋伸发力，哑铃摆到肩高" },
        { name: "无俯卧撑版波比", sets: 3, reps: "12", rest: "60秒", rpe: "8-9",
          weight: "自重", tip: "蹲下→后跳→俯卧撑→跳回站姿，或简化版站姿完成" }
      ],
      coreFinisher: [
        { name: "负重俄罗斯转体", sets: 3, reps: "20", rest: "45秒" }
      ]
    },
    upper: {
      label: "上肢主导",
      warmup: "5-8分钟：肩部绕环 + 俯卧撑热身×10 + 轻重量侧平举热身",
      cooldown: "5分钟：胸部/肩部/背部/手臂拉伸各2组",
      exercises: [
        { name: "上斜哑铃推举", sets: 4, reps: "12", rest: "90秒", rpe: "7",
          weight: sw(p, "bench", 12, "dumbbell"), tip: "凳子调30-45度，下放后推起，全程控制" },
        { name: "坐姿绳索划船", sets: 4, reps: "12", rest: "90秒", rpe: "7",
          weight: sw(p, "pull", 12, "barbell"), tip: "肘贴近身体，拉到腹部，夹肩胛骨顶峰收缩" },
        { name: "哑铃侧平举", sets: 4, reps: "15", rest: "60秒", rpe: "6-7",
          weight: sw(p, "bench", 15, "dumbbell"), tip: "小指略高于拇指，全程手臂不要完全伸直" },
        { name: "仰卧哑铃臂屈伸", sets: 3, reps: "15", rest: "60秒", rpe: "7",
          weight: sw(p, "bench", 15, "dumbbell"), tip: "手臂从耳侧向上伸直，肘关节全程夹紧" },
        { name: "哑铃弯举", sets: 3, reps: "15", rest: "60秒", rpe: "7",
          weight: sw(p, "pull", 15, "dumbbell"), tip: "上臂固定，全程控制，不要借力摆荡" },
        { name: "面拉", sets: 4, reps: "15", rest: "60秒", rpe: "6-7",
          weight: sw(p, "pull", 15, "barbell"), tip: "拉到面部位置，拇指向上，肩胛主动后收" }
      ]
    },
    lower: {
      label: "下肢主导",
      warmup: "5-8分钟：步行弓步×10/侧 + 徒手深蹲×20 + 踝关节绕环",
      cooldown: "5分钟：股四/臀肌/髋屈肌/小腿各2组30秒拉伸",
      exercises: [
        { name: "杠铃深蹲", sets: 4, reps: "12", rest: "2-3分钟", rpe: "7-8",
          weight: sw(p, "squat", 12, "barbell"), tip: "脚距与肩同宽，脚尖微微外展，膝盖沿脚尖方向" },
        { name: "哑铃罗马尼亚硬拉", sets: 3, reps: "15", rest: "90秒", rpe: "7",
          weight: sw(p, "dead", 15, "dumbbell"), tip: "髋铰链，哑铃贴近腿侧，感受腘绳肌持续张力" },
        { name: "保加利亚分腿蹲", sets: 3, reps: "12/侧", rest: "90秒", rpe: "7-8",
          weight: sw(p, "squat", 12, "dumbbell"), tip: "后脚抬高放在凳子上，前腿下蹲90度" },
        { name: "腿弯举（如有器械）", sets: 3, reps: "15", rest: "60秒", rpe: "7",
          weight: sw(p, "dead", 15, "barbell"), tip: "全程控制，慢下快上，顶峰收缩" },
        { name: "站姿提踵", sets: 4, reps: "20", rest: "45秒", rpe: "7",
          weight: "自重或持哑铃", tip: "站在台阶边缘，充分下放到底再全力提踵" },
        { name: "负重臀桥", sets: 3, reps: "20", rest: "60秒", rpe: "7",
          weight: sw(p, "dead", 20, "dumbbell"), tip: "顶峰夹紧臀部，全程核心收紧不拱腰" }
      ]
    }
  }
  return plans[key] || plans.fullA
}
