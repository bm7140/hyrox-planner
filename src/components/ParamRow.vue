<template>
  <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
    <label style="width:120px;font-weight:bold;flex-shrink:0">{{ label }}</label>
    <input
      type="number"
      :step="step"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      style="flex:1;max-width:150px"
    >
    <span style="font-size:12px;color:#6b7280">当前: <b>{{ modelValue }}</b></span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: [Number, String], required: true },
  defaultVal: { type: Number, default: 0 },
  step: { type: [Number, String], default: 'any' },
  min: { type: Number, default: null },
  max: { type: Number, default: null }
})

defineEmits(['update:modelValue'])
</script>
