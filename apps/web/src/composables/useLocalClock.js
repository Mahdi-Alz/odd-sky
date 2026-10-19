import { computed, onScopeDispose, ref } from "vue";
import { useFormat } from "./useFormat";

export const useLocalClock = (getTimezone) => {
  const { formatCityTime } = useFormat();
  const now = ref(new Date());

  const timer = setInterval(() => {
    now.value = new Date();
  }, 30000);
  onScopeDispose(() => clearInterval(timer));

  const label = computed(() => formatCityTime(now.value, getTimezone()));

  return { now, label };
};
