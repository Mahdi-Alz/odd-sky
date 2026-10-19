<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  label: { type: String, required: true },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <button
    type="button"
    role="switch"
    class="flex w-full items-center justify-between gap-3 py-2.5 text-start"
    :aria-checked="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="text-base">{{ label }}</span>
    <span
      class="relative h-6 w-10 shrink-0 rounded-full transition-colors"
      :class="modelValue ? 'bg-good' : 'bg-white/25'"
      aria-hidden="true"
    >
      <span
        class="absolute top-0.5 start-0.5 size-5 rounded-full bg-white shadow transition-transform"
        :class="modelValue ? 'translate-x-4 rtl:-translate-x-4' : ''"
      ></span>
    </span>
  </button>
</template>
