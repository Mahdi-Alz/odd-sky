<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <span>
    {{ t("app.dataBy") }}
    <a
      href="https://open-meteo.com/"
      target="_blank"
      rel="noopener"
      class="underline underline-offset-2 hover:text-white"
      >Open-Meteo.com</a
    >
    (<a
      href="https://creativecommons.org/licenses/by/4.0/"
      target="_blank"
      rel="noopener license"
      class="underline underline-offset-2 hover:text-white"
      >CC BY 4.0</a
    >)
  </span>
</template>
