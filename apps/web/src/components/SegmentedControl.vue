<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
  label: { type: String, required: true },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="flex rounded-xl border border-line bg-white/5 p-1" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      :class="modelValue === option.value ? 'bg-white text-ink' : 'text-white/70 hover:text-white'"
      :aria-pressed="modelValue === option.value"
      @click="$emit('update:modelValue', option.value)"
    >
      <span :dir="option.dir ?? undefined">{{ option.label }}</span>
    </button>
  </div>
</template>
