<script setup>
defineProps({
  icon: { type: String, required: true },
  isDay: { type: Boolean, default: true },
});
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="icon === 'clear'">
      <template v-if="isDay">
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        />
      </template>
      <path v-else d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </template>

    <template v-else-if="icon === 'partly'">
      <template v-if="isDay">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 2v1M2 8h1M3.8 3.8l.7.7M12.2 3.8l-.7.7" />
      </template>
      <path v-else d="M12 6.5A4.5 4.5 0 0 1 6 2.5a4.5 4.5 0 1 0 6 4Z" />
      <path d="M17.5 21a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 2A3.5 3.5 0 0 0 7.5 21Z" />
    </template>

    <path
      v-else-if="icon === 'cloudy'"
      d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.8A4 4 0 0 0 6.5 19Z"
    />

    <template v-else-if="icon === 'fog'">
      <path d="M17.5 14a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.8A4 4 0 0 0 6.5 14" />
      <path d="M4 17h16M6 21h12" />
    </template>

    <template v-else>
      <path d="M17.5 15a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.8A4 4 0 0 0 6.5 15" />
      <path v-if="icon === 'drizzle'" d="M9 18v1M13 18v1M17 18v1M11 21v1M15 21v1" />
      <path v-else-if="icon === 'rain'" d="M9 17l-1 3M13 17l-1 3M17 17l-1 3" />
      <path
        v-else-if="icon === 'snow'"
        d="M9 18h.01M13 18h.01M17 18h.01M11 21h.01M15 21h.01"
        stroke-width="2.5"
      />
      <path v-else d="M13 15l-3 4h4l-2.5 3.5" />
    </template>
  </svg>
</template>
