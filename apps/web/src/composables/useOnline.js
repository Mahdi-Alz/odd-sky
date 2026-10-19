import { onScopeDispose, ref } from "vue";

export const useOnline = () => {
  const online = ref(navigator.onLine);
  const update = () => {
    online.value = navigator.onLine;
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  onScopeDispose(() => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
  });

  return online;
};
